import { EMPTY_INVENTORY } from './content';
import type { OceanSave } from './types';

const SAVE_KEY = 'ocean-depths-save-v1';

export function readOceanSave(): OceanSave | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '') as OceanSave;
    if (parsed.version !== 1 || !parsed.inventory || !Array.isArray(parsed.crafted)) return null;
    return { ...parsed, inventory: { ...EMPTY_INVENTORY, ...parsed.inventory } };
  } catch {
    return null;
  }
}

export function writeOceanSave(save: OceanSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearOceanSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasOceanSave(): boolean {
  return readOceanSave() !== null;
}
