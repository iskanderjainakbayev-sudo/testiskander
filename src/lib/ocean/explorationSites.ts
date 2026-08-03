import * as THREE from 'three';
import { createExplorationLandmark, type ExplorationSiteKind } from './explorationSiteFactory';
import { floorAt } from './terrain';

export interface ExplorationSite {
  name: string;
  position: THREE.Vector3;
}

const SITE_DATA: Array<[string, number, number, ExplorationSiteKind]> = [
  ['Whisper Arch', 28, -18, 'arch'], ['Saffron Nursery', -32, 28, 'spire'],
  ['Wayfarer Wreck', 14, 53, 'arch'], ['Ribbon Gardens', 57, 25, 'spire'],
  ['Pilgrim Steps', -62, 11, 'arch'], ['Mooncap Grove', -31, -68, 'spire'],
  ['Hollow Crown', 72, -48, 'arch'], ['Verdant Cathedral', 18, -88, 'spire'],
  ['Mirror Needles', 104, 18, 'spire'], ['Archive Gate', -112, -30, 'arch'],
  ['Ember Chimneys', 82, 94, 'vent'], ['Pale Shelf', -86, 104, 'spire'],
  ['Glass Labyrinth', 142, -38, 'arch'], ['Cartographer Vault', -151, 24, 'arch'],
  ['Cinder Caldera', 124, 112, 'vent'], ['Icebell Grotto', -126, -112, 'spire'],
  ['Sunken Observatory', 44, -158, 'arch'], ['Titan Rib', -32, 172, 'arch'],
  ['Lumen Falls', 184, 58, 'spire'], ['Silent Engine', -190, -52, 'vent'],
  ['Starseed Cradle', 126, -176, 'arch'], ['Obsidian Choir', -142, 176, 'spire'],
  ['Midnight Scar', 218, 34, 'vent'], ['Drowned Satellite', -220, 72, 'arch'],
  ['Last Beacon', 36, 246, 'spire'],
];

export function createExplorationSites(scene: THREE.Scene): ExplorationSite[] {
  return SITE_DATA.map(([name, x, z, kind], index) => {
    const model = createExplorationLandmark(kind, 9187 + index * 7919);
    model.position.set(x, floorAt(x, z), z);
    scene.add(model);
    return { name, position: model.position };
  });
}
