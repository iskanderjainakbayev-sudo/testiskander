import * as THREE from 'three';
import { nacreHeight, nacreRandom } from './nacreNoise';

export function createNacreSample(
  geometry: THREE.BufferGeometry,
  shader: THREE.ShaderMaterial,
  x: number,
  z: number,
  index: number,
): THREE.Group {
  const site = new THREE.Group();
  site.name = `NACRE_PRISM_SAMPLE_${index + 1}`;
  site.position.set(x, nacreHeight(x, z), z);
  const shards = new THREE.InstancedMesh(geometry, shader, 13);
  const random = nacreRandom(0x7a11ca + index * 3571);
  const dummy = new THREE.Object3D();
  for (let shard = 0; shard < shards.count; shard += 1) {
    const angle = shard * 2.399963 + (random() - 0.5) * 0.48;
    const radius = 0.16 + Math.sqrt(shard / shards.count) * (1.05 + random() * 0.38);
    const height = 1.25 + random() * random() * 5.2;
    dummy.position.set(
      Math.cos(angle) * radius,
      height * 0.47,
      Math.sin(angle) * radius,
    );
    dummy.rotation.set(
      (random() - 0.5) * 0.25,
      angle + random() * 0.32,
      (random() - 0.5) * 0.28,
    );
    const width = 0.58 + random() * 0.64;
    dummy.scale.set(width, height / 6, width * (0.78 + random() * 0.35));
    dummy.updateMatrix();
    shards.setMatrixAt(shard, dummy.matrix);
  }
  shards.instanceMatrix.needsUpdate = true;
  shards.computeBoundingSphere();
  site.add(shards);
  return site;
}
