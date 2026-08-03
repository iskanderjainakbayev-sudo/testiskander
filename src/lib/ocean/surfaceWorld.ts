import * as THREE from 'three';
import { seededRandom } from './terrain';
import { createShorelineFoam, updateShorelineFoam } from './shorelineFoam';

const ISLANDS: Array<[number, number, number]> = [
  [-58, -26, 1.15], [67, 32, 1.4], [-35, 74, 0.85], [43, -72, 1.05],
];
const rockGeometry = new THREE.IcosahedronGeometry(1, 2);
const rock = new THREE.MeshStandardMaterial({ color: 0x344d4a, roughness: 0.96 });
const moss = new THREE.MeshStandardMaterial({ color: 0x527958, roughness: 0.91 });
const bark = new THREE.MeshStandardMaterial({ color: 0x5e4934, roughness: 1 });
const leaf = new THREE.MeshStandardMaterial({ color: 0x397a58, roughness: 0.86, side: THREE.DoubleSide });

function softTexture(stops: Array<[number, string]>): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createRadialGradient(96, 48, 2, 96, 48, 82);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPalm(group: THREE.Group, x: number, z: number, scale: number, phase: number): void {
  const palm = new THREE.Group();
  for (let index = 0; index < 4; index += 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .19, 1.45, 8), bark);
    trunk.position.set(Math.sin(phase) * index * .08, .72 + index * 1.35, 0);
    trunk.rotation.z = Math.sin(phase + index) * .055;
    palm.add(trunk);
  }
  for (let index = 0; index < 7; index += 1) {
    const frond = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 5), leaf);
    const angle = index / 7 * Math.PI * 2;
    frond.scale.set(1.7, .055, .32);
    frond.position.set(Math.cos(angle) * 1.25, 5.75, Math.sin(angle) * 1.25);
    frond.rotation.set(0, -angle, Math.sin(index * 2.1) * .14);
    palm.add(frond);
  }
  palm.position.set(x, 1.9, z);
  palm.scale.setScalar(scale);
  group.add(palm);
}

function createIsland(x: number, z: number, scale: number, seed: number): THREE.Group {
  const group = new THREE.Group();
  const random = seededRandom(seed);
  for (let index = 0; index < 15; index += 1) {
    const angle = index / 15 * Math.PI * 2 + random() * .35;
    const radius = (2.2 + random() * 3.4) * scale;
    const stone = new THREE.Mesh(rockGeometry, index > 10 ? moss : rock);
    stone.position.set(Math.cos(angle) * radius * .52, -.65 + random() * 2.2, Math.sin(angle) * radius * .52);
    stone.scale.set((1.4 + random() * 2.3) * scale, (.75 + random() * 1.8) * scale, (1.3 + random() * 2.4) * scale);
    stone.rotation.set(random() * .4, random() * Math.PI, random() * .3);
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }
  addPalm(group, -1.5 * scale, .5 * scale, .7 * scale, random() * 4);
  if (scale > 1) addPalm(group, 1.4 * scale, -.7 * scale, .55 * scale, random() * 4);
  const foam = createShorelineFoam(4.7 * scale, 7.4 * scale);
  group.add(foam);
  group.position.set(x, 0, z);
  return group;
}

export function createSurfaceWorld(): THREE.Group {
  const group = new THREE.Group();
  ISLANDS.forEach(([x, z, scale], index) => group.add(createIsland(x, z, scale, 7481 + index * 97)));
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softTexture([[0, '#fffce8'], [.18, '#ffeec4'], [.52, '#ffd48a88'], [1, '#ffd48a00']]),
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
  }));
  sun.position.set(-72, 52, -110);
  sun.scale.set(28, 14, 1);
  group.add(sun);
  const cloudMap = softTexture([[0, '#ffffffdd'], [.35, '#ecffffb0'], [.7, '#d9f4fa3d'], [1, '#d9f4fa00']]);
  for (let index = 0; index < 10; index += 1) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudMap, transparent: true, opacity: .38, depthWrite: false, fog: false }));
    cloud.name = 'surface-cloud';
    cloud.scale.set(22 + index % 3 * 7, 7 + index % 2 * 2, 1);
    cloud.position.set(-110 + index * 27, 25 + index % 3 * 5, -78 + (index % 4) * 47);
    cloud.userData.baseX = cloud.position.x;
    group.add(cloud);
  }
  return group;
}

export function updateSurfaceWorld(group: THREE.Group, time: number): void {
  group.traverse((child) => {
    if (child.name === 'surface-cloud') child.position.x = (child.userData.baseX as number) + time * .16;
    if (child.name === 'surface-foam') updateShorelineFoam(child, time);
  });
}
