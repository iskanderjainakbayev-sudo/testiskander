import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addInstances,
  addRoundedBox,
  roundedInstances,
  type Placement,
} from './interiorGeometry';

export function buildBulkheads(group: THREE.Group, materials: InteriorMaterials): void {
  const geometry = createPortalGeometry();
  const placements: Placement[] = [-3.9, -1.9, 0.1, 2.1, 4.1, 6.1, 8.1, 10.1]
    .map((z) => ({ position: [0, 0, z] }));
  addInstances(group, geometry, materials.frame, placements);
  buildCockpitCanopy(group, materials);
  buildObservationWindows(group, materials);
}

function createPortalGeometry(): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  outer.moveTo(-3.12, -0.02);
  outer.lineTo(-3.12, 2.44);
  outer.lineTo(-2.69, 3.17);
  outer.lineTo(2.69, 3.17);
  outer.lineTo(3.12, 2.44);
  outer.lineTo(3.12, -0.02);
  outer.closePath();
  const aperture = new THREE.Path();
  aperture.moveTo(2.64, 0.12);
  aperture.lineTo(2.64, 2.32);
  aperture.lineTo(2.36, 2.82);
  aperture.lineTo(-2.36, 2.82);
  aperture.lineTo(-2.64, 2.32);
  aperture.lineTo(-2.64, 0.12);
  aperture.closePath();
  outer.holes.push(aperture);
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -0.07);
  geometry.computeVertexNormals();
  return geometry;
}

function buildCockpitCanopy(group: THREE.Group, materials: InteriorMaterials): void {
  addRoundedBox(group, [5.25, 1.82, 0.035], materials.glass, {
    position: [0, 1.77, -7.15],
    rotation: [-0.065, 0, 0],
  }, 0.012);
  const verticals: Placement[] = [-2.55, 0, 2.55].map((x) => ({
    position: [x, 1.72, -7.08],
    rotation: [0, 0, x === 0 ? 0 : Math.sign(x) * -0.17],
  }));
  roundedInstances(group, [0.18, 3.02, 0.2], materials.frame, verticals, 0.055);
  addRoundedBox(group, [5.45, 0.2, 0.23], materials.frame, {
    position: [0, 3.03, -7.02],
    rotation: [-0.08, 0, 0],
  }, 0.065);
  for (const side of [-1, 1]) {
    addRoundedBox(group, [1.05, 0.3, 3.95], materials.shell, {
      position: [side * 2.69, 0.23, -6.12],
      rotation: [0, side * 0.23, side * 0.075],
    }, 0.09);
    addRoundedBox(group, [0.24, 0.2, 3.7], materials.trim, {
      position: [side * 2.42, 0.42, -6.15],
      rotation: [0, side * 0.23, side * 0.075],
    }, 0.055);
  }
}

function buildObservationWindows(group: THREE.Group, materials: InteriorMaterials): void {
  for (const side of [-1, 1]) {
    addRoundedBox(group, [0.035, 1.38, 3.72], materials.glass, {
      position: [side * 2.88, 1.67, 4.1],
    }, 0.012);
    roundedInstances(group, [0.18, 0.15, 4.05], materials.frame, [
      { position: [side * 2.84, 0.92, 4.1] },
      { position: [side * 2.84, 2.43, 4.1] },
    ], 0.045);
    roundedInstances(group, [0.16, 1.55, 0.14], materials.trim, [
      { position: [side * 2.82, 1.67, 2.25] },
      { position: [side * 2.82, 1.67, 4.1] },
      { position: [side * 2.82, 1.67, 5.95] },
    ], 0.035);
  }
}
