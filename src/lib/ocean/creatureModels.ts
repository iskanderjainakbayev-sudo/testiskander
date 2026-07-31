import * as THREE from 'three';
import type { Species } from './creatureCatalog';
import { createSeaDragonModel } from './SeaDragonModel';

const skins = new Map<string, THREE.MeshPhysicalMaterial>();
const markings = new Map<string, THREE.MeshBasicMaterial>();
const calmEye = new THREE.MeshBasicMaterial({ color: 0xeaffff });
const hostileEye = new THREE.MeshBasicMaterial({ color: 0xff5b45 });
const toothMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2cf });

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

function addEyes(group: THREE.Group, size: number, hostile: boolean): void {
  const material = hostile ? hostileEye : calmEye;
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(size * 0.105, 9, 6), material);
    eye.position.set(side * size * 0.48, size * 0.16, -size * 1.28);
    group.add(eye);
  }
}

function addFishFins(group: THREE.Group, skin: THREE.Material, size: number): void {
  const tail = new THREE.Mesh(new THREE.ConeGeometry(size * 0.78, size * 1.5, 3), skin);
  tail.name = 'swim-tail';
  tail.rotation.x = Math.PI / 2;
  tail.position.z = size * 2.05;
  group.add(tail);

  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(size * 0.34, size * 0.92, 3), skin);
    fin.name = `swim-fin-${side}`;
    fin.position.set(side * size * 0.66, -size * 0.08, -size * 0.1);
    fin.rotation.z = side * 1.18;
    group.add(fin);
  }
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(size * 0.28, size * 0.88, 3), skin);
  dorsal.position.set(0, size * 0.58, size * 0.15);
  dorsal.rotation.x = -0.2;
  group.add(dorsal);
}

function addPredatorDetails(group: THREE.Group, species: Species): void {
  for (let tooth = -2; tooth <= 2; tooth += 1) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(species.size * 0.055, species.size * 0.28, 5),
      toothMaterial,
    );
    fang.position.set(tooth * species.size * 0.12, -species.size * 0.17, -species.size * 1.48);
    fang.rotation.x = -Math.PI / 2;
    group.add(fang);
  }
}

function createFish(species: Species): THREE.Group {
  const group = new THREE.Group();
  const skin = skinFor(species);
  const body = new THREE.Mesh(new THREE.SphereGeometry(species.size, 18, 12), skin);
  body.scale.set(0.76, 0.54, 1.58);
  group.add(body);
  addFishFins(group, skin, species.size);
  addEyes(group, species.size, species.temperament === 'aggressive');

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
  if (species.temperament === 'aggressive') addPredatorDetails(group, species);
  return group;
}

function createRay(species: Species): THREE.Group {
  const group = new THREE.Group();
  const skin = skinFor(species);
  const body = new THREE.Mesh(new THREE.SphereGeometry(species.size, 18, 10), skin);
  body.scale.set(2.1, 0.18, 1.28);
  group.add(body);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(species.size * 1.05, species.size * 1.8, 3), skin);
    wing.name = `swim-fin-${side}`;
    wing.position.x = side * species.size * 1.35;
    wing.rotation.z = side * Math.PI / 2;
    group.add(wing);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.11, species.size * 3.4, 7), skin);
  tail.name = 'swim-tail';
  tail.rotation.x = Math.PI / 2;
  tail.position.z = species.size * 2.1;
  group.add(tail);
  addEyes(group, species.size, false);
  return group;
}

export function createCreatureModel(species: Species): THREE.Group {
  if (species.isBoss) return createSeaDragonModel(species);
  if (species.name === 'Sunveil Ray' || species.name === 'Night Kite') return createRay(species);
  return createFish(species);
}
