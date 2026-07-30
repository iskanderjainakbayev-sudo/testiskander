import * as THREE from "three";
import { addBox, addCylinder } from "./mapPrimitives";

export type SiroccoMaterials = {
  sand: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  safety: THREE.MeshStandardMaterial;
  lamp: THREE.MeshStandardMaterial;
};

export function createSiroccoMaterials(): SiroccoMaterials {
  return {
    sand: new THREE.MeshStandardMaterial({ color: 0xb47b45, roughness: 0.96 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x7d6d5d, roughness: 0.87 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x536068, roughness: 0.72, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x273238, roughness: 0.38, metalness: 0.82 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xa8e9f2, roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.56 }),
    safety: new THREE.MeshStandardMaterial({ color: 0xf2ad3d, roughness: 0.48, metalness: 0.45 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffe09a, emissive: 0xe8782f, emissiveIntensity: 1.7 }),
  };
}

export function addSiroccoTerrain(group: THREE.Group, materials: SiroccoMaterials) {
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), materials.sand);
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  group.add(sand);
  addBox(group, materials.concrete, [0, 0.06, 8], [18, 0.12, 122]);
  addBox(group, materials.concrete, [-15, 0.07, -19], [48, 0.13, 9]);
  addBox(group, materials.concrete, [31, 0.08, -29], [9, 0.12, 47]);
  [[-61, -54, 9], [-56, 35, 7], [53, 45, 8], [59, -52, 10], [-3, 58, 6]].forEach(([x, z, radius]) => {
    const dune = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * 0.55, 14), materials.sand);
    dune.position.set(x, radius * 0.16, z);
    dune.scale.z = 1.7;
    group.add(dune);
  });
  [-51, -17, 17, 51].forEach((x) => addCylinder(group, materials.safety, [x, 0.55, 51], 0.12, 1.1));
}
