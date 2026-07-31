import * as THREE from 'three';
import { createCreatureModel, SPECIES, type Species } from './creatureCatalog';
import { floorAt, seededRandom } from './terrain';

interface Creature {
  mesh: THREE.Group;
  home: THREE.Vector3;
  target: THREE.Vector3;
  species: Species;
  phase: number;
  attackCooldown: number;
}

export class CreatureSystem {
  private readonly creatures: Creature[] = [];
  private readonly random = seededRandom(8492);

  constructor(scene: THREE.Scene) {
    SPECIES.forEach((species, speciesIndex) => {
      const count = species.name === 'Gloom Crown' ? 1 : species.temperament === 'aggressive' ? 2 : 3;
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
  ): void {
    for (const creature of this.creatures) {
      creature.attackCooldown = Math.max(0, creature.attackCooldown - delta);
      const distance = creature.mesh.position.distanceTo(player);
      const target = this.chooseTarget(creature, player, distance, time);
      const direction = target.clone().sub(creature.mesh.position);
      const chase = creature.species.temperament === 'aggressive' && distance < 16;
      const speed = creature.species.speed * (chase ? 2.35 : 1);
      if (direction.lengthSq() > 0.05) {
        direction.normalize();
        creature.mesh.position.addScaledVector(direction, speed * delta);
        creature.mesh.lookAt(creature.mesh.position.clone().add(direction));
      }
      creature.mesh.rotation.z = Math.sin(time * 3 + creature.phase) * 0.08;
      if (chase && distance < creature.species.size * 1.4 + 1 && creature.attackCooldown === 0) {
        onAttack(protectedBySub ? 4 : 11, creature.species.name);
        creature.attackCooldown = 2.2;
      }
    }
  }

  private chooseTarget(creature: Creature, player: THREE.Vector3, distance: number, time: number): THREE.Vector3 {
    const { temperament } = creature.species;
    if (temperament === 'aggressive' && distance < 16) return player;
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
}

