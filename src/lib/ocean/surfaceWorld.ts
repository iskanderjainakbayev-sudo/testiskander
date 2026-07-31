import * as THREE from 'three';

const ROCK_POSITIONS: Array<[number, number, number]> = [
  [-58, -26, 1.15],
  [67, 32, 1.4],
  [-35, 74, 0.85],
  [43, -72, 1.05],
];

function createIsland(x: number, z: number, scale: number): THREE.Group {
  const group = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ color: 0x354d4c, roughness: 0.92 });
  const moss = new THREE.MeshStandardMaterial({ color: 0x486f53, roughness: 0.88 });
  for (let layer = 0; layer < 4; layer += 1) {
    const radius = (5.8 - layer * 0.85) * scale;
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius, 2.4, 7), layer === 3 ? moss : rock);
    stone.position.y = -1.4 + layer * 1.65;
    stone.rotation.y = layer * 0.48;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }
  const foam = new THREE.Mesh(
    new THREE.RingGeometry(5.2 * scale, 7.1 * scale, 42),
    new THREE.MeshBasicMaterial({ color: 0xd8fff9, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.23;
  foam.name = 'surface-foam';
  group.add(foam);
  group.position.set(x, 0, z);
  return group;
}

export function createSurfaceWorld(): THREE.Group {
  const group = new THREE.Group();
  ROCK_POSITIONS.forEach(([x, z, scale]) => group.add(createIsland(x, z, scale)));
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2, fog: false }),
  );
  sun.position.set(-72, 52, -110);
  group.add(sun);
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0xe9ffff,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    fog: false,
  });
  for (let index = 0; index < 7; index += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 7), cloudMaterial);
    cloud.name = 'surface-cloud';
    cloud.scale.set(8 + index % 3, 1.2, 3.2);
    cloud.position.set(-95 + index * 31, 27 + index % 2 * 6, -65 + (index % 3) * 42);
    group.add(cloud);
  }
  return group;
}

export function updateSurfaceWorld(group: THREE.Group, time: number): void {
  group.children
    .filter((child) => child.name === 'surface-cloud')
    .forEach((cloud, index) => {
      cloud.position.x += Math.sin(time * 0.08 + index) * 0.006;
    });
  group.traverse((child) => {
    if (child.name === 'surface-foam') {
      child.scale.setScalar(1 + Math.sin(time * 1.2 + child.position.x) * 0.025);
    }
  });
}
