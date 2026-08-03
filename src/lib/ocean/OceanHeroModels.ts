import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type HeroAsset = 'damaged-lifepod' | 'nereid-micro-sub';

const urls = import.meta.glob('../../../../assets/models/ocean/hero/*.glb', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const loader = new GLTFLoader();
const models = new Map<HeroAsset, Promise<THREE.Group>>();

function load(asset: HeroAsset): Promise<THREE.Group> | null {
  const cached = models.get(asset);
  if (cached) return cached;
  const url = Object.entries(urls).find(([path]) => path.endsWith(`/${asset}.glb`))?.[1];
  if (!url) return null;
  const pending = loader.loadAsync(url).then(({ scene }) => scene);
  models.set(asset, pending);
  return pending;
}

export function hydrateOceanHero(target: THREE.Group, asset: HeroAsset): void {
  const pending = load(asset);
  if (!pending) return;
  void pending.then((source) => {
    const model = source.clone(true);
    model.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
    });
    target.clear();
    target.add(model);
  });
}
