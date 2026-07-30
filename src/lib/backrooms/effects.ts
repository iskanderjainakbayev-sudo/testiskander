import * as THREE from 'three';

export function addAtmosphere(scene: THREE.Scene, fog: number) {
  scene.fog = new THREE.FogExp2(fog, .045);
  const count = 480; const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) { positions[index * 3] = (Math.random() - .5) * 80; positions[index * 3 + 1] = Math.random() * 5; positions[index * 3 + 2] = (Math.random() - .5) * 80; }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffefb0, size: .035, transparent: true, opacity: .45 })); scene.add(dust); return dust;
}

export function makeStalker() {
  const group = new THREE.Group(); const material = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: .95 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 1.9, 5, 8), material); body.position.y = 1.25; group.add(body);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.08), new THREE.MeshBasicMaterial({ color: 0xffdf77 })); eye.position.set(0, 1.7, -.34); group.add(eye); return group;
}
