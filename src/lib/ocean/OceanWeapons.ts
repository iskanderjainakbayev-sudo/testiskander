import type * as THREE from 'three';
import { ArcGun } from './ArcGun';
import type { CreatureSystem } from './CreatureSystem';
import { DiveKnife } from './DiveKnife';
import type { WeaponHit } from './creatureRuntime';
import type { OceanWeapon } from './types';

export interface WeaponAction {
  fired: boolean;
  hit: WeaponHit | null;
  special: boolean;
  weapon: OceanWeapon;
}

export class OceanWeapons {
  private readonly gun: ArcGun;
  private readonly knife = new DiveKnife();
  active: OceanWeapon = 'gun';

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.gun = new ArcGun(scene);
    camera.add(this.gun.model, this.knife.model);
    this.syncVisibility(false);
  }

  equip(weapon: OceanWeapon, hidden: boolean): boolean {
    if (this.active === weapon) return false;
    this.active = weapon;
    this.syncVisibility(hidden);
    return true;
  }

  use(now: number, origin: THREE.Vector3, direction: THREE.Vector3, creatures: CreatureSystem, special: boolean): WeaponAction {
    if (this.active === 'knife') {
      const result = this.knife.attack(now, origin, direction, creatures);
      return { fired: result !== undefined, hit: result ?? null, special: false, weapon: 'knife' };
    }
    return { ...this.gun.fire(now, origin, direction, creatures, special), weapon: 'gun' };
  }

  update(now: number, hidden: boolean): void {
    this.syncVisibility(hidden);
    this.gun.update(now);
    this.knife.update(now);
  }

  ready(now: number): boolean {
    return this.active === 'gun' ? this.gun.ready(now) : this.knife.ready(now);
  }

  specialReady(now: number): boolean { return this.gun.specialReady(now); }

  dispose(camera: THREE.Camera): void {
    camera.remove(this.gun.model, this.knife.model);
    this.gun.dispose();
  }

  private syncVisibility(hidden: boolean): void {
    this.gun.model.visible = !hidden && this.active === 'gun';
    this.knife.model.visible = !hidden && this.active === 'knife';
  }
}
