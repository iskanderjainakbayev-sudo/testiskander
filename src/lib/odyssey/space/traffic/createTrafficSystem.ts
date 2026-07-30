import * as THREE from 'three';
import { createCarrier } from './carrier';
import { disposeTraffic } from './disposeTraffic';
import { createFleetRuntimes } from './fleetRuntime';
import { createFleetUpdater } from './fleetUpdater';
import { createFleetVisuals } from './fleetVisuals';
import { createTrafficMaterials } from './materials';
import { createTrafficRoutes } from './routes';
import { createDistantLanes } from './trafficEffects';
import type { TrafficSystem, TrafficUpdate } from './types';

export type { TrafficSystem, TrafficUpdate } from './types';

const FAR_AWAY = new THREE.Vector3(100_000, 100_000, 100_000);

export function createTrafficSystem(): TrafficSystem {
  const group = new THREE.Group();
  group.name = 'Odyssey living-universe traffic';
  const routes = createTrafficRoutes();
  const materialBundle = createTrafficMaterials();
  const { materials } = materialBundle;
  const visuals = createFleetVisuals(materials);
  const runtimes = createFleetRuntimes(routes);
  const updateFleet = createFleetUpdater(runtimes, visuals, materials);
  const lanes = createDistantLanes(routes, materials.lane);
  const carrier = createCarrier(materials);
  group.add(lanes, visuals.group, carrier.group);

  let disposed = false;
  updateFleet(0, FAR_AWAY);
  carrier.update(0);

  return {
    group,
    update: (time, shipPosition): TrafficUpdate => {
      if (disposed) {
        return {
          nearestShipName: null,
          nearestShipDistance: Number.POSITIVE_INFINITY,
          encounterMessage: null,
        };
      }
      carrier.update(time);
      return updateFleet(time, shipPosition);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      disposeTraffic(group, materialBundle.textures);
    },
  };
}
