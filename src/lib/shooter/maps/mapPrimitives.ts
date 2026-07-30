import * as THREE from "three";

export type DistrictMaterials = {
  concrete: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  darkWall: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  safety: THREE.MeshStandardMaterial;
  lamp: THREE.MeshStandardMaterial;
};

export function createDistrictMaterials(): DistrictMaterials {
  return {
    concrete: new THREE.MeshStandardMaterial({ color: 0x202a31, roughness: 0.92 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x3b4245, roughness: 0.82, metalness: 0.08 }),
    darkWall: new THREE.MeshStandardMaterial({ color: 0x151c21, roughness: 0.78, metalness: 0.24 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x465157, roughness: 0.48, metalness: 0.72 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x8bd4db, roughness: 0.1, metalness: 0.35, transparent: true, opacity: 0.5 }),
    safety: new THREE.MeshStandardMaterial({ color: 0xdb9a35, roughness: 0.58, metalness: 0.4 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0x9effe9, emissive: 0x3ca99c, emissiveIntensity: 1.7 }),
  };
}

export function addBox(
  group: THREE.Object3D,
  material: THREE.Material,
  position: [number, number, number],
  size: [number, number, number],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function addCylinder(
  group: THREE.Object3D,
  material: THREE.Material,
  position: [number, number, number],
  radius: number,
  height: number,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function addSign(group: THREE.Object3D, text: string, position: [number, number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#111a20";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#76eadf";
  context.strokeRect(6, 6, 500, 116);
  context.fillStyle = "#eafffa";
  context.font = "700 44px Arial";
  context.fillText(text, 28, 76);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 0.98),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }),
  );
  sign.position.set(...position);
  group.add(sign);
}
