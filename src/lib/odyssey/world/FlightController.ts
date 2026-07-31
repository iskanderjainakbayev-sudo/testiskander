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
  private yawRate = 0;
  private pitchRate = 0;
  private rollRate = 0;
  private readonly rotation = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly velocity = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly targetDirection = new THREE.Vector3();
  private readonly desiredQuaternion = new THREE.Quaternion();
  private readonly inverseQuaternion = new THREE.Quaternion();

  reset() {
    this.position.set(0, 0, 0);
    this.quaternion.identity();
    this.throttle = 0;
    this.speed = 0;
    this.boost = false;
    this.yawRate = 0;
    this.pitchRate = 0;
    this.rollRate = 0;
  }

  update(delta: number, input: InputController) {
    const look = input.takeLook();
    const yawInput = Number(input.isDown('KeyA')) - Number(input.isDown('KeyD'));
    const pitchInput = Number(input.isDown('ArrowUp')) - Number(input.isDown('ArrowDown'));
    const rollInput = Number(input.isDown('KeyZ')) - Number(input.isDown('KeyC'));
    this.yawRate = THREE.MathUtils.damp(this.yawRate, yawInput * 1.15, 8, delta);
    this.pitchRate = THREE.MathUtils.damp(this.pitchRate, pitchInput * 0.85, 8, delta);
    this.rollRate = THREE.MathUtils.damp(this.rollRate, rollInput * 0.9, 8, delta);
    if (input.isDown('KeyW')) this.throttle = Math.min(1, this.throttle + delta * 0.9);
    if (input.isDown('KeyS')) this.throttle = Math.max(0, this.throttle - delta * 1.25);
    if (input.isDown('Space')) this.throttle = Math.max(0, this.throttle - delta * 1.2);
    this.boost = input.isDown('ShiftLeft') || input.isDown('ShiftRight');

    this.rotation.setFromEuler(this.euler.set(
      -look.y * 0.0018 + this.pitchRate * delta,
      -look.x * 0.0018 + this.yawRate * delta,
      this.rollRate * delta,
      'XYZ',
    ));
    this.quaternion.multiply(this.rotation).normalize();
    const desired = this.throttle * (this.boost ? 330 : 82);
    this.speed = THREE.MathUtils.damp(this.speed, desired, this.boost ? 2.2 : 3.8, delta);
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

  getInverseQuaternion(target = this.inverseQuaternion) {
    return target.copy(this.quaternion).invert();
  }
}
