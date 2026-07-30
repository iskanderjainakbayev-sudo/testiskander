import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import { createScreenMaterial } from './materials';
import {
  roundedBox,
  type VectorTuple,
} from './interiorGeometry';

export function addScreenPanel(
  group: THREE.Object3D,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
  title: string,
  size: readonly [number, number],
  position: VectorTuple,
  rotation: VectorTuple = [0, 0, 0],
  accent = '#eab16d',
): THREE.Mesh {
  const assembly = new THREE.Group();
  assembly.position.set(...position);
  assembly.rotation.set(...rotation);
  const bezel = roundedBox(
    [size[0] + 0.17, size[1] + 0.15, 0.09],
    materials.frame,
    0.035,
  );
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    createScreenMaterial(title, accent),
  );
  screen.position.z = 0.051;
  assembly.add(bezel, screen);
  group.add(assembly);
  holograms.push(screen);
  return screen;
}

export function createHologramMaterial(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    wireframe: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function addRing(
  group: THREE.Object3D,
  radius: number,
  tube: number,
  material: THREE.Material,
  position: VectorTuple,
  rotation: VectorTuple,
): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 10, 64),
    material,
  );
  ring.position.set(...position);
  ring.rotation.set(...rotation);
  ring.castShadow = true;
  group.add(ring);
  return ring;
}
