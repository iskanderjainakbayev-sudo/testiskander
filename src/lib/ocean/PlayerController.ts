import * as THREE from 'three';
import type { InputController } from './InputController';
import type { OceanState } from './OceanState';
import { floorAt } from './terrain';

export class PlayerController {
  private yaw = Math.PI;
  private pitch = 0.08;
  private readonly velocity = new THREE.Vector3();
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
    this.yaw = Math.PI;
    this.pitch = 0.08;
    this.syncCamera();
  }

  update(delta: number, state: OceanState, inSub: boolean): void {
    const [lookX, lookY] = this.input.takeLook();
    const keyLookX = Number(this.input.isDown('ArrowRight')) - Number(this.input.isDown('ArrowLeft'));
    const keyLookY = Number(this.input.isDown('ArrowDown')) - Number(this.input.isDown('ArrowUp'));
    this.yaw -= lookX * 0.00215 + keyLookX * delta * 1.65;
    this.pitch = THREE.MathUtils.clamp(this.pitch - lookY * 0.0018 - keyLookY * delta * 1.35, -1.38, 1.38);
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const movement = new THREE.Vector3();
    if (this.input.isDown('KeyW')) movement.add(forward);
    if (this.input.isDown('KeyS')) movement.sub(forward);
    if (this.input.isDown('KeyD')) movement.add(right);
    if (this.input.isDown('KeyA')) movement.sub(right);
    if (this.input.isDown('Space')) movement.y += 1;
    if (this.input.isDown('ControlLeft') || this.input.isDown('ControlRight')) movement.y -= 1;
    const fins = state.crafted.includes('fins') ? 1.35 : 1;
    const sprint = this.input.isDown('ShiftLeft') ? 1.45 : 1;
    const battery = inSub && state.subBattery <= 0 ? 0.24 : 1;
    const speed = (inSub ? 11.5 : 5.1 * fins) * sprint * battery;
    if (movement.lengthSq() > 0) movement.normalize().multiplyScalar(speed);
    this.velocity.lerp(movement, 1 - Math.exp(-delta * (inSub ? 3.8 : 5.5)));
    this.position.addScaledVector(this.velocity, delta);
    const radius = Math.hypot(this.position.x, this.position.z - 8);
    if (radius > 142) {
      const scale = 142 / radius;
      this.position.x *= scale;
      this.position.z = 8 + (this.position.z - 8) * scale;
    }
    const floor = floorAt(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.clamp(this.position.y, floor + (inSub ? 2.2 : 1.05), -0.45);
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
