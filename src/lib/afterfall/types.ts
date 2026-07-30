export type AfterfallItemId = 'water' | 'canned-food' | 'bandage' | 'scrap' | 'cloth' | 'ammo' | 'medkit' | 'signal-key';

export type AfterfallInventory = Record<AfterfallItemId, number>;

export type AfterfallSnapshot = {
  position: { x: number; y: number; z: number };
  health: number;
  hunger: number;
  thirst: number;
  energy: number;
  temperature: number;
  ammo: number;
  reserveAmmo: number;
  inventory: AfterfallInventory;
  questStep: number;
  lootCollected: number;
  enemiesDefeated: number;
  timeMinutes: number;
  weatherIndex: number;
  playtimeSeconds: number;
};

export type AfterfallSettings = {
  masterVolume: number;
  quality: 'performance' | 'balanced' | 'cinematic';
  sensitivity: number;
  reducedMotion: boolean;
};

export type AfterfallSave = {
  version: 1;
  savedAt: number;
  settings: AfterfallSettings;
  snapshot: AfterfallSnapshot;
};

export type AfterfallHudSnapshot = AfterfallSnapshot & {
  location: string;
  weather: string;
  timeLabel: string;
  objective: string;
  nearbyThreats: number;
  prompt: string | null;
  toast: string | null;
  isReloading: boolean;
  isCrouching: boolean;
};

export const itemNames: Record<AfterfallItemId, string> = {
  water: 'Clean Water',
  'canned-food': 'Canned Food',
  bandage: 'Bandage',
  scrap: 'Salvaged Scrap',
  cloth: 'Sterile Cloth',
  ammo: 'Rifle Cartridge',
  medkit: 'Field Medkit',
  'signal-key': 'Relay Key',
};

export function createDefaultAfterfallSave(): AfterfallSave {
  return {
    version: 1,
    savedAt: Date.now(),
    settings: { masterVolume: 0.65, quality: 'balanced', sensitivity: 1, reducedMotion: false },
    snapshot: {
      position: { x: -4, y: 1.7, z: 34 }, health: 100, hunger: 78, thirst: 72, energy: 86, temperature: 19,
      ammo: 8, reserveAmmo: 32, inventory: { water: 1, 'canned-food': 1, bandage: 1, scrap: 1, cloth: 1, ammo: 0, medkit: 0, 'signal-key': 0 },
      questStep: 0, lootCollected: 0, enemiesDefeated: 0, timeMinutes: 17 * 60 + 20, weatherIndex: 0, playtimeSeconds: 0,
    },
  };
}
