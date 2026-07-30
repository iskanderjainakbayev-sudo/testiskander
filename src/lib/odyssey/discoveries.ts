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

export const TARGET_ORDER: DiscoveryId[] = ['solace', 'veil', 'pilgrim', 'atlas'];

export function getObjective(scanned: DiscoveryId[], mode: string): Objective {
  if (mode === 'walking') {
    return {
      eyebrow: 'AWAKENING / DECK 01',
      title: 'Take the helm',
      detail: 'Follow the amber guide lights to the forward cockpit.',
    };
  }

  const echoes = scanned.filter((id) => id !== 'atlas').length;
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
