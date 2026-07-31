import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Species } from './creatureCatalog';

const urls = import.meta.glob('../../../../assets/models/ocean/fish/*.glb', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const loader = new GLTFLoader();
const models = new Map<string, Promise<THREE.Group>>();

function urlFor(assetId: string): string | undefined {
  return Object.entries(urls).find(([path]) => path.endsWith(`/${assetId}.glb`))?.[1];
}

function load(assetId: string): Promise<THREE.Group> | null {
  const cached = models.get(assetId);
  if (cached) return cached;
  const url = urlFor(assetId);
  if (!url) return null;
  const pending = loader.loadAsync(url).then((gltf) => gltf.scene);
  models.set(assetId, pending);
  return pending;
}

export function replaceWithBlenderFish(group: THREE.Group, species: Species): void {
  const pending = load(species.assetId);
  if (!pending) return;
  void pending.then((source) => {
    const model = source.clone(true);
    model.scale.setScalar(species.size);
    model.traverse((child) => {
      child.frustumCulled = false;
      child.castShadow = true;
      if (child.name.startsWith('eel-segment-')) {
        child.userData.restX = child.position.x;
        child.userData.restY = child.position.y;
      }
    });
    group.clear();
    group.add(model);
  });
}
