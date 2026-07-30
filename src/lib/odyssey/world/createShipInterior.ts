import * as THREE from 'three';
import { batchInteriorGeometry } from './interiorBatching';
import { buildInteriorLighting } from './interiorLighting';
import { createInteriorMaterials, disposeMaterial } from './materials';
import { buildShipStructure } from './shipStructure';
import { buildArchiveAndReactor, buildCockpit, buildNavTable } from './shipStations';

export interface ShipInterior {
  group: THREE.Group;
  update: (time: number) => void;
  dispose: () => void;
}

export function createShipInterior(scene: THREE.Scene): ShipInterior {
  const group = new THREE.Group();
  group.name = 'Lyra interior';
  const materials = createInteriorMaterials();
  const holograms: THREE.Object3D[] = [];
  buildShipStructure(group, materials);
  buildCockpit(group, holograms, materials);
  buildNavTable(group, holograms, materials);
  const reactorLight = buildArchiveAndReactor(group, holograms, materials);
  batchInteriorGeometry(group, new Set(holograms));
  const lighting = buildInteriorLighting(group, reactorLight);
  scene.add(group);

  return {
    group,
    update: (time) => {
      holograms.forEach((object) => {
        const spinY = object.userData.spinY as number | undefined;
        const spinZ = object.userData.spinZ as number | undefined;
        const baseZ = object.userData.baseZ as number | undefined;
        if (spinY) object.rotation.y = time * spinY;
        if (spinZ) object.rotation.z = (baseZ ?? 0) + time * spinZ;
      });
      lighting.update(time);
    },
    dispose: () => disposeInterior(scene, group),
  };
}

function disposeInterior(scene: THREE.Scene, group: THREE.Group): void {
  scene.remove(group);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => disposeMaterial(material, textures));
}
