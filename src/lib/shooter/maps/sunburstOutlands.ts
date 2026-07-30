import * as THREE from "three";
import { addBox, addCylinder, addSign } from "./mapPrimitives";
import { addIslandDoor, addIslandLadder } from "./sunburstStructures";
import type { IslandMaterials } from "./sunburstTerrain";
import type { DistrictDetails } from "./districtStructures";

export function addIslandOutlands(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails) {
  addLighthouse(group, materials, details);
  addSolarDepot(group, materials, details);
  addCliffCamp(group, materials);
  addSkybridge(group, materials);
}

function addLighthouse(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails) {
  addCylinder(group, materials.cream, [-58, 4.25, -36], 4.8, 8.5);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 4, 10), materials.coral);
  roof.position.set(-58, 10.5, -36);
  roof.castShadow = true;
  group.add(roof);
  addCylinder(group, materials.glass, [-58, 9.6, -36], 2.2, 1.5);
  addIslandDoor(group, materials, details, -58, -40.88);
  addIslandLadder(group, materials, -53.2, -36, 8.5);
  addSign(group, "SEAGLASS LIGHT", [-58, 4.1, -40.9]);
}

function addSolarDepot(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails) {
  addBox(group, materials.cream, [54, 2.75, 33], [18, 5.5, 14]);
  addBox(group, materials.coral, [54, 5.6, 33], [18.4, 0.2, 14.4]);
  addIslandDoor(group, materials, details, 54, 25.86);
  addIslandLadder(group, materials, 45, 33, 5.5);
  for (let row = -2; row <= 2; row += 1) {
    const panel = addBox(group, materials.glass, [54 + row * 3.1, 5.95, 33], [2.7, 0.08, 5.6]);
    panel.rotation.x = -0.22;
  }
  addSign(group, "SOLAR DEPOT // 07", [54, 3.8, 25.85]);
}

function addCliffCamp(group: THREE.Group, materials: IslandMaterials) {
  [[-59, 47], [-45, 53], [-34, 44]].forEach(([x, z], index) => {
    addBox(group, index % 2 ? materials.coral : materials.wood, [x, 1.45, z], [5, 2.9, 4.6]);
    const tent = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.5, 4), materials.cream);
    tent.position.set(x, 4.15, z);
    tent.rotation.y = Math.PI / 4;
    group.add(tent);
  });
  addSign(group, "CLOUD CAMP", [-46, 5.6, 42]);
}

function addSkybridge(group: THREE.Group, materials: IslandMaterials) {
  addBox(group, materials.wood, [-4, 2.8, 50], [46, 0.35, 4.2]);
  [-25, -5, 15].forEach((x) => {
    addCylinder(group, materials.stone, [x, 1.35, 50], 0.55, 2.7);
    addBox(group, materials.sun, [x, 3.8, 50], [0.15, 1.3, 4.1]);
  });
  addSign(group, "HIGHWIND BRIDGE", [-5, 5.1, 47.85]);
}
