import * as THREE from 'three';
import { createErodedMountainGeometry } from './createNacreGeology';
import { createNacreGrounding, placeNacreGrounding } from './createNacreGrounding';
import { createNacreSample } from './createNacreSample';
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
  const mesh = new THREE.InstancedMesh(createErodedMountainGeometry(), shader, 50);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < mesh.count; index += 1) {
    const angle = index * 2.399963 + (random() - 0.5) * 0.38;
    const farLayer = index >= 34;
    const radius = farLayer ? 445 + random() * 104 : 338 + random() * 118;
    const height = (farLayer ? 48 : 62) + random() * (farLayer ? 62 : 78);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    dummy.position.set(x, nacreHeight(x, z) - 1.5, z);
    dummy.rotation.set((random() - 0.5) * 0.045, random() * Math.PI * 2, (random() - 0.5) * 0.04);
    dummy.scale.set(31 + random() * 46, height, 25 + random() * 37);
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
    dummy.rotation.set(
      crowns ? (random() - 0.5) * 0.7 : random() * 0.16,
      random() * Math.PI * 2,
      crowns ? 0.38 + random() * 0.83 : random() * 0.12,
    );
    dummy.scale.set(0.48 + random() * 0.72, height / (crowns ? 3.3 : 6), 0.48 + random() * 0.72);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.name = crowns ? 'Translucent mineral crowns' : 'Translucent mineral forest';
  return finalize(mesh);
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
  const sampleSites = coordinates.map(
    ([x, z], index) => createNacreSample(spire, mineralMaterial, x, z, index),
  );
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
