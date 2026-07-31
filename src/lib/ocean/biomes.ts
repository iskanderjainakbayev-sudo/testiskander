import * as THREE from 'three';
import type { BiomeId } from './types';

interface BiomePalette {
  color: number;
  fog: number;
  light: number;
}

export const BIOME_PALETTES: Record<BiomeId, BiomePalette> = {
  'Coral Paradise': { color: 0x2b9fa7, fog: 0.014, light: 1.45 },
  'Giant Kelp Forest': { color: 0x0b554d, fog: 0.024, light: 0.86 },
  'Mushroom Reef': { color: 0x445c91, fog: 0.021, light: 0.92 },
  'Underwater Jungle': { color: 0x17634f, fog: 0.027, light: 0.78 },
  'Crystal Caverns': { color: 0x174e72, fog: 0.025, light: 0.72 },
  'Ancient Ruins': { color: 0x28515a, fog: 0.028, light: 0.62 },
  'Volcanic Depths': { color: 0x351c24, fog: 0.032, light: 0.48 },
  'Frozen Ocean': { color: 0x4a6f87, fog: 0.023, light: 0.84 },
  'Bioluminescent Abyss': { color: 0x071632, fog: 0.036, light: 0.3 },
  'Black Trench': { color: 0x01050e, fog: 0.043, light: 0.18 },
};

function sector(position: THREE.Vector3): number {
  const angle = Math.atan2(position.z - 8, position.x) + Math.PI;
  return Math.floor(angle / (Math.PI * 2) * 8) % 8;
}

export function biomeAt(position: THREE.Vector3): BiomeId {
  const radius = Math.hypot(position.x, position.z - 8);
  if (radius < 38) return 'Coral Paradise';
  const slice = sector(position);
  if (radius < 90) {
    if (slice < 3) return 'Giant Kelp Forest';
    if (slice < 6) return 'Mushroom Reef';
    return 'Underwater Jungle';
  }
  if (radius < 176) {
    if (slice < 2) return 'Crystal Caverns';
    if (slice < 4) return 'Ancient Ruins';
    if (slice < 6) return 'Volcanic Depths';
    return 'Frozen Ocean';
  }
  return slice < 4 ? 'Bioluminescent Abyss' : 'Black Trench';
}
