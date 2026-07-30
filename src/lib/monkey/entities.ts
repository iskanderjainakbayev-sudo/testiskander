import * as THREE from 'three';

export type Collectible = { id: string; mesh: THREE.Group; collected: boolean };
export type Chest = { id: string; mesh: THREE.Group; opened: boolean };

export function makeMonkey(color: string) {
  const monkey = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color, roughness: .85 });
  const skin = new THREE.MeshStandardMaterial({ color: '#e7b980' });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.72, 12, 10), fur);
  body.scale.set(1, 1.2, .8); body.position.y = 1.25;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.58, 12, 10), fur); head.position.set(0, 2.15, .1);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 8), skin); face.position.set(0, 2.06, .52);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(.62, .1, 7, 12, Math.PI * 1.3), fur); tail.position.set(0, 1.45, -.68); tail.rotation.x = Math.PI / 2;
  monkey.add(body, head, face, tail);
  monkey.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return monkey;
}

export function makeBanana(id: string, x: number, z: number): Collectible {
  const mesh = new THREE.Group();
  const banana = new THREE.Mesh(new THREE.TorusGeometry(.42, .13, 7, 12, Math.PI * .8), new THREE.MeshStandardMaterial({ color: '#ffd83d', emissive: '#d48600', emissiveIntensity: .45 }));
  banana.rotation.z = Math.PI * .6; mesh.add(banana); mesh.position.set(x, 1.2, z);
  return { id, mesh, collected: false };
}

export function makeChest(id: string, x: number, z: number): Chest {
  const mesh = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#7a4825' });
  const gold = new THREE.MeshStandardMaterial({ color: '#e8b642', metalness: .35 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.25, .75, .8), wood); box.position.y = .38;
  const band = new THREE.Mesh(new THREE.BoxGeometry(.12, .82, .88), gold); band.position.y = .42;
  mesh.add(box, band); mesh.position.set(x, 0, z); mesh.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return { id, mesh, opened: false };
}

export function makeGuardian(x: number, z: number) {
  const guardian = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#6f7460', flatShading: true });
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), stone); body.position.y = 1.3;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.14), new THREE.MeshBasicMaterial({ color: '#ff7847' })); eye.position.set(0, 1.55, 1.08);
  guardian.add(body, eye); guardian.position.set(x, 0, z);
  return guardian;
}
