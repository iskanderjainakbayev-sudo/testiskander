import * as THREE from 'three';
import { SPECIES } from './creatureCatalog';
import { createCreatureModel } from './creatureModels';
import { animateCreature } from './creatureMotion';
import { thinkCreature, type CreatureStimulus } from './CreatureBrain';
import { creatureAttackDelay, creatureAttackRange, updateEcosystemTarget } from './creatureEcosystem';
import {
  createCreatureActor,
  hitCreature,
  hitCreatureInCone,
  respawnCreature,
  type CreatureActor,
  type WeaponHit,
  type CreatureMode,
} from './creatureRuntime';
import { floorAt, seededRandom } from './terrain';
import { updateCreatureLocomotion } from './creatureLocomotion';
import { CreatureWake } from './CreatureWake';

export interface PredatorAlert {
  name: string;
  distance: number;
  attacking: boolean;
  health: number;
  maxHealth: number;
  isBoss: boolean;
  soundHz: number;
  mode: CreatureMode;
}

export class CreatureSystem {
  private readonly creatures: CreatureActor[] = [];
  private readonly random = seededRandom(8492);
  private readonly raycaster = new THREE.Raycaster();
  private readonly wake: CreatureWake;

  constructor(scene: THREE.Scene) {
    SPECIES.forEach((species, speciesIndex) => {
      const count = species.isBoss ? 1 : species.pack >= 5 ? 4 : species.pack >= 2 ? 2 : 1;
      const radius = species.band[0] + this.random() * (species.band[1] - species.band[0]);
      const angle = this.random() * Math.PI * 2;
      const schoolCenter = new THREE.Vector3(Math.cos(angle) * radius, 0, 8 + Math.sin(angle) * radius);
      for (let index = 0; index < count; index += 1) {
        const spread = count === 1 ? 0 : 2.5 + this.random() * 3.5;
        const schoolAngle = this.random() * Math.PI * 2;
        const x = schoolCenter.x + Math.cos(schoolAngle) * spread;
        const z = schoolCenter.z + Math.sin(schoolAngle) * spread;
        const floor = floorAt(x, z);
        const home = new THREE.Vector3(x, floor + 3 + this.random() * Math.min(14, radius * 0.12), z);
        const mesh = createCreatureModel(species);
        mesh.position.copy(home);
        scene.add(mesh);
        this.creatures.push(createCreatureActor(species, mesh, home, speciesIndex + index * 1.7));
      }
    });
    this.wake = new CreatureWake(scene);
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
      updateEcosystemTarget(creature, this.creatures, time, this.random);
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
        updateCreatureLocomotion(creature, this.creatures, target, speed, delta, time);
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
          soundHz: creature.species.soundSet.callHz,
          mode: brainIntent.mode,
        };
      }
      const canStrike = bossIntent?.canStrike ?? brainIntent.canStrike;
      const attackRange = creatureAttackRange(creature);
      if (hostile && canStrike && distance < attackRange && creature.attackCooldown === 0) {
        const damage = creature.species.damage;
        onAttack(
          protectedBySub ? Math.max(3, damage * .34) : damage,
          creature.species.name,
          creature.species.soundSet.warningHz,
          creature.species.attack,
        );
        creature.mesh.position.addScaledVector(direction, -2.5);
        creature.attackCooldown = creatureAttackDelay(creature);
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
    this.wake.update(delta, time, this.creatures);
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
