import * as THREE from 'three';
import type { Enemy } from './models';
import type { PlayerAction, PlayerFrame } from './player';

export type CombatEvent = { type: 'message' | 'defeat' | 'boss'; text: string; enemy?: Enemy };

type Effect = { mesh: THREE.Mesh; life: number; maxLife: number };

export class EclipseCombat {
  private events: CombatEvent[] = [];
  private effects: Effect[] = [];
  private attackReadyAt = 0;
  private pulseReadyAt = 0;

  constructor(private scene: THREE.Scene, readonly enemies: Enemy[]) {}

  perform(action: PlayerAction, frame: PlayerFrame, elapsed: number) {
    if (action === 'attack' && elapsed >= this.attackReadyAt) {
      this.attackReadyAt = elapsed + .32;
      this.hitNearby(frame, 3.3, 7, 'Arc blade');
      this.spawnEffect(frame.position, '#77f4ff', 1.8);
    }
    if (action === 'bolt' && elapsed >= this.attackReadyAt) {
      this.attackReadyAt = elapsed + .55;
      const enemy = this.closestEnemy(frame.position, 22);
      if (enemy) this.hit(enemy, 11, 'Rift bolt');
      this.spawnEffect(frame.position, '#bb91ff', 2.5);
    }
    if (action === 'pulse' && elapsed >= this.pulseReadyAt) {
      this.pulseReadyAt = elapsed + 6;
      this.hitNearby(frame, 8, 12, 'Eclipse pulse');
      this.spawnEffect(frame.position, '#ffd58a', 7);
      this.events.push({ type: 'message', text: 'Eclipse Pulse ruptures the rift.' });
    }
  }

  update(delta: number, elapsed: number, frame: PlayerFrame) {
    let damage = 0;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const distance = enemy.mesh.position.distanceTo(frame.position);
      if (distance < 28) {
        const direction = frame.position.clone().sub(enemy.mesh.position);
        direction.y = 0;
        if (direction.lengthSq() > .1 && distance > 1.55) enemy.mesh.position.addScaledVector(direction.normalize(), enemy.speed * delta);
        enemy.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      }
      enemy.mesh.position.y = Math.max(0, Math.sin(elapsed * 2 + enemy.maxHealth) * .13);
      if (distance < (enemy.kind === 'warden' ? 3.6 : 2.1) && elapsed > enemy.attackAt && !frame.invulnerable) {
        enemy.attackAt = elapsed + (enemy.kind === 'warden' ? .82 : 1.15);
        damage += enemy.damage;
        this.events.push({ type: 'message', text: enemy.kind === 'warden' ? 'The Warden’s eclipse strike lands.' : 'Rift energy bites through your shield.' });
      }
      if (enemy.kind === 'warden' && enemy.phase === 1 && enemy.health < enemy.maxHealth * .5) {
        enemy.phase = 2;
        enemy.speed += 1.2;
        enemy.damage += 7;
        this.events.push({ type: 'message', text: 'WARDEN PHASE II — The sky fractures.' });
      }
    }
    this.effects = this.effects.filter((effect) => {
      effect.life -= delta;
      const progress = 1 - effect.life / effect.maxLife;
      effect.mesh.scale.setScalar(1 + progress * 2);
      (effect.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, effect.life / effect.maxLife);
      if (effect.life <= 0) this.scene.remove(effect.mesh);
      return effect.life > 0;
    });
    return damage;
  }

  drainEvents() { const next = [...this.events]; this.events = []; return next; }
  getBoss() { return this.enemies.find((enemy) => enemy.kind === 'warden' && enemy.alive); }
  private hitNearby(frame: PlayerFrame, range: number, power: number, label: string) {
    this.enemies.filter((enemy) => enemy.alive && enemy.mesh.position.distanceTo(frame.position) <= range).forEach((enemy) => this.hit(enemy, power, label));
  }
  private closestEnemy(position: THREE.Vector3, range: number) {
    return this.enemies.filter((enemy) => enemy.alive).sort((a, b) => a.mesh.position.distanceToSquared(position) - b.mesh.position.distanceToSquared(position)).find((enemy) => enemy.mesh.position.distanceTo(position) < range);
  }
  private hit(enemy: Enemy, power: number, label: string) {
    enemy.health -= power;
    this.spawnEffect(enemy.mesh.position, enemy.kind === 'warden' ? '#ffbd70' : '#e7a9ff', .8);
    if (enemy.health > 0) return;
    enemy.alive = false;
    this.scene.remove(enemy.mesh);
    if (enemy.kind === 'warden') this.events.push({ type: 'boss', text: 'The Eclipse Warden dissolves into starlight.', enemy });
    else this.events.push({ type: 'defeat', text: `${label}: rift host purged.`, enemy });
  }
  private spawnEffect(position: THREE.Vector3, color: string, size: number) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.18, .28, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y += .08;
    mesh.scale.setScalar(size);
    this.scene.add(mesh);
    this.effects.push({ mesh, life: .28, maxLife: .28 });
  }
}
