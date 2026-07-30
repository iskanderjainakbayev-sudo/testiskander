import * as THREE from 'three';
import { disposeMaterial } from './materials';
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
  const holograms: THREE.Object3D[] = [];
  buildShipStructure(group);
  buildCockpit(group, holograms);
  buildNavTable(group, holograms);
  buildArchiveAndReactor(group, holograms);

  const ambient = new THREE.HemisphereLight(0x8ab0b5, 0x07090b, 0.34);
  group.add(ambient);
  const cockpitLight = new THREE.SpotLight(0xffc38b, 14, 16, 0.75, 0.7, 2);
  cockpitLight.position.set(0, 2.8, -2.5);
  cockpitLight.target.position.set(0, 0, -6);
  cockpitLight.castShadow = true;
  cockpitLight.shadow.mapSize.set(512, 512);
  group.add(cockpitLight, cockpitLight.target);
  const corridorLight = new THREE.PointLight(0x7ac8c7, 5, 14, 2);
  corridorLight.position.set(0, 2.65, 4.5);
  group.add(corridorLight);
  scene.add(group);

  return {
    group,
    update: (time) => {
      holograms.forEach((object, index) => {
        if (object.type === 'Mesh' && index < 2) object.rotation.y += 0.0015 + index * 0.0004;
      });
      corridorLight.intensity = 4.5 + Math.sin(time * 1.7) * 0.35;
    },
    dispose: () => {
      scene.remove(group);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
        meshMaterials.forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach(disposeMaterial);
    },
  };
}
