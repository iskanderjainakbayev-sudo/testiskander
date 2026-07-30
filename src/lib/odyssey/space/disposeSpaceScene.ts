import * as THREE from 'three';

function collectMaterialTextures(
  material: THREE.Material,
  textures: Set<THREE.Texture>,
): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      textures.add(value);
    }
  }

  if (material instanceof THREE.ShaderMaterial) {
    for (const uniform of Object.values(material.uniforms)) {
      if (uniform.value instanceof THREE.Texture) {
        textures.add(uniform.value);
      }
    }
  }
}

export function disposeSpaceScene(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  group.traverse((object) => {
    const renderable = object as THREE.Mesh | THREE.Points | THREE.Line;
    if (renderable.geometry instanceof THREE.BufferGeometry) {
      geometries.add(renderable.geometry);
    }
    const objectMaterial = renderable.material;
    if (Array.isArray(objectMaterial)) {
      objectMaterial.forEach((material) => materials.add(material));
    } else if (objectMaterial instanceof THREE.Material) {
      materials.add(objectMaterial);
    }
  });

  materials.forEach((material) => collectMaterialTextures(material, textures));
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  group.clear();
}
