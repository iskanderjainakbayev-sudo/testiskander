import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((data) => {
      this.result = data;
      this.onloadend?.();
    });
  }
};

const weaponFolder = fileURLToPath(new URL("../assets/models/weapons/", import.meta.url));
const weapons = [
  ["ar9", 0x385465, true],
  ["volt-smg", 0x497159, true],
  ["sable-sr", 0x4b4d58, true],
  ["breach-8", 0x5b4a3b, false],
  ["m9-pistol", 0x394653, false],
  ["ranger-br3", 0x406a4c, true],
  ["ember-6", 0x9c583c, false],
  ["lancer-1", 0x7564a8, true],
  ["falcon-9", 0xcc7147, false],
  ["vector-0", 0x4b91b3, true],
];

await mkdir(weaponFolder, { recursive: true });
await Promise.all(weapons.map(async ([id, color, scope]) => {
  const binary = await exportGlb(makeWeapon(id, color, scope));
  await writeFile(`${weaponFolder}${id}.glb`, new Uint8Array(binary));
}));

function makeWeapon(id, color, hasScope) {
  const weapon = new THREE.Group();
  weapon.name = id;
  const metal = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.82 });
  const polymer = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.7, metalness: 0.08 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x7be8da, emissive: 0x1b847b, emissiveIntensity: 0.45, roughness: 0.24, metalness: 0.5 });
  addBox(weapon, metal, [0, 0, 0.18], [0.22, 0.22, 0.96]);
  addBox(weapon, polymer, [0, -0.14, -0.35], [0.18, 0.28, 0.42], -0.38);
  addBox(weapon, polymer, [0, -0.31, 0.1], [0.16, 0.44, 0.16], 0.22);
  addCylinder(weapon, metal, [0, 0.01, 0.93], 0.06, 0.78);
  addBox(weapon, accent, [0, 0.17, 0.15], [0.13, 0.05, 0.44]);
  addBox(weapon, polymer, [0, -0.02, 0.19], [0.27, 0.05, 0.27]);
  if (hasScope) addScope(weapon, metal, accent);
  if (id === "breach-8") addCylinder(weapon, metal, [0, 0.01, 1.07], 0.1, 0.55);
  if (id === "m9-pistol") weapon.scale.set(0.72, 0.72, 0.72);
  weapon.rotation.set(0, Math.PI, 0);
  return weapon;
}

function addScope(group, metal, accent) {
  addCylinder(group, metal, [0, 0.27, 0.23], 0.095, 0.44);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.072, 16), accent);
  lens.position.set(0, 0.27, 0.46);
  lens.rotation.x = -Math.PI / 2;
  group.add(lens);
}

function addBox(group, material, position, size, tilt = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.x = tilt;
  group.add(mesh);
}

function addCylinder(group, material, position, radius, length) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), material);
  mesh.position.set(...position);
  mesh.rotation.x = Math.PI / 2;
  group.add(mesh);
}

function exportGlb(object) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(object, resolve, reject, { binary: true, onlyVisible: true });
  });
}
