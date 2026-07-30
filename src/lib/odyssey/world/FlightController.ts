import * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import type { DiscoveryId } from '../types';
import type { InputController } from './InputController';

const FORWARD = new THREE.Vector3(0, 0, -1);

export class FlightController {
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  throttle = 0;
  speed = 0;
  boost = false;
  private pitchRate = 0;
  private yawRate = 0;
  private rollRate = 0;

  update(delta: number, input: InputController) {
    const look = input.takeLook();
    this.pitchRate = THREE.MathUtils.lerp(this.pitchRate, -look.y * 0.0024, 0.18);
    this.yawRate = THREE.MathUtils.lerp(this.yawRate, -look.x * 0.0024, 0.18);
    const rollInput = Number(input.isDown('KeyA')) - Number(input.isDown('KeyD'));
    this.rollRate = THREE.MathUtils.lerp(this.rollRate, rollInput * 0.9, delta * 5);
    if (input.isDown('KeyW')) this.throttle = Math.min(1, this.throttle + delta * 0.32);
    if (input.isDown('KeyS')) this.throttle = Math.max(0, this.throttle - delta * 0.4);
    if (input.isDown('Space')) this.throttle = Math.max(0, this.throttle - delta * 1.2);
    this.boost = input.isDown('ShiftLeft') || input.isDown('ShiftRight');

    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      this.pitchRate,
      this.yawRate,
      this.rollRate * delta,
      'XYZ',
    ));
    this.quaternion.multiply(rotation).normalize();
    const desired = this.throttle * (this.boost ? 330 : 82);
    this.speed = THREE.MathUtils.damp(this.speed, desired, this.boost ? 1.8 : 2.8, delta);
    const velocity = FORWARD.clone().applyQuaternion(this.quaternion).multiplyScalar(this.speed * delta);
    this.position.add(velocity);
    this.pitchRate *= Math.pow(0.72, delta * 60);
    this.yawRate *= Math.pow(0.72, delta * 60);
  }

  distanceTo(id: DiscoveryId) {
    return this.position.distanceTo(new THREE.Vector3(...DISCOVERIES[id].position));
  }

  directionTo(id: DiscoveryId) {
    return new THREE.Vector3(...DISCOVERIES[id].position).sub(this.position).normalize();
  }

  alignTo(id: DiscoveryId, delta: number) {
    const desired = new THREE.Quaternion().setFromUnitVectors(FORWARD, this.directionTo(id));
    this.quaternion.slerp(desired, Math.min(1, delta * 1.35)).normalize();
  }

  getInverseQuaternion(target = new THREE.Quaternion()) {
    return target.copy(this.quaternion).invert();
  }
}
