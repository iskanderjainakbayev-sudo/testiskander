import type { CreatureActor } from './creatureRuntime';

export function updateEcosystemTarget(
  creature: CreatureActor,
  creatures: CreatureActor[],
  time: number,
  random: () => number,
): void {
  if (time < creature.ecosystemCheckAt) return;
  creature.ecosystemCheckAt = time + 1.2 + random();
  creature.ecosystemTarget = null;
  creature.ecosystemThreat = null;
  let preyDistance = 15;
  let threatDistance = 12;
  for (const other of creatures) {
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

export function creatureAttackDelay(creature: CreatureActor): number {
  if (creature.species.attack === 'shock') return 3.4;
  if (creature.species.attack === 'poison') return 2.8;
  if (creature.species.attack === 'charge' || creature.species.attack === 'ram') return 2.5;
  return 1.8;
}

export function creatureAttackRange(creature: CreatureActor): number {
  const base = creature.species.size * 1.4 + 1;
  if (creature.species.attack === 'shock') return base + 3;
  if (creature.species.attack === 'tail') return base + 1.8;
  if (creature.species.attack === 'grab') return base + 1.2;
  return base;
}
