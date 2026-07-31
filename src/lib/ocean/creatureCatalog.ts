import { AGGRESSIVE_SPECIES } from './speciesAggressive';
import { NEUTRAL_SPECIES } from './speciesNeutral';
import { PEACEFUL_SPECIES } from './speciesPeaceful';

export type { AttackStyle, BodyPlan, Species, Temperament } from './creatureTypes';

export const SPECIES = [
  ...PEACEFUL_SPECIES,
  ...NEUTRAL_SPECIES,
  ...AGGRESSIVE_SPECIES,
];
