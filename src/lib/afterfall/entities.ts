import * as THREE from 'three';
import type { AfterfallItemId } from './types';

type EnemyRig = { kind: 'raider' | 'stalker'; leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group; head: THREE.Group; torso: THREE.Group };
export type AfterfallEnemy = { id: string; label: string; mesh: THREE.Group; health: number; speed: number; damage: number; attackAt: number; alive: boolean; hitUntil: number };
export type AfterfallLoot = { id: string; item: AfterfallItemId; amount: number; mesh: THREE.Group; taken: boolean };

const material = (color: string, roughness = .75, metalness = .18) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const limb = (color: string, length: number, radius: number) => {
  const root = new THREE.Group(); const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material(color));
  mesh.position.y = -length * .5; root.add(mesh); return root;
};

export function makeEnemy(id: string, label: string, x: number, z: number, special = false): AfterfallEnemy {
  const mesh = special ? makeStalker() : makeRaider();
  mesh.position.set(x, 0, z);
  mesh.traverse((part) => { if (part instanceof THREE.Mesh) { part.castShadow = true; part.receiveShadow = true; part.userData.enemyId = id; } });
  return { id, label, mesh, health: special ? 76 : 34, speed: special ? 2.65 : 1.7, damage: special ? 13 : 7, attackAt: 0, alive: true, hitUntil: 0 };
}

export function animateEnemy(enemy: AfterfallEnemy, elapsed: number, moving: boolean, attacking: boolean) {
  const rig = enemy.mesh.userData.rig as EnemyRig | undefined; if (!rig) return;
  const pace = elapsed * (rig.kind === 'stalker' ? 8.5 : 6.5) + enemy.mesh.position.x;
  const swing = moving ? Math.sin(pace) * (rig.kind === 'stalker' ? .68 : .52) : Math.sin(elapsed * 1.7 + enemy.mesh.position.z) * .04;
  rig.leftArm.rotation.x = swing; rig.rightArm.rotation.x = -swing; rig.leftLeg.rotation.x = -swing; rig.rightLeg.rotation.x = swing;
  rig.torso.position.y = rig.kind === 'stalker' ? .88 + Math.abs(swing) * .07 : 1.25 + Math.abs(swing) * .025;
  rig.head.rotation.x = attacking ? -.32 : Math.sin(elapsed * 1.4 + enemy.mesh.position.x) * .055;
  if (attacking) rig.rightArm.rotation.x = -1.12;
  const flash = elapsed < enemy.hitUntil;
  enemy.mesh.traverse((part) => { if (part instanceof THREE.Mesh && part.material instanceof THREE.MeshStandardMaterial) { part.material.emissive.set(flash ? '#a84d3a' : '#000000'); part.material.emissiveIntensity = flash ? .75 : 0; } });
}

export function markEnemyHit(enemy: AfterfallEnemy, elapsed: number) { enemy.hitUntil = elapsed + .1; }

function makeRaider() {
  const root = new THREE.Group(); const torso = new THREE.Group(); const head = new THREE.Group();
  const jacket = material('#3d4640', .84); const leather = material('#5a382b', .68); const skin = material('#816251', .8); const cloth = material('#6e735c', .95); const metal = material('#313936', .35, .75);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(.39, .73, 5, 10), jacket); chest.position.y = .03;
  const vest = new THREE.Mesh(new THREE.BoxGeometry(.5, .52, .2), leather); vest.position.set(0, .06, .32);
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(.48, .55, .22), cloth); backpack.position.set(0, .05, -.35);
  torso.position.y = 1.25; torso.add(chest, vest, backpack);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.27, 12, 10), skin); const hood = new THREE.Mesh(new THREE.SphereGeometry(.31, 12, 10, 0, Math.PI * 2, 0, Math.PI * .64), cloth);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.046, 8, 6), new THREE.MeshBasicMaterial({ color: '#f0c077' })); eye.position.set(.09, .02, .255);
  const otherEye = eye.clone(); otherEye.position.x = -.09; const scarf = new THREE.Mesh(new THREE.TorusGeometry(.25, .035, 6, 12), leather); scarf.rotation.x = Math.PI / 2; scarf.position.y = -.2;
  head.position.y = 1.94; head.add(skull, hood, eye, otherEye, scarf);
  const leftArm = limb('#4b544a', .58, .105); leftArm.position.set(.43, 1.48, 0); const rightArm = limb('#4b544a', .58, .105); rightArm.position.set(-.43, 1.48, 0);
  const leftLeg = limb('#454842', .72, .12); leftLeg.position.set(.18, .82, 0); const rightLeg = limb('#454842', .72, .12); rightLeg.position.set(-.18, .82, 0);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.035, .052, .76, 7), metal); pipe.rotation.z = .32; pipe.position.set(-.56, 1.05, .1);
  root.add(torso, head, leftArm, rightArm, leftLeg, rightLeg, pipe); root.userData.rig = { kind: 'raider', leftArm, rightArm, leftLeg, rightLeg, head, torso } satisfies EnemyRig; return root;
}

function makeStalker() {
  const root = new THREE.Group(); const torso = new THREE.Group(); const head = new THREE.Group();
  const hide = material('#3f5233', .92); const bone = material('#8d886c', .78); const claw = material('#24261e', .5, .5);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.48, .92, 5, 10), hide); body.rotation.x = Math.PI / 2; const spine = new THREE.Mesh(new THREE.BoxGeometry(.2, .12, 1.15), bone); spine.position.y = .38; torso.position.y = .88; torso.add(body, spine);
  const jaw = new THREE.Mesh(new THREE.ConeGeometry(.29, .48, 6), hide); jaw.rotation.x = Math.PI / 2; jaw.position.z = .34; const eye = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), new THREE.MeshBasicMaterial({ color: '#e8d26b' })); eye.position.set(.13, .06, .35); const otherEye = eye.clone(); otherEye.position.x = -.13; head.position.set(0, 1.13, .54); head.add(jaw, eye, otherEye);
  const leftArm = limb('#3a4930', .66, .1); leftArm.position.set(.42, 1, .28); leftArm.rotation.x = .5; const rightArm = limb('#3a4930', .66, .1); rightArm.position.set(-.42, 1, .28); rightArm.rotation.x = .5;
  const leftLeg = limb('#3a4930', .72, .12); leftLeg.position.set(.3, .73, -.27); leftLeg.rotation.x = -.43; const rightLeg = limb('#3a4930', .72, .12); rightLeg.position.set(-.3, .73, -.27); rightLeg.rotation.x = -.43;
  for (const x of [-.33, 0, .33]) { const spike = new THREE.Mesh(new THREE.ConeGeometry(.07, .35, 5), bone); spike.position.set(x, 1.43, -.12); root.add(spike); }
  const claws = new THREE.Mesh(new THREE.ConeGeometry(.14, .28, 4), claw); claws.position.set(.42, .25, .55); claws.rotation.x = Math.PI / 2; root.add(torso, head, leftArm, rightArm, leftLeg, rightLeg, claws); root.userData.rig = { kind: 'stalker', leftArm, rightArm, leftLeg, rightLeg, head, torso } satisfies EnemyRig; return root;
}

export function makeLoot(id: string, item: AfterfallItemId, amount: number, x: number, z: number): AfterfallLoot {
  const mesh = new THREE.Group(); const crate = new THREE.Mesh(new THREE.BoxGeometry(.6, .45, .45), material(item === 'signal-key' ? '#72899a' : '#66523d')); crate.position.y = .28;
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.17), new THREE.MeshBasicMaterial({ color: item === 'signal-key' ? '#82e1e6' : '#d9a752' })); marker.position.y = .76; mesh.add(crate, marker); mesh.position.set(x, 0, z);
  return { id, item, amount, mesh, taken: false };
}
