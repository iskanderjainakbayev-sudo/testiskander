import * as THREE from 'three';
import type { OceanDecor } from './decorations';
import { createLandmarks } from './landmarks';
import { createResourceNodes } from './resources';
import type { Interactable, RecipeId } from './types';

export class WorldContent {
  private readonly interactions: Interactable[];
  private scanUntil = 0;

  constructor(scene: THREE.Scene, private readonly decor: OceanDecor) {
    this.interactions = [
      ...createResourceNodes(scene),
      ...createLandmarks(scene, decor),
    ];
  }

  nearest(position: THREE.Vector3, forward: THREE.Vector3): Interactable | null {
    let best: Interactable | null = null;
    let bestDistance = Infinity;
    for (const item of this.interactions) {
      if (!item.mesh.visible) continue;
      const distance = position.distanceTo(item.position);
      const range = item.kind === 'pod' || item.kind === 'rocket' ? 5.5 : 4;
      if (distance > range) continue;
      const direction = item.position.clone().sub(position).normalize();
      if (distance > 1.7 && direction.dot(forward) < 0.28) continue;
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best;
  }

  collect(item: Interactable, now: number): void {
    item.mesh.visible = false;
    item.collectedAt = now;
  }

  scan(now: number): void {
    this.scanUntil = now + 4500;
  }

  update(now: number, time: number): void {
    const scanning = now < this.scanUntil;
    for (const item of this.interactions) {
      if (item.kind === 'resource' && !item.mesh.visible && item.collectedAt && now - item.collectedAt > 120_000) {
        item.mesh.visible = true;
        item.collectedAt = undefined;
      }
      if (item.kind === 'resource' && item.mesh.visible) {
        const pulse = scanning ? 1.18 + Math.sin(time * 8 + item.position.x) * 0.15 : 1;
        item.mesh.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.12);
        item.mesh.rotation.y += 0.002;
      }
    }
    for (const plant of this.decor.plants) {
      plant.rotation.z = Math.sin(time * 0.55 + plant.position.x) * 0.025;
    }
  }

  reconcile(crafted: RecipeId[], logs: string[]): void {
    this.decor.submarine.visible = crafted.includes('submarine');
    const rocketReady = ['rocketHull', 'rocketCore', 'rocketFuel'].every((id) => crafted.includes(id as RecipeId));
    this.decor.rocket.visible = rocketReady;
    for (const item of this.interactions) {
      if (item.kind === 'log' && item.logId && logs.includes(item.logId)) item.mesh.visible = false;
    }
  }

  setSubPosition(position: THREE.Vector3): void {
    this.decor.submarine.position.copy(position);
    const node = this.interactions.find((item) => item.kind === 'submarine');
    node?.position.copy(position);
  }

  setSubVisible(visible: boolean): void {
    this.decor.submarine.visible = visible;
  }
}
