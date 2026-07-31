import type * as THREE from 'three';

export type ResourceId =
  | 'stone' | 'copper' | 'quartz' | 'crystal' | 'fiber'
  | 'oil' | 'coral' | 'scrap' | 'cell' | 'gem';

export type RecipeId =
  | 'tank' | 'fins' | 'flashlight' | 'scanner' | 'repair'
  | 'battery' | 'submarine' | 'depthModule'
  | 'storage' | 'fabricator' | 'charger' | 'solar' | 'beacon'
  | 'rocketHull' | 'rocketCore' | 'rocketFuel';

export type Inventory = Record<ResourceId, number>;
export type BiomeId = 'Safe Reef' | 'Lumen Kelp' | 'The Abyss';

export interface Recipe {
  id: RecipeId;
  name: string;
  detail: string;
  category: 'Gear' | 'Habitat' | 'Escape';
  cost: Partial<Inventory>;
  requires?: RecipeId;
  repeatable?: boolean;
}

export interface OceanSave {
  version: 1;
  position: [number, number, number];
  inSub?: boolean;
  inventory: Inventory;
  crafted: RecipeId[];
  logs: string[];
  health: number;
  oxygen: number;
  hunger: number;
  water: number;
  subBattery: number;
  elapsed: number;
}

export interface OceanSnapshot {
  health: number;
  oxygen: number;
  maxOxygen: number;
  hunger: number;
  water: number;
  depth: number;
  heading: number;
  biome: BiomeId;
  objective: string;
  inventory: Inventory;
  crafted: RecipeId[];
  logs: string[];
  prompt: string;
  toast: string;
  inSub: boolean;
  subBattery: number;
  crushDepth: number;
  lightsOn: boolean;
  elapsed: number;
}

export interface Interactable {
  id: string;
  kind: 'resource' | 'log' | 'pod' | 'submarine' | 'rocket';
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  label: string;
  resource?: ResourceId;
  logId?: string;
  collectedAt?: number;
}

export type WorldEvent = 'pause' | 'craft' | 'pda' | 'ending';
