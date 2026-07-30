import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function batchInteriorGeometry(
  group: THREE.Group,
  dynamicObjects: ReadonlySet<THREE.Object3D>,
): void {
  group.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh) return;
    if (dynamicObjects.has(object) || Array.isArray(object.material)) return;
    if (object.material.transparent || object.userData.noBatch === true) return;
    const batch = batches.get(object.material) ?? [];
    batch.push(object);
    batches.set(object.material, batch);
  });

  batches.forEach((meshes, material) => {
    if (meshes.length < 2) return;
    const transformed = meshes.map((mesh) => {
      const geometry = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone();
      Object.keys(geometry.attributes).forEach((attribute) => {
        if (!['position', 'normal', 'uv'].includes(attribute)) geometry.deleteAttribute(attribute);
      });
      geometry.applyMatrix4(mesh.matrixWorld);
      return geometry;
    });
    const merged = mergeGeometries(transformed, false);
    transformed.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    const batch = new THREE.Mesh(merged, material);
    batch.name = `LYRA static batch / ${material.name || material.type}`;
    batch.castShadow = true;
    batch.receiveShadow = true;
    meshes.forEach((mesh) => {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
    });
    group.add(batch);
  });
}
