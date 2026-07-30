import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addInstances,
  roundedInstances,
  type Placement,
} from './interiorGeometry';

const LIGHT_Z = [-3.9, -1.9, 0.1, 2.1, 4.1, 6.1, 8.1, 10.1];
const PANEL_Z = [-3.05, -1.35, 0.35, 7.05, 8.75, 10.15];

export function buildInteriorDetails(group: THREE.Group, materials: InteriorMaterials): void {
  buildGuideLighting(group, materials);
  buildServiceRails(group, materials);
  buildConduits(group, materials);
  buildLouvers(group, materials);
  buildFasteners(group, materials);
}

function buildGuideLighting(group: THREE.Group, materials: InteriorMaterials): void {
  roundedInstances(
    group,
    [1.42, 0.035, 0.09],
    materials.accent,
    LIGHT_Z.map((z) => ({ position: [0, 2.9, z - 0.07] })),
    0.015,
  );
  roundedInstances(
    group,
    [1.55, 0.025, 0.07],
    materials.accent,
    LIGHT_Z.slice(0, -1).map((z) => ({ position: [0, 0.07, z + 0.85] })),
    0.01,
  );
}

function buildServiceRails(group: THREE.Group, materials: InteriorMaterials): void {
  const railGeometry = new THREE.CylinderGeometry(0.035, 0.035, 14.8, 10);
  addInstances(group, railGeometry, materials.trim, [
    { position: [-2.48, 0.48, 2.75], rotation: [Math.PI / 2, 0, 0] },
    { position: [2.48, 0.48, 2.75], rotation: [Math.PI / 2, 0, 0] },
  ]);
  const brackets: Placement[] = [];
  for (const side of [-1, 1]) {
    LIGHT_Z.forEach((z) => brackets.push({
      position: [side * 2.48, 0.33, z],
      rotation: [0, 0, Math.PI / 2],
    }));
  }
  roundedInstances(group, [0.08, 0.32, 0.18], materials.frame, brackets, 0.025);
}

function buildConduits(group: THREE.Group, materials: InteriorMaterials): void {
  const paths = [
    [[-1.72, 2.9, 10.4], [-1.72, 2.83, 5], [-1.48, 2.82, 0], [-1.15, 2.78, -4.8]],
    [[1.7, 2.92, 10.4], [1.72, 2.86, 5.4], [1.54, 2.82, 0.2], [1.18, 2.79, -4.7]],
    [[-2.61, 2.56, 9.8], [-2.6, 2.52, 6.2], [-2.54, 2.5, 3.1], [-2.45, 2.47, 0.4]],
  ] as const;
  paths.forEach((points, index) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, 48, index === 2 ? 0.035 : 0.045, 7, false);
    const conduit = new THREE.Mesh(geometry, materials.conduit);
    conduit.castShadow = true;
    group.add(conduit);
  });
}

function buildLouvers(group: THREE.Group, materials: InteriorMaterials): void {
  const louvers: Placement[] = [];
  for (const side of [-1, 1]) {
    PANEL_Z.forEach((z) => {
      for (let row = -2; row <= 2; row += 1) {
        louvers.push({ position: [side * 2.705, 1.62 + row * 0.14, z] });
      }
    });
  }
  roundedInstances(group, [0.045, 0.055, 0.82], materials.trim, louvers, 0.016);
}

function buildFasteners(group: THREE.Group, materials: InteriorMaterials): void {
  const placements: Placement[] = [];
  LIGHT_Z.forEach((z) => {
    for (const x of [-2.13, 2.13]) placements.push({ position: [x, 0.095, z + 0.58] });
    for (const side of [-1, 1]) {
      for (const y of [1.08, 2.16]) placements.push({ position: [side * 2.67, y, z] });
    }
  });
  addInstances(group, new THREE.SphereGeometry(0.038, 8, 5), materials.trim, placements);
}
