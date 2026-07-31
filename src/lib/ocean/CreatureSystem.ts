import * as THREE from 'three';
import { BossBrain } from './BossBrain';
import { SPECIES, type Species } from './creatureCatalog';
import { createCreatureModel } from './creatureModels';
import { animateCreature } from './creatureMotion';
import { floorAt, seededRandom } from './terrain';

interface Creature {
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

export interface PredatorAlert {
  name: string;
  distance: number;
  attacking: boolean;
  health: number;
  maxHealth: number;
  isBoss: boolean;
}

export interface WeaponHit {
  name: string;
  point: THREE.Vector3;
  health: number;
  maxHealth: number;
  killed: boolean;
  isBoss: boolean;
}

export class CreatureSystem {
  private readonly creatures: Creature[] = [];
  private readonly random = seededRandom(8492);
  private readonly raycaster = new THREE.Raycaster();

  constructor(scene: THREE.Scene) {
    SPECIES.forEach((species, speciesIndex) => {
      const count = species.name === 'Gloom Crown' ? 1 : species.name === 'Reef Fang' ? 4 : 3;
      for (let index = 0; index < count; index += 1) {
        const radius = species.band[0] + this.random() * (species.band[1] - species.band[0]);
        const angle = this.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = 8 + Math.sin(angle) * radius;
        const floor = floorAt(x, z);
        const home = new THREE.Vector3(x, floor + 3 + this.random() * Math.min(14, radius * 0.12), z);
        const mesh = createCreatureModel(species);
        const maxHealth = species.name === 'Gloom Crown'
          ? 420
          : species.temperament === 'aggressive' ? Math.round(38 + species.size * 34) : 1;
        mesh.position.copy(home);
        scene.add(mesh);
        this.creatures.push({
          mesh, home, target: home.clone(), species,
          phase: speciesIndex + index * 1.7,
          attackCooldown: 0,
          health: maxHealth,
          maxHealth,
          deadUntil: 0,
          provokedUntil: 0,
          boss: species.name === 'Gloom Crown' ? new BossBrain(home) : null,
        });
      }
    });
  }

  update(
    delta: number,
    time: number,
    player: THREE.Vector3,
    protectedBySub: boolean,
    onAttack: (damage: number, creature: string) => void,
  ): PredatorAlert | null {
    let alert: PredatorAlert | null = null;
    for (const creature of this.creatures) {
      if (!creature.mesh.visible) {
        if (time >= creature.deadUntil) this.respawn(creature);
        else continue;
      }
      creature.attackCooldown = Math.max(0, creature.attackCooldown - delta);
      const distance = creature.mesh.position.distanceTo(player);
      const alertRadius = creature.species.alertRadius ?? 16;
      const chase = creature.species.temperament === 'aggressive'
        && (distance < alertRadius || time < creature.provokedUntil);
      const bossIntent = creature.boss && chase
        ? creature.boss.update(time, creature.mesh.position, player, creature.health / creature.maxHealth)
        : null;
      const target = bossIntent?.target ?? this.chooseTarget(creature, player, distance, time, chase);
      const direction = target.clone().sub(creature.mesh.position);
      const lunge = chase && distance < 6 ? 1.38 : 1;
      const chaseSpeed = bossIntent?.speedMultiplier ?? 2.45;
      const speed = creature.species.speed * (chase ? chaseSpeed : 1) * lunge;
      if (direction.lengthSq() > 0.05) {
        direction.normalize();
        creature.mesh.position.addScaledVector(direction, speed * delta);
        creature.mesh.lookAt(creature.mesh.position.clone().add(direction));
      }
      animateCreature(creature.mesh, creature.phase, time, chase);
      if (chase && (!alert || distance < alert.distance)) {
        alert = {
          name: creature.species.name,
          distance,
          attacking: (bossIntent?.canStrike ?? true) && distance < 6,
          health: creature.health,
          maxHealth: creature.maxHealth,
          isBoss: Boolean(creature.boss),
        };
      }
      const canStrike = bossIntent?.canStrike ?? true;
      if (chase && canStrike && distance < creature.species.size * 1.4 + 1 && creature.attackCooldown === 0) {
        const damage = creature.species.damage ?? 10;
        onAttack(protectedBySub ? Math.max(3, damage * 0.34) : damage, creature.species.name);
        creature.mesh.position.addScaledVector(direction, -2.5);
        creature.attackCooldown = 2.2;
      }
    }
    return alert;
  }

  hit(origin: THREE.Vector3, direction: THREE.Vector3, range: number, damage: number, time: number): WeaponHit | null {
    this.raycaster.set(origin, direction.clone().normalize());
    this.raycaster.far = range;
    let closest: { creature: Creature; point: THREE.Vector3; distance: number } | null = null;
    for (const creature of this.creatures) {
      if (!creature.mesh.visible || creature.species.temperament !== 'aggressive') continue;
      const contact = this.raycaster.intersectObject(creature.mesh, true)[0];
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

  private chooseTarget(
    creature: Creature,
    player: THREE.Vector3,
    distance: number,
    time: number,
    chasing: boolean,
  ): THREE.Vector3 {
    const { temperament } = creature.species;
    if (chasing) return player;
    if (temperament === 'passive' && distance < 6) {
      return creature.mesh.position.clone().add(creature.mesh.position.clone().sub(player).normalize().multiplyScalar(8));
    }
    if (temperament === 'neutral' && distance < 2.8) {
      return creature.mesh.position.clone().add(creature.mesh.position.clone().sub(player).normalize().multiplyScalar(4));
    }
    const returned = creature.mesh.position.distanceTo(creature.home) > 16;
    if (returned) return creature.home;
    if (creature.mesh.position.distanceTo(creature.target) < 1.2 || Math.sin(time * 0.2 + creature.phase) > 0.995) {
      creature.target.copy(creature.home).add(new THREE.Vector3(
        (this.random() - 0.5) * 13,
        (this.random() - 0.5) * 5,
        (this.random() - 0.5) * 13,
      ));
    }
    return creature.target;
  }

  private respawn(creature: Creature): void {
    creature.health = creature.maxHealth;
    creature.deadUntil = 0;
    creature.provokedUntil = 0;
    creature.attackCooldown = 0;
    creature.mesh.position.copy(creature.home);
    creature.mesh.visible = true;
  }
}
