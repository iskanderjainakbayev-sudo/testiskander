import type { BiomeId } from './types';
import { createCreatureTraits } from './creatureTraits';

export type Temperament = 'passive' | 'neutral' | 'aggressive';
export type BodyPlan =
  | 'fish' | 'ray' | 'eel' | 'jelly' | 'turtle' | 'crab'
  | 'squid' | 'whale' | 'serpent' | 'puffer' | 'shrimp' | 'slug';
export type AttackStyle = 'bite' | 'charge' | 'tail' | 'shock' | 'poison' | 'ink' | 'grab' | 'ram';

export interface SpeciesSeed {
  name: string;
  scientificName: string;
  assetId: string;
  bodyPlan: BodyPlan;
  habitat: BiomeId;
  diet: string;
  color: number;
  glow: number;
  size: number;
  speed: number;
  band: [number, number];
  signature: string;
  behavior: string;
  temperament?: Temperament;
  threat?: number;
  attack?: AttackStyle;
  pack?: number;
  boss?: boolean;
}

export interface Species extends SpeciesSeed {
  temperament: Temperament;
  threat: number;
  attack: AttackStyle;
  pack: number;
  isBoss: boolean;
  damage: number;
  alertRadius: number;
  length: string;
  averageSize: string;
  depthRange: string;
  preferredBiome: BiomeId;
  personality: string;
  ecosystemRole: string;
  specialAbility: string;
  loreDescription: string;
  originalSounds: string[];
  weaknesses: string[];
  strengths: string[];
  scannerEntry: string;
  animations: string[];
  soundSet: { family: string; callHz: number; warningHz: number };
  palette: [number, number, number];
  silhouette: { width: number; height: number; length: number; appendages: number; crest: number };
  senses: { sight: number; sound: number; light: number; motion: number };
}

const bodyStrength: Record<BodyPlan, string> = {
  fish: 'Fast directional turns', ray: 'Wide-area awareness', eel: 'Flexible cave pursuit',
  jelly: 'Transparent drifting body', turtle: 'Armored dorsal shell', crab: 'Heavy frontal armor',
  squid: 'Multi-directional movement', whale: 'Powerful mass and endurance',
  serpent: 'Long-range lunge', puffer: 'Inflating defensive spines',
  shrimp: 'Explosive backward dash', slug: 'Chemical camouflage',
};

const bodyWeakness: Record<BodyPlan, string> = {
  fish: 'Exposed gills', ray: 'Vulnerable underside', eel: 'Sensitive electrical organs',
  jelly: 'Fragile central bell', turtle: 'Slow turning radius', crab: 'Soft rear joints',
  squid: 'Delicate eye cluster', whale: 'Slow acceleration', serpent: 'Soft throat plates',
  puffer: 'Clumsy while inflated', shrimp: 'Thin abdominal armor', slug: 'Weak against bright light',
};

function hashOf(value: string): number {
  let hash = 2166136261;
  for (const letter of value) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export function defineSpecies(seed: SpeciesSeed): Species {
  const hash = hashOf(seed.assetId);
  const temperament = seed.temperament ?? 'passive';
  const threat = seed.threat ?? (temperament === 'aggressive' ? 3 : temperament === 'neutral' ? 1 : 0);
  const attack = seed.attack ?? 'bite';
  const pack = seed.pack ?? (temperament === 'passive' ? 3 : 1);
  const isBoss = seed.boss ?? false;
  const length = `${Math.max(0.2, seed.size * (isBoss ? 15 : 2.4)).toFixed(1)} m`;
  const callHz = 70 + (hash % 620);
  const warningHz = 45 + ((hash >> 8) % 310);
  const traits = createCreatureTraits(
    seed.name, seed.scientificName, seed.bodyPlan, temperament, attack,
    seed.behavior, seed.signature, hash, callHz, warningHz,
  );
  return {
    ...seed,
    temperament,
    threat,
    attack,
    pack,
    isBoss,
    damage: isBoss ? 30 : 5 + threat * 4,
    alertRadius: 12 + threat * 4 + ((hash >> 4) % 6),
    length,
    averageSize: length,
    depthRange: `${seed.band[0]}–${seed.band[1]} m`,
    preferredBiome: seed.habitat,
    ...traits,
    weaknesses: [bodyWeakness[seed.bodyPlan], attack === 'shock' ? 'Insulated attacks' : 'Sudden sonic bursts'],
    strengths: [bodyStrength[seed.bodyPlan], seed.signature],
    scannerEntry: `${seed.signature}. ${seed.behavior}`,
    animations: [
      'idle', 'slow swim', 'fast swim', 'turn', 'feed', 'sleep', 'look around',
      'hunt', 'escape', 'injured', 'death', 'mouth and eye movement', 'fin and tail movement',
      seed.bodyPlan === 'ray' ? 'wing breach' : seed.bodyPlan === 'whale' ? 'surface breach' : `${attack} display`,
    ],
    soundSet: {
      family: `${seed.assetId}-${seed.bodyPlan}`,
      callHz,
      warningHz,
    },
    palette: [seed.color, seed.glow, (seed.color ^ (hash & 0xffffff)) >>> 0],
    silhouette: {
      width: 0.72 + (hash % 57) / 100,
      height: 0.58 + ((hash >> 5) % 48) / 100,
      length: 1.15 + ((hash >> 10) % 92) / 100,
      appendages: 2 + ((hash >> 16) % 7),
      crest: ((hash >> 21) % 100) / 100,
    },
    senses: {
      sight: 0.35 + (hash % 55) / 100,
      sound: 0.35 + ((hash >> 7) % 60) / 100,
      light: 0.25 + ((hash >> 13) % 70) / 100,
      motion: 0.4 + ((hash >> 19) % 55) / 100,
    },
  };
}
