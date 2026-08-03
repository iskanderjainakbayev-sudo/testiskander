import * as THREE from 'three';
import { floorAt, seededRandom } from './terrain';

function rockMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
}

function placeRocks(
  mesh: THREE.InstancedMesh,
  count: number,
  random: () => number,
  minRadius: number,
  maxRadius: number,
  size: [number, number],
): void {
  const transform = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, Math.sqrt(random()));
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = 8 + Math.sin(angle) * radius;
    const scale = THREE.MathUtils.lerp(size[0], size[1], random());
    transform.position.set(x, floorAt(x, z) + scale * 0.23, z);
    transform.rotation.set(random() * 0.45, random() * Math.PI * 2, random() * 0.35);
    transform.scale.set(scale * (0.75 + random() * 0.5), scale * 0.55, scale);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function createSeabedDetails(): THREE.Group {
  const group = new THREE.Group();
  const random = seededRandom(91827);
  const boulders = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    rockMaterial(0x395957),
    115,
  );
  const pebbles = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.45, 0),
    rockMaterial(0x7e8067),
    240,
  );
  placeRocks(boulders, 115, random, 28, 270, [0.7, 3.4]);
  placeRocks(pebbles, 240, random, 9, 110, [0.18, 0.65]);
  boulders.receiveShadow = true;
  boulders.castShadow = true;
  pebbles.receiveShadow = true;
  group.add(boulders, pebbles);
  return group;
}
