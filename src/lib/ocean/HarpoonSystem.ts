import * as THREE from 'three';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';

interface Tracer {
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  expiresAt: number;
}

export interface HarpoonShot {
  fired: boolean;
  hit: WeaponHit | null;
  special: boolean;
}

const RANGE = 58;
const STANDARD_DAMAGE = 46;
const SPECIAL_DAMAGE = 138;
const COOLDOWN = 480;
const SPECIAL_COOLDOWN = 3200;

export class HarpoonSystem {
  private readonly model = new THREE.Group();
  private readonly tracers: Tracer[] = [];
  private readonly energyCore = new THREE.Mesh();
  private readonly chargeRings = new THREE.Group();
  private nextShotAt = 0;
  private nextSpecialAt = 0;
  private recoilUntil = 0;
  private specialUntil = 0;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
  ) {
    this.createModel();
    this.model.visible = false;
    camera.add(this.model);
  }

  fire(
    now: number,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    creatures: CreatureSystem,
    special = false,
  ): HarpoonShot {
    if (now < this.nextShotAt || (special && now < this.nextSpecialAt)) {
      return { fired: false, hit: null, special };
    }
    this.nextShotAt = now + (special ? 820 : COOLDOWN);
    if (special) this.nextSpecialAt = now + SPECIAL_COOLDOWN;
    this.recoilUntil = now + (special ? 380 : 130);
    this.specialUntil = special ? now + 620 : this.specialUntil;
    const shotDirection = direction.clone().normalize();
    const hit = creatures.hit(
      origin,
      shotDirection,
      special ? RANGE * 1.45 : RANGE,
      special ? SPECIAL_DAMAGE : STANDARD_DAMAGE,
      now / 1000,
    );
    const end = hit?.point ?? origin.clone().addScaledVector(shotDirection, RANGE);
    this.addTracer(now, origin.clone().addScaledVector(shotDirection, 0.7), end, special);
    return { fired: true, hit, special };
  }

  update(now: number, hidden: boolean): void {
    this.model.visible = !hidden;
    const recoilProgress = Math.max(0, (this.recoilUntil - now) / 380);
    this.model.position.z = -0.74 + Math.sin(recoilProgress * Math.PI) * 0.18;
    const specialProgress = Math.max(0, (this.specialUntil - now) / 620);
    this.model.rotation.z = -0.04 + Math.sin(specialProgress * Math.PI * 5) * specialProgress * 0.045;
    this.chargeRings.rotation.z = now * 0.004;
    this.chargeRings.scale.setScalar(1 + Math.sin(now * 0.008) * 0.08 + specialProgress * 0.65);
    this.energyCore.scale.setScalar(1 + specialProgress * 1.8);
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

  specialReady(now: number): boolean {
    return now >= this.nextSpecialAt;
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
    const specialGlow = new THREE.MeshBasicMaterial({ color: 0xffa84f, transparent: true, opacity: 0.9 });
    const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.56, 5, 9), metal);
    barrel.rotation.x = Math.PI / 2;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.12), grip);
    handle.position.set(0, -0.17, 0.13);
    handle.rotation.x = -0.22;
    this.energyCore.geometry = new THREE.IcosahedronGeometry(0.055, 1);
    this.energyCore.material = specialGlow;
    this.energyCore.position.z = -0.3;
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08 + index * 0.026, 0.009, 6, 18), index === 1 ? specialGlow : glow);
      ring.position.z = -0.28 - index * 0.045;
      ring.rotation.set(index * 0.5, index * 0.65, 0);
      this.chargeRings.add(ring);
    }
    for (const side of [-1, 1]) {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 5), metal);
      prong.position.set(side * 0.075, 0, -0.42);
      prong.rotation.x = -Math.PI / 2;
      this.model.add(prong);
    }
    this.model.add(barrel, handle, this.energyCore, this.chargeRings);
    this.model.position.set(0.34, -0.27, -0.74);
    this.model.rotation.set(-0.05, -0.08, -0.04);
    this.model.traverse((object) => {
      object.renderOrder = 20;
      if (object instanceof THREE.Mesh) object.material.depthTest = false;
    });
  }

  private addTracer(now: number, start: THREE.Vector3, end: THREE.Vector3, special: boolean): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: special ? 0xffb14f : 0x8dfff1,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 19;
    this.scene.add(line);
    this.tracers.push({ line, expiresAt: now + (special ? 260 : 90) });
  }
}
