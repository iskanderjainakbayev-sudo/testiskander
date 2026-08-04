export type MultiToolModule = 'mining' | 'harpoon' | 'repulsor' | 'scanner' | 'repair';

export interface MultiToolSpec {
  id: MultiToolModule;
  name: string;
  shortName: string;
  color: number;
  cost: number;
  cooldown: number;
  range: number;
  damage: number;
  mode: 'beam' | 'projectile' | 'pulse' | 'scan' | 'repair';
}

export const MULTITOOL_MODULES: MultiToolSpec[] = [
  { id: 'mining', name: 'THERMAL LANCE', shortName: 'LANCE', color: 0x68fff0, cost: 1.4, cooldown: 115, range: 34, damage: 9, mode: 'beam' },
  { id: 'harpoon', name: 'TETHER SPEAR', shortName: 'SPEAR', color: 0xffb45f, cost: 9, cooldown: 1180, range: 58, damage: 76, mode: 'projectile' },
  { id: 'repulsor', name: 'PRESSURE WAVE', shortName: 'PULSE', color: 0x879cff, cost: 14, cooldown: 2600, range: 14, damage: 4, mode: 'pulse' },
  { id: 'scanner', name: 'ECHO ARRAY', shortName: 'SCAN', color: 0x64d8ff, cost: 4, cooldown: 900, range: 48, damage: 0, mode: 'scan' },
  { id: 'repair', name: 'ARC MENDER', shortName: 'MEND', color: 0x75ff9a, cost: 6, cooldown: 720, range: 4, damage: 0, mode: 'repair' },
];

export function getMultiToolSpec(id: MultiToolModule): MultiToolSpec {
  return MULTITOOL_MODULES.find((module) => module.id === id) ?? MULTITOOL_MODULES[0];
}
