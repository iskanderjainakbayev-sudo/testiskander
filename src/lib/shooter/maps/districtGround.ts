import * as THREE from "three";
import { addBox, type DistrictMaterials } from "./mapPrimitives";

export function addDistrictGround(group: THREE.Group, materials: DistrictMaterials) {
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(88, 88),
    new THREE.MeshStandardMaterial({ color: 0x131a1e, roughness: 0.86, metalness: 0.18 }),
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.receiveShadow = true;
  group.add(asphalt);
  addRoadMarkings(group, materials);
  addCourtyard(group, materials);
  addParkingLot(group, materials);
}

function addRoadMarkings(group: THREE.Group, materials: DistrictMaterials) {
  for (let index = -5; index <= 5; index += 1) {
    addBox(group, materials.safety, [index * 5.3, 0.025, 2], [2.2, 0.04, 0.18]);
  }
  [-39, 39].forEach((edge) => addBox(group, materials.concrete, [edge, 0.24, 0], [1.2, 0.48, 82]));
  [-39, 39].forEach((edge) => addBox(group, materials.concrete, [0, 0.24, edge], [82, 0.48, 1.2]));
}

function addCourtyard(group: THREE.Group, materials: DistrictMaterials) {
  addBox(group, materials.concrete, [0, 0.1, 0], [19, 0.2, 15]);
  [[-7, -5], [7, -5], [-7, 5], [7, 5]].forEach(([x, z]) => {
    addBox(group, materials.darkWall, [x, 0.65, z], [2.8, 1.1, 1.2]);
    addBox(group, materials.lamp, [x, 1.28, z], [2.9, 0.08, 1.3]);
  });
}

function addParkingLot(group: THREE.Group, materials: DistrictMaterials) {
  for (let index = 0; index < 7; index += 1) {
    const x = -33 + index * 3.3;
    addBox(group, materials.metal, [x, 0.12, 29], [0.1, 0.08, 5]);
    addBox(group, materials.metal, [x + 1.4, 0.12, 29], [0.1, 0.08, 5]);
  }
  addBox(group, materials.darkWall, [-26, 0.85, 28], [4.2, 1.5, 1.9]);
  addBox(group, materials.metal, [-26, 1.8, 28], [4.45, 0.12, 2.1]);
}
