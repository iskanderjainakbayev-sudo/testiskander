import * as THREE from 'three';

export type EnemyKind = 'scavenger' | 'sentinel' | 'wraith' | 'warden';

export type Enemy = {
  id: string;
  kind: EnemyKind;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  xp: number;
  attackAt: number;
  alive: boolean;
  phase: number;
};

export type Resource = {
  id: string;
  mesh: THREE.Group;
  kind: 'shard' | 'alloy';
  taken: boolean;
};

const material = (color: string, emissive = '#000000') => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive === '#000000' ? 0 : 1.4, roughness: .45, metalness: .22 });

export function makeRunner() {
  const runner = new THREE.Group();
  const suit = material('#172a49', '#162859');
  const trim = material('#72f7ff', '#2de4ff');
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.44, .9, 5, 10), suit);
  body.position.y = 1.2;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 8), trim);
  visor.position.set(0, 1.72, .29);
  visor.scale.z = .45;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .94), trim);
  blade.position.set(.52, 1.02, .25);
  blade.rotation.x = Math.PI / 4;
  runner.add(body, visor, blade);
  runner.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return runner;
}

export function makeCompanion() {
  const drone = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.26, 1), material('#d6f5ff', '#68e9ff'));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.34, .035, 6, 14), material('#9f75ff', '#8467ff'));
  ring.rotation.x = Math.PI / 2;
  drone.add(core, ring);
  return drone;
}

export function makeEnemy(id: string, kind: EnemyKind, x: number, z: number): Enemy {
  const mesh = new THREE.Group();
  const palette: Record<EnemyKind, [string, string, number, number, number]> = {
    scavenger: ['#6a3159', '#f55bcb', 1.4, 18, 8],
    sentinel: ['#426e8f', '#97fbff', 1.2, 24, 11],
    wraith: ['#4b6c45', '#d5ff65', 1.7, 30, 13],
    warden: ['#53255f', '#ffbd70', 2.4, 92, 18],
  };
  const [bodyColor, glow, scale, health, damage] = palette[kind];
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * .48, 0), material(bodyColor, glow));
  body.position.y = scale * .62;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(scale * .12, 8, 6), material('#ffffff', glow));
  eye.position.set(0, scale * .72, scale * .44);
  mesh.add(body, eye);
  mesh.position.set(x, 0, z);
  mesh.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return { id, kind, mesh, health, maxHealth: health, speed: kind === 'warden' ? 3.3 : 2 + scale * .45, damage, xp: Math.round(health * 3), attackAt: 0, alive: true, phase: 1 };
}

export function makeResource(id: string, kind: Resource['kind'], x: number, z: number): Resource {
  const mesh = new THREE.Group();
  const shard = new THREE.Mesh(new THREE.OctahedronGeometry(kind === 'shard' ? .45 : .33, 0), material(kind === 'shard' ? '#c2a3ff' : '#94e7ff', kind === 'shard' ? '#a45cff' : '#42e4ff'));
  shard.position.y = .75;
  mesh.add(shard);
  mesh.position.set(x, 0, z);
  return { id, mesh, kind, taken: false };
}

export function makeBeacon() {
  const beacon = new THREE.Group();
  const stone = material('#26344d');
  const glow = material('#fdde8b', '#ffb55c');
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, .45, 8), stone);
  plinth.position.y = .22;
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.74, 1), glow);
  crystal.position.y = 1.14;
  beacon.add(plinth, crystal);
  beacon.position.set(4, 0, 10);
  return beacon;
}

export function makeGrappleAnchor(x: number, y: number, z: number) {
  const anchor = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .075, 7, 16), material('#a789ff', '#8b69ff'));
  ring.rotation.x = Math.PI / 2;
  const spike = new THREE.Mesh(new THREE.ConeGeometry(.18, .9, 5), material('#c6efff', '#62ddff'));
  spike.rotation.x = Math.PI;
  spike.position.y = -.35;
  anchor.add(ring, spike);
  anchor.position.set(x, y, z);
  return anchor;
}

export function makeHoverbike() {
  const bike = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(.28, 1.3, 5, 10), material('#203556', '#1ccce6'));
  hull.rotation.x = Math.PI / 2;
  hull.position.y = .48;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.1, .08, .32), material('#9e78ff', '#855eff'));
  fin.position.y = .48;
  bike.add(hull, fin);
  return bike;
}
