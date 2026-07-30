import type { EclipseSave } from './types';
import { createDefaultEclipseSave } from './types';
import { migrateEclipseSave } from './saveCodec';

export { migrateEclipseSave } from './saveCodec';

const DATABASE_NAME = 'project-eclipse';
const DATABASE_VERSION = 1;
const STORE_NAME = 'saves';
const AUTOSAVE_ID = 'autosave';

export interface EclipseAutosave {
  schedule(save: EclipseSave): void;
  flush(): Promise<void>;
  dispose(): Promise<void>;
}

let databasePromise: Promise<IDBDatabase> | undefined;

export async function loadEclipseSave(): Promise<EclipseSave> {
  try {
    const database = await getDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const completed = transactionComplete(transaction);
    const stored = await requestResult<unknown>(transaction.objectStore(STORE_NAME).get(AUTOSAVE_ID));
    await completed;
    return migrateEclipseSave(isRecord(stored) ? stored.save : undefined);
  } catch {
    return createDefaultEclipseSave();
  }
}

export async function saveEclipseSave(save: EclipseSave): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const completed = transactionComplete(transaction);
  const currentSave = migrateEclipseSave({ ...save, savedAt: Date.now() });
  transaction.objectStore(STORE_NAME).put({ id: AUTOSAVE_ID, save: currentSave });
  await completed;
}

export function createEclipseAutosave(delayMs = 750): EclipseAutosave {
  let timer: number | undefined;
  let pending: EclipseSave | undefined;
  let disposed = false;
  let writeQueue = Promise.resolve();

  const writePending = (): Promise<void> => {
    const next = pending;
    pending = undefined;
    if (!next) return Promise.resolve();
    const write = writeQueue.then(() => saveEclipseSave(next));
    writeQueue = write.catch(() => undefined);
    return write;
  };

  return {
    schedule(save) {
      if (disposed) return;
      pending = migrateEclipseSave(save);
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = undefined;
        void writePending().catch(() => undefined);
      }, Math.max(0, delayMs));
    },
    async flush() {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      await writePending();
    },
    async dispose() {
      disposed = true;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      await writePending();
    },
  };
}

function getDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = openDatabase().catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = undefined;
      };
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error('Unable to open Project Eclipse saves.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
