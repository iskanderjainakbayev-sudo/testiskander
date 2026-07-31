import * as THREE from 'three';
import type { OceanDecor } from './decorations';
import { floorAt } from './terrain';
import type { Interactable } from './types';

const LOG_POSITIONS: Array<[string, number, number]> = [
  ['pod', 2, 6],
  ['kelp', 51, -25],
  ['vault', -94, -43],
  ['heart', 102, -78],
];

function createTablet(): THREE.Group {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.12, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x182e38, metalness: 0.65, roughness: 0.3 }),
  );
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.78),
    new THREE.MeshBasicMaterial({ color: 0x8dfff1, transparent: true, opacity: 0.88 }),
  );
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.07;
  group.add(frame, screen);
  return group;
}

function createRuin(scene: THREE.Scene, x: number, z: number, size: number): void {
  const material = new THREE.MeshStandardMaterial({
    color: 0x243f48, emissive: 0x092c35, emissiveIntensity: 0.8, roughness: 0.84,
  });
  const floor = floorAt(x, z);
  for (let index = 0; index < 5; index += 1) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, size + index * 0.5, 1.4), material);
    pillar.position.set(x + Math.cos(index * 1.25) * 5, floor + size / 2, z + Math.sin(index * 1.25) * 5);
    pillar.rotation.y = index * 0.5;
    scene.add(pillar);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.5, 0.28, 7, 30),
    new THREE.MeshStandardMaterial({ color: 0x47e4da, emissive: 0x19887f, emissiveIntensity: 2 }),
  );
  ring.position.set(x, floor + 3.2, z);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
}

export function createLandmarks(scene: THREE.Scene, decor: OceanDecor): Interactable[] {
  const interactions: Interactable[] = [
    { id: 'pod', kind: 'pod', position: decor.pod.position, mesh: decor.pod, label: 'Escape Pod' },
    { id: 'submarine', kind: 'submarine', position: decor.submarine.position, mesh: decor.submarine, label: 'Nereid Micro-Sub' },
    { id: 'rocket', kind: 'rocket', position: decor.rocket.position, mesh: decor.rocket, label: 'Aster Escape Vehicle' },
  ];
  LOG_POSITIONS.forEach(([id, x, z], index) => {
    const mesh = createTablet();
    mesh.position.set(x, floorAt(x, z) + 1.1, z);
    scene.add(mesh);
    interactions.push({
      id: `log-${id}`,
      kind: 'log',
      position: mesh.position,
      mesh,
      label: index === 0 ? 'Damaged PDA' : 'Memory Tablet',
      logId: id,
    });
    if (index > 0) createRuin(scene, x, z, index === 3 ? 8 : 5.5);
  });
  return interactions;
}

