import * as THREE from 'three';
import type { OceanDecor } from './decorations';
import { createExplorationSites, type ExplorationSite } from './explorationSites';
import { createLandmarks } from './landmarks';
import { createResourceNodes } from './resources';
import type { Interactable, RecipeId } from './types';

export class WorldContent {
  private readonly interactions: Interactable[];
  private readonly sites: ExplorationSite[];
  private scanUntil = 0;

  constructor(scene: THREE.Scene, private readonly decor: OceanDecor) {
    this.sites = createExplorationSites(scene);
    this.interactions = [
      ...createResourceNodes(scene),
      ...createLandmarks(scene, decor),
    ];
  }

  nearestSite(position: THREE.Vector3): { name: string; distance: number } {
    const nearest = this.sites
      .map((site) => ({ name: site.name, distance: site.position.distanceTo(position) }))
      .sort((left, right) => left.distance - right.distance)[0];
    return nearest ?? { name: '', distance: 0 };
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
    for (const [id, module] of Object.entries(this.decor.habitat)) {
      if (module) module.visible = crafted.includes(id as RecipeId);
    }
    for (const item of this.interactions) {
      if (item.kind === 'log' && item.logId) item.mesh.visible = !logs.includes(item.logId);
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

  objectiveTarget(
    crafted: RecipeId[],
    logs: string[],
    player: THREE.Vector3,
  ): { position: THREE.Vector3; label: string } {
    const landmarkId = !logs.includes('pod') ? 'log-pod'
      : !crafted.includes('tank') ? null
        : !crafted.includes('repair') ? null
          : !crafted.includes('submarine') ? null
            : !logs.includes('kelp') ? 'log-kelp'
              : !crafted.includes('depthModule') ? null
                : !logs.includes('vault') ? 'log-vault'
                  : !logs.includes('heart') ? 'log-heart'
                    : ['rocketHull', 'rocketCore', 'rocketFuel'].some((id) => !crafted.includes(id as RecipeId))
                      ? null : 'rocket';
    if (landmarkId) {
      const landmark = this.interactions.find((item) => item.id === landmarkId);
      if (landmark) return { position: landmark.position, label: landmark.label };
    }
    const wanted = !crafted.includes('tank') ? ['copper', 'quartz', 'coral']
      : !crafted.includes('repair') ? ['scrap', 'copper', 'crystal']
        : !crafted.includes('submarine') ? ['scrap', 'copper', 'crystal', 'oil', 'cell']
          : !crafted.includes('depthModule') ? ['gem', 'crystal', 'oil']
            : ['scrap', 'oil', 'quartz', 'gem', 'crystal', 'cell', 'coral'];
    const resource = this.interactions
      .filter((item) => item.kind === 'resource' && item.mesh.visible && item.resource && wanted.includes(item.resource))
      .sort((left, right) => left.position.distanceToSquared(player) - right.position.distanceToSquared(player))[0];
    if (resource) return { position: resource.position, label: resource.label };
    const pod = this.interactions.find((item) => item.id === 'pod');
    return { position: pod?.position ?? new THREE.Vector3(), label: 'Escape Pod' };
  }
}
