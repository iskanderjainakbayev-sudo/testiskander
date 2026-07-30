import * as THREE from 'three';

type Renderable = THREE.Mesh | THREE.Line | THREE.Points;

function isRenderable(object: THREE.Object3D): object is Renderable {
  return object instanceof THREE.Mesh
    || object instanceof THREE.Line
    || object instanceof THREE.Points;
}

export function disposeTraffic(
  root: THREE.Group,
  textures: readonly THREE.Texture[],
): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!isRenderable(object)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  root.clear();
}
