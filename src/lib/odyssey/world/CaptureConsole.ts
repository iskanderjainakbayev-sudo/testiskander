import type { InputController } from './InputController';
import type { OdysseyCinematics } from './OdysseyCinematics';
import type { OdysseySession } from './OdysseySession';
import type { PlanetExpeditions } from './PlanetExpeditions';
import {
  buildSceneList,
  isDiscoveryId,
  isLandable,
  isWalkScene,
  showFlight,
  showSurface,
  showTransition,
  showWalking,
} from './CaptureScenes';
type CaptureWindow = Window & { __ODYSSEY_CAPTURE__?: OdysseyCaptureApi };

export interface OdysseyCaptureApi {
  list: () => string[];
  ready: () => Promise<boolean>;
  show: (scene: string) => boolean;
  state: () => { mode: string; target: string; landingTarget: string };
}

export function installCaptureConsole(
  session: OdysseySession,
  input: InputController,
  expedition: PlanetExpeditions,
  cinematics: OdysseyCinematics,
  showMenu: () => void,
  modelReady: Promise<boolean>,
) {
  const captureScene = new URLSearchParams(window.location.search).get('capture');
  if (captureScene === null) return () => undefined;
  const captureWindow = window as CaptureWindow;
  const scenes = buildSceneList();
  const api: OdysseyCaptureApi = {
    list: () => [...scenes],
    ready: () => modelReady,
    state: () => ({
      mode: session.mode,
      target: session.mission.target,
      landingTarget: session.landingTarget,
    }),
    show: (scene) => showScene(
      scene,
      session,
      input,
      expedition,
      cinematics,
      showMenu,
    ),
  };
  captureWindow.__ODYSSEY_CAPTURE__ = api;
  if (captureScene !== '' && captureScene !== '1') api.show(captureScene);
  return () => {
    if (captureWindow.__ODYSSEY_CAPTURE__ === api) delete captureWindow.__ODYSSEY_CAPTURE__;
  };
}

function showScene(
  scene: string,
  session: OdysseySession,
  input: InputController,
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
