import * as THREE from "three";
import { addCheckpoint, addContainers, addRooftops, addTunnel } from "./districtFeatures";
import { addBox, addCylinder, addSign, type DistrictMaterials } from "./mapPrimitives";
import type { MapDetails } from "./types";

export type DistrictDetails = MapDetails;

export function addDistrictStructures(group: THREE.Group, materials: DistrictMaterials) {
  const details: DistrictDetails = { breakableGlass: [], doors: [] };
  addWarehouse(group, materials, details);
  addApartments(group, materials, details);
  addCheckpoint(group, materials);
  addContainers(group, materials);
  addTunnel(group, materials);
  addRooftops(group, materials);
  return details;
}

function addWarehouse(group: THREE.Group, materials: DistrictMaterials, details: DistrictDetails) {
  const x = -21;
  const z = 15;
  addBox(group, materials.wall, [x, 3.2, z - 8.5], [14, 6.4, 0.6]);
  addBox(group, materials.wall, [x - 6.7, 3.2, z], [0.6, 6.4, 18]);
  addBox(group, materials.wall, [x + 6.7, 3.2, z], [0.6, 6.4, 18]);
  addBox(group, materials.metal, [x, 6.55, z], [14.4, 0.25, 18.4]);
  addBox(group, materials.darkWall, [x - 2.4, 2.1, z + 8.5], [4.6, 4.2, 0.25]);
  addBox(group, materials.metal, [x + 3.4, 1.1, z + 8.5], [5.8, 2.2, 0.25]);
  [-4.1, 0, 4.1].forEach((offset) => addInteriorBay(group, materials, x + offset, z));
  addWindows(group, materials, details, x - 3.4, 3.8, z - 8.14, 3, "warehouse-office-window");
  addSign(group, "NORTHLINE // STORAGE 04", [x, 5.3, z - 8.16]);
}

function addInteriorBay(group: THREE.Group, materials: DistrictMaterials, x: number, z: number) {
  addBox(group, materials.metal, [x, 3.1, z + 2.2], [0.16, 6, 12]);
  addBox(group, materials.metal, [x, 5.5, z + 2.2], [0.28, 0.16, 12]);
  addBox(group, materials.darkWall, [x - 1.3, 0.75, z + 2], [2.3, 1.5, 2.8]);
}

function addApartments(group: THREE.Group, materials: DistrictMaterials, details: DistrictDetails) {
  addBuilding(group, materials, details, [24, 3, 17], [16, 6, 14], "RESIDENCES // 12");
  addBuilding(group, materials, details, [23, 3.5, -8], [14, 7, 17], "SERVICE BLOCK");
  addBuilding(group, materials, details, [0, 2.2, -25], [18, 4.4, 12], "TRANSIT DEPOT");
  addBuilding(group, materials, details, [-6, 2.5, 0], [9, 5, 12], "COURTYARD OFFICE");
}

function addBuilding(
  group: THREE.Group,
  materials: DistrictMaterials,
  details: DistrictDetails,
  position: [number, number, number],
  size: [number, number, number],
  label: string,
) {
  addBox(group, materials.wall, position, size);
  const [x, y, z] = position;
  const [width, height, depth] = size;
  addBox(group, materials.metal, [x, y + height / 2 + 0.1, z], [width + 0.35, 0.2, depth + 0.35]);
  addSign(group, label, [x, y + 0.75, z - depth / 2 - 0.03]);
  addWindows(group, materials, details, x, y + 0.6, z - depth / 2 - 0.04, Math.max(2, Math.floor(width / 3)), label);
  addBalcony(group, materials, x + width / 2 + 0.3, y + 0.4, z);
}

function addWindows(
  group: THREE.Group, materials: DistrictMaterials, details: DistrictDetails,
  x: number, y: number, z: number, count: number, id: string,
) {
  for (let index = 0; index < count; index += 1) {
    const glass = addBox(group, materials.glass, [x + (index - (count - 1) / 2) * 2.1, y, z], [1.35, 1.25, 0.04]);
    glass.userData.breakableGlass = true;
    glass.userData.interactiveId = `${id}-${index}`;
    details.breakableGlass.push(glass);
  }
}

function addBalcony(group: THREE.Group, materials: DistrictMaterials, x: number, y: number, z: number) {
  addBox(group, materials.metal, [x, y + 1.4, z], [1.2, 0.13, 4.1]);
  [z - 1.8, z + 1.8].forEach((railZ) => addCylinder(group, materials.metal, [x + 0.5, y + 2.1, railZ], 0.05, 1.4));
  addBox(group, materials.metal, [x + 0.5, y + 2.75, z], [0.08, 0.08, 4.1]);
}
