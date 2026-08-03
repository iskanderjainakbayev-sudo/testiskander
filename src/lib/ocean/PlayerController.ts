import * as THREE from 'three';
import type { InputController } from './InputController';
import type { OceanState } from './OceanState';
import { floorAt } from './terrain';

export class PlayerController {
  readonly maxStamina = 100;
  stamina = this.maxStamina;
  accelerating = false;
  moving = false;
  private yaw = Math.PI;
  private pitch = 0.08;
  private targetYaw = Math.PI;
  private targetPitch = 0.08;
  private readonly velocity = new THREE.Vector3();
  private staminaRecoveryDelay = 0;
  readonly position = new THREE.Vector3(0, -1.2, 2);

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly input: InputController,
  ) {
    this.syncCamera();
  }

  reset(position: [number, number, number] = [0, -1.2, 2]): void {
    this.position.fromArray(position);
    this.velocity.set(0, 0, 0);
    this.stamina = this.maxStamina;
    this.accelerating = false;
    this.moving = false;
    this.staminaRecoveryDelay = 0;
    this.yaw = Math.PI;
    this.pitch = 0.08;
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
    this.syncCamera();
  }

  update(delta: number, state: OceanState, inSub: boolean): void {
    const [lookX, lookY] = this.input.takeLook();
    const keyLookX = Number(this.input.isDown('ArrowRight')) - Number(this.input.isDown('ArrowLeft'));
    const keyLookY = Number(this.input.isDown('ArrowDown')) - Number(this.input.isDown('ArrowUp'));
    this.targetYaw -= lookX * 0.00215 + keyLookX * delta * 1.65;
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch - lookY * 0.0018 - keyLookY * delta * 1.35,
      -1.38,
      1.38,
    );
    const lookBlend = 1 - Math.exp(-delta * 24);
    const yawDelta = Math.atan2(Math.sin(this.targetYaw - this.yaw), Math.cos(this.targetYaw - this.yaw));
    this.yaw += yawDelta * lookBlend;
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, lookBlend);
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const movement = new THREE.Vector3();
    const [stickX, stickForward] = this.input.virtualMove();
    const forwardInput = stickForward + Number(this.input.isDown('KeyW')) - Number(this.input.isDown('KeyS'));
    const sideInput = stickX + Number(this.input.isDown('KeyD')) - Number(this.input.isDown('KeyA'));
    movement.addScaledVector(forward, THREE.MathUtils.clamp(forwardInput, -1, 1));
    movement.addScaledVector(right, THREE.MathUtils.clamp(sideInput, -1, 1));
    if (this.input.isDown('Space')) movement.y += 1;
    if (this.input.isDown('ControlLeft') || this.input.isDown('ControlRight')) movement.y -= 1;
    const moving = movement.lengthSq() > 0;
    this.moving = moving;
    const wantsAcceleration = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');
    this.accelerating = moving && wantsAcceleration && this.stamina > 0.5;
    if (this.accelerating) {
      this.stamina = Math.max(0, this.stamina - delta * (inSub ? 17 : 24));
      this.staminaRecoveryDelay = 0.72;
    } else {
      this.staminaRecoveryDelay = Math.max(0, this.staminaRecoveryDelay - delta);
      if (this.staminaRecoveryDelay === 0) {
        this.stamina = Math.min(this.maxStamina, this.stamina + delta * (inSub ? 22 : 16));
      }
    }
    const fins = state.crafted.includes('fins') ? 1.35 : 1;
    const sprint = this.accelerating ? (inSub ? 1.55 : 1.72) : 1;
    const battery = inSub && state.subBattery <= 0 ? 0.24 : 1;
    const speed = (inSub ? 11.5 : 5.1 * fins) * sprint * battery;
    const movementStrength = Math.min(1, movement.length());
    if (moving) movement.normalize().multiplyScalar(speed * movementStrength);
    this.velocity.lerp(movement, 1 - Math.exp(-delta * (inSub ? 3.8 : 5.5)));
    this.position.addScaledVector(this.velocity, delta);
    const radius = Math.hypot(this.position.x, this.position.z - 8);
    if (radius > 284) {
      const scale = 284 / radius;
      this.position.x *= scale;
      this.position.z = 8 + (this.position.z - 8) * scale;
    }
    const floor = floorAt(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.clamp(this.position.y, floor + (inSub ? 2.2 : 1.05), inSub ? -0.45 : 1.55);
    this.syncCamera();
  }

  forward(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
  }

  heading(): number {
    return (THREE.MathUtils.radToDeg(this.yaw) + 360) % 360;
  }

  private syncCamera(): void {
    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
