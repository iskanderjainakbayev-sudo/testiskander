import { EMPTY_INVENTORY } from '../../lib/ocean/content';
import type { OceanSnapshot } from '../../lib/ocean/types';

export const DEFAULT_SNAPSHOT: OceanSnapshot = {
  health: 100,
  oxygen: 90,
  maxOxygen: 90,
  hunger: 100,
  water: 100,
  depth: 0,
  heading: 180,
  biome: 'Safe Reef',
  objective: 'Recover the damaged PDA on the reef below',
  inventory: { ...EMPTY_INVENTORY },
  crafted: [],
  logs: [],
  prompt: '',
  toast: '',
  inSub: false,
  subBattery: 100,
  crushDepth: 85,
  lightsOn: false,
  elapsed: 0,
};

