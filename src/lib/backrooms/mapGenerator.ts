import * as THREE from 'three';
import type { BackroomsLevel } from './types';

export type MapItem = { id: string; kind: 'battery' | 'key' | 'note' | 'medkit' | 'switch'; mesh: THREE.Group };
export type GeneratedMap = { solids: THREE.Box3[]; items: MapItem[]; exit: THREE.Group; spawn: THREE.Vector3 };

const roomSize = 10;
const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .94, metalness: .04 });

export function createMap(scene: THREE.Scene, level: BackroomsLevel, seed = Math.random() * 99): GeneratedMap {
  const solids: THREE.Box3[] = []; const items: MapItem[] = []; const random = mulberry32(Math.floor(seed * 1e6));
  const walls = material(level.palette.wall); const floor = material(level.palette.floor);
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(92, 92), floor); floorMesh.rotation.x = -Math.PI / 2; scene.add(floorMesh);
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => random() > .21)); grid[3][3] = true; grid[6][5] = true;
  grid.forEach((row, z) => row.forEach((open, x) => { if (open) addRoom(scene, walls, solids, x, z, grid); }));
  for (let index = 0; index < 8; index += 1) {
    const x = Math.floor(random() * 7); const z = Math.floor(random() * 7); if (!grid[z][x]) continue;
    const prop = createProp(level, random); prop.position.set((x - 3) * roomSize + (random() - .5) * 5, prop.position.y, (z - 3) * roomSize + (random() - .5) * 5); scene.add(prop);
  }
  const placements: Array<[MapItem['kind'], number, number]> = [['battery', 2, 3], ['key', 4, 2], ['note', 1, 4], ['medkit', 4, 5], ['switch', 5, 4]];
  placements.forEach(([kind, x, z], index) => { if (!grid[z][x]) return; const mesh = createItem(kind); mesh.position.set((x - 3) * roomSize, 0, (z - 3) * roomSize); scene.add(mesh); items.push({ id: `${kind}-${index}`, kind, mesh }); });
  const exit = createExit(); exit.position.set(20, 0, 30); scene.add(exit);
  return { solids, items, exit, spawn: new THREE.Vector3(0, 1.7, 0) };
}

function addRoom(scene: THREE.Scene, walls: THREE.Material, solids: THREE.Box3[], x: number, z: number, grid: boolean[][]) {
  const at = (dx: number, dz: number) => grid[z + dz]?.[x + dx] ?? false;
  const px = (x - 3) * roomSize; const pz = (z - 3) * roomSize;
  [[0, -1, 0, 5], [0, 1, 0, 5], [-1, 0, 5, 0], [1, 0, 5, 0]].forEach(([dx, dz, ox, oz]) => {
    if (at(dx, dz)) return;
    const width = dx ? .45 : roomSize; const depth = dz ? .45 : roomSize;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 4.5, depth), walls); mesh.position.set(px + ox, 2.25, pz + oz); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); solids.push(new THREE.Box3().setFromObject(mesh));
  });
}

function createProp(level: BackroomsLevel, random: () => number) {
  const group = new THREE.Group(); const metal = new THREE.MeshStandardMaterial({ color: level.id === 5 ? 0x563529 : 0x303638, roughness: .7, metalness: .5 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4 + random() * 1.2, 1.4 + random() * 1.1, 1.2), metal); crate.position.y = .7; group.add(crate);
  if (level.id === 2 || level.id === 3) { const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 5), metal); pipe.rotation.z = Math.PI / 2; pipe.position.y = 2.6; group.add(pipe); }
  return group;
}

function createItem(kind: MapItem['kind']) {
  const group = new THREE.Group(); const color = ({ battery: 0x5edb9d, key: 0xf1cd57, note: 0xf4e8c1, medkit: 0xe84d4d, switch: 0xe96b4b })[kind];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(kind === 'note' ? .7 : .4, kind === 'note' ? .04 : .7, .35), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .25 })); mesh.position.y = kind === 'switch' ? 1.3 : .45; group.add(mesh); return group;
}

function createExit() { const group = new THREE.Group(); const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, .22), new THREE.MeshStandardMaterial({ color: 0x7e1f1c, emissive: 0x390000 })); door.position.y = 1.9; group.add(door); return group; }
function mulberry32(seed: number) { return () => { let value = seed += 0x6D2B79F5; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; }
