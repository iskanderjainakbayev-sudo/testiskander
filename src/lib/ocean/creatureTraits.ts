import type { AttackStyle, BodyPlan, Temperament } from './creatureTypes';

const personalities: Record<Temperament, string[]> = {
  passive: ['Curious and social', 'Shy but observant', 'Calm and migratory', 'Playful around gentle movement'],
  neutral: ['Patient and territorial', 'Protective of its nursery', 'Cautious until cornered', 'Stoic and nest-bound'],
  aggressive: ['Calculating and relentless', 'Opportunistic and wary', 'Bold when hunting', 'Patient before a sudden strike'],
};

const ecosystemRoles: Record<BodyPlan, string> = {
  fish: 'Transfers nutrients between reef layers', ray: 'Stirs buried nutrients into the current',
  eel: 'Controls cave-dwelling prey populations', jelly: 'Converts drifting plankton into food for larger animals',
  turtle: 'Prunes vegetation and carries reef organisms', crab: 'Recycles carrion and aerates the seabed',
  squid: 'Links small schooling prey to deep-water hunters', whale: 'Moves nutrients across distant biomes',
  serpent: 'Regulates animals hiding in narrow terrain', puffer: 'Controls algae and hard-shelled grazers',
  shrimp: 'Cleans parasites and processes detritus', slug: 'Recycles plant matter and spreads spores',
};

const attackAbilities: Record<AttackStyle, string> = {
  bite: 'A precisely timed jaw strike', charge: 'A high-speed armored charge',
  tail: 'A disorienting tail sweep', shock: 'A short-range bioelectric discharge',
  poison: 'A defensive toxin pulse', ink: 'A light-absorbing ink cloud',
  grab: 'A locking appendage grapple', ram: 'A full-body concussive ram',
};

export interface GeneratedCreatureTraits {
  personality: string;
  ecosystemRole: string;
  specialAbility: string;
  loreDescription: string;
  originalSounds: string[];
}

export function createCreatureTraits(
  name: string,
  scientificName: string,
  bodyPlan: BodyPlan,
  temperament: Temperament,
  attack: AttackStyle,
  behavior: string,
  signature: string,
  hash: number,
  callHz: number,
  warningHz: number,
): GeneratedCreatureTraits {
  const personalitySet = personalities[temperament];
  const personality = personalitySet[hash % personalitySet.length];
  const role = ecosystemRoles[bodyPlan];
  const specialAbility = `${attackAbilities[attack]}: ${signature.toLowerCase()}`;
  return {
    personality,
    ecosystemRole: role,
    specialAbility,
    loreDescription: `${scientificName} is known to Pelagos surveyors as the ${name}. ${behavior} Its ${role.toLowerCase()}, making it a distinct part of the local food web.`,
    originalSounds: [
      `${callHz} Hz ${bodyPlan} contact call`,
      `${warningHz} Hz ${temperament} warning signal`,
      `${name.toLowerCase()} water-displacement signature`,
    ],
  };
}
