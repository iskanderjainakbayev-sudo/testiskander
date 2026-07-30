import * as THREE from 'three';
import { HULL_PROFILES, VESSELS } from './fleetManifest';
import type { Route, VesselSpec } from './types';

export interface VesselRuntime {
  spec: VesselSpec;
  route: Route;
  instanceIndex: number;
  plumeStart: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
  wasNear: boolean;
}

export function createFleetRuntimes(routes: Map<string, Route>): VesselRuntime[] {
  const instanceCounters = new Map<string, number>();
  let plumeStart = 0;
  return VESSELS.map((spec) => {
    const route = routes.get(spec.route);
    if (!route) throw new Error(`Unknown traffic route: ${spec.route}`);
    const instanceIndex = instanceCounters.get(spec.hull) ?? 0;
    instanceCounters.set(spec.hull, instanceIndex + 1);
    const runtime: VesselRuntime = {
      spec,
      route,
      instanceIndex,
      plumeStart,
      position: new THREE.Vector3(),
      tangent: new THREE.Vector3(0, 0, 1),
      quaternion: new THREE.Quaternion(),
      matrix: new THREE.Matrix4(),
      wasNear: false,
    };
    plumeStart += HULL_PROFILES[spec.hull].engines.length;
    return runtime;
  });
}
