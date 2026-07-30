import * as THREE from 'three';
import { makeBeacon, makeEnemy, makeGrappleAnchor, makeHoverbike, makeResource, type Enemy, type Resource } from './models';

export type EclipseEncounters = {
  enemies: Enemy[];
  resources: Resource[];
  anchors: THREE.Group[];
  beacon: THREE.Group;
  hoverbike: THREE.Group;
};

export function createEncounters(scene: THREE.Scene): EclipseEncounters {
  const enemies = [
    makeEnemy('scavenger-a', 'scavenger', 31, -14), makeEnemy('scavenger-b', 'scavenger', 47, -24),
    makeEnemy('sentinel-a', 'sentinel', -34, -17), makeEnemy('sentinel-b', 'sentinel', -49, -28),
    makeEnemy('wraith-a', 'wraith', -28, 31), makeEnemy('wraith-b', 'wraith', -40, 45),
    makeEnemy('scavenger-c', 'scavenger', 15, 35),
  ];
  const resources = [
    ...[[18, -8], [29, -21], [48, -12], [-20, -8], [-43, -30], [-28, 24], [-47, 40], [17, 31], [36, 32], [7, 57]].map(([x, z], index) => makeResource(`shard-${index}`, 'shard', x, z)),
    ...[[6, -12], [41, -33], [-53, -12], [-18, 47], [45, 47], [0, 62]].map(([x, z], index) => makeResource(`alloy-${index}`, 'alloy', x, z)),
  ];
  const anchors = [[20, 5, 18], [-22, 6, 22], [26, 8, 35], [38, 7, 49], [-40, 5, -10]].map(([x, y, z]) => makeGrappleAnchor(x, y, z));
  const beacon = makeBeacon();
  const hoverbike = makeHoverbike();
  hoverbike.position.set(-3, .05, -5);
  scene.add(...enemies.map((enemy) => enemy.mesh), ...resources.map((resource) => resource.mesh), ...anchors, beacon, hoverbike);
  return { enemies, resources, anchors, beacon, hoverbike };
}

export function summonWarden(scene: THREE.Scene, enemies: Enemy[]) {
  const existing = enemies.find((enemy) => enemy.kind === 'warden');
  if (existing) return existing;
  const warden = makeEnemy('eclipse-warden', 'warden', 35, 43);
  enemies.push(warden);
  scene.add(warden.mesh);
  return warden;
}
