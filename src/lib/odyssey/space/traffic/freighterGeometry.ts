import * as THREE from 'three';
import {
  capsule,
  cone,
  ellipsoid,
  loft,
  mergeParts,
  torus,
} from './geometryUtils';
import type { ShipGeometrySet } from './types';

function createArkose(): ShipGeometrySet {
  const hull = mergeParts([
    capsule(2.6, 13.4, [0, 0, 0]),
    capsule(1.85, 9.2, [-3.8, -0.25, -1.2], [1, .9, 1]),
    capsule(1.85, 9.2, [3.8, -0.25, -1.2], [1, .9, 1]),
    ellipsoid(2.2, [0, .05, 7.2], [.92, .72, 1.48]),
    torus(4.05, .28, [0, -.1, -2.8]),
    torus(3.9, .19, [0, -.1, 2.7]),
  ], 'Arkose freight hull');
  const detail = mergeParts([
    torus(2.64, .17, [0, 0, -5.2]),
    torus(2.64, .17, [0, 0, .8]),
    torus(1.9, .13, [-3.8, -.25, -4.1]),
    torus(1.9, .13, [3.8, -.25, -4.1]),
    loft([
      { z: -7, y: 2.1, width: .08, height: .08 },
      { z: -2, y: 2.7, width: .34, height: .22 },
      { z: 4.2, y: 2.2, width: .12, height: .1 },
    ], 8),
  ], 'Arkose armor and spine');
  const glass = mergeParts([
    ellipsoid(1.5, [0, 2.25, 5.1], [1, .25, 1.45]),
    capsule(.17, 4.2, [-2.25, 1.22, 1.3], [.7, .5, 1]),
    capsule(.17, 4.2, [2.25, 1.22, 1.3], [.7, .5, 1]),
  ], 'Arkose windows');
  return { hull, detail, glass };
}

function createCaravel(): ShipGeometrySet {
  const wing = loft([
    { z: -8.5, y: -.2, width: .15, height: .12 },
    { z: -4, y: .05, width: 7.1, height: .26 },
    { z: 2.5, y: .35, width: 5.3, height: .36 },
    { z: 8.5, y: .1, width: .12, height: .1 },
  ], 14);
  const hull = mergeParts([
    capsule(2.15, 18, [0, .25, 0]),
    capsule(1.25, 13.5, [-4.25, -.15, -2]),
    capsule(1.25, 13.5, [4.25, -.15, -2]),
    cone(1.7, 5.2, [-4.25, -.15, 8.2]),
    cone(1.7, 5.2, [4.25, -.15, 8.2]),
    wing,
  ], 'Caravel forked freight hull');
  const detail = mergeParts([
    torus(2.2, .16, [0, .25, -7.1]),
    torus(2.2, .16, [0, .25, 3.6]),
    torus(1.29, .12, [-4.25, -.15, -7]),
    torus(1.29, .12, [4.25, -.15, -7]),
    capsule(.25, 12, [0, -2.1, -1], [.65, .6, 1]),
  ], 'Caravel ventral armor');
  const glass = mergeParts([
    ellipsoid(1.42, [0, 2.05, 6.2], [.95, .25, 1.5]),
    capsule(.15, 5.5, [-4.25, 1.08, -.5], [.7, .45, 1]),
    capsule(.15, 5.5, [4.25, 1.08, -.5], [.7, .45, 1]),
  ], 'Caravel windows');
  return { hull, detail, glass };
}

export function createFreighterGeometry(id: 'arkose' | 'caravel'): ShipGeometrySet {
  return id === 'arkose' ? createArkose() : createCaravel();
}
