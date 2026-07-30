import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Triple = readonly [number, number, number];

const ORIGIN: Triple = [0, 0, 0];
const UNIT: Triple = [1, 1, 1];

export function place(
  geometry: THREE.BufferGeometry,
  position: Triple = ORIGIN,
  rotation: Triple = ORIGIN,
  scale: Triple = UNIT,
): THREE.BufferGeometry {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

export function mergeParts(
  parts: THREE.BufferGeometry[],
  name: string,
): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error(`Could not merge ${name} geometry`);
  merged.name = name;
  merged.computeBoundingSphere();
  return merged;
}

export function capsule(
  radius: number,
  length: number,
  position: Triple = ORIGIN,
  scale: Triple = UNIT,
): THREE.BufferGeometry {
  return place(
    new THREE.CapsuleGeometry(radius, length, 6, 12),
    position,
    [Math.PI / 2, 0, 0],
    scale,
  );
}

export function ellipsoid(
  radius: number,
  position: Triple,
  scale: Triple,
): THREE.BufferGeometry {
  return place(new THREE.SphereGeometry(radius, 20, 12), position, ORIGIN, scale);
}

export function torus(
  radius: number,
  tube: number,
  position: Triple,
  rotation: Triple = ORIGIN,
  arc = Math.PI * 2,
): THREE.BufferGeometry {
  return place(
    new THREE.TorusGeometry(radius, tube, 8, Math.max(16, Math.round(32 * arc / (Math.PI * 2))), arc),
    position,
    rotation,
  );
}

export function cone(
  radius: number,
  length: number,
  position: Triple,
  rotation: Triple = [Math.PI / 2, 0, 0],
  scale: Triple = UNIT,
): THREE.BufferGeometry {
  return place(
    new THREE.ConeGeometry(radius, length, 16, 3, false),
    position,
    rotation,
    scale,
  );
}

export interface LoftRing {
  z: number;
  y: number;
  width: number;
  height: number;
}

export function loft(rings: readonly LoftRing[], segments = 16): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring, ringIndex) => {
    for (let side = 0; side < segments; side += 1) {
      const angle = side / segments * Math.PI * 2;
      positions.push(
        Math.cos(angle) * ring.width,
        ring.y + Math.sin(angle) * ring.height,
        ring.z,
      );
      uvs.push(side / segments, ringIndex / (rings.length - 1));
    }
  });
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < segments; side += 1) {
      const next = (side + 1) % segments;
      const a = ring * segments + side;
      const b = ring * segments + next;
      const c = (ring + 1) * segments + next;
      const d = (ring + 1) * segments + side;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function dish(
  radius: number,
  depth: number,
  position: Triple,
  rotation: Triple = ORIGIN,
): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = [];
  for (let index = 0; index <= 8; index += 1) {
    const r = radius * index / 8;
    profile.push(new THREE.Vector2(r, -depth * (r / radius) ** 2));
  }
  return place(new THREE.LatheGeometry(profile, 24), position, [
    rotation[0] + Math.PI / 2,
    rotation[1],
    rotation[2],
  ]);
}
