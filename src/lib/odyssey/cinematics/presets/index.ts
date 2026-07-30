import type { CinematicKind, CinematicPreset } from '../types';
import { atlasFinale } from './atlasFinale';
import { discoveryFlyby } from './discoveryFlyby';
import { landingCompanion } from './landingCompanion';

export const CINEMATIC_PRESETS: Record<CinematicKind, CinematicPreset> = {
  'discovery-flyby': discoveryFlyby,
  'landing-companion': landingCompanion,
  'atlas-finale': atlasFinale,
};
