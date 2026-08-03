import * as THREE from 'three';
import { RESOURCE_NAMES } from './content';
import { floorAt, seededRandom } from './terrain';
import type { Interactable, ResourceId } from './types';

const COLORS: Record<ResourceId, [number, number]> = {
  stone: [0x71858a, 0x172528],
  copper: [0xd8753e, 0x5a2411],
  quartz: [0xd9fbff, 0x4e9caa],
  crystal: [0x5ffff0, 0x157c70],
  fiber: [0x53d67f, 0x174b25],
  oil: [0x8136ad, 0x421259],
  coral: [0xff8f74, 0x6e241c],
  scrap: [0xb4b4a9, 0x303b42],
  cell: [0xffdf66, 0x8a5a08],
  gem: [0x3f8dff, 0x183d9d],
  meat: [0xe6816f, 0x6f211a],
};

interface ResourceBand {
  min: number;
  max: number;
  items: ResourceId[];
}

const BANDS: ResourceBand[] = [
  { min: 8, max: 34, items: ['scrap', 'copper', 'quartz', 'coral', 'stone', 'scrap', 'copper'] },
  { min: 40, max: 82, items: ['fiber', 'oil', 'crystal', 'scrap', 'copper', 'fiber', 'oil', 'cell', 'scrap', 'crystal'] },
  { min: 98, max: 134, items: ['gem', 'crystal', 'oil', 'gem', 'quartz', 'gem', 'cell'] },
  { min: 145, max: 268, items: ['gem', 'cell', 'crystal', 'oil', 'scrap', 'quartz', 'gem'] },
];

function createResourceMesh(id: ResourceId): THREE.Group {
  const [color, emissive] = COLORS[id];
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity: id === 'stone' || id === 'scrap' ? 0.15 : 1.25,
    roughness: id === 'gem' || id === 'quartz' ? 0.25 : 0.7,
    metalness: id === 'scrap' || id === 'copper' ? 0.45 : 0.03,
  });
  const geometry = id === 'fiber'
    ? new THREE.ConeGeometry(0.38, 1.5, 7)
    : id === 'scrap'
      ? new THREE.BoxGeometry(1.15, 0.32, 0.72)
      : new THREE.DodecahedronGeometry(id === 'gem' ? 0.62 : 0.48, 0);
  const core = new THREE.Mesh(geometry, material);
  core.rotation.set(0.18, 0.4, 0.12);
  group.add(core);
  if (!['stone', 'scrap', 'copper'].includes(id)) {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.72, 18),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    halo.rotateX(-Math.PI / 2);
    halo.renderOrder = 1;
    group.add(halo);
  }
  return group;
}

export function createResourceNodes(scene: THREE.Scene): Interactable[] {
  const random = seededRandom(1907);
  const nodes: Interactable[] = [];
  BANDS.forEach((band, bandIndex) => {
    const count = bandIndex === 0 ? 38 : bandIndex === 1 ? 30 : bandIndex === 2 ? 28 : 46;
    for (let index = 0; index < count; index += 1) {
      const radius = band.min + random() * (band.max - band.min);
      const angle = random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = 8 + Math.sin(angle) * radius;
      const id = band.items[index % band.items.length];
      const mesh = createResourceMesh(id);
      mesh.position.set(x, floorAt(x, z) + 0.7, z);
      mesh.rotation.y = random() * Math.PI * 2;
      scene.add(mesh);
      nodes.push({
        id: `resource-${bandIndex}-${index}`,
        kind: 'resource',
        position: mesh.position,
        mesh,
        label: RESOURCE_NAMES[id],
        resource: id,
      });
    }
  });
  return nodes;
}
