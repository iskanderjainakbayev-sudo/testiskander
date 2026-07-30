import type { Quest } from './types';

export function getQuests(bananas: number, chests: number): Quest[] {
  return [
    { id: 'scout', title: 'Jungle scout', description: 'Collect sunlit bananas', current: bananas, target: 12, reward: 30 },
    { id: 'treasure', title: 'Lost cargo', description: 'Open ancient chests', current: chests, target: 2, reward: 50 },
    { id: 'explorer', title: 'Island explorer', description: 'Reach level 2', current: Math.min(2, 1 + Math.floor(bananas / 15)), target: 2, reward: 60 },
  ];
}
