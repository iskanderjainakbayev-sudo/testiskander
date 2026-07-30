import type { GameSave } from './types';

const key = 'backrooms-lost-levels-save';
export const defaultSave: GameSave = {
  level: 0, health: 100, battery: 100, inventory: ['flashlight'], collected: [],
  settings: { sound: 0.45, sensitivity: 1, grain: true },
};

export function loadGame(): GameSave {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...defaultSave, ...JSON.parse(stored) as GameSave } : defaultSave;
  } catch { return defaultSave; }
}

export function saveGame(game: GameSave) { localStorage.setItem(key, JSON.stringify(game)); }
export function clearGame() { localStorage.removeItem(key); }
