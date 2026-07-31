import * as THREE from 'three';
import type { Species } from './creatureCatalog';

export const calmEye = new THREE.MeshBasicMaterial({ color: 0xeaffff });
export const hostileEye = new THREE.MeshBasicMaterial({ color: 0xff5b45 });
export const toothMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2cf });

export function ellipsoid(
  radius: number,
  scale: [number, number, number],
  material: THREE.Material,
  segments = 14,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, 9), material);
  mesh.scale.set(...scale);
  return mesh;
}

export function cone(
  radius: number,
  height: number,
  material: THREE.Material,
  sides = 5,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), material);
}

export function addEyes(group: THREE.Group, species: Species, spread = .48, z = -1.15): void {
  const material = species.temperament === 'aggressive' ? hostileEye : calmEye;
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(species.size * .105, 8, 6), material);
    eye.position.set(side * species.size * spread, species.size * .16, species.size * z);
    group.add(eye);
  }
}

export function addFins(group: THREE.Group, species: Species, material: THREE.Material): void {
  const { size, silhouette } = species;
  const tail = cone(size * .72 * silhouette.height, size * 1.35, material, 3);
  tail.name = 'swim-tail';
  tail.rotation.x = Math.PI / 2;
  tail.position.z = size * silhouette.length;
  group.add(tail);
  for (const side of [-1, 1]) {
    const fin = cone(size * .3, size * (.72 + silhouette.crest * .4), material, 3);
    fin.name = `swim-fin-${side}`;
    fin.position.set(side * size * silhouette.width * .62, -size * .04, 0);
    fin.rotation.z = side * 1.18;
    group.add(fin);
  }
}

export function addCrest(group: THREE.Group, species: Species, material: THREE.Material): void {
  const count = 1 + Math.round(species.silhouette.crest * 4);
  for (let index = 0; index < count; index += 1) {
    const spine = cone(species.size * .12, species.size * (.28 + species.silhouette.crest * .5), material, 4);
    spine.position.set(0, species.size * .55, species.size * (-.45 + index * .28));
    spine.rotation.x = Math.PI;
    group.add(spine);
  }
}

export function addTeeth(group: THREE.Group, species: Species): void {
  if (species.temperament !== 'aggressive') return;
  for (let tooth = -2; tooth <= 2; tooth += 1) {
    const fang = cone(species.size * .055, species.size * .28, toothMaterial);
    fang.position.set(tooth * species.size * .12, -species.size * .17, -species.size * 1.35);
    fang.rotation.x = -Math.PI / 2;
    group.add(fang);
  }
}
