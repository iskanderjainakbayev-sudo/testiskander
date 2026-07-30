import * as THREE from "three";
import { addBox, addCylinder, addSign, type DistrictMaterials } from "./mapPrimitives";

export function addCheckpoint(group: THREE.Group, materials: DistrictMaterials) {
  addBox(group, materials.darkWall, [0, 1.45, 34], [8.6, 2.9, 0.35]);
  addBox(group, materials.metal, [-5.1, 1.65, 31.5], [2.8, 3.3, 3.8]);
  addBox(group, materials.glass, [-5.1, 2.15, 29.58], [1.7, 1.25, 0.04]);
  addSign(group, "CORDON // CHECKPOINT", [0, 3.55, 33.78]);
  [-3.2, 3.2].forEach((x) => {
    addCylinder(group, materials.safety, [x, 0.78, 30.1], 0.28, 1.55);
    addBox(group, materials.safety, [x, 1.4, 29.7], [0.12, 0.12, 2.8]);
  });
  for (let index = 0; index < 5; index += 1) addSandbag(group, materials, -1.6 + index * 0.8, 31.5);
}

export function addContainers(group: THREE.Group, materials: DistrictMaterials) {
  const containers: [number, number, number, number][] = [
    [-26, -20, 0, 0], [-20, -20, 0, 0.1], [-28, -15, 1.3, -0.05], [13, 12, 0, 0.03],
  ];
  containers.forEach(([x, z, y, tilt], index) => {
    const container = addBox(group, index % 2 ? materials.safety : materials.metal, [x, 1.35 + y, z], [5.8, 2.7, 2.5]);
    container.rotation.z = tilt;
    for (let line = -2; line <= 2; line += 1) addBox(group, materials.darkWall, [x + line, 1.35 + y, z - 1.28], [0.1, 2.2, 0.06]);
  });
  addSign(group, "FREIGHT // 7A", [-26, 3.2, -21.3]);
}

export function addTunnel(group: THREE.Group, materials: DistrictMaterials) {
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 13, 16, 1, true), materials.darkWall);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.set(23, 2.6, -25);
  tunnel.castShadow = true;
  group.add(tunnel);
  addBox(group, materials.concrete, [23, 0.12, -25], [6.4, 0.24, 13]);
  addBox(group, materials.metal, [23, 0.12, -18.4], [5.9, 0.08, 0.18]);
  [-28, -24, -20].forEach((z) => {
    const lamp = new THREE.PointLight(0x7ce8e0, 1.4, 8, 2);
    lamp.position.set(23, 3.7, z);
    group.add(lamp);
  });
  addSign(group, "UTILITY TUNNEL // B", [23, 4.1, -18.45]);
}

export function addRooftops(group: THREE.Group, materials: DistrictMaterials) {
  addStaircase(group, materials, -12, 9, 6.5);
  addStaircase(group, materials, 14, 23, 5.5);
  addRooftopRail(group, materials, -21, 15, 14, 18, 6.8);
  addRooftopRail(group, materials, 24, 17, 16, 14, 5.8);
  addBox(group, materials.metal, [-21, 7.2, 15], [2.8, 0.3, 3.2]);
  addBox(group, materials.lamp, [-21, 8.2, 15], [0.45, 1.7, 0.45]);
}

function addSandbag(group: THREE.Group, materials: DistrictMaterials, x: number, z: number) {
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 6), materials.wall);
  bag.scale.set(1.25, 0.68, 0.7);
  bag.position.set(x, 0.42, z);
  bag.castShadow = true;
  group.add(bag);
}

function addStaircase(group: THREE.Group, materials: DistrictMaterials, x: number, z: number, top: number) {
  const steps = 7;
  for (let step = 0; step < steps; step += 1) {
    addBox(group, materials.metal, [x + step * 0.72, (step + 1) * top / steps / 2, z], [0.78, (step + 1) * top / steps, 2.2]);
  }
}

function addRooftopRail(group: THREE.Group, materials: DistrictMaterials, x: number, z: number, width: number, depth: number, y: number) {
  [-1, 1].forEach((side) => {
    addBox(group, materials.metal, [x + side * width / 2, y + 0.45, z], [0.08, 0.9, depth]);
    addBox(group, materials.metal, [x, y + 0.45, z + side * depth / 2], [width, 0.08, 0.08]);
  });
}
