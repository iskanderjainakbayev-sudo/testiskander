import * as THREE from 'three';
import { BulletEffects } from './BulletEffects';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';

export interface GunShot {
  fired: boolean;
  hit: WeaponHit | null;
  special: boolean;
}

const RANGE = 62;

export class ArcGun {
  readonly model = new THREE.Group();
  private readonly bullets: BulletEffects;
  private readonly core = new THREE.Mesh();
  private readonly rings = new THREE.Group();
  private nextShotAt = 0;
  private nextSpecialAt = 0;
  private recoilUntil = 0;
  private pulseUntil = 0;

  constructor(scene: THREE.Scene) {
    this.bullets = new BulletEffects(scene);
    this.buildModel();
  }

  fire(now: number, origin: THREE.Vector3, direction: THREE.Vector3, creatures: CreatureSystem, special: boolean): GunShot {
    if (now < this.nextShotAt || (special && now < this.nextSpecialAt)) return { fired: false, hit: null, special };
    const range = special ? RANGE * 1.45 : RANGE;
    this.nextShotAt = now + (special ? 820 : 430);
    if (special) this.nextSpecialAt = now + 3200;
    this.recoilUntil = now + (special ? 420 : 150);
    this.pulseUntil = special ? now + 650 : this.pulseUntil;
    const shotDirection = direction.clone().normalize();
    const hit = creatures.hit(origin, shotDirection, range, special ? 138 : 46, now / 1000);
    const end = hit?.point ?? origin.clone().addScaledVector(shotDirection, range);
    this.bullets.spawn(now, origin.clone().addScaledVector(shotDirection, 0.7), end, special);
    return { fired: true, hit, special };
  }

  update(now: number): void {
    const recoil = Math.max(0, (this.recoilUntil - now) / 420);
    this.model.position.z = -0.74 + Math.sin(recoil * Math.PI) * 0.2;
    const pulse = Math.max(0, (this.pulseUntil - now) / 650);
    this.model.rotation.z = -0.04 + Math.sin(pulse * Math.PI * 5) * pulse * 0.05;
    this.rings.rotation.z = now * 0.004;
    this.rings.scale.setScalar(1 + Math.sin(now * 0.008) * 0.08 + pulse * 0.65);
    this.core.scale.setScalar(1 + pulse * 1.8);
    this.bullets.update(now);
  }

  ready(now: number): boolean { return now >= this.nextShotAt; }
  specialReady(now: number): boolean { return now >= this.nextSpecialAt; }

  dispose(): void {
    this.bullets.dispose();
  }

  private buildModel(): void {
    const metal = new THREE.MeshStandardMaterial({ color: 0x172d39, metalness: 0.9, roughness: 0.22 });
    const grip = new THREE.MeshStandardMaterial({ color: 0xc8522f, roughness: 0.6 });
    const aqua = new THREE.MeshBasicMaterial({ color: 0x6fffee });
    const amber = new THREE.MeshBasicMaterial({ color: 0xffa84f });
    const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.58, 6, 10), metal);
    barrel.rotation.x = Math.PI / 2;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.13), grip);
    handle.position.set(0, -0.18, 0.13);
    this.core.geometry = new THREE.IcosahedronGeometry(0.058, 1);
    this.core.material = amber;
    this.core.position.z = -0.3;
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08 + index * 0.026, 0.009, 7, 20), index === 1 ? amber : aqua);
      ring.position.z = -0.28 - index * 0.045;
      ring.rotation.set(index * 0.5, index * 0.65, 0);
      this.rings.add(ring);
    }
    this.model.add(barrel, handle, this.core, this.rings);
    this.model.position.set(0.34, -0.27, -0.74);
    this.model.rotation.set(-0.05, -0.08, -0.04);
    this.model.traverse((object) => {
      object.renderOrder = 20;
      if (object instanceof THREE.Mesh) object.material.depthTest = false;
    });
  }

}
