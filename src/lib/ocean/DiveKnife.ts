import * as THREE from 'three';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';
import { addGoldSpike, extrudedProfile, oceanWeaponMaterials, prepareViewModel } from './weaponModelParts';

export class DiveKnife {
  readonly model = new THREE.Group();
  private nextAttackAt = 0;
  private swingStartedAt = 0;

  constructor() {
    const blade = extrudedProfile([
      [0, -0.48], [0.09, -0.34], [0.12, -0.08], [0.08, 0.25],
      [0.14, 0.4], [0, 0.34], [-0.14, 0.4], [-0.08, 0.2], [-0.11, -0.18],
    ], 0.045, oceanWeaponMaterials.blade);
    blade.position.z = -0.4;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.72), oceanWeaponMaterials.gold);
    ridge.position.set(0, -0.005, -0.42);
    const grip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.24, 5, 8), oceanWeaponMaterials.grip,
    );
    grip.rotation.x = Math.PI / 2;
    grip.position.z = 0.14;
    const guard = extrudedProfile([
      [-0.2, -0.08], [-0.1, 0.08], [0, 0.02], [0.1, 0.08], [0.2, -0.08], [0, -0.02],
    ], 0.06, oceanWeaponMaterials.gold);
    guard.position.z = -0.01;
    const pommel = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), oceanWeaponMaterials.gold);
    pommel.position.z = 0.31;
    this.model.add(blade, ridge, guard, grip, pommel);
    [[-0.14, -0.02, 1.15], [0.14, -0.02, -1.15], [-0.12, -0.68, 1.15], [0.12, -0.68, -1.15]].forEach(([x, z, angle]) => {
      addGoldSpike(this.model, new THREE.Vector3(x, 0, z), angle, 0.1);
    });
    this.model.position.set(0.4, -0.34, -0.68);
    this.model.rotation.set(-0.12, -0.12, -0.28);
    prepareViewModel(this.model);
  }

  attack(now: number, origin: THREE.Vector3, direction: THREE.Vector3, creatures: CreatureSystem): WeaponHit | null | undefined {
    if (now < this.nextAttackAt) return undefined;
    this.nextAttackAt = now + 560;
    this.swingStartedAt = now;
    return creatures.melee(origin, direction, 4.1, 78, now / 1000);
  }

  update(now: number): void {
    const progress = Math.min(1, (now - this.swingStartedAt) / 360);
    const swing = Math.sin(progress * Math.PI);
    this.model.rotation.y = -0.12 - swing * 1.25;
    this.model.rotation.z = -0.28 + swing * 0.72;
    this.model.position.x = 0.4 - swing * 0.24;
  }

  ready(now: number): boolean { return now >= this.nextAttackAt; }
}
