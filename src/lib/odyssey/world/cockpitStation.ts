import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addCylinder,
  addRoundedBox,
  roundedInstances,
  type Placement,
} from './interiorGeometry';
import { addScreenPanel } from './stationPrimitives';

export function buildCockpitStation(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  buildConsole(group, holograms, materials);
  buildPilotSeat(group, materials);
  buildPedals(group, materials);
}

function buildConsole(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  const consoleRoot = new THREE.Group();
  consoleRoot.position.set(0, 0.56, -5.42);
  consoleRoot.rotation.x = -0.16;
  addRoundedBox(consoleRoot, [1.52, 0.62, 1.38], materials.panel, {
    position: [0, 0, 0],
  }, 0.13);
  for (const side of [-1, 1]) {
    addRoundedBox(consoleRoot, [1.75, 0.54, 1.28], materials.panel, {
      position: [side * 1.61, -0.04, 0.06],
      rotation: [0, side * -0.075, side * -0.018],
    }, 0.12);
    addRoundedBox(consoleRoot, [0.13, 0.36, 1.15], materials.trim, {
      position: [side * 2.48, -0.02, 0.08],
      rotation: [0, side * -0.075, 0],
    }, 0.045);
  }
  addRoundedBox(consoleRoot, [4.65, 0.52, 0.36], materials.recess, {
    position: [0, -0.28, 0.42],
  }, 0.08);
  group.add(consoleRoot);

  for (const x of [-1.45, 0, 1.45]) {
    addScreenPanel(
      group,
      holograms,
      materials,
      x === 0 ? 'NAV / HELM' : 'FLIGHT SYSTEMS',
      [1.24, 0.48],
      [x, 0.98, -4.79],
      [-Math.PI / 2.65, 0, 0],
      x === 0 ? '#f2b36f' : '#8fd8d3',
    );
  }

  const keys: Placement[] = [];
  for (const x of [-1.82, -1.56, -1.3, 1.3, 1.56, 1.82]) {
    keys.push({ position: [x, 0.88, -4.43], rotation: [-1.03, 0, 0] });
  }
  roundedInstances(group, [0.15, 0.055, 0.2], materials.accent, keys, 0.02);
  addCylinder(group, 0.055, 0.42, materials.trim, {
    position: [-2.05, 0.97, -4.35],
    rotation: [0.96, 0, -0.18],
  }, 12);
}

function buildPilotSeat(group: THREE.Group, materials: InteriorMaterials): void {
  addCylinder(group, 0.23, 0.5, materials.frame, {
    position: [0, 0.2, -3.32],
  }, 18);
  addRoundedBox(group, [1.06, 0.24, 1.18], materials.upholstery, {
    position: [0, 0.49, -3.45],
    rotation: [-0.035, 0, 0],
  }, 0.12);
  addRoundedBox(group, [1.1, 1.38, 0.2], materials.upholstery, {
    position: [0, 1.12, -2.96],
    rotation: [-0.17, 0, 0],
  }, 0.09);
  addRoundedBox(group, [0.72, 0.35, 0.24], materials.upholstery, {
    position: [0, 1.77, -2.84],
    rotation: [-0.14, 0, 0],
  }, 0.1);
  const bolsters: Placement[] = [];
  for (const side of [-1, 1]) {
    bolsters.push(
      { position: [side * 0.52, 0.65, -3.35], rotation: [-0.08, 0, side * -0.08] },
      { position: [side * 0.53, 1.16, -2.9], rotation: [-0.17, 0, side * -0.06] },
    );
    addRoundedBox(group, [0.09, 0.8, 0.045], materials.trim, {
      position: [side * 0.27, 1.2, -2.83],
      rotation: [-0.18, 0, side * 0.17],
    }, 0.02);
  }
  roundedInstances(group, [0.18, 0.58, 0.24], materials.upholstery, bolsters, 0.08);
}

function buildPedals(group: THREE.Group, materials: InteriorMaterials): void {
  roundedInstances(group, [0.42, 0.08, 0.62], materials.frame, [
    { position: [-0.38, 0.18, -4.35], rotation: [-0.28, 0, 0] },
    { position: [0.38, 0.18, -4.35], rotation: [-0.28, 0, 0] },
  ], 0.045);
}
