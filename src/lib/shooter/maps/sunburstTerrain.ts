import * as THREE from "three";
import { addBox } from "./mapPrimitives";

export type IslandMaterials = {
  grass: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  coral: THREE.MeshStandardMaterial;
  cream: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  water: THREE.MeshPhysicalMaterial;
  sun: THREE.MeshStandardMaterial;
};

export function createIslandMaterials(): IslandMaterials {
  return {
    grass: new THREE.MeshStandardMaterial({ color: 0x58a957, roughness: 0.8, metalness: 0.05 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x84929a, roughness: 0.7, metalness: 0.12 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x94633e, roughness: 0.6, metalness: 0.08 }),
    coral: new THREE.MeshStandardMaterial({ color: 0xf27b5f, roughness: 0.52, metalness: 0.1 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xffe7ad, roughness: 0.6, metalness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x91ebff, roughness: 0.04, metalness: 0.08, transparent: true, opacity: 0.58, clearcoat: 0.9 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x38bde8, roughness: 0.08, metalness: 0.18, transparent: true, opacity: 0.86, clearcoat: 1 }),
    sun: new THREE.MeshStandardMaterial({ color: 0xffdf68, emissive: 0xffba38, emissiveIntensity: 0.55, roughness: 0.35 }),
  };
}

export function addIslandTerrain(group: THREE.Group, materials: IslandMaterials) {
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(230, 230), materials.water);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.25;
  group.add(ocean);
  const island = new THREE.Mesh(new THREE.CircleGeometry(88, 96), materials.grass);
  island.rotation.x = -Math.PI / 2;
  island.receiveShadow = true;
  group.add(island);
  addRoads(group, materials);
  addRidges(group, materials);
  addShinyPuddles(group, materials);
}

function addRoads(group: THREE.Group, materials: IslandMaterials) {
  addBox(group, materials.cream, [0, 0.035, 8], [7, 0.07, 150]);
  addBox(group, materials.cream, [8, 0.04, 2], [150, 0.07, 6]);
  for (let index = -5; index <= 5; index += 1) addBox(group, materials.sun, [index * 5.2, 0.09, 8], [2.2, 0.03, 0.22]);
}

function addRidges(group: THREE.Group, materials: IslandMaterials) {
  [[-32, -16, 5], [31, 23, 4], [-24, 26, 7], [28, -27, 6], [-64, -45, 11], [62, 50, 10], [-71, 31, 9], [69, -51, 12]].forEach(([x, z, size]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(size, size * 1.25, 16), materials.grass);
    hill.position.set(x, size * 0.36, z);
    hill.castShadow = true;
    hill.receiveShadow = true;
    group.add(hill);
    for (let tree = 0; tree < 3; tree += 1) addPalm(group, materials, x + tree * 1.5 - 1.5, z + (tree % 2) * 1.8);
  });
}

function addPalm(group: THREE.Group, materials: IslandMaterials, x: number, z: number) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.7, 8), materials.wood);
  trunk.position.set(x, 1.35, z);
  group.add(trunk);
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.1, 6), materials.grass);
  leaves.position.set(x, 3, z);
  leaves.rotation.x = Math.PI;
  group.add(leaves);
}

function addShinyPuddles(group: THREE.Group, materials: IslandMaterials) {
  [[-9, 7, 3, 1], [13, -7, 2.4, 1.2], [25, 16, 3.4, 1.3], [-46, 42, 5, 1.6], [45, -44, 4.2, 1.3]].forEach(([x, z, width, depth]) => {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(width, 24), materials.water);
    puddle.scale.z = depth / width;
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.06, z);
    group.add(puddle);
  });
}
