import * as THREE from 'three';

export type EclipseRegionId =
  | 'neon-refuge'
  | 'crystal-desert'
  | 'frostbreak'
  | 'rootfall'
  | 'sky-breach'
  | 'emberfall';

export type EclipseRegion = {
  id: EclipseRegionId;
  name: string;
  subtitle: string;
  center: THREE.Vector2;
  radius: number;
  color: string;
  accent: string;
  enemy: string;
};

export const ECLIPSE_REGIONS: EclipseRegion[] = [
  { id: 'neon-refuge', name: 'Neon Refuge', subtitle: 'The last safe signal', center: new THREE.Vector2(0, 0), radius: 22, color: '#172d58', accent: '#42e4ff', enemy: 'None' },
  { id: 'crystal-desert', name: 'Crystal Desert', subtitle: 'Singing glass dunes', center: new THREE.Vector2(42, -18), radius: 27, color: '#7b4c75', accent: '#f1b9ff', enemy: 'Rift scavengers' },
  { id: 'frostbreak', name: 'Frostbreak Peaks', subtitle: 'An aurora split in stone', center: new THREE.Vector2(-40, -22), radius: 25, color: '#2c5778', accent: '#a8f6ff', enemy: 'Ice sentinels' },
  { id: 'rootfall', name: 'Rootfall Ruins', subtitle: 'The city beneath the canopy', center: new THREE.Vector2(-35, 38), radius: 30, color: '#2e654f', accent: '#d9f277', enemy: 'Vine wraiths' },
  { id: 'sky-breach', name: 'Sky Breach', subtitle: 'Islands caught in the eclipse', center: new THREE.Vector2(35, 43), radius: 27, color: '#4b3d86', accent: '#ffc86b', enemy: 'Eclipse warden' },
  { id: 'emberfall', name: 'Emberfall Rim', subtitle: 'A sleeping volcanic engine', center: new THREE.Vector2(4, 69), radius: 21, color: '#70383b', accent: '#ff845f', enemy: 'Ash prowlers' },
];

export const QUESTS = [
  { id: 'shards', title: 'Signal in the Sand', description: 'Recover Lunar Shards from the fractured frontier.', target: 6, reward: 'Pulse Module' },
  { id: 'beacon', title: 'Wake the Beacon', description: 'Feed the recovered shards into the Eclipse Beacon.', target: 1, reward: 'Astra Drone' },
  { id: 'warden', title: 'A Rift Has a Heart', description: 'Defeat the Eclipse Warden at Sky Breach.', target: 1, reward: 'Starfall Blade' },
] as const;

export function regionAt(position: THREE.Vector3): EclipseRegion {
  return ECLIPSE_REGIONS.reduce((nearest, region) => {
    const currentDistance = region.center.distanceToSquared(new THREE.Vector2(position.x, position.z));
    const nearestDistance = nearest.center.distanceToSquared(new THREE.Vector2(position.x, position.z));
    return currentDistance < nearestDistance ? region : nearest;
  }, ECLIPSE_REGIONS[0]);
}

export function regionById(id: EclipseRegionId): EclipseRegion {
  return ECLIPSE_REGIONS.find((region) => region.id === id) ?? ECLIPSE_REGIONS[0];
}
