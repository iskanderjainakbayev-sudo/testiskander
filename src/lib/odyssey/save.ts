import type { SaveData } from './types';

const SAVE_KEY = 'long-silence-save-v1';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) as SaveData : null;
  } catch {
    return null;
  }
}

export function storeSave(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
