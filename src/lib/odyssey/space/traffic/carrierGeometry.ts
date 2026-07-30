import * as THREE from 'three';
import {
  capsule,
  ellipsoid,
  loft,
  mergeParts,
  place,
  torus,
} from './geometryUtils';

export interface CarrierGeometry {
  hull: THREE.BufferGeometry;
  detail: THREE.BufferGeometry;
  hangars: THREE.BufferGeometry;
  windows: THREE.BufferGeometry;
}

function createWindows(): THREE.BufferGeometry {
  const windows: THREE.BufferGeometry[] = [];
  for (let deck = 0; deck < 3; deck += 1) {
    for (let bay = 0; bay < 10; bay += 1) {
      const angle = bay / 10 * Math.PI * 2;
      windows.push(place(
        new THREE.SphereGeometry(.27, 8, 6),
        [
          Math.cos(angle) * (8.8 + deck * .35),
          Math.sin(angle) * (5.2 + deck * .2),
          -15 + deck * 16,
        ],
        [0, 0, 0],
        [1.45, .7, .55],
      ));
    }
  }
  return mergeParts(windows, 'Ananke observation windows');
}

export function createCarrierGeometry(): CarrierGeometry {
  const centralHull = loft([
    { z: -56, y: 0, width: .3, height: .22 },
    { z: -47, y: -.3, width: 7.2, height: 4.8 },
    { z: -24, y: 0, width: 10.4, height: 6.7 },
    { z: 6, y: .5, width: 11.6, height: 7.7 },
    { z: 31, y: 1.4, width: 8.4, height: 6.2 },
    { z: 49, y: .4, width: 3.2, height: 2.8 },
    { z: 57, y: 0, width: .25, height: .2 },
  ], 24);
  const hull = mergeParts([
    centralHull,
    capsule(4.3, 54, [-14.5, -1.1, -6], [1, .82, 1]),
    capsule(4.3, 54, [14.5, -1.1, -6], [1, .82, 1]),
    ellipsoid(6.5, [0, 5.2, 35], [1, .78, 1.4]),
    torus(15.2, 1.25, [0, 0, -22], [.08, 0, 0]),
    torus(17.2, .95, [0, .2, 12], [-.08, 0, 0]),
  ], 'Ananke carrier pressure hull');

  const details: THREE.BufferGeometry[] = [
    capsule(.48, 74, [-8.5, -6.4, -5], [.9, .55, 1]),
    capsule(.48, 74, [8.5, -6.4, -5], [.9, .55, 1]),
    torus(10.6, .34, [0, 0, -38]),
    torus(11.2, .34, [0, .2, -6]),
    torus(9.4, .3, [0, 1, 28]),
  ];
  for (const x of [-14.5, 14.5]) {
    for (const z of [-29, -10, 10]) {
      details.push(torus(4.35, .25, [x, -1.1, z]));
    }
  }
  const detail = mergeParts(details, 'Ananke armor ribs and launch rails');

  const hangars = mergeParts([
    ellipsoid(3.8, [-14.5, 2.3, 5], [.36, .78, 2.55]),
    ellipsoid(3.8, [14.5, 2.3, 5], [.36, .78, 2.55]),
    ellipsoid(5.2, [0, -6.6, -2], [1.4, .22, 2.1]),
    ellipsoid(2.4, [0, 4.9, 43], [1.4, .3, 1.45]),
  ], 'Ananke recessed hangar apertures');

  return { hull, detail, hangars, windows: createWindows() };
}
