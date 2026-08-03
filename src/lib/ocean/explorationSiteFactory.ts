import * as THREE from 'three';
import { seededRandom } from './terrain';

export type ExplorationSiteKind = 'arch' | 'spire' | 'vent';

const rockGeometry = new THREE.IcosahedronGeometry(1, 2);
const pebbleGeometry = new THREE.IcosahedronGeometry(1, 1);
const glowGeometry = new THREE.SphereGeometry(1, 10, 7);
const ringGeometry = new THREE.TorusGeometry(1, 0.1, 6, 20);
const ventGeometry = new THREE.LatheGeometry([
  new THREE.Vector2(0.9, 0), new THREE.Vector2(1.12, 0.7),
  new THREE.Vector2(0.66, 2.3), new THREE.Vector2(0.78, 4.6),
  new THREE.Vector2(0.54, 6.3), new THREE.Vector2(0.92, 6.75),
], 12);

const rocks: Record<ExplorationSiteKind, THREE.MeshStandardMaterial> = {
  arch: new THREE.MeshStandardMaterial({ color: 0x274d50, roughness: 0.94, metalness: 0.02 }),
  spire: new THREE.MeshStandardMaterial({ color: 0x23434c, roughness: 0.88, metalness: 0.08 }),
  vent: new THREE.MeshStandardMaterial({ color: 0x231f24, roughness: 0.91, metalness: 0.12 }),
};
const accents: Record<ExplorationSiteKind, THREE.MeshStandardMaterial> = {
  arch: new THREE.MeshStandardMaterial({ color: 0x72d7c5, emissive: 0x1b8f86, emissiveIntensity: 2.1, roughness: 0.38 }),
  spire: new THREE.MeshStandardMaterial({ color: 0x8df7ff, emissive: 0x28cddd, emissiveIntensity: 2.5, roughness: 0.3 }),
  vent: new THREE.MeshStandardMaterial({ color: 0xff9a58, emissive: 0xff431f, emissiveIntensity: 3, roughness: 0.45 }),
};

function addRock(group: THREE.Group, position: THREE.Vector3, scale: THREE.Vector3,
  material: THREE.Material, rotation = 0): void {
  const mesh = new THREE.Mesh(rockGeometry, material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.rotation.set(rotation * 0.3, rotation, rotation * 0.18);
  group.add(mesh);
}

function addGlow(group: THREE.Group, x: number, y: number, z: number,
  scale: number, material: THREE.Material): void {
  const glow = new THREE.Mesh(glowGeometry, material);
  glow.position.set(x, y, z);
  glow.scale.set(scale, scale * 0.62, scale);
  group.add(glow);
}

function createArch(random: () => number): THREE.Group {
  const group = new THREE.Group();
  for (let index = 0; index < 13; index += 1) {
    const t = index / 12;
    const x = THREE.MathUtils.lerp(-5.7, 5.7, t);
    const y = 1.05 + Math.sin(t * Math.PI) * 7.8;
    const radius = 0.78 + Math.abs(t - 0.5) * 1.55;
    addRock(group, new THREE.Vector3(x, y, (random() - 0.5) * 0.45),
      new THREE.Vector3(radius * 1.15, radius, radius * 0.86), rocks.arch, random() * 3);
    if (index > 1 && index < 11 && index % 2 === 0) {
      addGlow(group, x * 0.88, y - radius * 0.62, 0.72, 0.18 + random() * 0.16, accents.arch);
    }
  }
  for (const side of [-1, 1]) {
    addRock(group, new THREE.Vector3(side * 6, 0.65, 0.3), new THREE.Vector3(2.5, 1.1, 2.2), rocks.arch, side);
    addRock(group, new THREE.Vector3(side * 7.1, 0.45, -2.2), new THREE.Vector3(1.25, 0.7, 1.6), rocks.arch, side * 2);
  }
  return group;
}

function createSpire(random: () => number): THREE.Group {
  const group = new THREE.Group();
  const heights = [12.5, 8.5, 6.5];
  heights.forEach((height, column) => {
    const baseX = (column - 1) * 2.8;
    for (let layer = 0; layer < 4; layer += 1) {
      const t = layer / 4;
      const radius = (1 - t) * (1.25 - column * 0.08);
      addRock(group, new THREE.Vector3(baseX + Math.sin(layer + column) * 0.35,
        height * t + radius, (column - 1) * 0.65),
      new THREE.Vector3(radius, height * 0.16, radius * 0.78), rocks.spire, random() * 4);
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.1, 9), rocks.spire);
    tip.position.set(baseX + Math.sin(column) * 0.3, height + 0.35, (column - 1) * 0.65);
    tip.rotation.z = (column - 1) * 0.12;
    group.add(tip);
    for (let bead = 1; bead < 4; bead += 1) {
      addGlow(group, baseX + 0.72, height * bead / 4, 0.72, 0.19 + random() * 0.12, accents.spire);
    }
  });
  const halo = new THREE.Mesh(ringGeometry, accents.spire);
  halo.position.set(0, 8.2, 0);
  halo.rotation.x = Math.PI / 2;
  halo.scale.setScalar(2.05);
  group.add(halo);
  return group;
}

function createVent(random: () => number): THREE.Group {
  const group = new THREE.Group();
  [0, 1, 2, 3].forEach((index) => {
    const height = 0.65 + random() * 0.65;
    const vent = new THREE.Mesh(ventGeometry, rocks.vent);
    vent.scale.set(0.72 + random() * 0.5, height, 0.72 + random() * 0.5);
    vent.position.set((index - 1.5) * 2.25, 0, Math.sin(index * 2.2) * 1.2);
    vent.rotation.z = (random() - 0.5) * 0.1;
    group.add(vent);
    const mouthY = 6.75 * height + 0.035;
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.72, 12), accents.vent);
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.set(vent.position.x, mouthY, vent.position.z);
    mouth.scale.setScalar(vent.scale.x);
    group.add(mouth);
    addGlow(group, vent.position.x, mouthY + 1, vent.position.z, 0.35, accents.vent);
  });
  for (let index = 0; index < 5; index += 1) {
    const stone = new THREE.Mesh(pebbleGeometry, rocks.vent);
    stone.position.set((random() - 0.5) * 10, 0.35, (random() - 0.5) * 5);
    stone.scale.set(1.2 + random(), 0.42, 0.8 + random());
    group.add(stone);
  }
  return group;
}

export function createExplorationLandmark(kind: ExplorationSiteKind, seed: number): THREE.Group {
  const random = seededRandom(seed);
  const landmark = kind === 'arch' ? createArch(random) : kind === 'spire' ? createSpire(random) : createVent(random);
  landmark.rotation.y = random() * Math.PI * 2;
  landmark.scale.setScalar(0.9 + random() * 0.22);
  return landmark;
}
