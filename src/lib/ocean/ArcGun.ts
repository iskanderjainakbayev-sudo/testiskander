import * as THREE from 'three';
import { BulletEffects } from './BulletEffects';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';
import { addGoldSpike, extrudedProfile, oceanWeaponMaterials, prepareViewModel } from './weaponModelParts';

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
  private readonly muzzleFlash = new THREE.PointLight(0x8ffff4, 0, 4);
  private nextShotAt = 0;
  private nextSpecialAt = 0;
  private recoilUntil = 0;
  private pulseUntil = 0;
  private flashUntil = 0;

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
    this.flashUntil = now + (special ? 170 : 75);
    this.muzzleFlash.color.setHex(special ? 0xff8b36 : 0x8ffff4);
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
    this.muzzleFlash.intensity = now < this.flashUntil ? (pulse > 0 ? 18 : 8) : 0;
    this.bullets.update(now);
  }

  ready(now: number): boolean { return now >= this.nextShotAt; }
  specialReady(now: number): boolean { return now >= this.nextSpecialAt; }

  dispose(): void {
    this.bullets.dispose();
  }

  private buildModel(): void {
    const body = extrudedProfile([
      [-0.13, 0.33], [0.12, 0.29], [0.15, 0.05], [0.1, -0.15],
      [0.17, -0.37], [0.04, -0.46], [-0.12, -0.33], [-0.08, -0.12], [-0.2, 0.05],
    ], 0.11, oceanWeaponMaterials.abyssMetal);
    body.position.set(0, -0.01, -0.05);
    const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.58, 6, 10), oceanWeaponMaterials.abyssMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.02, 0.08, -0.37);
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.25, 5, 8), oceanWeaponMaterials.grip);
    handle.rotation.set(Math.PI / 2, 0, -0.34);
    handle.position.set(-0.07, -0.2, 0.17);
    const pressureRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.025, 8, 24), oceanWeaponMaterials.gold);
    pressureRing.rotation.y = Math.PI / 2;
    pressureRing.position.set(-0.07, 0.025, -0.12);
    this.core.geometry = new THREE.SphereGeometry(0.075, 12, 8);
    this.core.material = oceanWeaponMaterials.glow;
    this.core.position.set(-0.07, 0.025, -0.12);
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055 + index * 0.018, 0.006, 6, 18), oceanWeaponMaterials.glow);
      ring.position.z = -0.55 - index * 0.045;
      ring.rotation.set(index * 0.45, index * 0.6, 0);
      this.rings.add(ring);
    }
    [-2.1, -1.25, -0.35, 0.5, 1.35, 2.2].forEach((angle) => {
      const position = new THREE.Vector3(-0.07, 0.025, -0.12).add(new THREE.Vector3(Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0));
      addGoldSpike(this.model, position, angle - Math.PI / 2, 0.09);
    });
    this.muzzleFlash.position.z = -0.58;
    this.model.add(body, barrel, handle, pressureRing, this.core, this.rings, this.muzzleFlash);
    this.model.position.set(0.36, -0.29, -0.74);
    this.model.rotation.set(-0.04, -0.12, -0.05);
    prepareViewModel(this.model);
  }

}
