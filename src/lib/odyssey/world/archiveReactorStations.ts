import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addCylinder,
  addRoundedBox,
  roundedInstances,
  type Placement,
} from './interiorGeometry';
import { addRing, addScreenPanel } from './stationPrimitives';

export function buildArchiveStation(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  addRoundedBox(group, [0.42, 1.92, 2.36], materials.frame, {
    position: [2.69, 1.18, 3.8],
  }, 0.095);
  addRoundedBox(group, [0.07, 1.58, 2.02], materials.recess, {
    position: [2.46, 1.18, 3.8],
  }, 0.025);
  addScreenPanel(
    group,
    holograms,
    materials,
    'ARCHIVE / ECHO LOG',
    [1.58, 0.78],
    [2.405, 1.5, 3.8],
    [0, -Math.PI / 2, 0],
    '#8fe0d8',
  );
  const drawers: Placement[] = [];
  const handles: Placement[] = [];
  for (const z of [3.14, 3.8, 4.46]) {
    drawers.push({ position: [2.405, 0.67, z] });
    handles.push({ position: [2.34, 0.67, z] });
  }
  roundedInstances(group, [0.1, 0.28, 0.54], materials.panel, drawers, 0.035);
  roundedInstances(group, [0.055, 0.06, 0.26], materials.trim, handles, 0.02);
  roundedInstances(group, [0.055, 0.12, 0.08], materials.accent, [
    { position: [2.33, 0.67, 2.83] },
    { position: [2.33, 0.67, 4.77] },
  ], 0.018);
}

export function buildReactorStation(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): THREE.PointLight {
  buildContainmentFrame(group, materials);
  addCylinder(group, 0.36, 2.18, materials.glass, {
    position: [0, 1.56, 9.72],
  }, 24);
  addCylinder(group, 0.17, 1.82, materials.cyan, {
    position: [0, 1.56, 9.72],
  }, 18);
  for (let index = 0; index < 3; index += 1) {
    const ring = addRing(
      group,
      1.22 + index * 0.22,
      0.085,
      index === 1 ? materials.trim : materials.cyan,
      [0, 1.58, 9.5],
      [index * 0.11, index * 0.08, index * 0.23],
    );
    ring.userData.spinZ = 0.055 + index * 0.022;
    ring.userData.baseZ = ring.rotation.z;
    holograms.push(ring);
  }
  addReactorConsoles(group, materials);
  const light = new THREE.PointLight(0x74d9cf, 8.5, 8.5, 2);
  light.position.set(0, 1.58, 9.12);
  group.add(light);
  return light;
}

function buildContainmentFrame(group: THREE.Group, materials: InteriorMaterials): void {
  roundedInstances(group, [0.28, 2.65, 0.36], materials.frame, [
    { position: [-1.82, 1.43, 9.78] },
    { position: [1.82, 1.43, 9.78] },
  ], 0.09);
  addRoundedBox(group, [3.92, 0.3, 0.4], materials.frame, {
    position: [0, 2.78, 9.78],
  }, 0.09);
  addRoundedBox(group, [3.55, 2.3, 0.12], materials.recess, {
    position: [0, 1.5, 10.14],
  }, 0.045);
  roundedInstances(group, [0.15, 0.15, 0.42], materials.conduit, [
    { position: [-1.43, 2.72, 9.62] },
    { position: [1.43, 2.72, 9.62] },
  ], 0.045);
}

function addReactorConsoles(group: THREE.Group, materials: InteriorMaterials): void {
  for (const side of [-1, 1]) {
    addRoundedBox(group, [0.74, 0.72, 0.9], materials.panel, {
      position: [side * 1.78, 0.48, 8.78],
      rotation: [0, side * -0.16, 0],
    }, 0.09);
    roundedInstances(group, [0.08, 0.055, 0.18], materials.accent, [
      { position: [side * 1.58, 0.87, 8.53], rotation: [-0.56, 0, 0] },
      { position: [side * 1.82, 0.87, 8.53], rotation: [-0.56, 0, 0] },
      { position: [side * 2.06, 0.87, 8.53], rotation: [-0.56, 0, 0] },
    ], 0.02);
  }
}
