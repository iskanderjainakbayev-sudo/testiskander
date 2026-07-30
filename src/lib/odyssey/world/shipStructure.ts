import * as THREE from 'three';
import { makeBrushedMetal, makeFloorSurface } from './materials';

function box(
  geometry: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...geometry), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildShipStructure(group: THREE.Group) {
  const hull = new THREE.MeshStandardMaterial({
    color: 0x20292e,
    map: makeBrushedMetal(),
    roughness: 0.72,
    metalness: 0.65,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0b1013,
    roughness: 0.55,
    metalness: 0.82,
  });
  const floor = new THREE.MeshStandardMaterial({
    color: 0x293238,
    map: makeFloorSurface(),
    roughness: 0.8,
    metalness: 0.42,
  });
  const amber = new THREE.MeshStandardMaterial({
    color: 0x2b1608,
    emissive: 0xff8b32,
    emissiveIntensity: 3.2,
    roughness: 0.3,
  });

  group.add(box([6.2, 0.18, 19.2], floor, [0, -0.1, 2]));
  group.add(box([5.7, 0.14, 18.5], hull, [0, 3.25, 2]));
  group.add(box([0.38, 3.25, 17], hull, [-3.02, 1.55, 2.6]));
  group.add(box([0.38, 3.25, 17], hull, [3.02, 1.55, 2.6]));

  for (let z = -4; z <= 10; z += 2) {
    group.add(box([6.4, 0.17, 0.21], dark, [0, 3.1, z]));
    group.add(box([0.18, 3.35, 0.22], dark, [-2.82, 1.55, z]));
    group.add(box([0.18, 3.35, 0.22], dark, [2.82, 1.55, z]));
    group.add(box([1.6, 0.025, 0.12], amber, [0, 3.02, z - 0.06]));
  }

  for (let z = -2.8; z <= 8.5; z += 1.5) {
    group.add(box([2.1, 0.035, 0.09], amber, [0, 0.02, z]));
  }

  buildCockpitFrame(group, hull, dark);
  buildSideWindows(group, hull, dark);
  return [hull, dark, floor, amber];
}

function buildCockpitFrame(group: THREE.Group, hull: THREE.Material, dark: THREE.Material) {
  group.add(box([6.35, 0.25, 1.7], hull, [0, 3.05, -6.7], [-0.18, 0, 0]));
  group.add(box([1.25, 0.32, 4], hull, [-2.65, 0.25, -6.4], [0, -0.25, -0.08]));
  group.add(box([1.25, 0.32, 4], hull, [2.65, 0.25, -6.4], [0, 0.25, 0.08]));
  group.add(box([0.2, 3.2, 0.25], dark, [-2.6, 1.75, -6.25], [0, 0, -0.2]));
  group.add(box([0.2, 3.2, 0.25], dark, [2.6, 1.75, -6.25], [0, 0, 0.2]));
  group.add(box([0.22, 3, 0.24], dark, [0, 2.05, -7.2]));
  group.add(box([5.4, 0.2, 0.25], dark, [0, 3.03, -7.1]));
}

function buildSideWindows(group: THREE.Group, hull: THREE.Material, dark: THREE.Material) {
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x476a73,
    roughness: 0.16,
    metalness: 0.05,
    transparent: true,
    opacity: 0.18,
    transmission: 0.35,
  });
  for (const side of [-1, 1]) {
    group.add(box([0.08, 1.55, 4.4], glass, [side * 2.84, 1.72, 4.1]));
    group.add(box([0.28, 0.18, 4.8], dark, [side * 2.82, 0.9, 4.1]));
    group.add(box([0.28, 0.18, 4.8], hull, [side * 2.82, 2.52, 4.1]));
  }
}
