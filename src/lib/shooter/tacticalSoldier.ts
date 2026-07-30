import * as THREE from "three";
import type { HumanoidBot } from "./humanoidBot";

export function buildTacticalSoldier(): HumanoidBot {
  const group = new THREE.Group();
  const materials = createMaterials();
  const limbs = createLimbs(group, materials);
  const armor = addBody(group, materials);
  addHead(group, materials);
  const core = addRadio(group, materials);
  const muzzle = addRifle(group, materials);
  addPack(group, materials);
  return { group, armor, core, muzzle, limbs };
}

function createMaterials() {
  return {
    fabric: new THREE.MeshStandardMaterial({ color: 0x303b36, roughness: 0.88, metalness: 0.04 }),
    armor: new THREE.MeshStandardMaterial({ color: 0x4b594e, emissive: 0x06100a, emissiveIntensity: 0.5, roughness: 0.5, metalness: 0.4 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0x202924, roughness: 0.36, metalness: 0.62 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xa96f50, roughness: 0.82 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x111614, roughness: 0.94 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x394448, roughness: 0.32, metalness: 0.84 }),
    lens: new THREE.MeshStandardMaterial({ color: 0x89c9ce, emissive: 0x123f42, emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.5 }),
  };
}

function addBody(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  addCapsule(group, materials.fabric, [0, 1.28, 0], 0.42, 0.62);
  const vest = addBox(group, materials.armor, [0, 1.33, 0.31], [0.82, 0.8, 0.22]);
  vest.name = "vest";
  [-0.23, 0, 0.23].forEach((x) => addBox(group, materials.rubber, [x, 1.1, 0.44], [0.18, 0.26, 0.08]));
  addBox(group, materials.armor, [0, 1.4, -0.38], [0.68, 0.7, 0.12]);
  return materials.armor;
}

function addHead(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  const neck = addCylinder(group, materials.skin, [0, 1.78, 0], 0.12, 0.18);
  neck.name = "neck";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), materials.skin);
  head.name = "head";
  head.position.y = 2.03;
  group.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, 1.5), materials.helmet);
  helmet.position.y = 2.15;
  group.add(helmet);
  addBox(group, materials.rubber, [0, 1.91, 0.24], [0.42, 0.17, 0.12]);
  addBox(group, materials.lens, [0, 2.04, 0.27], [0.46, 0.11, 0.06]);
}

function createLimbs(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  const leftArm = addArm(group, materials, -0.48);
  const rightArm = addArm(group, materials, 0.48);
  const leftLeg = addLeg(group, materials, -0.22);
  const rightLeg = addLeg(group, materials, 0.22);
  return { leftArm, rightArm, leftLeg, rightLeg };
}

function addArm(group: THREE.Group, materials: ReturnType<typeof createMaterials>, x: number) {
  const arm = new THREE.Group();
  arm.position.set(x, 1.6, 0.08);
  addCapsule(arm, materials.fabric, [0, -0.28, 0], 0.12, 0.4);
  addCapsule(arm, materials.fabric, [0, -0.68, 0.1], 0.1, 0.3);
  addBox(arm, materials.armor, [0, -0.08, 0], [0.26, 0.2, 0.2]);
  group.add(arm);
  return arm;
}

function addLeg(group: THREE.Group, materials: ReturnType<typeof createMaterials>, x: number) {
  const leg = new THREE.Group();
  leg.position.set(x, 0.92, 0);
  addCapsule(leg, materials.fabric, [0, -0.3, 0], 0.14, 0.4);
  addCapsule(leg, materials.fabric, [0, -0.73, 0.04], 0.12, 0.34);
  addBox(leg, materials.armor, [0, -0.47, 0.12], [0.24, 0.18, 0.13]);
  addBox(leg, materials.rubber, [0, -1.04, 0.12], [0.26, 0.15, 0.38]);
  group.add(leg);
  return leg;
}

function addRadio(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  const radio = addBox(group, materials.lens, [-0.28, 1.63, 0.44], [0.16, 0.2, 0.06]);
  radio.name = "radio";
  addCylinder(group, materials.metal, [-0.28, 1.8, 0.41], 0.018, 0.27);
  return radio;
}

function addPack(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  addBox(group, materials.armor, [0, 1.32, -0.5], [0.58, 0.68, 0.2]);
  addBox(group, materials.rubber, [0, 1.78, -0.46], [0.17, 0.24, 0.12]);
}

function addRifle(group: THREE.Group, materials: ReturnType<typeof createMaterials>) {
  const rifle = new THREE.Group();
  rifle.position.set(0.25, 1.3, 0.48);
  rifle.rotation.set(-0.12, 0, 0);
  addBox(rifle, materials.metal, [0, 0, 0.2], [0.16, 0.16, 0.7]);
  addCylinder(rifle, materials.metal, [0, 0, 0.8], 0.035, 0.56);
  addBox(rifle, materials.rubber, [0, -0.12, -0.22], [0.13, 0.19, 0.32]);
  addBox(rifle, materials.lens, [0, 0.12, 0.25], [0.08, 0.07, 0.2]);
  group.add(rifle);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.25, 1.3, 1.08);
  group.add(muzzle);
  return muzzle;
}

function addBox(group: THREE.Object3D, material: THREE.Material, position: [number, number, number], size: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addCapsule(group: THREE.Object3D, material: THREE.Material, position: [number, number, number], radius: number, length: number) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addCylinder(group: THREE.Object3D, material: THREE.Material, position: [number, number, number], radius: number, height: number) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 10), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}
