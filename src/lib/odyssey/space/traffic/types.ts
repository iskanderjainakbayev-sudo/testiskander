import type * as THREE from 'three';

export type VesselClass = 'freighter' | 'surveyor' | 'escort';

export type HullId =
  | 'arkose'
  | 'caravel'
  | 'orison'
  | 'kestrel'
  | 'manta'
  | 'lancer';

export interface TrafficUpdate {
  nearestShipName: string | null;
  nearestShipDistance: number;
  encounterMessage: string | null;
}

export interface TrafficSystem {
  group: THREE.Group;
  update: (time: number, shipPosition: THREE.Vector3) => TrafficUpdate;
  dispose: () => void;
}

export interface Route {
  id: string;
  curve: THREE.CatmullRomCurve3;
  color: THREE.Color;
}

export interface VesselSpec {
  name: string;
  class: VesselClass;
  hull: HullId;
  route: string;
  phase: number;
  speed: number;
  scale: number;
  tint: number;
  transmission: string;
}

export interface HullProfile {
  length: number;
  engines: readonly THREE.Vector3[];
  portStrobe: THREE.Vector3;
  starboardStrobe: THREE.Vector3;
}

export interface ShipGeometrySet {
  hull: THREE.BufferGeometry;
  detail: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
}

export interface TrafficMaterials {
  hull: THREE.MeshPhysicalMaterial;
  detail: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  plume: THREE.ShaderMaterial;
  port: THREE.MeshBasicMaterial;
  starboard: THREE.MeshBasicMaterial;
  contrail: THREE.LineBasicMaterial;
  lane: THREE.ShaderMaterial;
}
