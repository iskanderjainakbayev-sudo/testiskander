import * as THREE from 'three';
import { SPECIES } from './creatureCatalog';
import { createCreatureModel } from './creatureModels';
import { animateCreature } from './creatureMotion';
import { thinkCreature, type CreatureStimulus } from './CreatureBrain';
import {
  createCreatureActor,
  hitCreature,
  hitCreatureInCone,
  respawnCreature,
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
      const count = species.isBoss ? 1 : species.pack >= 5 ? 3 : species.pack >= 2 ? 2 : 1;
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
    stimulus: CreatureStimulus,
    onAttack: (damage: number, creature: string, soundHz: number, attack: string) => void,
  ): PredatorAlert | null {
    let alert: PredatorAlert | null = null;
    for (const creature of this.creatures) {
      if (creature.health <= 0) {
        if (creature.mesh.visible && time >= creature.corpseUntil) creature.mesh.visible = false;
        if (time >= creature.deadUntil) respawnCreature(creature);
        else {
          if (creature.mesh.visible) animateCreature(creature.mesh, creature.phase, time, 'dead', 0);
          continue;
        }
      }
      if (!creature.mesh.visible) continue;
      creature.attackCooldown = Math.max(0, creature.attackCooldown - delta);
      const distance = creature.mesh.position.distanceTo(player);
      this.updateEcosystem(creature, time);
      const brainIntent = thinkCreature(creature, player, time, stimulus, this.random);
      const hostile = ['stalk', 'circle', 'flank', 'chase', 'attack', 'search'].includes(brainIntent.mode);
      const bossIntent = creature.boss && hostile
        ? creature.boss.update(time, creature.mesh.position, player, creature.health / creature.maxHealth)
        : null;
      const target = bossIntent?.target
        ?? brainIntent.target;
      const direction = target.clone().sub(creature.mesh.position);
      const speedMultiplier = bossIntent?.speedMultiplier ?? brainIntent.speedMultiplier;
      const speed = creature.species.speed * speedMultiplier;
      if (direction.lengthSq() > 0.05) {
        direction.normalize();
        creature.mesh.position.addScaledVector(direction, speed * delta);
        creature.mesh.lookAt(creature.mesh.position.clone().add(direction));
      }
      animateCreature(creature.mesh, creature.phase, time, brainIntent.mode, creature.health / creature.maxHealth);
      if (hostile && (!alert || distance < alert.distance)) {
        alert = {
          name: creature.species.name,
          distance,
          attacking: (bossIntent?.canStrike ?? brainIntent.canStrike) && distance < 6,
          health: creature.health,
          maxHealth: creature.maxHealth,
          isBoss: Boolean(creature.boss),
        };
      }
      const canStrike = bossIntent?.canStrike ?? brainIntent.canStrike;
      if (hostile && canStrike && distance < creature.species.size * 1.4 + 1 && creature.attackCooldown === 0) {
        const damage = creature.species.damage;
        onAttack(
          protectedBySub ? Math.max(3, damage * .34) : damage,
          creature.species.name,
          creature.species.soundSet.warningHz,
          creature.species.attack,
        );
        creature.mesh.position.addScaledVector(direction, -2.5);
        creature.attackCooldown = this.attackDelay(creature);
      }
      const prey = creature.ecosystemTarget;
      if (brainIntent.mode === 'hunt' && prey && prey.health > 0
        && creature.mesh.position.distanceTo(prey.mesh.position) < creature.species.size + prey.species.size) {
        prey.health = 0;
        prey.mode = 'dead';
        prey.corpseUntil = time + 9;
        prey.deadUntil = time + 42;
        creature.mode = 'feed';
        creature.modeUntil = time + 5;
        creature.ecosystemTarget = null;
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

  private updateEcosystem(creature: CreatureActor, time: number): void {
    if (time < creature.ecosystemCheckAt) return;
    creature.ecosystemCheckAt = time + 1.2 + this.random();
    creature.ecosystemTarget = null;
    creature.ecosystemThreat = null;
    let preyDistance = 15;
    let threatDistance = 12;
    for (const other of this.creatures) {
      if (other === creature || !other.mesh.visible || other.health <= 0) continue;
      const distance = creature.mesh.position.distanceTo(other.mesh.position);
      const stronger = other.species.threat > creature.species.threat + 1;
      if (stronger && distance < threatDistance) {
        creature.ecosystemThreat = other;
        threatDistance = distance;
      }
      const huntsFish = creature.species.diet.includes('fish') || creature.species.diet.includes('predator');
      if (huntsFish && other.species.temperament === 'passive' && distance < preyDistance) {
        creature.ecosystemTarget = other;
        preyDistance = distance;
      }
    }
  }

  private attackDelay(creature: CreatureActor): number {
    if (creature.species.attack === 'shock') return 3.4;
    if (creature.species.attack === 'poison') return 2.8;
    if (creature.species.attack === 'charge' || creature.species.attack === 'ram') return 2.5;
    return 1.8;
  }
}
