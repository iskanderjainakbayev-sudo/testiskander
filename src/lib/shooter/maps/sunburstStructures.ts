import * as THREE from "three";
import { addBox, addCylinder, addSign } from "./mapPrimitives";
import type { DistrictDetails } from "./districtStructures";
import type { IslandMaterials } from "./sunburstTerrain";

export function addIslandStructures(group: THREE.Group, materials: IslandMaterials) {
  const details: DistrictDetails = { breakableGlass: [], doors: [] };
  addMarket(group, materials, details);
  addWindmill(group, materials);
  addBoathouses(group, materials, details);
  addPlaza(group, materials);
  addLootCover(group, materials);
  return details;
}

function addMarket(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails) {
  addHouse(group, materials, details, [20, 2.25, -8], [16, 4.5, 14], "SUNBEAM MARKET");
  addHouse(group, materials, details, [2, 2.25, -23], [18, 4.5, 10], "TIDELINE GARAGE");
  addBox(group, materials.coral, [20, 4.65, -8], [16.4, 0.28, 14.4]);
  addBox(group, materials.coral, [2, 4.65, -23], [18.4, 0.28, 10.4]);
  addIslandLadder(group, materials, 11.2, -1.7, 4.5);
}

function addHouse(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails, position: [number, number, number], size: [number, number, number], sign: string) {
  const [x, y, z] = position;
  const [width, height, depth] = size;
  const front = z - depth / 2;
  addBox(group, materials.cream, [x, y, z + depth / 2], [width, height, 0.32]);
  addBox(group, materials.cream, [x - width / 2, y, z], [0.32, height, depth]);
  addBox(group, materials.cream, [x + width / 2, y, z], [0.32, height, depth]);
  addBox(group, materials.cream, [x - (width + 2.3) / 4, y, front], [(width - 2.3) / 2, height, 0.32]);
  addBox(group, materials.cream, [x + (width + 2.3) / 4, y, front], [(width - 2.3) / 2, height, 0.32]);
  addBox(group, materials.coral, [x, y + height / 2, z], [width + 0.4, 0.25, depth + 0.4]);
  addBox(group, materials.wood, [x + width / 4, 0.75, z + depth / 4], [width / 3, 1.5, 1.2]);
  addSign(group, sign, [x, y + 0.55, z - depth / 2 - 0.05]);
  for (let index = 0; index < Math.floor(width / 3); index += 1) {
    const glass = addBox(group, materials.glass, [x + (index - 2) * 2.35, y + 0.45, z - depth / 2 - 0.18], [1.45, 1.25, 0.05]);
    glass.userData.breakableGlass = true;
    details.breakableGlass.push(glass);
  }
  addIslandDoor(group, materials, details, x, z - depth / 2 - 0.14);
}

function addWindmill(group: THREE.Group, materials: IslandMaterials) {
  addCylinder(group, materials.cream, [-23, 3.1, 10], 2.4, 6.2);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 2.2, 8), materials.coral);
  roof.position.set(-23, 7.3, 10);
  group.add(roof);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), materials.sun);
  hub.position.set(-23, 5.6, 7.55);
  group.add(hub);
  for (let blade = 0; blade < 4; blade += 1) {
    const arm = addBox(group, materials.cream, [-23, 5.6, 7.45], [0.35, 3.3, 0.1]);
    arm.rotation.z = blade * Math.PI / 2 + 0.3;
  }
  addSign(group, "WINDWARD RIDGE", [-23, 3.2, 7.48]);
  addIslandLadder(group, materials, -20.4, 10, 6.5);
}

function addBoathouses(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails) {
  addHouse(group, materials, details, [-22, 1.7, -17], [8, 3.4, 7], "COVE HOUSE");
  addHouse(group, materials, details, [-31, 1.55, -11], [7, 3.1, 6], "FISHERS");
  [-25, -19].forEach((x) => addBox(group, materials.wood, [x, 0.23, -23], [3.2, 0.16, 8]));
  addBox(group, materials.water, [-25, 0.01, -27], [13, 0.04, 7]);
}

function addPlaza(group: THREE.Group, materials: IslandMaterials) {
  addCylinder(group, materials.stone, [0, 0.42, 2], 5.6, 0.8);
  addCylinder(group, materials.water, [0, 0.86, 2], 3.8, 0.14);
  addCylinder(group, materials.sun, [0, 1.15, 2], 0.38, 1.3);
  for (let index = 0; index < 6; index += 1) {
    const bench = addBox(group, materials.wood, [Math.sin(index) * 7, 0.55, 2 + Math.cos(index) * 7], [2.3, 0.45, 0.65]);
    bench.rotation.y = index;
  }
  addSign(group, "BRIGHTWATER BASIN", [0, 3.5, -3.9]);
}

function addLootCover(group: THREE.Group, materials: IslandMaterials) {
  [[-9, 17], [-10, -6], [10, 15], [31, 10], [27, -28]].forEach(([x, z], index) => {
    const crate = addBox(group, index % 2 ? materials.coral : materials.wood, [x, 1.15, z], [2.3, 2.3, 2.3]);
    crate.rotation.y = index * 0.4;
    addBox(group, materials.sun, [x, 2.37, z], [2.45, 0.1, 2.45]);
  });
}

export function addIslandDoor(group: THREE.Group, materials: IslandMaterials, details: DistrictDetails, x: number, z: number) {
  const pivot = new THREE.Group();
  pivot.position.set(x - 1.15, 0, z);
  const leaf = addBox(pivot, materials.wood, [1.15, 1.25, 0], [2.3, 2.5, 0.16]);
  leaf.userData.door = true;
  group.add(pivot);
  details.doors.push({
    pivot,
    closedRotation: 0,
    openRotation: -1.42,
    open: false,
    collision: { x, z, width: 2.3, depth: 0.55, height: 2.5 },
  });
}

export function addIslandLadder(group: THREE.Group, materials: IslandMaterials, x: number, z: number, height: number) {
  [-0.32, 0.32].forEach((offset) => addCylinder(group, materials.wood, [x + offset, height / 2, z], 0.05, height));
  for (let rung = 0.45; rung < height; rung += 0.45) addBox(group, materials.cream, [x, rung, z], [0.72, 0.07, 0.09]);
}
