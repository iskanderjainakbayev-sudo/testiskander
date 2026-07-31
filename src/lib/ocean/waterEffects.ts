import * as THREE from 'three';

export function createGodRays(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0x9dfff1,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  for (let index = 0; index < 11; index += 1) {
    const height = 25 + index * 2.4;
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.1 + index * 0.12, height, 8, 1, true), material);
    const angle = index / 11 * Math.PI * 2;
    ray.position.set(Math.cos(angle) * (12 + index * 2.5), -height / 2, 8 + Math.sin(angle) * (12 + index * 2.5));
    ray.rotation.z = 0.08 + index * 0.012;
    ray.userData.phase = angle;
    group.add(ray);
  }
  return group;
}

export function updateGodRays(group: THREE.Group, time: number, depth: number): void {
  group.visible = depth < 72;
  group.rotation.y = Math.sin(time * 0.035) * 0.18;
  for (const object of group.children) {
    const phase = object.userData.phase as number;
    object.scale.x = 0.8 + Math.sin(time * 0.18 + phase) * 0.18;
  }
}
