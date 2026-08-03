import * as THREE from 'three';
import type { CreatureActor } from './creatureRuntime';

const UP = new THREE.Vector3(0, 1, 0);
const desired = new THREE.Vector3();
const steering = new THREE.Vector3();
const separation = new THREE.Vector3();
const alignment = new THREE.Vector3();
const cohesion = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();
const targetRotation = new THREE.Quaternion();

function schooling(actor: CreatureActor, creatures: CreatureActor[]): THREE.Vector3 {
  separation.set(0, 0, 0);
  alignment.set(0, 0, 0);
  cohesion.set(0, 0, 0);
  let neighbors = 0;
  for (const other of creatures) {
    if (other === actor || other.species.name !== actor.species.name || other.health <= 0) continue;
    const distanceSq = actor.mesh.position.distanceToSquared(other.mesh.position);
    if (distanceSq > 144) continue;
    neighbors += 1;
    alignment.add(other.velocity);
    cohesion.add(other.mesh.position);
    if (distanceSq < 9) {
      separation.add(actor.mesh.position.clone().sub(other.mesh.position).divideScalar(Math.max(.25, distanceSq)));
    }
  }
  if (neighbors === 0) return steering.set(0, 0, 0);
  alignment.divideScalar(neighbors).normalize();
  cohesion.divideScalar(neighbors).sub(actor.mesh.position).normalize();
  return steering.copy(alignment).multiplyScalar(.28)
    .addScaledVector(cohesion, .2)
    .addScaledVector(separation.normalize(), .72);
}

export function updateCreatureLocomotion(
  actor: CreatureActor,
  creatures: CreatureActor[],
  target: THREE.Vector3,
  speed: number,
  delta: number,
  time: number,
): void {
  desired.copy(target).sub(actor.mesh.position);
  if (desired.lengthSq() < .01) return;
  desired.normalize();
  if (actor.species.pack > 1 && actor.mode === 'patrol') desired.add(schooling(actor, creatures));
  const current = Math.sin(time * .21 + actor.phase) * .07;
  desired.x += current;
  desired.y += Math.sin(time * .37 + actor.phase * 2.1) * .035;
  desired.normalize().multiplyScalar(speed);

  const responsiveness = ['attack', 'chase', 'flee', 'retreat'].includes(actor.mode) ? 4.8 : 2.25;
  const blend = 1 - Math.exp(-responsiveness * delta);
  const previousDirection = actor.velocity.clone().normalize();
  actor.velocity.lerp(desired, blend);
  actor.mesh.position.addScaledVector(actor.velocity, delta);

  if (actor.velocity.lengthSq() < .002) return;
  const direction = actor.velocity.clone().normalize();
  lookMatrix.lookAt(actor.mesh.position, actor.mesh.position.clone().add(direction), UP);
  targetRotation.setFromRotationMatrix(lookMatrix);
  actor.mesh.quaternion.slerp(targetRotation, 1 - Math.exp(-3.6 * delta));
  const turn = previousDirection.cross(direction).dot(UP);
  actor.turnBank = THREE.MathUtils.lerp(actor.turnBank, THREE.MathUtils.clamp(-turn * 8, -.34, .34), .12);
  actor.mesh.userData.turnBank = actor.turnBank;
}
