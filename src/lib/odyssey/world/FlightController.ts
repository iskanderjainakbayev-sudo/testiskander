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
  private rollRate = 0;
  private readonly rotation = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly velocity = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly targetDirection = new THREE.Vector3();
  private readonly desiredQuaternion = new THREE.Quaternion();

  reset() {
    this.position.set(0, 0, 0);
    this.quaternion.identity();
    this.throttle = 0;
    this.speed = 0;
    this.boost = false;
    this.rollRate = 0;
  }

  update(delta: number, input: InputController) {
    const look = input.takeLook();
    const rollInput = Number(input.isDown('KeyA')) - Number(input.isDown('KeyD'));
    this.rollRate = THREE.MathUtils.lerp(this.rollRate, rollInput * 0.9, delta * 5);
    if (input.isDown('KeyW')) this.throttle = Math.min(1, this.throttle + delta * 0.32);
    if (input.isDown('KeyS')) this.throttle = Math.max(0, this.throttle - delta * 0.4);
    if (input.isDown('Space')) this.throttle = Math.max(0, this.throttle - delta * 1.2);
    this.boost = input.isDown('ShiftLeft') || input.isDown('ShiftRight');

    this.rotation.setFromEuler(this.euler.set(
      -look.y * 0.0018,
      -look.x * 0.0018,
      this.rollRate * delta,
      'XYZ',
    ));
    this.quaternion.multiply(this.rotation).normalize();
    const desired = this.throttle * (this.boost ? 330 : 82);
    this.speed = THREE.MathUtils.damp(this.speed, desired, this.boost ? 1.8 : 2.8, delta);
    this.velocity.copy(FORWARD).applyQuaternion(this.quaternion).multiplyScalar(this.speed * delta);
    this.position.add(this.velocity);
  }

  distanceTo(id: DiscoveryId) {
    return this.position.distanceTo(this.targetPosition.fromArray(DISCOVERIES[id].position));
  }

  directionTo(id: DiscoveryId) {
    return this.targetDirection
      .copy(this.targetPosition.fromArray(DISCOVERIES[id].position))
      .sub(this.position)
      .normalize();
  }

  alignTo(id: DiscoveryId, delta: number) {
    this.desiredQuaternion.setFromUnitVectors(FORWARD, this.directionTo(id));
    this.quaternion.slerp(this.desiredQuaternion, Math.min(1, delta * 1.35)).normalize();
  }

  getInverseQuaternion(target = new THREE.Quaternion()) {
    return target.copy(this.quaternion).invert();
  }
}
