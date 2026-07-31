import * as THREE from 'three';
import { BossBrain } from './BossBrain';
import type { Species } from './creatureCatalog';

export interface CreatureActor {
  mesh: THREE.Group;
  home: THREE.Vector3;
  target: THREE.Vector3;
  species: Species;
  phase: number;
  attackCooldown: number;
  health: number;
  maxHealth: number;
  deadUntil: number;
  provokedUntil: number;
  boss: BossBrain | null;
}

export interface WeaponHit {
  name: string;
  point: THREE.Vector3;
  health: number;
  maxHealth: number;
  killed: boolean;
  isBoss: boolean;
}

export function createCreatureActor(
  species: Species,
  mesh: THREE.Group,
  home: THREE.Vector3,
  phase: number,
): CreatureActor {
  const maxHealth = species.name === 'Gloom Crown'
    ? 420
    : species.temperament === 'aggressive' ? Math.round(38 + species.size * 34) : 1;
  return {
    mesh,
    home,
    target: home.clone(),
    species,
    phase,
    attackCooldown: 0,
    health: maxHealth,
    maxHealth,
    deadUntil: 0,
    provokedUntil: 0,
    boss: species.name === 'Gloom Crown' ? new BossBrain(home) : null,
  };
}

export function targetForCreature(
  creature: CreatureActor,
  player: THREE.Vector3,
  distance: number,
  time: number,
  chasing: boolean,
  random: () => number,
): THREE.Vector3 {
  if (chasing) return player;
  if (creature.species.temperament === 'passive' && distance < 6) {
    return creature.mesh.position.clone().add(creature.mesh.position.clone().sub(player).normalize().multiplyScalar(8));
  }
  if (creature.species.temperament === 'neutral' && distance < 2.8) {
    return creature.mesh.position.clone().add(creature.mesh.position.clone().sub(player).normalize().multiplyScalar(4));
  }
  if (creature.mesh.position.distanceTo(creature.home) > 16) return creature.home;
  if (creature.mesh.position.distanceTo(creature.target) < 1.2 || Math.sin(time * 0.2 + creature.phase) > 0.995) {
    creature.target.copy(creature.home).add(new THREE.Vector3(
      (random() - 0.5) * 13,
      (random() - 0.5) * 5,
      (random() - 0.5) * 13,
    ));
  }
  return creature.target;
}

export function hitCreature(
  raycaster: THREE.Raycaster,
  creatures: CreatureActor[],
  damage: number,
  time: number,
): WeaponHit | null {
  let closest: { creature: CreatureActor; point: THREE.Vector3; distance: number } | null = null;
  for (const creature of creatures) {
    if (!creature.mesh.visible || creature.species.temperament !== 'aggressive') continue;
    const contact = raycaster.intersectObject(creature.mesh, true)[0];
    if (contact && (!closest || contact.distance < closest.distance)) {
      closest = { creature, point: contact.point.clone(), distance: contact.distance };
    }
  }
  if (!closest) return null;
  const { creature, point } = closest;
  creature.health = Math.max(0, creature.health - damage);
  creature.provokedUntil = time + 24;
  creature.mesh.userData.hitUntil = time + 0.16;
  creature.boss?.onHit(time, creature.health / creature.maxHealth);
  const killed = creature.health <= 0;
  if (killed) {
    creature.mesh.visible = false;
    creature.deadUntil = creature.boss ? Infinity : time + 35;
  }
  return {
    name: creature.species.name,
    point,
    health: creature.health,
    maxHealth: creature.maxHealth,
    killed,
    isBoss: Boolean(creature.boss),
  };
}

export function respawnCreature(creature: CreatureActor): void {
  creature.health = creature.maxHealth;
  creature.deadUntil = 0;
  creature.provokedUntil = 0;
  creature.attackCooldown = 0;
  creature.mesh.position.copy(creature.home);
  creature.mesh.visible = true;
}
