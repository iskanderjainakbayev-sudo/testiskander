import * as THREE from "three";
import { addBox, addCylinder, addSign } from "./mapPrimitives";
import type { MapDetails } from "./types";
import type { SiroccoMaterials } from "./siroccoTerrain";

export function addSiroccoStructures(group: THREE.Group, materials: SiroccoMaterials): MapDetails {
  const details: MapDetails = { breakableGlass: [], doors: [] };
  addHangar(group, materials, details);
  addCommandBlock(group, materials, details);
  addServiceTunnel(group, materials);
  addWatchtower(group, materials);
  const animate = addCraneYard(group, materials);
  addArmorAndCover(group, materials);
  details.update = animate;
  return details;
}

function addHangar(group: THREE.Group, m: SiroccoMaterials, details: MapDetails) {
  const [x, z] = [-29, 13];
  addBox(group, m.wall, [x, 2.75, z + 9.3], [18, 5.5, 0.5]);
  addBox(group, m.wall, [x - 8.75, 2.75, z], [0.5, 5.5, 19]);
  addBox(group, m.wall, [x + 8.75, 2.75, z], [0.5, 5.5, 19]);
  addBox(group, m.metal, [x, 5.6, z], [18.5, 0.25, 19.5]);
  addBox(group, m.metal, [x - 3.2, 1.6, z - 9.25], [7, 3.2, 0.2]);
  addBox(group, m.wall, [x + 4.2, 2.75, z - 9.25], [8.5, 5.5, 0.2]);
  addSign(group, "SANDHAWK // HANGAR 03", [x, 4.25, z - 9.38]);
  addWindow(group, m, details, x - 5.5, 3.3, z - 9.38, "hangar-control-window");
  addDoor(group, m, details, x, z - 9.28, "hangar-service-door");
  addLadder(group, m, -39, 13, 5.5);
  [-33, -27, -21].forEach((bay) => addBox(group, m.metal, [bay, 0.9, 16], [2.4, 1.8, 4]));
}

function addCommandBlock(group: THREE.Group, m: SiroccoMaterials, details: MapDetails) {
  addBox(group, m.concrete, [29, 3.75, -9], [12, 7.5, 12]);
  addBox(group, m.metal, [29, 7.65, -9], [12.35, 0.25, 12.35]);
  addBox(group, m.glass, [29, 4.6, -15.08], [6.8, 1.9, 0.05]);
  addSign(group, "COMMAND // DUSTWIND", [29, 6.2, -15.16]);
  addWindow(group, m, details, 25.2, 3.2, -15.14, "command-room-window");
  addDoor(group, m, details, 32.4, -15.1, "command-archive-door");
  addLadder(group, m, 24, -9, 7.5);
  addCylinder(group, m.lamp, [29, 9.4, -9], 0.75, 0.28);
}

function addServiceTunnel(group: THREE.Group, m: SiroccoMaterials) {
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 21, 16, 1, true), m.metal);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.set(25, 2.8, -42);
  group.add(tunnel);
  addBox(group, m.concrete, [25, 0.1, -42], [7, 0.2, 21]);
  [-49, -42, -35].forEach((z) => {
    const light = new THREE.PointLight(0xffbd62, 1.5, 9, 2);
    light.position.set(25, 3.7, z);
    group.add(light);
  });
  addSign(group, "SERVICE LINK // 06", [25, 4.2, -31.42]);
}

function addWatchtower(group: THREE.Group, m: SiroccoMaterials) {
  [-46, -40].forEach((x) => addCylinder(group, m.metal, [x, 4, -25], 0.34, 8));
  addBox(group, m.metal, [-43, 8, -25], [8, 0.3, 8]);
  addBox(group, m.safety, [-43, 8.5, -21.1], [8, 0.1, 0.1]);
  addBox(group, m.safety, [-43, 8.5, -28.9], [8, 0.1, 0.1]);
  addLadder(group, m, -47, -25, 8);
  addSign(group, "OVERWATCH", [-43, 9.7, -29]);
}

function addCraneYard(group: THREE.Group, m: SiroccoMaterials) {
  const crane = new THREE.Group();
  crane.position.set(5, 0, 30);
  addBox(crane, m.safety, [0, 6, 0], [1, 12, 1]);
  addBox(crane, m.safety, [6, 11, 0], [13, 0.7, 0.7]);
  const hook = addBox(crane, m.metal, [11.4, 6.6, 0], [0.6, 7.8, 0.6]);
  addBox(crane, m.metal, [11.4, 2.7, 0], [2.2, 0.3, 1.5]);
  group.add(crane);
  let elapsed = 0;
  return (delta: number) => {
    elapsed += delta;
    crane.rotation.y = Math.sin(elapsed * 0.35) * 0.34;
    hook.position.y = 6.6 + Math.sin(elapsed * 1.1) * 1.4;
  };
}

function addArmorAndCover(group: THREE.Group, m: SiroccoMaterials) {
  [[-5, 16], [9, 12], [17, -4], [-12, -9], [42, 25]].forEach(([x, z], index) => {
    const crate = addBox(group, index % 2 ? m.safety : m.metal, [x, 1.2, z], [2.4, 2.4, 2.4]);
    crate.rotation.y = index * 0.42;
  });
  addBox(group, m.metal, [-5, 1.15, 33], [6, 2.3, 3.1]);
  addBox(group, m.safety, [-5, 2.45, 33], [6.2, 0.12, 3.3]);
}

function addWindow(group: THREE.Group, m: SiroccoMaterials, details: MapDetails, x: number, y: number, z: number, id: string) {
  const glass = addBox(group, m.glass, [x, y, z], [2.1, 1.6, 0.05]);
  glass.userData.breakableGlass = true;
  glass.userData.interactiveId = id;
  details.breakableGlass.push(glass);
}

function addDoor(group: THREE.Group, m: SiroccoMaterials, details: MapDetails, x: number, z: number, id: string) {
  const pivot = new THREE.Group();
  pivot.position.set(x - 1.1, 0, z);
  const door = addBox(pivot, m.metal, [1.1, 1.25, 0], [2.2, 2.5, 0.15]);
  door.userData.interactiveId = id;
  group.add(pivot);
  details.doors.push({ pivot, closedRotation: 0, openRotation: -1.42, open: false, collision: { x, z, width: 2.2, depth: 0.55, height: 2.5 } });
}

function addLadder(group: THREE.Group, m: SiroccoMaterials, x: number, z: number, height: number) {
  [-0.32, 0.32].forEach((offset) => addCylinder(group, m.metal, [x + offset, height / 2, z], 0.05, height));
  for (let rung = 0.45; rung < height; rung += 0.45) addBox(group, m.safety, [x, rung, z], [0.72, 0.07, 0.09]);
}
