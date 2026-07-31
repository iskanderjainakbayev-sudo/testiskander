import * as THREE from 'three';

type BossMode = 'stalk' | 'circle' | 'charge' | 'recover';

export interface BossIntent {
  target: THREE.Vector3;
  speedMultiplier: number;
  canStrike: boolean;
  mode: BossMode;
}

export class BossBrain {
  private mode: BossMode = 'stalk';
  private modeUntil = 0;
  private readonly orbitDirection: number;

  constructor(home: THREE.Vector3) {
    this.orbitDirection = home.x >= 0 ? 1 : -1;
  }

  update(
    time: number,
    position: THREE.Vector3,
    player: THREE.Vector3,
    healthRatio: number,
  ): BossIntent {
    const enraged = healthRatio < 0.38;
    if (this.modeUntil === 0) this.modeUntil = time + 2.4;
    if (time >= this.modeUntil) this.advance(time, enraged);

    if (this.mode === 'circle') {
      const angle = time * (enraged ? 1.45 : 0.86) * this.orbitDirection;
      return {
        target: player.clone().add(new THREE.Vector3(Math.cos(angle) * 9, Math.sin(time * 1.3) * 2.4, Math.sin(angle) * 9)),
        speedMultiplier: enraged ? 1.9 : 1.5,
        canStrike: false,
        mode: this.mode,
      };
    }
    if (this.mode === 'charge') {
      return {
        target: player.clone(),
        speedMultiplier: enraged ? 4.2 : 3.35,
        canStrike: true,
        mode: this.mode,
      };
    }
    if (this.mode === 'recover') {
      const retreat = position.clone().sub(player).normalize().multiplyScalar(12);
      return {
        target: position.clone().add(retreat).add(new THREE.Vector3(0, 3.5, 0)),
        speedMultiplier: enraged ? 2.2 : 1.7,
        canStrike: false,
        mode: this.mode,
      };
    }
    const approach = player.clone().sub(position).normalize();
    return {
      target: player.clone().addScaledVector(approach, -7).add(new THREE.Vector3(0, Math.sin(time) * 2, 0)),
      speedMultiplier: enraged ? 1.55 : 1.12,
      canStrike: false,
      mode: this.mode,
    };
  }

  onHit(time: number, healthRatio: number): void {
    if (this.mode === 'charge') return;
    this.mode = healthRatio < 0.38 ? 'circle' : 'recover';
    this.modeUntil = time + (healthRatio < 0.38 ? 0.65 : 1.15);
  }

  private advance(time: number, enraged: boolean): void {
    if (this.mode === 'stalk') this.mode = 'circle';
    else if (this.mode === 'circle') this.mode = 'charge';
    else if (this.mode === 'charge') this.mode = 'recover';
    else this.mode = enraged ? 'charge' : 'stalk';
    const duration = {
      stalk: enraged ? 1.1 : 2.2,
      circle: enraged ? 1.7 : 3.1,
      charge: enraged ? 1.15 : 1.35,
      recover: enraged ? 0.8 : 1.55,
    }[this.mode];
    this.modeUntil = time + duration;
  }
}
