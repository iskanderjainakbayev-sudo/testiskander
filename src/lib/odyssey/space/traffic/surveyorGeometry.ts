import * as THREE from 'three';
import {
  capsule,
  dish,
  ellipsoid,
  loft,
  mergeParts,
  place,
  torus,
} from './geometryUtils';
import type { ShipGeometrySet } from './types';

function createOrison(): ShipGeometrySet {
  const hull = mergeParts([
    capsule(1.45, 8.2, [0, 0, -.2]),
    ellipsoid(2.25, [0, 0, 1.4], [1.05, .78, 1.28]),
    torus(4.65, .36, [0, 0, -.4], [.16, .08, 0]),
    capsule(.28, 6.6, [-2.1, 0, -.4], [1, 1, 1]),
    capsule(.28, 6.6, [2.1, 0, -.4], [1, 1, 1]),
  ], 'Orison ring surveyor hull');
  const detail = mergeParts([
    dish(2.65, .7, [0, 0, 5.1]),
    capsule(.14, 1.9, [0, 0, 5.8]),
    torus(4.65, .09, [0, 0, -.4], [.16, .08, 0]),
    torus(1.48, .12, [0, 0, -3.6]),
  ], 'Orison instruments');
  const glass = mergeParts([
    ellipsoid(1.65, [0, 1.22, 1.7], [1, .3, 1.15]),
    ellipsoid(.28, [0, 0, 6.9], [1, 1, 1.5]),
  ], 'Orison optics');
  return { hull, detail, glass };
}

function createKestrel(): ShipGeometrySet {
  const crescent = place(
    new THREE.TorusGeometry(5.1, .72, 10, 42, Math.PI * 1.62),
    [0, -.25, -1.2],
    [0, 0, -.31 * Math.PI],
    [1, .72, 1],
  );
  const hull = mergeParts([
    capsule(1.5, 10.8, [0, .15, 0]),
    ellipsoid(1.8, [0, .1, 5.3], [.9, .68, 1.25]),
    crescent,
    loft([
      { z: -7.8, y: -.3, width: .1, height: .08 },
      { z: -3.4, y: -.2, width: 3.8, height: .24 },
      { z: 2.2, y: 0, width: 2.1, height: .2 },
      { z: 6.5, y: .1, width: .08, height: .06 },
    ], 12),
  ], 'Kestrel crescent surveyor hull');
  const detail = mergeParts([
    dish(2.0, .55, [0, -.15, 7.1]),
    capsule(.12, 2.2, [0, -.1, 7.65]),
    torus(1.55, .12, [0, .15, -4.7]),
    torus(5.1, .1, [0, -.25, -1.2], [0, 0, -.31 * Math.PI], Math.PI * 1.62),
  ], 'Kestrel instruments');
  const glass = mergeParts([
    ellipsoid(1.2, [0, 1.42, 3.4], [.88, .27, 1.45]),
    ellipsoid(.22, [0, -.1, 8.8], [1, 1, 1.8]),
  ], 'Kestrel windows');
  return { hull, detail, glass };
}

export function createSurveyorGeometry(id: 'orison' | 'kestrel'): ShipGeometrySet {
  return id === 'orison' ? createOrison() : createKestrel();
}
