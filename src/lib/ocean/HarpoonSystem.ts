import * as THREE from 'three';
import type { CreatureSystem, WeaponHit } from './CreatureSystem';

interface Tracer {
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  expiresAt: number;
}

export interface HarpoonShot {
  fired: boolean;
  hit: WeaponHit | null;
}

const RANGE = 58;
const DAMAGE = 34;
const COOLDOWN = 620;

export class HarpoonSystem {
  private readonly model = new THREE.Group();
  private readonly tracers: Tracer[] = [];
  private nextShotAt = 0;
  private recoilUntil = 0;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
  ) {
    this.createModel();
    camera.add(this.model);
  }

  fire(
    now: number,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    creatures: CreatureSystem,
  ): HarpoonShot {
    if (now < this.nextShotAt) return { fired: false, hit: null };
    this.nextShotAt = now + COOLDOWN;
    this.recoilUntil = now + 110;
    const shotDirection = direction.clone().normalize();
    const hit = creatures.hit(origin, shotDirection, RANGE, DAMAGE, now / 1000);
    const end = hit?.point ?? origin.clone().addScaledVector(shotDirection, RANGE);
    this.addTracer(now, origin.clone().addScaledVector(shotDirection, 0.7), end);
    return { fired: true, hit };
  }

  update(now: number, hidden: boolean): void {
    this.model.visible = !hidden;
    this.model.position.z = now < this.recoilUntil ? -0.61 : -0.74;
    for (let index = this.tracers.length - 1; index >= 0; index -= 1) {
      const tracer = this.tracers[index];
      if (now < tracer.expiresAt) continue;
      this.scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      tracer.line.material.dispose();
      this.tracers.splice(index, 1);
    }
  }

  ready(now: number): boolean {
    return now >= this.nextShotAt;
  }

  dispose(): void {
    this.camera.remove(this.model);
    for (const tracer of this.tracers) {
      this.scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      tracer.line.material.dispose();
    }
    this.tracers.splice(0);
  }

  private createModel(): void {
    const metal = new THREE.MeshStandardMaterial({ color: 0x253a43, metalness: 0.82, roughness: 0.28 });
    const grip = new THREE.MeshStandardMaterial({ color: 0xe67442, roughness: 0.62 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x6fffee });
    const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.56, 5, 9), metal);
    barrel.rotation.x = Math.PI / 2;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.12), grip);
    handle.position.set(0, -0.17, 0.13);
    handle.rotation.x = -0.22;
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16), glow);
    coil.position.z = -0.26;
    for (const side of [-1, 1]) {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 5), metal);
      prong.position.set(side * 0.075, 0, -0.42);
      prong.rotation.x = -Math.PI / 2;
      this.model.add(prong);
    }
    this.model.add(barrel, handle, coil);
    this.model.position.set(0.34, -0.27, -0.74);
    this.model.rotation.set(-0.05, -0.08, -0.04);
    this.model.traverse((object) => {
      object.renderOrder = 20;
      if (object instanceof THREE.Mesh) object.material.depthTest = false;
    });
  }

  private addTracer(now: number, start: THREE.Vector3, end: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: 0x8dfff1,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 19;
    this.scene.add(line);
    this.tracers.push({ line, expiresAt: now + 90 });
  }
}
