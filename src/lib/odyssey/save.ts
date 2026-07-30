import type { DiscoveryId, SaveData } from './types';

const SAVE_KEY = 'long-silence-save-v1';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isSaveData(value) ? value : null;
  } catch {
    return null;
  }
}

const IDS: DiscoveryId[] = ['solace', 'nacre', 'veil', 'pilgrim', 'atlas'];

function isSaveData(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const save = value as Partial<SaveData>;
  return Array.isArray(save.scanned)
    && save.scanned.every((id) => IDS.includes(id))
    && typeof save.echoes === 'number'
    && typeof save.target === 'string'
    && IDS.includes(save.target as DiscoveryId)
    && Array.isArray(save.shipPosition)
    && save.shipPosition.length === 3
    && save.shipPosition.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
    && (save.solaceSurveyed === undefined || typeof save.solaceSurveyed === 'boolean')
    && (save.nacreSurveyed === undefined || typeof save.nacreSurveyed === 'boolean')
    && (save.surfaceSamples === undefined || (
      Array.isArray(save.surfaceSamples)
      && save.surfaceSamples.every((index) => Number.isInteger(index) && index >= 0 && index < 3)
    ))
    && (save.nacreSurfaceSamples === undefined || (
      Array.isArray(save.nacreSurfaceSamples)
      && save.nacreSurfaceSamples.every((index) => Number.isInteger(index) && index >= 0 && index < 3)
    ));
}

export function storeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // The voyage remains playable when storage is unavailable.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Private browsing may disable storage.
  }
}
