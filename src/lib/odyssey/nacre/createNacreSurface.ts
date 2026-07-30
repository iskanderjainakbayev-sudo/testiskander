import * as THREE from 'three';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import { createNacreAtmosphere } from './createNacreAtmosphere';
import { createNacreDetails } from './createNacreDetails';
import { nacreHeight } from './nacreNoise';
import {
  NACRE_TERRAIN_FRAGMENT,
  NACRE_TERRAIN_VERTEX,
} from './nacreSurfaceShaders';

export interface NacreSurface {
  group: THREE.Group;
  sampleSites: THREE.Object3D[];
  getHeight: (x: number, z: number) => number;
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
}

function createTerrain(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(920, 920, 168, 168);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    positions.setY(index, nacreHeight(positions.getX(index), positions.getZ(index)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    vertexShader: NACRE_TERRAIN_VERTEX,
    fragmentShader: NACRE_TERRAIN_FRAGMENT,
  });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.name = 'NACRE wind-carved canyon terrain';
  terrain.receiveShadow = false;
  terrain.castShadow = false;
  return terrain;
}

export function createNacreSurface(): NacreSurface {
  const group = new THREE.Group();
  group.name = 'NACRE ochre silica biome';
  group.visible = false;
  const terrain = createTerrain();
  const details = createNacreDetails();
  const atmosphere = createNacreAtmosphere();
  group.add(atmosphere.sky, terrain, atmosphere.dust, details.root);

  const sun = new THREE.DirectionalLight(0xffc27a, 3.1);
  sun.position.set(-170, 220, 95);
  const ambient = new THREE.HemisphereLight(0xd7864d, 0x2b1009, 0.7);
  group.add(sun, ambient);

  return {
    group,
    sampleSites: details.sampleSites,
    getHeight: nacreHeight,
    update: (time, camera) => {
      atmosphere.update(time, camera);
      details.update(time);
    },
    dispose: () => disposeSpaceScene(group),
  };
}
