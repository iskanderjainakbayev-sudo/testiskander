import * as THREE from 'three';
import type { CreatureSystem } from './CreatureSystem';
import type { WeaponHit } from './creatureRuntime';

export class DiveKnife {
  readonly model = new THREE.Group();
  private nextAttackAt = 0;
  private swingStartedAt = 0;

  constructor() {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.58, 4),
      new THREE.MeshStandardMaterial({ color: 0xd9ffff, metalness: 0.95, roughness: 0.12 }),
    );
    blade.rotation.x = -Math.PI / 2;
    blade.position.z = -0.28;
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.028, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x70fff0 }),
    );
    edge.position.set(0.045, 0, -0.25);
    const grip = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.22, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0x1d3037, roughness: 0.72 }),
    );
    grip.rotation.x = Math.PI / 2;
    grip.position.z = 0.14;
    this.model.add(blade, edge, grip);
    this.model.position.set(0.4, -0.34, -0.68);
    this.model.rotation.set(-0.12, -0.12, -0.28);
    this.model.traverse((object) => {
      object.renderOrder = 20;
      if (object instanceof THREE.Mesh) object.material.depthTest = false;
    });
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
