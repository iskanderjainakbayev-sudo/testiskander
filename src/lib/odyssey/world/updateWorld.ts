import * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import type { WorldCallbacks } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';

const FORWARD = new THREE.Vector3(0, 0, -1);
const currentForward = new THREE.Vector3();

export function updateWalking(
  session: OdysseySession,
  input: InputController,
  camera: THREE.PerspectiveCamera,
  delta: number,
) {
  session.mission.updateTime(delta);
  session.walking.update(delta, input, camera, () => session.audio.footstep());
  if (input.consume('KeyE')) session.interact(camera);
}

export function updateFlight(
  session: OdysseySession,
  input: InputController,
  camera: THREE.PerspectiveCamera,
  callbacks: WorldCallbacks,
  delta: number,
  time: number,
) {
  const { flight, mission, audio } = session;
  flight.update(delta, input);
  if (input.isDown('KeyF')) flight.alignTo(mission.target, delta);
  const distance = flight.distanceTo(mission.target);
  const scanRange = DISCOVERIES[mission.target].scanRange;
  if (distance < scanRange * 1.45) {
    flight.boost = false;
    const approachSpeed = Math.max(2, (distance - scanRange * 0.35) * 0.22);
    flight.speed = Math.min(flight.speed, approachSpeed);
  }
  audio.setFlight(flight.throttle, flight.boost);
  if (flight.boost) session.fuel = Math.max(12, session.fuel - delta * 0.22);
  const shake = flight.boost ? Math.sin(time * 0.04) * 0.006 : 0;
  camera.position.set(shake, 1.58 + shake, -3.9);
  camera.rotation.set(shake * 0.2, 0, shake * 0.3);
  if (input.consume('KeyT')) session.cycleTarget();
  if (input.consume('KeyE') && flight.speed < 3) session.interact(camera);
  const scanning = input.isDown('KeyQ') || performance.now() < session.manualScanUntil;
  const alignment = flight.directionTo(mission.target).dot(
    currentForward.copy(FORWARD).applyQuaternion(flight.quaternion),
  );
  const completed = mission.update(
    delta,
    scanning,
    distance,
    alignment,
  );
  if (scanning) audio.scan(mission.scanProgress);
  if (completed) session.finishDiscovery(completed, input, callbacks);
}

export function updateMenu(camera: THREE.PerspectiveCamera, time: number) {
  camera.position.x = 0.42 + Math.sin(time * 0.00013) * 0.09;
  camera.position.y = 1.48 + Math.sin(time * 0.00021) * 0.025;
  camera.lookAt(0, 1.35, -10);
}

export function updateEnding(
  session: OdysseySession,
  camera: THREE.PerspectiveCamera,
  delta: number,
  time: number,
) {
  session.endingTimer += delta;
  const { flight } = session;
  flight.throttle = Math.min(1, session.endingTimer / 4);
  flight.boost = session.endingTimer > 3.5;
  flight.speed = THREE.MathUtils.damp(flight.speed, 420, 0.55, delta);
  flight.position.add(
    currentForward.copy(FORWARD).applyQuaternion(flight.quaternion).multiplyScalar(flight.speed * delta),
  );
  camera.position.set(0, 1.58, -3.9 + Math.sin(time * 0.03) * 0.01);
  session.audio.setFlight(1, true);
}
