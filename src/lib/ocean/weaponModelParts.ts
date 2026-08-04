import * as THREE from 'three';

export const oceanWeaponMaterials = {
  abyssMetal: new THREE.MeshStandardMaterial({ color: 0x173b42, metalness: 0.82, roughness: 0.3 }),
  blade: new THREE.MeshStandardMaterial({ color: 0x9ed5cd, metalness: 0.72, roughness: 0.2 }),
  gold: new THREE.MeshStandardMaterial({ color: 0x8f773e, metalness: 0.9, roughness: 0.33 }),
  grip: new THREE.MeshStandardMaterial({ color: 0x102c32, roughness: 0.78 }),
  glow: new THREE.MeshBasicMaterial({ color: 0x75fff1 }),
};

export function extrudedProfile(points: [number, number][], depth: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function addGoldSpike(parent: THREE.Group, position: THREE.Vector3, rotationZ: number, length = 0.12): void {
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, length, 4), oceanWeaponMaterials.gold);
  spike.position.copy(position);
  spike.rotation.z = rotationZ;
  parent.add(spike);
}

export function prepareViewModel(model: THREE.Group): void {
  model.traverse((object) => {
    object.renderOrder = 20;
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => { material.depthTest = false; });
    }
  });
}
