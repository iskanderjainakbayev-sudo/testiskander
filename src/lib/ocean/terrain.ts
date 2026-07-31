import * as THREE from 'three';

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function floorAt(x: number, z: number): number {
  const radius = Math.hypot(x, z - 8);
  const reef = -17 - Math.sin(x * 0.13) * 2.1 - Math.cos(z * 0.17) * 1.4;
  const kelp = THREE.MathUtils.lerp(reef, -50, smoothstep(28, 62, radius));
  const abyss = THREE.MathUtils.lerp(kelp, -122, smoothstep(82, 122, radius));
  return abyss - Math.sin((x + z) * 0.08) * 3.2;
}

export function biomeAtDepth(depth: number) {
  if (depth < 28) return 'Safe Reef' as const;
  if (depth < 78) return 'Lumen Kelp' as const;
  return 'The Abyss' as const;
}

export function createTerrain(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(310, 310, 64, 64);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index) + 8;
    positions.setY(index, floorAt(x, z));
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x174f55,
    roughness: 0.92,
    metalness: 0.04,
    vertexColors: false,
  });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.z = 8;
  return terrain;
}

export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

