import * as THREE from 'three';

export const WORLD_SIZE = 180;

export function createIsland(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(72, 82, 3, 64, 4),
    new THREE.MeshStandardMaterial({ color: '#4d8f48', roughness: 0.94 }),
  );
  ground.position.y = -1.8;
  ground.receiveShadow = true;
  scene.add(ground);

  const sand = new THREE.Mesh(
    new THREE.RingGeometry(69, 78, 64),
    new THREE.MeshStandardMaterial({ color: '#d9bf79', roughness: 1, side: THREE.DoubleSide }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.25;
  scene.add(sand);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(260, 80),
    new THREE.MeshPhysicalMaterial({ color: '#237a97', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.92 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -2.4;
  scene.add(water);
  return water;
}

function makeTree(position: THREE.Vector3, scale: number) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.32 * scale, .55 * scale, 4 * scale, 7), new THREE.MeshStandardMaterial({ color: '#5a351f' }));
  trunk.position.y = 2 * scale;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.1 * scale, 4.8 * scale, 8), new THREE.MeshStandardMaterial({ color: '#206d3c', flatShading: true }));
  leaves.position.y = 5.1 * scale;
  tree.add(trunk, leaves);
  tree.position.copy(position);
  tree.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return tree;
}

export function populateJungle(scene: THREE.Scene) {
  const decorations = new THREE.Group();
  const random = seededRandom(18);
  for (let index = 0; index < 180; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 12 + random() * 58;
    const size = .55 + random() * 1.1;
    decorations.add(makeTree(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius), size));
  }
  const volcano = new THREE.Mesh(new THREE.ConeGeometry(16, 31, 10), new THREE.MeshStandardMaterial({ color: '#4e3d39', flatShading: true }));
  volcano.position.set(38, 13, -36);
  volcano.castShadow = true;
  decorations.add(volcano);
  const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(16, 21), new THREE.MeshBasicMaterial({ color: '#9deeff', transparent: true, opacity: .64 }));
  waterfall.position.set(-43, 10, -26);
  decorations.add(waterfall);
  scene.add(decorations);
}

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
