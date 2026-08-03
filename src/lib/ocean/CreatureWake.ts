import * as THREE from 'three';
import type { CreatureActor } from './creatureRuntime';

const BUBBLE_COUNT = 180;

export class CreatureWake {
  private readonly positions = new Float32Array(BUBBLE_COUNT * 3);
  private readonly life = new Float32Array(BUBBLE_COUNT);
  private readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    for (let index = 1; index < this.positions.length; index += 3) this.positions[index] = -999;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xc9ffff,
      size: .09,
      transparent: true,
      opacity: .52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(delta: number, time: number, creatures: CreatureActor[]): void {
    for (let index = 0; index < BUBBLE_COUNT; index += 1) {
      if (this.life[index] <= 0) continue;
      this.life[index] -= delta;
      if (this.life[index] <= 0) {
        this.positions[index * 3 + 1] = -999;
        continue;
      }
      this.positions[index * 3 + 1] += delta * (.18 + index % 4 * .03);
      this.positions[index * 3] += Math.sin(time * 2 + index) * delta * .025;
    }
    for (const creature of creatures) {
      if (!creature.mesh.visible || creature.velocity.length() < creature.species.speed * 1.35) continue;
      if ((Math.floor(time * 20 + creature.phase * 7) % 4) !== 0) continue;
      this.emit(creature);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  private emit(creature: CreatureActor): void {
    const offset = new THREE.Vector3(0, 0, creature.species.size * 1.4)
      .applyQuaternion(creature.mesh.quaternion);
    const point = creature.mesh.position.clone().add(offset);
    const slot = this.cursor++ % BUBBLE_COUNT;
    this.positions[slot * 3] = point.x + Math.sin(slot * 4.7) * .08;
    this.positions[slot * 3 + 1] = point.y;
    this.positions[slot * 3 + 2] = point.z + Math.cos(slot * 3.1) * .08;
    this.life[slot] = 2.4;
  }
}
