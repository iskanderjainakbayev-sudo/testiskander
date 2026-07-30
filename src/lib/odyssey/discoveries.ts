import type { Discovery, DiscoveryId, Objective } from './types';

export const DISCOVERIES: Record<DiscoveryId, Discovery> = {
  solace: {
    id: 'solace',
    name: 'SOLACE',
    classification: 'Rogue ocean world',
    description: 'A sunless sea, warm beneath the ice. Something answers from below.',
    position: [340, -55, -760],
    scanRange: 185,
  },
  nacre: {
    id: 'nacre',
    name: 'NACRE',
    classification: 'Silica canyon world',
    description: 'Its mineral forests refract the Solace echo into a navigable key.',
    position: [670, 35, -980],
    scanRange: 180,
  },
  veil: {
    id: 'veil',
    name: 'THE VEIL',
    classification: 'Gravitational wound',
    description: 'Light circles it for eleven minutes. The signal crosses instantly.',
    position: [-720, 105, -1180],
    scanRange: 150,
  },
  pilgrim: {
    id: 'pilgrim',
    name: 'PILGRIM',
    classification: 'Unknown ark vessel',
    description: 'No engines. No heat. A garden still turns inside the hull.',
    position: [760, 170, -1510],
    scanRange: 135,
  },
  atlas: {
    id: 'atlas',
    name: 'ATLAS GATE',
    classification: 'Pre-collapse megastructure',
    description: 'A door pointed beyond every chart humanity ever made.',
    position: [0, 30, -2240],
    scanRange: 190,
  },
};

export const TARGET_ORDER: DiscoveryId[] = ['solace', 'nacre', 'veil', 'pilgrim', 'atlas'];

export function getObjective(
  scanned: DiscoveryId[],
  mode: string,
  surfaceSamples = 0,
  solaceSurveyed = false,
  nacreSurveyed = false,
  landingSite = 'solace',
): Objective {
  if (mode === 'walking') {
    return {
      eyebrow: 'AWAKENING / DECK 01',
      title: 'Take the helm',
      detail: 'Follow the amber guide lights to the forward cockpit.',
    };
  }
  if (mode === 'landing') {
    const isNacre = landingSite === 'nacre';
    return {
      eyebrow: `${isNacre ? 'NACRE' : 'SOLACE'} / ATMOSPHERIC ENTRY`,
      title: 'Hold the descent corridor',
      detail: isNacre
        ? 'Lyra is threading the dust shear toward a sunlit silica canyon.'
        : 'Lyra is riding the ion wake toward a singing archipelago.',
    };
  }
  if (mode === 'takeoff') {
    const isNacre = landingSite === 'nacre';
    return {
      eyebrow: `${isNacre ? 'NACRE' : 'SOLACE'} / ASCENT`,
      title: 'Return to the stars',
      detail: isNacre
        ? 'The silica storm falls away beneath Lyra’s rising wake.'
        : 'The pulse field is rebuilding above the cloud deck.',
    };
  }
  if (mode === 'surface') {
    if (landingSite === 'nacre') {
      return surfaceSamples < 3 ? {
        eyebrow: `NACRE EXPEDITION / PRISM ${surfaceSamples + 1} OF 3`,
        title: 'Triangulate the prism choir',
        detail: 'Follow the amber refractions between the mineral groves.',
      } : {
        eyebrow: 'NACRE EXPEDITION / CALIBRATION COMPLETE',
        title: 'Return to Lyra',
        detail: 'The silica lattice has stabilized the first echo. Board at the landing beacon.',
      };
    }
    return surfaceSamples < 3 ? {
      eyebrow: `SOLACE EXPEDITION / SAMPLE ${surfaceSamples + 1} OF 3`,
      title: 'Follow the echo blooms',
      detail: 'Their harmonic light cuts through the storm. Approach and interface.',
    } : {
      eyebrow: 'SOLACE EXPEDITION / FIELDWORK COMPLETE',
      title: 'Return to Lyra',
      detail: 'The recovered living ice belongs in the archive. Find the amber landing beacon.',
    };
  }
  if (mode === 'flight' && solaceSurveyed && !scanned.includes('solace')) {
    return {
      eyebrow: 'SOLACE / ORBITAL SURVEY COMPLETE',
      title: 'Descend to the echo blooms',
      detail: 'The living signal is beneath the cloud deck. Enter the amber landing corridor.',
    };
  }
  if (mode === 'flight' && nacreSurveyed && !scanned.includes('nacre')) {
    return {
      eyebrow: 'NACRE / ORBITAL SURVEY COMPLETE',
      title: 'Enter the silica canyons',
      detail: 'The calibration chorus is strongest inside the ochre landing corridor.',
    };
  }

  const echoes = scanned.filter((id) => id !== 'atlas' && id !== 'nacre').length;
  if (echoes < 3) {
    const next = TARGET_ORDER.find((id) => id !== 'atlas' && !scanned.includes(id));
    return {
      eyebrow: `THE LONG SILENCE / ECHO ${echoes + 1} OF 3`,
      title: next ? `Chart ${DISCOVERIES[next].name}` : 'Find the remaining echo',
      detail: 'Align the central reticle. Hold Q inside scan range.',
    };
  }

  return {
    eyebrow: 'THE LONG SILENCE / FINAL VECTOR',
    title: 'Wake the Atlas Gate',
    detail: 'The three echoes form a key. Take them beyond the charted dark.',
  };
}
