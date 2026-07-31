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
  const outerShelf = THREE.MathUtils.lerp(abyss, -178, smoothstep(155, 250, radius));
  const ridges = Math.sin((x + z) * 0.08) * 3.2 + Math.sin(x * 0.031) * Math.cos(z * 0.027) * 12;
  const trench = Math.max(0, Math.cos(Math.atan2(z - 8, x) * 3.5)) * smoothstep(165, 265, radius) * 28;
  return outerShelf - ridges - trench;
}

export function createTerrain(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> {
  const geometry = new THREE.PlaneGeometry(620, 620, 96, 96);
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
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uOceanTime = { value: 0 };
    shader.vertexShader = `varying vec3 vOceanWorld;\n${shader.vertexShader}`
      .replace(
        '#include <project_vertex>',
        'vOceanWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>',
      );
    shader.fragmentShader = `varying vec3 vOceanWorld;\nuniform float uOceanTime;\n${shader.fragmentShader}`
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float causticWave = max(0.0, sin(vOceanWorld.x * 1.7 + uOceanTime * 1.8)
          * cos(vOceanWorld.z * 1.35 - uOceanTime * 1.3));
        float causticDepth = clamp((vOceanWorld.y + 105.0) / 100.0, 0.0, 1.0);
        totalEmissiveRadiance += vec3(0.04, 0.3, 0.27) * pow(causticWave, 5.0) * causticDepth;`,
      );
    material.userData.causticShader = shader;
  };
  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.z = 8;
  return terrain;
}

export function updateTerrainCaustics(
  terrain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>,
  time: number,
): void {
  const shader = terrain.material.userData.causticShader as
    | { uniforms: { uOceanTime: { value: number } } }
    | undefined;
  if (shader) shader.uniforms.uOceanTime.value = time;
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
