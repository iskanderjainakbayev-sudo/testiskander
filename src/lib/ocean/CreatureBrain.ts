import * as THREE from 'three';
import type { DayPhase, OceanWeather } from './climate';
import type { CreatureActor, CreatureMode } from './creatureRuntime';

export interface CreatureStimulus {
  lightsOn: boolean;
  vehicleNoise: number;
  weaponNoise: number;
  explosion: number;
  movement: number;
  dayPhase: DayPhase;
  weather: OceanWeather;
}

export interface CreatureIntent {
  target: THREE.Vector3;
  mode: CreatureMode;
  speedMultiplier: number;
  canStrike: boolean;
}

function awareness(actor: CreatureActor, distance: number, stimulus: CreatureStimulus): number {
  const senses = actor.species.senses;
  const range = actor.species.alertRadius;
  const proximity = Math.max(0, 1 - distance / range);
  return proximity * senses.sight
    + stimulus.movement * senses.motion * .34
    + stimulus.vehicleNoise * senses.sound * .55
    + stimulus.weaponNoise * senses.sound * .72
    + stimulus.explosion * .9
    + (stimulus.lightsOn ? senses.light * .42 : 0);
}

function orbitTarget(actor: CreatureActor, player: THREE.Vector3, time: number, radius: number): THREE.Vector3 {
  const side = actor.phase % 2 > 1 ? 1 : -1;
  const angle = time * side * .72 + actor.phase;
  return player.clone().add(new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.sin(time * .8 + actor.phase) * 2,
    Math.sin(angle) * radius,
  ));
}

function fleeTarget(actor: CreatureActor, danger: THREE.Vector3): THREE.Vector3 {
  const away = actor.mesh.position.clone().sub(danger);
  if (away.lengthSq() < .01) away.set(1, 0, 0);
  return actor.mesh.position.clone().add(away.normalize().multiplyScalar(13)).add(new THREE.Vector3(0, 2, 0));
}

function roamTarget(actor: CreatureActor, time: number, random: () => number): THREE.Vector3 {
  if (actor.mesh.position.distanceTo(actor.target) < 1.2 || time >= actor.modeUntil) {
    actor.target.copy(actor.home).add(new THREE.Vector3(
      (random() - .5) * actor.territoryRadius,
      (random() - .5) * Math.min(8, actor.territoryRadius * .3),
      (random() - .5) * actor.territoryRadius,
    ));
    actor.modeUntil = time + 4 + random() * 7;
  }
  return actor.target;
}

export function thinkCreature(
  actor: CreatureActor,
  player: THREE.Vector3,
  time: number,
  stimulus: CreatureStimulus,
  random: () => number,
): CreatureIntent {
  const distance = actor.mesh.position.distanceTo(player);
  const homeDistance = actor.mesh.position.distanceTo(actor.home);
  const detected = awareness(actor, distance, stimulus) > .62 || time < actor.provokedUntil;
  const hurt = actor.health / actor.maxHealth < .27;
  const nightSleeper = actor.species.temperament === 'passive' && actor.phase % 3 < 1;

  if (hurt && actor.species.temperament !== 'passive') {
    actor.mode = 'retreat';
    return { target: fleeTarget(actor, player), mode: actor.mode, speedMultiplier: 1.85, canStrike: false };
  }
  if (homeDistance > actor.territoryRadius * 1.45) {
    actor.mode = 'return';
    return { target: actor.home, mode: actor.mode, speedMultiplier: 1.25, canStrike: false };
  }
  if (actor.ecosystemThreat?.mesh.visible && actor.ecosystemThreat.health > 0) {
    actor.mode = 'flee';
    return { target: fleeTarget(actor, actor.ecosystemThreat.mesh.position), mode: actor.mode, speedMultiplier: 2.15, canStrike: false };
  }
  if (actor.species.temperament === 'passive') {
    if (detected && (distance < 7 || stimulus.weaponNoise > 0)) {
      actor.mode = 'flee';
      return { target: fleeTarget(actor, player), mode: actor.mode, speedMultiplier: 2.2, canStrike: false };
    }
    if (nightSleeper && stimulus.dayPhase === 'Night' && stimulus.explosion === 0) {
      actor.mode = 'sleep';
      return { target: actor.home.clone().add(new THREE.Vector3(0, -1.2, 0)), mode: actor.mode, speedMultiplier: .12, canStrike: false };
    }
    if (stimulus.lightsOn && distance < 11 && stimulus.movement < .7) {
      actor.mode = 'curious';
      return { target: orbitTarget(actor, player, time, 4.5), mode: actor.mode, speedMultiplier: .72, canStrike: false };
    }
  }

  const isHostile = actor.species.temperament === 'aggressive' || time < actor.provokedUntil;
  if (isHostile && detected) {
    actor.lastKnownPlayer.copy(player);
    if (time >= actor.modeUntil) {
      const modes: CreatureMode[] = actor.species.pack > 1
        ? ['circle', 'flank', 'chase'] : ['stalk', 'circle', 'chase'];
      actor.mode = modes[Math.floor(random() * modes.length)];
      actor.modeUntil = time + 1.8 + random() * 2.8;
    }
    if (actor.mode === 'circle' || actor.mode === 'flank') {
      return { target: orbitTarget(actor, player, time, actor.mode === 'flank' ? 5.5 : 8), mode: actor.mode, speedMultiplier: 1.55, canStrike: false };
    }
    if (actor.mode === 'stalk') {
      return { target: orbitTarget(actor, player, time, 10), mode: actor.mode, speedMultiplier: .78, canStrike: false };
    }
    actor.mode = distance < 6 ? 'attack' : 'chase';
    return { target: player, mode: actor.mode, speedMultiplier: distance < 6 ? 2.9 : 2.15, canStrike: true };
  }

  if (actor.species.temperament === 'neutral' && detected && distance < 7) {
    if (actor.mode !== 'warn') {
      actor.mode = 'warn';
      actor.modeUntil = time + 2.2;
    }
    const attacksTerritory = time >= actor.modeUntil && distance < 4.2;
    return {
      target: attacksTerritory ? player : orbitTarget(actor, player, time, 5.5),
      mode: attacksTerritory ? 'attack' : 'warn',
      speedMultiplier: attacksTerritory ? 2.1 : .55,
      canStrike: attacksTerritory,
    };
  }

  if (actor.ecosystemTarget?.mesh.visible && actor.ecosystemTarget.health > 0) {
    actor.mode = actor.species.temperament === 'aggressive' ? 'hunt' : 'feed';
    return {
      target: actor.ecosystemTarget.mesh.position,
      mode: actor.mode,
      speedMultiplier: actor.mode === 'hunt' ? 1.7 : .65,
      canStrike: actor.mode === 'hunt',
    };
  }
  if (actor.mode === 'search' && time < actor.modeUntil) {
    return { target: actor.lastKnownPlayer, mode: actor.mode, speedMultiplier: .9, canStrike: false };
  }
  if (isHostile && actor.lastKnownPlayer.lengthSq() > 0 && distance < actor.species.alertRadius * 1.4) {
    actor.mode = 'search';
    actor.modeUntil = time + 4;
    return { target: actor.lastKnownPlayer, mode: actor.mode, speedMultiplier: .9, canStrike: false };
  }
  actor.mode = stimulus.weather === 'Storm' ? 'shelter' : 'patrol';
  return { target: roamTarget(actor, time, random), mode: actor.mode, speedMultiplier: stimulus.weather === 'Storm' ? .62 : 1, canStrike: false };
}
