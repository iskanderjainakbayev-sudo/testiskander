import type * as THREE from 'three';
import type { CreatureSystem } from './CreatureSystem';
import { OceanMultiTool, type MultiToolMotion } from './OceanMultiTool';
import type { WeaponHit } from './creatureRuntime';
import type { OceanWeapon } from './types';

export interface WeaponAction {
  fired: boolean;
  hit: WeaponHit | null;
  repaired: number;
  repelled: number;
  weapon: OceanWeapon;
}

export class OceanWeapons {
  private readonly tool: OceanMultiTool;
  active: OceanWeapon = 'mining';

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.tool = new OceanMultiTool(scene);
    camera.add(this.tool.model);
  }

  equip(weapon: OceanWeapon, now: number): boolean {
    if (!this.tool.equip(weapon, now)) return false;
    this.active = weapon;
    return true;
  }

  use(now: number, origin: THREE.Vector3, direction: THREE.Vector3, creatures: CreatureSystem): WeaponAction {
    const action = this.tool.use(now, origin, direction, creatures);
    return { ...action, weapon: action.module };
  }

  update(now: number, hidden: boolean, motion: MultiToolMotion): void { this.tool.update(now, hidden, motion); }

  ready(now: number): boolean { return this.tool.ready(now); }
  recharge(now: number): boolean { return this.tool.recharge(now); }
  get battery(): number { return this.tool.battery; }
  get temperature(): number { return this.tool.temperature; }

  specialReady(now: number): boolean { return this.tool.battery >= 14 && this.tool.ready(now); }

  dispose(camera: THREE.Camera): void {
    camera.remove(this.tool.model);
    this.tool.dispose();
  }
}
