import * as THREE from 'three';
import { SPECIES, type Species } from './creatureCatalog';
import { createCreatureModel } from './creatureModels';
import { floorAt, seededRandom } from './terrain';

interface Creature {
  mesh: THREE.Group;
  home: THREE.Vector3;
  target: THREE.Vector3;
  species: Species;
  phase: number;
  attackCooldown: number;
}

export interface PredatorAlert {
  name: string;
  distance: number;
  attacking: boolean;
}

export class CreatureSystem {
  private readonly creatures: Creature[] = [];
  private readonly random = seededRandom(8492);

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
        mesh.position.copy(home);
        scene.add(mesh);
        this.creatures.push({
          mesh, home, target: home.clone(), species,
          phase: speciesIndex + index * 1.7,
          attackCooldown: 0,
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
      creature.attackCooldown = Math.max(0, creature.attackCooldown - delta);
      const distance = creature.mesh.position.distanceTo(player);
      const target = this.chooseTarget(creature, player, distance, time);
      const direction = target.clone().sub(creature.mesh.position);
      const alertRadius = creature.species.alertRadius ?? 16;
      const chase = creature.species.temperament === 'aggressive' && distance < alertRadius;
      const lunge = chase && distance < 6 ? 1.38 : 1;
      const speed = creature.species.speed * (chase ? 2.45 : 1) * lunge;
      if (direction.lengthSq() > 0.05) {
        direction.normalize();
        creature.mesh.position.addScaledVector(direction, speed * delta);
        creature.mesh.lookAt(creature.mesh.position.clone().add(direction));
      }
      this.animate(creature, time, chase);
      if (chase && (!alert || distance < alert.distance)) {
        alert = { name: creature.species.name, distance, attacking: distance < 6 };
      }
      if (chase && distance < creature.species.size * 1.4 + 1 && creature.attackCooldown === 0) {
        const damage = creature.species.damage ?? 10;
        onAttack(protectedBySub ? Math.max(3, damage * 0.34) : damage, creature.species.name);
        creature.mesh.position.addScaledVector(direction, -2.5);
        creature.attackCooldown = 2.2;
      }
    }
    return alert;
  }

  private chooseTarget(creature: Creature, player: THREE.Vector3, distance: number, time: number): THREE.Vector3 {
    const { temperament } = creature.species;
    if (temperament === 'aggressive' && distance < (creature.species.alertRadius ?? 16)) return player;
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

  private animate(creature: Creature, time: number, chasing: boolean): void {
    const beat = time * (chasing ? 10 : 4.5) + creature.phase;
    creature.mesh.rotation.z = Math.sin(beat * 0.48) * (chasing ? 0.16 : 0.07);
    const tail = creature.mesh.getObjectByName('swim-tail');
    if (tail) tail.rotation.y = Math.sin(beat) * (chasing ? 0.7 : 0.38);
    for (const side of [-1, 1]) {
      const fin = creature.mesh.getObjectByName(`swim-fin-${side}`);
      if (fin) fin.rotation.y = Math.sin(beat * 0.72 + side) * 0.24;
    }
    creature.mesh.children
      .filter((child) => child.name.startsWith('tentacle-'))
      .forEach((limb, index) => {
        limb.rotation.x = Math.sin(beat * 0.32 + index) * 0.15;
      });
  }
}
