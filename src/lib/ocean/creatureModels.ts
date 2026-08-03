import * as THREE from 'three';
import type { Species } from './creatureCatalog';
import { replaceWithBlenderFish } from './FishModel';
import { createSeaDragonModel } from './SeaDragonModel';
import { createProceduralBody } from './proceduralCreatureModels';

const skins = new Map<string, THREE.MeshPhysicalMaterial>();
const markings = new Map<string, THREE.MeshBasicMaterial>();

function skinFor(species: Species): THREE.MeshPhysicalMaterial {
  const cached = skins.get(species.name);
  if (cached) return cached;
  const material = new THREE.MeshPhysicalMaterial({
    color: species.color,
    emissive: species.glow,
    emissiveIntensity: 1.05,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.48,
    clearcoatRoughness: 0.28,
  });
  skins.set(species.name, material);
  return material;
}

function addMarkings(group: THREE.Group, species: Species): void {
  let stripeMaterial = markings.get(species.name);
  if (!stripeMaterial) {
    stripeMaterial = new THREE.MeshBasicMaterial({
      color: species.glow,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
    });
    markings.set(species.name, stripeMaterial);
  }
  for (const offset of [-0.35, 0.25]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(species.size * 0.68, species.size * 0.035, 5, 18), stripeMaterial);
    stripe.scale.y = 0.72;
    stripe.position.z = species.size * offset;
    group.add(stripe);
  }
}

export function createCreatureModel(species: Species): THREE.Group {
  if (species.isBoss) return createSeaDragonModel(species);
  const root = new THREE.Group();
  const visual = createProceduralBody(species, skinFor(species));
  visual.name = 'creature-visual';
  addMarkings(visual, species);
  replaceWithBlenderFish(visual, species);
  root.add(visual);
  return root;
}
