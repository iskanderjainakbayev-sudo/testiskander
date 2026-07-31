import * as THREE from 'three';
import { SPECIES } from './creatureCatalog';
import { createCreatureModel } from './creatureModels';
import { animateCreature } from './creatureMotion';
import {
  createCreatureActor,
  hitCreature,
  hitCreatureInCone,
  respawnCreature,
  targetForCreature,
  type CreatureActor,
  type WeaponHit,
} from './creatureRuntime';
import { floorAt, seededRandom } from './terrain';

export interface PredatorAlert {
  name: string;
  distance: number;
  attacking: boolean;
  health: number;
  maxHealth: number;
  isBoss: boolean;
}

export class CreatureSystem {
  private readonly creatures: CreatureActor[] = [];
  private readonly random = seededRandom(8492);
  private readonly raycaster = new THREE.Raycaster();

  constructor(scene: THREE.Scene) {
    SPECIES.forEach((species, speciesIndex) => {
      const count = species.isBoss ? 1 : species.name === 'Reef Fang' ? 4 : 3;
      for (let index = 0; index < count; index += 1) {
        const radius = species.band[0] + this.random() * (species.band[1] - species.band[0]);
        const angle = this.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = 8 + Math.sin(angle) * radius;
        const floor = floorAt(x, z);
        const home = new THREE.Vector3(x, floor + 3 + this.random() * Math.min(14, radius * 0.12), z);
        const mesh = createCreatureModel(species);
        mesh.position.copy(home);
        scene.add(mesh);
        this.creatures.push(createCreatureActor(species, mesh, home, speciesIndex + index * 1.7));
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
        if (time >= creature.deadUntil) respawnCreature(creature);
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
      const target = bossIntent?.target
        ?? targetForCreature(creature, player, distance, time, chase, this.random);
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
    return hitCreature(this.raycaster, this.creatures, damage, time);
  }

  melee(origin: THREE.Vector3, direction: THREE.Vector3, range: number, damage: number, time: number): WeaponHit | null {
    return hitCreatureInCone(this.creatures, origin, direction, range, damage, time);
  }
}
