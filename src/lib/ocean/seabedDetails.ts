import * as THREE from 'three';
import { floorAt, seededRandom } from './terrain';

interface RockPlacement {
  x: number;
  z: number;
  scale: number;
  variant: number;
  tint: number;
}

const ROCK_FOCUS: ReadonlyArray<[number, number, number]> = [
  [0, 8, 30], [51, -25, 28], [-190, -52, 18], [218, 34, 20],
];

function rockMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .94, metalness: 0 });
}

function organicRockGeometry(seed: number, radius: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const variation = 1 + Math.sin(x * 3.7 + seed) * .09
      + Math.cos(z * 4.3 - seed * .7) * .07 + Math.sin(y * 5.1 + x * 2.2) * .04;
    positions.setXYZ(index, x * variation, y * variation, z * variation);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function basePlacements(
  random: () => number, count: number, radiusRange: [number, number], size: [number, number],
): RockPlacement[] {
  const placements: RockPlacement[] = [];
  for (let index = 0; index < count; index += 1) {
    const radius = THREE.MathUtils.lerp(radiusRange[0], radiusRange[1], Math.sqrt(random()));
    const angle = random() * Math.PI * 2;
    placements.push({
      x: Math.cos(angle) * radius,
      z: 8 + Math.sin(angle) * radius,
      scale: THREE.MathUtils.lerp(size[0], size[1], random()),
      variant: Math.floor(random() * 3),
      tint: random(),
    });
  }
  return placements;
}

function addFocusPlacements(placements: RockPlacement[], random: () => number): void {
  for (const [focusX, focusZ, count] of ROCK_FOCUS) {
    for (let index = 0; index < count; index += 1) {
      const radius = THREE.MathUtils.lerp(5, 28, Math.sqrt(random()));
      const angle = random() * Math.PI * 2;
      placements.push({
        x: focusX + Math.cos(angle) * radius,
        z: focusZ + Math.sin(angle) * radius,
        scale: THREE.MathUtils.lerp(.35, 1.65, random()),
        variant: Math.floor(random() * 3),
        tint: random(),
      });
    }
  }
}

function createRockMeshes(
  placements: RockPlacement[], baseRadius: number, flatten: number,
): THREE.InstancedMesh[] {
  const transform = new THREE.Object3D();
  const cool = new THREE.Color(0x355c59);
  const warm = new THREE.Color(0x82775d);
  return [0, 1, 2].map((variant) => {
    const selected = placements.filter((item) => item.variant === variant);
    const mesh = new THREE.InstancedMesh(
      organicRockGeometry(variant * 4.17 + baseRadius, baseRadius), rockMaterial(), selected.length,
    );
    selected.forEach((item, index) => {
      transform.position.set(item.x, floorAt(item.x, item.z) + item.scale * baseRadius * flatten * .52, item.z);
      transform.rotation.set(item.tint * .32, item.tint * Math.PI * 2, (1 - item.tint) * .24);
      transform.scale.set(
        item.scale * (.78 + item.tint * .42), item.scale * flatten,
        item.scale * (1.12 - item.tint * .27),
      );
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      mesh.setColorAt(index, cool.clone().lerp(warm, item.tint * .42));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = baseRadius > .5;
    mesh.receiveShadow = true;
    return mesh;
  });
}

export function createSeabedDetails(): THREE.Group {
  const random = seededRandom(91827);
  const boulders = basePlacements(random, 140, [25, 275], [.65, 3.3]);
  const pebbles = basePlacements(random, 260, [8, 128], [.2, .76]);
  addFocusPlacements(boulders, random);
  const group = new THREE.Group();
  group.add(...createRockMeshes(boulders, 1, .58), ...createRockMeshes(pebbles, .42, .48));
  return group;
}
