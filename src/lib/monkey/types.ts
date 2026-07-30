export type Weather = 'Sunny' | 'Rain' | 'Golden hour';

export type GameStats = {
  bananas: number;
  coins: number;
  xp: number;
  health: number;
  level: number;
  weather: Weather;
  unlockedSkins: string[];
  equippedSkin: string;
  openedChests: string[];
  completedQuestIds: string[];
};

export type WorldSnapshot = Pick<GameStats, 'bananas' | 'coins' | 'xp' | 'health' | 'level' | 'weather'> & {
  nearbyChest: boolean;
  enemyDistance: number;
  position: { x: number; z: number };
  notice?: string;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  reward: number;
};
