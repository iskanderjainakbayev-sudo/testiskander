export type Temperament = 'passive' | 'neutral' | 'aggressive';

export interface Species {
  name: string;
  assetId: string;
  color: number;
  glow: number;
  size: number;
  speed: number;
  temperament: Temperament;
  band: [number, number];
  damage?: number;
  alertRadius?: number;
  isBoss?: boolean;
}

export const SPECIES: Species[] = [
  { name: 'Lantern Sprat', assetId: 'lantern-sprat', color: 0x8dfff1, glow: 0x36bbaa, size: 0.35, speed: 1.5, temperament: 'passive', band: [8, 30] },
  { name: 'Mosaic Shellwing', assetId: 'mosaic-shellwing', color: 0xffb96b, glow: 0x6b3011, size: 0.72, speed: 0.55, temperament: 'passive', band: [12, 36] },
  { name: 'Bubblefin', assetId: 'bubblefin', color: 0xbda4ff, glow: 0x4e2b8f, size: 0.48, speed: 0.8, temperament: 'passive', band: [8, 40] },
  { name: 'Sunveil Ray', assetId: 'sunveil-ray', color: 0xfff09a, glow: 0x7e6a18, size: 1.1, speed: 1.0, temperament: 'passive', band: [18, 55] },
  { name: 'Volt Ribbon', assetId: 'volt-ribbon', color: 0x65dbff, glow: 0x146fba, size: 0.8, speed: 1.3, temperament: 'neutral', band: [45, 78] },
  { name: 'Rootback Crab', assetId: 'rootback-crab', color: 0xc87556, glow: 0x46190d, size: 0.65, speed: 0.35, temperament: 'neutral', band: [38, 78] },
  { name: 'Needle Dart', assetId: 'needle-dart', color: 0xa9ff77, glow: 0x3c7c21, size: 0.42, speed: 2.4, temperament: 'neutral', band: [42, 82] },
  { name: 'Night Kite', assetId: 'night-kite', color: 0x6f86c9, glow: 0x243467, size: 1.25, speed: 1.15, temperament: 'neutral', band: [65, 98] },
  { name: 'Reef Fang', assetId: 'reef-fang', color: 0xff7b4e, glow: 0x8f2418, size: 0.9, speed: 2.25, temperament: 'aggressive', band: [18, 42], damage: 8, alertRadius: 20 },
  { name: 'Rift Stalker', assetId: 'rift-stalker', color: 0xf05f54, glow: 0x6f130e, size: 1.35, speed: 2.0, temperament: 'aggressive', band: [52, 88], damage: 11, alertRadius: 23 },
  { name: 'Ink Maw', assetId: 'ink-maw', color: 0x7532a5, glow: 0x341050, size: 1.65, speed: 1.55, temperament: 'aggressive', band: [84, 120], damage: 14, alertRadius: 25 },
  { name: 'Glassjaw', assetId: 'glassjaw', color: 0x8bc5d2, glow: 0x2b6877, size: 1.8, speed: 2.1, temperament: 'aggressive', band: [98, 134], damage: 16, alertRadius: 27 },
  { name: 'Abyssal Dragon', assetId: 'abyssal-dragon', color: 0x07142f, glow: 0x1569df, size: 4.2, speed: 1.35, temperament: 'aggressive', band: [128, 140], damage: 30, alertRadius: 42, isBoss: true },
];
