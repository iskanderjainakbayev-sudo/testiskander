import * as THREE from 'three';
import { createSurfaceGrounding, placeSurfaceGrounding } from './createSurfaceGrounding';
import { seededRandom, surfaceHeight } from './terrainNoise';

export interface SurfaceDetails {
  root: THREE.Group;
  sampleSites: THREE.Object3D[];
  update: (time: number) => void;
}

function addRockField(root: THREE.Group) {
  const random = seededRandom(0x51a9ce);
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x26363b,
    roughness: 0.83,
    metalness: 0.08,
  });
  const rocks = new THREE.InstancedMesh(geometry, material, 230);
  const grounding = createSurfaceGrounding(230);
  const dummy = new THREE.Object3D();
  const shadowDummy = new THREE.Object3D();
  for (let index = 0; index < 230; index += 1) {
    let x = 0;
    let z = 0;
    do {
      const angle = random() * Math.PI * 2;
      const radius = 26 + Math.pow(random(), 0.55) * 390;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    } while ((x / 30) ** 2 + ((z - 70) / 51) ** 2 < 1);
    const height = surfaceHeight(x, z);
    const scale = 0.45 + random() * random() * 4.8;
    placeSurfaceGrounding(grounding, shadowDummy, index, x, z, scale);
    dummy.position.set(x, height - scale * 0.18, z);
    dummy.rotation.set(random() * 2.5, random() * Math.PI, random() * 1.7);
    dummy.scale.set(scale * (0.7 + random() * 0.8), scale, scale * (0.65 + random() * 0.7));
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  grounding.instanceMatrix.needsUpdate = true;
  grounding.computeBoundingSphere();
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  root.add(rocks, grounding);
}

function createSampleSite(
  position: THREE.Vector3,
  index: number,
  crystalMaterial: THREE.MeshPhysicalMaterial,
) {
  const site = new THREE.Group();
  site.name = `ECHO_BLOOM_${index + 1}`;
  site.position.copy(position);
  const geometry = new THREE.ConeGeometry(0.24, 1, 5, 2);
  const crystals = new THREE.InstancedMesh(geometry, crystalMaterial, 9);
  const random = seededRandom(0xec40b100 + index * 7919);
  const dummy = new THREE.Object3D();
  for (let shard = 0; shard < crystals.count; shard += 1) {
    const angle = shard * 2.399963 + (random() - 0.5) * 0.42;
    const radius = 0.14 + Math.sqrt(shard / crystals.count) * (0.74 + random() * 0.25);
    const height = 0.82 + random() * random() * 3.25;
    dummy.position.set(Math.cos(angle) * radius, height * 0.48, Math.sin(angle) * radius);
    dummy.rotation.set((random() - 0.5) * 0.28, angle, (random() - 0.5) * 0.32);
    dummy.scale.set(0.72 + random() * 0.6, height, 0.72 + random() * 0.5);
    dummy.updateMatrix();
    crystals.setMatrixAt(shard, dummy.matrix);
  }
  crystals.instanceMatrix.needsUpdate = true;
  crystals.computeBoundingSphere();
  crystals.castShadow = true;
  site.add(crystals);
  const halo = new THREE.PointLight(0x66d9d1, 3.8, 14, 2);
  halo.position.y = 1.1;
  site.add(halo);
  return site;
}

export function createSurfaceDetails(): SurfaceDetails {
  const root = new THREE.Group();
  addRockField(root);
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7fc7c1,
    emissive: 0x153f42,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.08,
    clearcoat: 0.24,
  });
  const coordinates: Array<[number, number]> = [[42, -38], [-64, -74], [18, -142]];
  const sampleSites = coordinates.map(([x, z], index) => {
    const site = createSampleSite(
      new THREE.Vector3(x, surfaceHeight(x, z), z),
      index,
      crystalMaterial,
    );
    root.add(site);
    return site;
  });
  return {
    root,
    sampleSites,
    update: (time) => {
      for (let index = 0; index < sampleSites.length; index += 1) {
        const site = sampleSites[index];
        site.rotation.y = Math.sin(time * 0.17 + index * 1.7) * 0.026;
        const light = site.children[site.children.length - 1];
        if (light instanceof THREE.PointLight) {
          light.intensity = 3.5 + Math.sin(time * 1.4 + index) * 0.65;
        }
      }
    },
  };
}
