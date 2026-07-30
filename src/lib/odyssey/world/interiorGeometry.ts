import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type VectorTuple = readonly [number, number, number];

export interface Placement {
  position: VectorTuple;
  rotation?: VectorTuple;
  scale?: VectorTuple;
}

export function roundedBox(
  size: VectorTuple,
  material: THREE.Material,
  radius = 0.06,
): THREE.Mesh {
  const safeRadius = Math.min(radius, Math.min(...size) * 0.45);
  return finishMesh(new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 2, safeRadius),
    material,
  ));
}

export function addRoundedBox(
  group: THREE.Object3D,
  size: VectorTuple,
  material: THREE.Material,
  placement: Placement,
  radius = 0.06,
): THREE.Mesh {
  const mesh = roundedBox(size, material, radius);
  applyPlacement(mesh, placement);
  group.add(mesh);
  return mesh;
}

export function addInstances(
  group: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placements: readonly Placement[],
): THREE.InstancedMesh {
  const instances = new THREE.InstancedMesh(geometry, material, placements.length);
  const dummy = new THREE.Object3D();
  placements.forEach((placement, index) => {
    applyPlacement(dummy, placement);
    dummy.updateMatrix();
    instances.setMatrixAt(index, dummy.matrix);
  });
  instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  instances.computeBoundingSphere();
  instances.castShadow = true;
  instances.receiveShadow = true;
  group.add(instances);
  return instances;
}

export function roundedInstances(
  group: THREE.Object3D,
  size: VectorTuple,
  material: THREE.Material,
  placements: readonly Placement[],
  radius = 0.04,
): THREE.InstancedMesh {
  const safeRadius = Math.min(radius, Math.min(...size) * 0.45);
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 2, safeRadius);
  return addInstances(group, geometry, material, placements);
}

export function addCylinder(
  group: THREE.Object3D,
  radius: number,
  depth: number,
  material: THREE.Material,
  placement: Placement,
  radialSegments = 16,
): THREE.Mesh {
  const mesh = finishMesh(new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, radialSegments),
    material,
  ));
  applyPlacement(mesh, placement);
  group.add(mesh);
  return mesh;
}

export function finishMesh<T extends THREE.Mesh>(mesh: T): T {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function applyPlacement(object: THREE.Object3D, placement: Placement): void {
  object.position.set(...placement.position);
  object.rotation.set(...(placement.rotation ?? [0, 0, 0]));
  object.scale.set(...(placement.scale ?? [1, 1, 1]));
}
