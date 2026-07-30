import * as THREE from 'three';
import type { DiscoveryId, LandablePlanetId } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';
import type { PlanetExpeditions } from './PlanetExpeditions';

export const DISCOVERY_IDS: DiscoveryId[] = ['solace', 'nacre', 'veil', 'pilgrim', 'atlas'];
export const WALK_SCENES = ['corridor', 'cockpit', 'archive', 'reactor'] as const;
export type WalkScene = typeof WALK_SCENES[number];

export function showWalking(scene: WalkScene, session: OdysseySession) {
  const poses: Record<WalkScene, readonly [number, number, number, number]> = {
    corridor: [0.45, 6.4, -0.02, 0],
    cockpit: [0.85, -2.05, -0.25, -0.06],
    archive: [1.25, 4.25, -1.1, -0.02],
    reactor: [0.5, 7.1, Math.PI, 0.04],
  };
  const [x, z, yaw, pitch] = poses[scene];
  session.walking.position.set(x, 1.62, z);
  session.walking.yaw = yaw;
  session.walking.pitch = pitch;
  session.mode = 'walking';
}

export function showFlight(id: DiscoveryId, session: OdysseySession) {
  session.mission.target = id;
  session.flight.position.copy(targetPosition(id));
  session.flight.quaternion.identity();
  session.flight.alignTo(id, 10);
  session.flight.speed = 0;
  session.flight.throttle = 0;
  session.mode = 'flight';
}

export function showSurface(
  id: LandablePlanetId,
  session: OdysseySession,
  expedition: PlanetExpeditions,
) {
  session.landingTarget = id;
  expedition.walker.reset();
  session.mode = 'surface';
}

export function showTransition(
  kind: 'landing' | 'takeoff',
  id: LandablePlanetId,
  session: OdysseySession,
  input: InputController,
  expedition: PlanetExpeditions,
) {
  session.landingTarget = id;
  expedition.walker.reset();
  if (kind === 'takeoff') {
    session.mode = 'surface';
    session.beginTakeoff(input);
    return true;
  }
  if (id === 'solace') session.mission.solaceSurveyed = true;
  else session.mission.nacreSurveyed = true;
  showFlight(id, session);
  return session.beginLanding(input);
}

export function buildSceneList() {
  return [
    'menu',
    ...WALK_SCENES.map((id) => `walk-${id}`),
    ...DISCOVERY_IDS.map((id) => `flight-${id}`),
    ...DISCOVERY_IDS.map((id) => `discovery-${id}`),
    'surface-solace', 'surface-nacre',
    'landing-solace', 'landing-nacre',
    'takeoff-solace', 'takeoff-nacre',
    'ending',
  ];
}

export function isDiscoveryId(value: string): value is DiscoveryId {
  return DISCOVERY_IDS.includes(value as DiscoveryId);
}

export function isLandable(value: string): value is LandablePlanetId {
  return value === 'solace' || value === 'nacre';
}

export function isWalkScene(value: string): value is WalkScene {
  return WALK_SCENES.includes(value as WalkScene);
}

function targetPosition(id: DiscoveryId) {
  const positions: Record<DiscoveryId, readonly [number, number, number]> = {
    solace: [380, -25, -590],
    nacre: [725, 70, -815],
    veil: [-640, 135, -1035],
    pilgrim: [820, 205, -1365],
    atlas: [0, 75, -2038],
  };
  return new THREE.Vector3(...positions[id]);
}
