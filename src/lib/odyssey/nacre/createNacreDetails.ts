import * as THREE from 'three';
import { createNacreGrounding, placeNacreGrounding } from './createNacreGrounding';
import { nacreHeight, nacreRandom } from './nacreNoise';
import {
  NACRE_INSTANCE_VERTEX,
  NACRE_MINERAL_FRAGMENT,
  NACRE_MOUNTAIN_FRAGMENT,
  NACRE_ROCK_FRAGMENT,
} from './nacreDetailShaders';

export interface NacreDetails {
  root: THREE.Group;
  sampleSites: THREE.Object3D[];
  update: (time: number) => void;
}
function material(
  fragmentShader: string,
  options: Partial<THREE.ShaderMaterialParameters> = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: NACRE_INSTANCE_VERTEX,
    fragmentShader,
    ...options,
  });
}
function finalize(mesh: THREE.InstancedMesh): THREE.InstancedMesh {
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
function createMountains(shader: THREE.ShaderMaterial): THREE.InstancedMesh {
  const random = nacreRandom(0x4e414352);
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), shader, 38);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < mesh.count; index += 1) {
    const angle = index / mesh.count * Math.PI * 2 + (random() - 0.5) * 0.11;
    const radius = 385 + random() * 92;
    const height = 48 + random() * 66;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    dummy.position.set(x, nacreHeight(x, z) + height * 0.22, z);
    dummy.rotation.set(random() * 0.14, random() * Math.PI, random() * 0.12);
    dummy.scale.set(42 + random() * 38, height, 31 + random() * 31);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.name = 'Wind-eroded mountain horizon';
  return finalize(mesh);
}
function createRocks(
  shader: THREE.ShaderMaterial,
  grounding: THREE.InstancedMesh,
): THREE.InstancedMesh {
  const random = nacreRandom(0x51ca17);
  const mesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), shader, 175);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < mesh.count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 31 + Math.pow(random(), 0.57) * 345;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 12;
    const scale = 0.4 + random() * random() * 4.1;
    dummy.position.set(x, nacreHeight(x, z) - scale * 0.16, z);
    placeNacreGrounding(grounding, index, x, z, scale);
    dummy.rotation.set(random() * 2.4, random() * Math.PI, random() * 1.8);
    dummy.scale.set(scale * (0.7 + random()), scale, scale * (0.7 + random() * 0.8));
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.name = 'Canyon talus';
  grounding.instanceMatrix.needsUpdate = true;
  grounding.computeBoundingSphere();
  return finalize(mesh);
}

const FOREST_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [-128, -102], [121, -91], [-168, 118], [142, 164], [18, -185],
];
function createForest(
  geometry: THREE.BufferGeometry,
  shader: THREE.ShaderMaterial,
  count: number,
  seed: number,
  crowns: boolean,
): THREE.InstancedMesh {
  const random = nacreRandom(seed);
  const mesh = new THREE.InstancedMesh(geometry, shader, count);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const center = FOREST_CENTERS[index % FOREST_CENTERS.length];
    const angle = random() * Math.PI * 2;
    const radius = Math.pow(random(), 0.7) * 66;
    const x = center[0] + Math.cos(angle) * radius;
    const z = center[1] + Math.sin(angle) * radius;
    const height = 2.8 + random() * random() * 10.8;
    dummy.position.set(x, nacreHeight(x, z) + (crowns ? height * 0.72 : height * 0.46), z);
    dummy.rotation.set(crowns ? random() * 1.2 : random() * 0.16, random() * Math.PI, crowns ? 1.15 : random() * 0.12);
    dummy.scale.set(0.48 + random() * 0.72, height / (crowns ? 3.3 : 6), 0.48 + random() * 0.72);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.name = crowns ? 'Translucent mineral crowns' : 'Translucent mineral forest';
  return finalize(mesh);
}
function createSample(
  geometry: THREE.BufferGeometry,
  shader: THREE.ShaderMaterial,
  x: number,
  z: number,
  index: number,
): THREE.Group {
  const site = new THREE.Group();
  site.name = `NACRE_PRISM_SAMPLE_${index + 1}`;
  site.position.set(x, nacreHeight(x, z), z);
  const shards = new THREE.InstancedMesh(geometry, shader, 11);
  const dummy = new THREE.Object3D();
  for (let shard = 0; shard < shards.count; shard += 1) {
    const angle = shard / shards.count * Math.PI * 2;
    const height = 1.8 + ((shard * 1.618) % 1) * 4.2;
    dummy.position.set(Math.cos(angle) * 1.15, height * 0.47, Math.sin(angle) * 1.15);
    dummy.rotation.set(Math.sin(shard) * 0.16, angle, Math.cos(shard) * 0.13);
    dummy.scale.set(0.72, height / 6, 0.72);
    dummy.updateMatrix();
    shards.setMatrixAt(shard, dummy.matrix);
  }
  site.add(finalize(shards));
  return site;
}

export function createNacreDetails(): NacreDetails {
  const root = new THREE.Group();
  const rockMaterial = material(NACRE_ROCK_FRAGMENT);
  const mountainMaterial = material(NACRE_MOUNTAIN_FRAGMENT);
  const mineralMaterial = material(NACRE_MINERAL_FRAGMENT);
  const spire = new THREE.ConeGeometry(0.62, 6, 7, 2);
  const crown = new THREE.ConeGeometry(0.42, 3.3, 6, 1);
  const grounding = createNacreGrounding(175);
  root.add(createMountains(mountainMaterial), createRocks(rockMaterial, grounding), grounding);
  root.add(createForest(spire, mineralMaterial, 205, 0xf012e57, false));
  root.add(createForest(crown, mineralMaterial, 126, 0xc20a7, true));
  const coordinates: Array<[number, number]> = [[48, -34], [-79, -91], [91, -146]];
  const sampleSites = coordinates.map(([x, z], index) => createSample(spire, mineralMaterial, x, z, index));
  root.add(...sampleSites);
  return {
    root,
    sampleSites,
    update: (time) => {
      mineralMaterial.uniforms.uTime.value = time;
      for (let index = 0; index < sampleSites.length; index += 1) {
        sampleSites[index].rotation.y = Math.sin(time * 0.12 + index) * 0.08;
      }
    },
  };
}
