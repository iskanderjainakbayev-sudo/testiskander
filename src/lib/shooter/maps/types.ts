import type * as THREE from "three";

export type CollisionBox = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height?: number;
};

export type WalkableSurface = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
};

export type Climbable = {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  topHeight: number;
};

export type InteractiveDoor = {
  pivot: THREE.Group;
  closedRotation: number;
  openRotation: number;
  open: boolean;
  collision: CollisionBox;
};

export type MapDetails = {
  breakableGlass: THREE.Object3D[];
  doors: InteractiveDoor[];
  update?: (delta: number) => void;
};

export type SpawnPoint = {
  id: string;
  position: [number, number, number];
  facing: number;
};

export type TacticalMapDefinition = {
  id: string;
  name: string;
  subtitle: string;
  bounds: number;
  weather: "clear" | "rain" | "snow" | "shiny" | "sandstorm";
  spawnPoints: SpawnPoint[];
  collision: CollisionBox[];
  surfaces: WalkableSurface[];
  climbables: Climbable[];
  lighting: { sky: number; fog: number; moon: number; accent: number };
  ambientSounds: string[];
  routes: { id: string; style: "sniper" | "close" | "flank"; description: string }[];
  navigationMesh: { patrolRoutes: [number, number, number][][] };
  interactiveObjects: { id: string; kind: "breakable-glass" | "door" }[];
};

export type TacticalMapRuntime = {
  definition: TacticalMapDefinition;
  breakableGlass: THREE.Object3D[];
  breakGlass: (object: THREE.Object3D) => boolean;
  toggleNearestDoor: (camera: THREE.Camera) => boolean;
  update: (delta: number) => void;
};
