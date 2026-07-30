import * as THREE from 'three';
import type { DiscoveryId, LandablePlanetId } from '../types';
import type { InputController } from './InputController';
import type { OdysseyCinematics } from './OdysseyCinematics';
import type { OdysseySession } from './OdysseySession';
import type { PlanetExpeditions } from './PlanetExpeditions';

const DISCOVERY_IDS: DiscoveryId[] = ['solace', 'nacre', 'veil', 'pilgrim', 'atlas'];
const WALK_SCENES = ['corridor', 'cockpit', 'archive', 'reactor'] as const;
type WalkScene = typeof WALK_SCENES[number];
type CaptureWindow = Window & { __ODYSSEY_CAPTURE__?: OdysseyCaptureApi };

export interface OdysseyCaptureApi {
  list: () => string[];
  show: (scene: string) => boolean;
  state: () => { mode: string; target: string; landingTarget: string };
}

export function installCaptureConsole(
  session: OdysseySession,
  input: InputController,
  camera: THREE.PerspectiveCamera,
  expedition: PlanetExpeditions,
  cinematics: OdysseyCinematics,
  showMenu: () => void,
) {
  if (!new URLSearchParams(window.location.search).has('capture')) return () => undefined;
  const captureWindow = window as CaptureWindow;
  const scenes = buildSceneList();
  const api: OdysseyCaptureApi = {
    list: () => [...scenes],
    state: () => ({
      mode: session.mode,
      target: session.mission.target,
      landingTarget: session.landingTarget,
    }),
    show: (scene) => showScene(
      scene,
      session,
      input,
      camera,
      expedition,
      cinematics,
      showMenu,
    ),
  };
  captureWindow.__ODYSSEY_CAPTURE__ = api;
  return () => {
    if (captureWindow.__ODYSSEY_CAPTURE__ === api) delete captureWindow.__ODYSSEY_CAPTURE__;
  };
}

function showScene(
  scene: string,
  session: OdysseySession,
  input: InputController,
  camera: THREE.PerspectiveCamera,
  expedition: PlanetExpeditions,
  cinematics: OdysseyCinematics,
  showMenu: () => void,
) {
  input.clear();
  cinematics.cancel();
  if (scene === 'menu') {
    session.mode = 'menu';
    showMenu();
    return true;
  }
  const [kind, rawId] = scene.split('-');
  if (kind === 'walk' && isWalkScene(rawId)) {
    showWalking(rawId, session);
    return true;
  }
  if (kind === 'flight' && isDiscoveryId(rawId)) {
    showFlight(rawId, session);
    return true;
  }
  if (kind === 'surface' && isLandable(rawId)) {
    showSurface(rawId, session, expedition);
    return true;
  }
  if (kind === 'discovery' && isDiscoveryId(rawId)) {
    showFlight(rawId, session);
    cinematics.beginDiscovery(rawId);
    return true;
  }
  if ((kind === 'landing' || kind === 'takeoff') && isLandable(rawId)) {
    return showTransition(kind, rawId, session, input, expedition);
  }
  if (scene === 'ending') {
    showFlight('atlas', session);
    session.mode = 'ending';
    session.endingTimer = 0;
    return true;
  }
  return false;
}

function showWalking(scene: WalkScene, session: OdysseySession) {
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

function showFlight(id: DiscoveryId, session: OdysseySession) {
  session.mission.target = id;
  const position = targetPosition(id);
  session.flight.position.copy(position);
  session.flight.quaternion.identity();
  session.flight.alignTo(id, 10);
  session.flight.speed = 0;
  session.flight.throttle = 0;
  session.mode = 'flight';
}

function showSurface(
  id: LandablePlanetId,
  session: OdysseySession,
  expedition: PlanetExpeditions,
) {
  session.landingTarget = id;
  expedition.walker.reset();
  session.mode = 'surface';
}

function showTransition(
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

function buildSceneList() {
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

function isDiscoveryId(value: string): value is DiscoveryId {
  return DISCOVERY_IDS.includes(value as DiscoveryId);
}

function isLandable(value: string): value is LandablePlanetId {
  return value === 'solace' || value === 'nacre';
}

function isWalkScene(value: string): value is WalkScene {
  return WALK_SCENES.includes(value as WalkScene);
}
