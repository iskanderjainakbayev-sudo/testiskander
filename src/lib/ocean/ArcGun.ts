import * as THREE from 'three';
import { BulletEffects } from './BulletEffects';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';
import { hydrateTidebreaker, type TidebreakerRig } from './TidebreakerModel';

export interface GunShot {
  fired: boolean;
  hit: WeaponHit | null;
  special: boolean;
}

const RANGE = 62;

export class ArcGun {
  readonly model = new THREE.Group();
  private readonly bullets: BulletEffects;
  private readonly asset = new THREE.Group();
  private readonly muzzleFlash = new THREE.PointLight(0x8ffff4, 0, 4);
  private rig: TidebreakerRig | null = null;
  private nextShotAt = 0;
  private nextSpecialAt = 0;
  private firedAt = -Infinity;
  private specialShot = false;
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
    this.firedAt = now;
    this.specialShot = special;
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
    const recoilLife = this.specialShot ? 420 : 170;
    const recoilTime = now - this.firedAt;
    const recoil = recoilTime < recoilLife ? Math.sin((recoilTime / recoilLife) * Math.PI) : 0;
    const pulse = Math.max(0, (this.pulseUntil - now) / 650);
    this.model.position.set(.38, -.31 + Math.sin(now * .0016) * .006, -.72 + recoil * .2);
    this.model.rotation.set(-.055 + recoil * .08, -.12, -.045 + Math.sin(pulse * Math.PI * 5) * pulse * .045);
    this.animateRig(now, recoil, pulse);
    this.muzzleFlash.intensity = now < this.flashUntil ? (pulse > 0 ? 18 : 8) : 0;
    this.bullets.update(now);
  }

  ready(now: number): boolean { return now >= this.nextShotAt; }
  specialReady(now: number): boolean { return now >= this.nextSpecialAt; }

  dispose(): void {
    this.bullets.dispose();
  }

  private buildModel(): void {
    this.muzzleFlash.position.set(0, .06, -.58);
    this.model.add(this.asset, this.muzzleFlash);
    this.model.position.set(.38, -.31, -.72);
    this.model.rotation.set(-.055, -.12, -.045);
    hydrateTidebreaker(this.asset, (rig) => { this.rig = rig; });
  }

  private animateRig(now: number, recoil: number, pulse: number): void {
    if (!this.rig) return;
    const glow = 1 + Math.sin(now * .006) * .035 + pulse * .5;
    this.rig.drum?.rotation.set(now * .0016 + pulse * 4, 0, 0);
    this.rig.chargeRing?.scale.setScalar(glow);
    this.rig.emitters.forEach((emitter, index) => {
      emitter.scale.setScalar(1 + recoil * .16 + pulse * .45);
      const material = emitter.material;
      if (material instanceof THREE.MeshStandardMaterial) material.emissiveIntensity = 3 + pulse * 7;
      emitter.rotation.z = Math.sin(now * .004 + index * 2) * .025;
    });
    this.rig.barrels.forEach((barrel, index) => {
      barrel.position.z = recoil * (.1 + index * .025);
      barrel.rotation.z = pulse * [0, -.08, .08][index];
    });
  }

}
