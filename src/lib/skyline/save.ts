import type { DashSave } from './types';
const storageKey = 'skyline-dash-save';
const fresh: DashSave = { bestScore: 0, crystals: 0, sound: .45 };
export function loadDash(): DashSave { try { return { ...fresh, ...JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<DashSave> }; } catch { return fresh; } }
export function saveDash(save: DashSave) { localStorage.setItem(storageKey, JSON.stringify(save)); }
