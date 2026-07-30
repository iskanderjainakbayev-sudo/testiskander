import * as THREE from 'three';
import type { InputController } from './InputController';

export type SurfaceAction = { type: 'sample'; index: number } | { type: 'takeoff'; index: -1 };

export class SurfaceController {
  readonly position = new THREE.Vector3();
  readonly samples = new Set<number>();
  yaw = 0;
  pitch = 0;
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private stepDistance = 0;

  constructor(
    private readonly getHeight: (x: number, z: number) => number,
    private readonly sampleSites: THREE.Object3D[],
  ) {}

  reset() {
    this.position.set(0, this.getHeight(0, 28) + 1.68, 28);
    this.yaw = 0;
    this.pitch = -0.03;
    this.stepDistance = 0;
  }

  resetExpedition() {
    this.samples.clear();
    this.sampleSites.forEach((site) => { site.visible = true; });
    this.reset();
  }

  restoreExpedition(samples: number[]) {
    this.samples.clear();
    samples.forEach((index) => {
      if (index >= 0 && index < this.sampleSites.length) this.samples.add(index);
    });
    this.sampleSites.forEach((site, index) => {
      site.visible = !this.samples.has(index);
    });
    this.reset();
  }

  update(
    delta: number,
    input: InputController,
    camera: THREE.PerspectiveCamera,
    onStep: () => void,
  ) {
    const look = input.takeLook();
    this.yaw -= look.x * 0.00175;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.y * 0.0015, -1.18, 1.18);
    this.forward.set(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    this.movement.set(0, 0, 0);
    if (input.isDown('KeyW')) this.movement.add(this.forward);
    if (input.isDown('KeyS')) this.movement.sub(this.forward);
    if (input.isDown('KeyD')) this.movement.add(this.right);
    if (input.isDown('KeyA')) this.movement.sub(this.right);
    if (this.movement.lengthSq() > 0) {
      const distance = delta * (input.isDown('ShiftLeft') ? 4.4 : 2.8);
      this.position.add(this.movement.normalize().multiplyScalar(distance));
      this.stepDistance += distance;
      if (this.stepDistance > 0.78) {
        this.stepDistance = 0;
        onStep();
      }
    }
    this.position.x = THREE.MathUtils.clamp(this.position.x, -420, 420);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -420, 420);
    this.position.y = THREE.MathUtils.damp(
      this.position.y,
      this.getHeight(this.position.x, this.position.z) + 1.68,
      18,
      delta,
    );
    camera.position.copy(this.position);
    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  nearbyAction(): { action: SurfaceAction; label: string } | null {
    for (let index = 0; index < this.sampleSites.length; index += 1) {
      if (this.samples.has(index)) continue;
      const site = this.sampleSites[index];
      if (this.isFacing(site.position, 4.2)) {
        return { action: { type: 'sample', index }, label: 'RESONATE WITH ECHO BLOOM' };
      }
    }
    const ramp = this.toTarget.set(0, this.getHeight(0, 45) + 1.2, 45);
    if (this.samples.size >= 3 && this.isFacing(ramp, 5.5)) {
      return { action: { type: 'takeoff', index: -1 }, label: 'BOARD LYRA / LAUNCH' };
    }
    return null;
  }

  completeSample(index: number) {
    this.samples.add(index);
    const site = this.sampleSites[index];
    if (site) site.visible = false;
  }

  private isFacing(position: THREE.Vector3, range: number) {
    const distance = this.position.distanceTo(position);
    this.toTarget.copy(position).sub(this.position).setY(0).normalize();
    this.forward.set(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return distance < range && this.toTarget.dot(this.forward) > 0.05;
  }
}
