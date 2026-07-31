import type { Inventory, Recipe, ResourceId } from './types';

export const RESOURCE_NAMES: Record<ResourceId, string> = {
  stone: 'Basalt',
  copper: 'Copper',
  quartz: 'Quartz',
  crystal: 'Lumen Crystal',
  fiber: 'Kelp Fiber',
  oil: 'Spore Oil',
  coral: 'Fan Coral',
  scrap: 'Alloy Scrap',
  cell: 'Energy Cell',
  gem: 'Abyssal Gem',
  meat: 'Fish Meat',
};

export const EMPTY_INVENTORY: Inventory = {
  stone: 0, copper: 0, quartz: 0, crystal: 0, fiber: 0,
  oil: 0, coral: 0, scrap: 0, cell: 0, gem: 0, meat: 0,
};

export const RECIPES: Recipe[] = [
  { id: 'tank', name: 'High-Capacity Tank', detail: '220 oxygen · over 2× capacity', category: 'Gear', cost: { copper: 2, quartz: 2, coral: 1 } },
  { id: 'fins', name: 'Flex Fins', detail: '+35% swim speed', category: 'Gear', cost: { fiber: 2, coral: 1 } },
  { id: 'flashlight', name: 'Lumen Torch', detail: 'Toggle with F', category: 'Gear', cost: { copper: 1, quartz: 1 } },
  { id: 'scanner', name: 'Pulse Scanner', detail: 'Reveal nearby finds with Q', category: 'Gear', cost: { copper: 1, crystal: 2 } },
  { id: 'repair', name: 'Arc Repair Tool', detail: 'Required for vehicle work', category: 'Gear', cost: { scrap: 2, copper: 1, crystal: 1 } },
  { id: 'battery', name: 'Energy Cell', detail: 'Portable power for machines', category: 'Gear', cost: { copper: 1, crystal: 1 }, repeatable: true },
  { id: 'submarine', name: 'Nereid Micro-Sub', detail: 'Fast, safe travel to 85m', category: 'Gear', cost: { scrap: 4, copper: 3, crystal: 2, oil: 1, cell: 1 }, requires: 'repair' },
  { id: 'depthModule', name: 'Pressure Lattice', detail: 'Micro-sub crush depth: 160m', category: 'Gear', cost: { gem: 2, crystal: 2, oil: 2 }, requires: 'submarine' },
  { id: 'storage', name: 'Wet Storage', detail: 'Protected supply locker', category: 'Habitat', cost: { scrap: 2, stone: 2 } },
  { id: 'fabricator', name: 'Field Fabricator', detail: 'A warm point of return', category: 'Habitat', cost: { scrap: 2, copper: 1 }, requires: 'storage' },
  { id: 'charger', name: 'Cell Charger', detail: 'Slowly restores sub power', category: 'Habitat', cost: { copper: 2, quartz: 1, cell: 1 }, requires: 'fabricator' },
  { id: 'solar', name: 'Solar Lily', detail: 'Powers your reef outpost', category: 'Habitat', cost: { quartz: 2, copper: 1 }, requires: 'fabricator' },
  { id: 'beacon', name: 'Pathfinder Beacon', detail: 'Marks the route home', category: 'Habitat', cost: { copper: 1, crystal: 1 }, requires: 'fabricator' },
  { id: 'rocketHull', name: 'Aster Hull', detail: 'Heat-shielded escape frame', category: 'Escape', cost: { scrap: 5, oil: 3, quartz: 3 }, requires: 'submarine' },
  { id: 'rocketCore', name: 'Aster Guidance Core', detail: 'Ancient crystal navigation', category: 'Escape', cost: { gem: 3, crystal: 3, cell: 2 }, requires: 'depthModule' },
  { id: 'rocketFuel', name: 'Aster Fuel Stack', detail: 'Catalysed ocean launch fuel', category: 'Escape', cost: { oil: 3, coral: 2, gem: 2 }, requires: 'depthModule' },
];

export const STORY_LOGS: Record<string, { title: string; body: string }> = {
  pod: {
    title: '01 · IMPACT',
    body: 'Survey vessel Wayfarer broke apart above Pelagos. The pod can fabricate a distress craft, but its guidance core needs a pressure-grown crystal lattice.',
  },
  kelp: {
    title: '02 · THE GARDENERS',
    body: 'These luminous forests are not wild. Stone channels feed minerals to every kelp root. Someone engineered the reef to keep the ocean alive.',
  },
  vault: {
    title: '03 · THE QUIET VAULT',
    body: 'Translation: “When the sky burned, we moved memory into the sea.” The ruins are an archive, not a city. The abyssal gems carry star maps.',
  },
  heart: {
    title: '04 · LAST LIGHT',
    body: 'The makers left no bodies. They launched seed worlds from this trench, then turned their final reactor into the warm current that still feeds Pelagos.',
  },
};
