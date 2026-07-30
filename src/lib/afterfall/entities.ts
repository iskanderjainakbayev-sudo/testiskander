import * as THREE from 'three';
import type { AfterfallItemId } from './types';

export type AfterfallEnemy = { id: string; label: string; mesh: THREE.Group; health: number; speed: number; damage: number; attackAt: number; alive: boolean };
export type AfterfallLoot = { id: string; item: AfterfallItemId; amount: number; mesh: THREE.Group; taken: boolean };

const material = (color: string, roughness = .75) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .18 });

export function makeEnemy(id: string, label: string, x: number, z: number, special = false): AfterfallEnemy {
  const mesh = new THREE.Group();
  const coat = material(special ? '#586b3e' : '#4a3933');
  const skin = material('#8d7361');
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.38, special ? 1.35 : 1.05, 5, 10), coat);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.29, 12, 10), skin);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: special ? '#ecce6c' : '#ff795d' }));
  body.position.y = special ? 1.16 : 1;
  head.position.y = special ? 2.03 : 1.76;
  eye.position.set(0, head.position.y, .27);
  mesh.add(body, head, eye); mesh.position.set(x, 0, z);
  mesh.traverse((part) => { if (part instanceof THREE.Mesh) { part.castShadow = true; part.userData.enemyId = id; } });
  return { id, label, mesh, health: special ? 76 : 34, speed: special ? 2.65 : 1.7, damage: special ? 13 : 7, attackAt: 0, alive: true };
}

export function makeLoot(id: string, item: AfterfallItemId, amount: number, x: number, z: number): AfterfallLoot {
  const mesh = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(.6, .45, .45), material(item === 'signal-key' ? '#72899a' : '#66523d'));
  crate.position.y = .28;
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.17), new THREE.MeshBasicMaterial({ color: item === 'signal-key' ? '#82e1e6' : '#d9a752' }));
  marker.position.y = .76; mesh.add(crate, marker); mesh.position.set(x, 0, z);
  return { id, item, amount, mesh, taken: false };
}
