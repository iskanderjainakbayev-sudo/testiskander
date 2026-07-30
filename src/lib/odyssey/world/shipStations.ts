import type * as THREE from 'three';
import {
  buildArchiveStation,
  buildReactorStation,
} from './archiveReactorStations';
import { buildCockpitStation } from './cockpitStation';
import type { InteriorMaterials } from './materials';
import { buildNavigationStation } from './navigationStation';

export function buildCockpit(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  buildCockpitStation(group, holograms, materials);
}

export function buildNavTable(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  buildNavigationStation(group, holograms, materials);
}

export function buildArchiveAndReactor(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): THREE.PointLight {
  buildArchiveStation(group, holograms, materials);
  return buildReactorStation(group, holograms, materials);
}
