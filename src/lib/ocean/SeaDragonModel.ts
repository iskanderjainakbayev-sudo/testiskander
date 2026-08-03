import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Species } from './creatureCatalog';
import { enhanceCreatureMaterials } from './enhanceCreatureMaterials';

const models = import.meta.glob('../../../../assets/models/ocean/abyssal-dragon.glb', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function fallbackMaterial(species: Species) {
  return new THREE.MeshPhysicalMaterial({
    color: species.color,
    emissive: species.glow,
    emissiveIntensity: 1.25,
    roughness: 0.3,
    metalness: 0.18,
    clearcoat: 0.55,
  });
}

function addFallback(group: THREE.Group, species: Species): void {
  const skin = fallbackMaterial(species);
  for (let index = 0; index < 16; index += 1) {
    const taper = 1 - index / 22;
    const segment = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), skin);
    segment.name = `dragon-segment-${index.toString().padStart(2, '0')}`;
    segment.scale.set(1.5 * taper, 0.95 * taper, 1.15);
    segment.position.z = -2 - index * 1.15;
    group.add(segment);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), skin);
  head.scale.set(1.9, 1.25, 2.25);
  group.add(head);
}

function prepareModel(model: THREE.Object3D): void {
  model.traverse((child) => {
    child.frustumCulled = false;
    if (child.name.startsWith('dragon-segment-')) {
      child.userData.restX = child.position.x;
      child.userData.restY = child.position.y;
    }
  });
}

export function createSeaDragonModel(species: Species): THREE.Group {
  const group = new THREE.Group();
  addFallback(group, species);
  const url = Object.values(models)[0];
  if (!url) return group;
  new GLTFLoader().load(url, (gltf) => {
    group.clear();
    const model = gltf.scene;
    enhanceCreatureMaterials(model, species);
    prepareModel(model);
    group.add(model);
  });
  prepareModel(group);
  return group;
}
