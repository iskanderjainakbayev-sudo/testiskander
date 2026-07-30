import {
  capsule,
  cone,
  ellipsoid,
  loft,
  mergeParts,
  torus,
} from './geometryUtils';
import type { ShipGeometrySet } from './types';

function createManta(): ShipGeometrySet {
  const body = loft([
    { z: -8, y: -.15, width: .08, height: .06 },
    { z: -5.4, y: -.1, width: 4.8, height: .45 },
    { z: -1.5, y: .15, width: 7.1, height: .7 },
    { z: 3.2, y: .45, width: 4.4, height: 1.05 },
    { z: 6.8, y: .18, width: 1.35, height: .74 },
    { z: 8.1, y: 0, width: .08, height: .05 },
  ], 18);
  const hull = mergeParts([
    body,
    capsule(.74, 9.8, [-2.7, -.28, -.8], [1, .75, 1]),
    capsule(.74, 9.8, [2.7, -.28, -.8], [1, .75, 1]),
    ellipsoid(1.32, [0, .6, 4], [.9, .55, 1.6]),
  ], 'Manta lifting-body escort hull');
  const detail = mergeParts([
    torus(.78, .1, [-2.7, -.28, -5.2]),
    torus(.78, .1, [2.7, -.28, -5.2]),
    capsule(.16, 8.4, [0, -.76, -1.2], [.8, .5, 1]),
    cone(.35, 2.1, [0, .5, 8.2]),
  ], 'Manta armor');
  const glass = mergeParts([
    ellipsoid(1.05, [0, 1.48, 3.7], [1, .28, 1.48]),
    capsule(.11, 3.7, [-1.48, .72, 1.2], [.7, .4, 1]),
    capsule(.11, 3.7, [1.48, .72, 1.2], [.7, .4, 1]),
  ], 'Manta canopy');
  return { hull, detail, glass };
}

function createLancer(): ShipGeometrySet {
  const body = loft([
    { z: -9.2, y: -.1, width: .12, height: .08 },
    { z: -6.8, y: -.1, width: 2.2, height: .66 },
    { z: -2, y: .12, width: 4.9, height: .9 },
    { z: 3.8, y: .3, width: 2.75, height: 1.12 },
    { z: 8.4, y: 0, width: .12, height: .07 },
  ], 18);
  const hull = mergeParts([
    body,
    capsule(.68, 12.7, [-1.8, -.34, -.5], [1, .76, 1]),
    capsule(.68, 12.7, [1.8, -.34, -.5], [1, .76, 1]),
    torus(3.9, .32, [0, 0, -1.6], [0, 0, .18], Math.PI * 1.35),
  ], 'Lancer swept escort hull');
  const detail = mergeParts([
    torus(.72, .09, [-1.8, -.34, -6.1]),
    torus(.72, .09, [1.8, -.34, -6.1]),
    capsule(.13, 10.8, [0, -.82, -1], [.7, .45, 1]),
    cone(.28, 2.5, [0, .45, 8.9]),
  ], 'Lancer armor');
  const glass = mergeParts([
    ellipsoid(1.0, [0, 1.35, 4.3], [.88, .25, 1.65]),
    ellipsoid(.35, [0, .8, 6.3], [.9, .3, 1.4]),
  ], 'Lancer canopy');
  return { hull, detail, glass };
}

export function createEscortGeometry(id: 'manta' | 'lancer'): ShipGeometrySet {
  return id === 'manta' ? createManta() : createLancer();
}
