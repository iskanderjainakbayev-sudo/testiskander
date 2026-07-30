import type { GameStats } from './types';

const key = 'monkey-adventure-save-v1';

export const defaultStats: GameStats = {
  bananas: 0,
  coins: 35,
  xp: 0,
  health: 100,
  level: 1,
  weather: 'Sunny',
  unlockedSkins: ['Jungle Scout'],
  equippedSkin: 'Jungle Scout',
  openedChests: [],
  completedQuestIds: [],
};

export function loadStats(): GameStats {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

export function saveStats(stats: GameStats) {
  localStorage.setItem(key, JSON.stringify(stats));
}
