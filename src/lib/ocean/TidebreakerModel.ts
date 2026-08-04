import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareViewModel } from './weaponModelParts';

export interface TidebreakerRig {
  barrels: THREE.Object3D[];
  chargeRing: THREE.Object3D | null;
  drum: THREE.Object3D | null;
  emitters: THREE.Mesh[];
}

const urls = import.meta.glob('../../../../assets/models/ocean/weapons/tidebreaker-blaster.glb', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const url = Object.values(urls)[0];
const source = url ? new GLTFLoader().loadAsync(url).then(({ scene }) => scene) : null;

export function hydrateTidebreaker(target: THREE.Group, onReady: (rig: TidebreakerRig) => void): void {
  if (!source) return;
  void source.then((loaded) => {
    const model = loaded.clone(true);
    model.scale.setScalar(.43);
    model.traverse((child) => {
      child.renderOrder = 20;
      if (!(child instanceof THREE.Mesh)) return;
      child.material = cloneMaterials(child.material);
      child.castShadow = false;
      child.frustumCulled = false;
    });
    target.add(model);
    prepareViewModel(target);
    onReady({
      barrels: ['barrel-upper', 'barrel-left', 'barrel-right']
        .map((name) => model.getObjectByName(name)).filter(isObject),
      chargeRing: model.getObjectByName('charge-ring') ?? null,
      drum: model.getObjectByName('energy-drum') ?? null,
      emitters: findEmitters(model),
    });
  });
}

function findEmitters(model: THREE.Object3D): THREE.Mesh[] {
  const emitters: THREE.Mesh[] = [];
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name.endsWith('-emitter')) emitters.push(child);
  });
  return emitters;
}

function cloneMaterials(material: THREE.Material | THREE.Material[]): THREE.Material | THREE.Material[] {
  return Array.isArray(material) ? material.map((item) => item.clone()) : material.clone();
}

function isObject(object: THREE.Object3D | undefined): object is THREE.Object3D {
  return object !== undefined;
}
