import type * as THREE from 'three';
import { buildBulkheads } from './interiorBulkheads';
import { buildInteriorDetails } from './interiorDetails';
import { buildInteriorModules } from './interiorModules';
import type { InteriorMaterials } from './materials';

export function buildShipStructure(
  group: THREE.Group,
  materials: InteriorMaterials,
): void {
  buildInteriorModules(group, materials);
  buildBulkheads(group, materials);
  buildInteriorDetails(group, materials);
}
