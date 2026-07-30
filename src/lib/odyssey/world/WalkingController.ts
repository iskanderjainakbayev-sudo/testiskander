import * as THREE from 'three';
import type { InputController } from './InputController';

export type StationId = 'helm' | 'navigation' | 'archive' | 'reactor';

const STATIONS: Array<{ id: StationId; label: string; position: THREE.Vector3; range: number }> = [
  { id: 'helm', label: 'TAKE THE HELM', position: new THREE.Vector3(0, 1.5, -3.5), range: 1.75 },
  { id: 'navigation', label: 'TOUCH THE STAR MAP', position: new THREE.Vector3(-1.15, 1.4, 1.25), range: 1.8 },
  { id: 'archive', label: 'OPEN ECHO ARCHIVE', position: new THREE.Vector3(2.2, 1.45, 3.8), range: 1.65 },
  { id: 'reactor', label: 'TUNE THE PULSE CORE', position: new THREE.Vector3(0, 1.5, 8.1), range: 1.8 },
];

export class WalkingController {
  readonly position = new THREE.Vector3(0, 1.62, 7.2);
  yaw = 0;
  pitch = 0;
  private bob = 0;
  private stepDistance = 0;

  reset() {
    this.position.set(0, 1.62, 7.2);
    this.yaw = 0;
    this.pitch = 0;
  }

  leaveHelm() {
    this.position.set(0.95, 1.62, -2.35);
    this.yaw = 0.25;
    this.pitch = 0;
  }

  update(
    delta: number,
    input: InputController,
    camera: THREE.PerspectiveCamera,
    onStep: () => void,
  ) {
    const look = input.takeLook();
    this.yaw -= look.x * 0.0018;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.y * 0.0016, -1.28, 1.28);
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const movement = new THREE.Vector3();
    if (input.isDown('KeyW')) movement.add(forward);
    if (input.isDown('KeyS')) movement.sub(forward);
    if (input.isDown('KeyD')) movement.add(right);
    if (input.isDown('KeyA')) movement.sub(right);
    const moving = movement.lengthSq() > 0;
    if (moving) {
      const distance = delta * (input.isDown('ShiftLeft') ? 3.35 : 2.35);
      this.position.add(movement.normalize().multiplyScalar(distance));
      this.stepDistance += distance;
      if (this.stepDistance > 0.82) {
        this.stepDistance = 0;
        onStep();
      }
      this.bob += delta * 9;
    }
    this.position.x = THREE.MathUtils.clamp(this.position.x, -2.42, 2.42);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -4.25, 8.35);
    const bob = moving ? Math.sin(this.bob) * 0.025 : 0;
    camera.position.set(this.position.x, this.position.y + bob, this.position.z);
    camera.rotation.set(this.pitch + (moving ? Math.sin(this.bob * 0.5) * 0.004 : 0), this.yaw, 0, 'YXZ');
  }

  nearbyStation() {
    let nearest: typeof STATIONS[number] | null = null;
    let distance = Number.POSITIVE_INFINITY;
    for (const station of STATIONS) {
      const current = this.position.distanceTo(station.position);
      if (current < station.range && current < distance) {
        nearest = station;
        distance = current;
      }
    }
    return nearest;
  }
}
