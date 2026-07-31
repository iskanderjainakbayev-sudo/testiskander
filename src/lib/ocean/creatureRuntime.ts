import * as THREE from 'three';
import { BossBrain } from './BossBrain';
import type { Species } from './creatureCatalog';

export type CreatureMode =
  | 'patrol' | 'sleep' | 'curious' | 'flee' | 'warn' | 'stalk'
  | 'circle' | 'flank' | 'chase' | 'attack' | 'search' | 'return'
  | 'retreat' | 'hunt' | 'feed' | 'shelter' | 'dead';

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
  mode: CreatureMode;
  modeUntil: number;
  territoryRadius: number;
  lastKnownPlayer: THREE.Vector3;
  ecosystemTarget: CreatureActor | null;
  ecosystemThreat: CreatureActor | null;
  ecosystemCheckAt: number;
  corpseUntil: number;
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
  const maxHealth = species.isBoss
    ? 720
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
    boss: species.isBoss ? new BossBrain(home) : null,
    mode: 'patrol',
    modeUntil: 0,
    territoryRadius: species.isBoss ? 48 : 14 + species.threat * 4,
    lastKnownPlayer: new THREE.Vector3(),
    ecosystemTarget: null,
    ecosystemThreat: null,
    ecosystemCheckAt: 0,
    corpseUntil: 0,
  };
}

export function hitCreature(
  raycaster: THREE.Raycaster,
  creatures: CreatureActor[],
  damage: number,
  time: number,
): WeaponHit | null {
  let closest: { creature: CreatureActor; point: THREE.Vector3; distance: number; weakPoint: boolean } | null = null;
  for (const creature of creatures) {
    if (!creature.mesh.visible || creature.health <= 0) continue;
    const contact = raycaster.intersectObject(creature.mesh, true)[0];
    if (contact && (!closest || contact.distance < closest.distance)) {
      closest = {
        creature,
        point: contact.point.clone(),
        distance: contact.distance,
        weakPoint: contact.object.name.startsWith('weak-point') || contact.object.name.toLowerCase().includes('eye'),
      };
    }
  }
  if (!closest) return null;
  const { creature, point } = closest;
  creature.health = Math.max(0, creature.health - damage * (closest.weakPoint ? 1.8 : 1));
  creature.provokedUntil = time + 24;
  if (!creature.species.isBoss && creature.species.senses.sight > .68) {
    const dodge = raycaster.ray.direction.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    creature.mesh.position.addScaledVector(dodge, creature.phase % 2 > 1 ? 1.2 : -1.2);
    creature.mode = creature.health / creature.maxHealth < .27 ? 'retreat' : 'flank';
    creature.modeUntil = time + 1.2;
  }
  creature.mesh.userData.hitUntil = time + 0.16;
  creature.boss?.onHit(time, creature.health / creature.maxHealth);
  const killed = creature.health <= 0;
  if (killed) {
    creature.mode = 'dead';
    creature.corpseUntil = time + 8;
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

export function hitCreatureInCone(
  creatures: CreatureActor[],
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  range: number,
  damage: number,
  time: number,
): WeaponHit | null {
  const facing = direction.clone().normalize();
  const target = creatures
    .filter((creature) => creature.mesh.visible && creature.health > 0)
    .map((creature) => ({
      creature,
      offset: creature.mesh.position.clone().sub(origin),
      distance: creature.mesh.position.distanceTo(origin),
    }))
    .filter(({ offset, distance }) => distance <= range && offset.normalize().dot(facing) > 0.42)
    .sort((left, right) => left.distance - right.distance)[0]?.creature;
  if (!target) return null;
  target.health = Math.max(0, target.health - damage);
  target.provokedUntil = time + 24;
  target.mesh.userData.hitUntil = time + 0.2;
  target.boss?.onHit(time, target.health / target.maxHealth);
  const killed = target.health <= 0;
  if (killed) {
    target.mode = 'dead';
    target.corpseUntil = time + 8;
    target.deadUntil = target.boss ? Infinity : time + 35;
  }
  return {
    name: target.species.name,
    point: target.mesh.position.clone(),
    health: target.health,
    maxHealth: target.maxHealth,
    killed,
    isBoss: Boolean(target.boss),
  };
}

export function respawnCreature(creature: CreatureActor): void {
  creature.health = creature.maxHealth;
  creature.deadUntil = 0;
  creature.provokedUntil = 0;
  creature.attackCooldown = 0;
  creature.mode = 'patrol';
  creature.modeUntil = 0;
  creature.corpseUntil = 0;
  creature.ecosystemTarget = null;
  creature.ecosystemThreat = null;
  creature.mesh.position.copy(creature.home);
  creature.mesh.rotation.z = 0;
  creature.mesh.scale.setScalar(1);
  creature.mesh.visible = true;
}
