import * as THREE from 'three';
import type { Species } from './creatureCatalog';

function shaderColor(color: number): string {
  const value = new THREE.Color(color);
  return `vec3(${value.r.toFixed(4)}, ${value.g.toFixed(4)}, ${value.b.toFixed(4)})`;
}

function enhance(material: THREE.MeshStandardMaterial, species: Species): THREE.MeshStandardMaterial {
  const result = material.clone();
  const accent = shaderColor(species.palette[2]);
  const glow = shaderColor(species.glow);
  result.roughness = THREE.MathUtils.clamp(result.roughness * 0.86, 0.28, 0.78);
  result.metalness = Math.min(result.metalness, 0.16);
  result.envMapIntensity = 1.12;
  result.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vCreatureLocal;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCreatureLocal = position;');
    shader.fragmentShader = `varying vec3 vCreatureLocal;\n${shader.fragmentShader}`
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 creatureCell = floor(vCreatureLocal * vec3(8.0, 11.0, 9.0));
        float creatureSpeckle = fract(sin(dot(creatureCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float creatureBand = sin(vCreatureLocal.z * 9.5 + sin(vCreatureLocal.y * 7.0) * 1.7) * .5 + .5;
        float creatureScale = smoothstep(.42, .74, creatureSpeckle * .56 + creatureBand * .44);
        diffuseColor.rgb *= mix(.76, 1.08, creatureSpeckle);
        diffuseColor.rgb = mix(diffuseColor.rgb, ${accent}, creatureScale * .22);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor *= .82 + creatureSpeckle * .2;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += ${glow} * pow(creatureScale, 5.0) * .12;`,
      );
  };
  result.customProgramCacheKey = () => `ocean-creature-${species.assetId}`;
  return result;
}

function shouldEnhance(name: string): boolean {
  return !/(eye|pupil|tooth|teeth|mouth|light|lure|glow)/i.test(name);
}

export function enhanceCreatureMaterials(model: THREE.Object3D, species: Species): void {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !shouldEnhance(child.name)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const enhanced = materials.map((material) => material instanceof THREE.MeshStandardMaterial
      ? enhance(material, species) : material);
    child.material = Array.isArray(child.material) ? enhanced : enhanced[0];
  });
}
