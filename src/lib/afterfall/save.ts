import { createDefaultAfterfallSave, type AfterfallSave } from './types';

const databaseName = 'afterfall-survival';
const storeName = 'saves';
const autosaveId = 'field-save';
let database: Promise<IDBDatabase> | undefined;

export async function loadAfterfallSave(): Promise<AfterfallSave> {
  try {
    const db = await getDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const result = await requestValue<{ save?: unknown }>(transaction.objectStore(storeName).get(autosaveId));
    return isSave(result?.save) ? result.save : createDefaultAfterfallSave();
  } catch { return createDefaultAfterfallSave(); }
}

export async function saveAfterfallSave(save: AfterfallSave): Promise<void> {
  const db = await getDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put({ id: autosaveId, save: { ...save, savedAt: Date.now() } });
  await complete(transaction);
}

export function createAfterfallAutosave(delay = 900) {
  let timer: number | undefined;
  let pending: AfterfallSave | undefined;
  const flush = async () => { const next = pending; pending = undefined; if (next) await saveAfterfallSave(next); };
  return {
    schedule(save: AfterfallSave) { pending = save; if (timer) window.clearTimeout(timer); timer = window.setTimeout(() => { timer = undefined; void flush(); }, delay); },
    async flush() { if (timer) window.clearTimeout(timer); timer = undefined; await flush(); },
  };
}

function getDatabase(): Promise<IDBDatabase> {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
function complete(transaction: IDBTransaction): Promise<void> { return new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = transaction.onabort = () => reject(transaction.error); }); }
function isSave(value: unknown): value is AfterfallSave { return typeof value === 'object' && value !== null && 'snapshot' in value && 'settings' in value; }
