import * as THREE from 'three';
import { floorAt } from './terrain';

export interface ExplorationSite {
  name: string;
  position: THREE.Vector3;
}

const SITE_DATA: Array<[string, number, number, 'arch' | 'spire' | 'vent']> = [
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

function makeSite(kind: 'arch' | 'spire' | 'vent'): THREE.Group {
  const group = new THREE.Group();
  const glow = kind === 'vent' ? 0xff5c34 : kind === 'spire' ? 0x50e8ef : 0x56a89f;
  const material = new THREE.MeshStandardMaterial({
    color: kind === 'vent' ? 0x301d1d : 0x263e43, emissive: glow, emissiveIntensity: 0.45, roughness: 0.78,
  });
  if (kind === 'arch') {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4, 0.65, 7, 18, Math.PI), material);
    arch.rotation.z = Math.PI;
    arch.position.y = 0.4;
    group.add(arch);
  } else {
    const height = kind === 'vent' ? 7 : 11;
    for (let i = 0; i < 4; i += 1) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, height - i, 6), material);
      spire.position.set((i - 1.5) * 1.4, (height - i) / 2, Math.sin(i) * 1.2);
      group.add(spire);
    }
  }
  return group;
}

export function createExplorationSites(scene: THREE.Scene): ExplorationSite[] {
  return SITE_DATA.map(([name, x, z, kind]) => {
    const model = makeSite(kind);
    model.position.set(x, floorAt(x, z), z);
    scene.add(model);
    return { name, position: model.position };
  });
}
