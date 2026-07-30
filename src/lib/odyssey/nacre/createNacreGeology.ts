import * as THREE from 'three';

const HEIGHTS = [0, 0.12, 0.29, 0.47, 0.66, 0.84, 1];
const RADII = [0.88, 1, 0.86, 0.72, 0.56, 0.33, 0.035];

export function createErodedMountainGeometry(): THREE.BufferGeometry {
  const segments = 18;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring < HEIGHTS.length; ring += 1) {
    const ringTwist = ring * 0.087;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2 + ringTwist;
      const erosion = 1
        + Math.sin(angle * 3 + ring * 0.71) * 0.105
        + Math.sin(angle * 7 - ring * 0.43) * 0.052;
      const radius = RADII[ring] * erosion;
      positions.push(
        Math.cos(angle) * radius,
        HEIGHTS[ring],
        Math.sin(angle) * radius,
      );
    }
  }
  for (let ring = 0; ring < HEIGHTS.length - 1; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const lower = ring * segments + segment;
      const lowerNext = ring * segments + next;
      const upper = (ring + 1) * segments + segment;
      const upperNext = (ring + 1) * segments + next;
      indices.push(lower, upper, lowerNext, lowerNext, upper, upperNext);
    }
  }
  const top = positions.length / 3;
  const topRing = (HEIGHTS.length - 1) * segments;
  positions.push(0, 1.012, 0);
  for (let segment = 0; segment < segments; segment += 1) {
    indices.push(topRing + segment, top, topRing + (segment + 1) % segments);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
