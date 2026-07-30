import * as THREE from 'three';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import { createLandingEquipment } from './createLandingEquipment';
import { createRainSplashes } from './createRainSplashes';
import { createSolaceRain } from './createSolaceRain';
import { createSurfaceDetails } from './createSurfaceDetails';
import { createSurfaceSun } from './createSurfaceSun';
import { surfaceHeight } from './terrainNoise';
import {
  TERRAIN_FRAGMENT,
  TERRAIN_VERTEX,
  WATER_FRAGMENT,
} from './surfaceShaders';
import { SKY_FRAGMENT } from './surfaceAtmosphereShaders';

export interface SolaceSurface {
  group: THREE.Group;
  sampleSites: THREE.Object3D[];
  getHeight: (x: number, z: number) => number;
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
}

const SKY_VERTEX = `
varying vec3 vDirection;
void main() {
  vDirection=normalize(position);
  vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  gl_Position=clip.xyww;
}`;

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(900, 900, 176, 176);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    positions.setY(index, surfaceHeight(positions.getX(index), positions.getZ(index)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERTEX,
    fragmentShader: TERRAIN_FRAGMENT,
  });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  return terrain;
}

function createWater() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: TERRAIN_VERTEX,
    fragmentShader: WATER_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.forceSinglePass = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), material);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 1.75;
  water.renderOrder = 2;
  return water;
}

function createSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(720, 4), material);
  sky.frustumCulled = false;
  sky.renderOrder = -20;
  return sky;
}

export function createSolaceSurface(): SolaceSurface {
  const group = new THREE.Group();
  group.name = 'Solace surface biome';
  group.visible = false;
  const terrain = createTerrain();
  const water = createWater();
  const sky = createSky();
  const precipitation = createSolaceRain();
  const details = createSurfaceDetails();
  const splashes = createRainSplashes();
  const landingEquipment = createLandingEquipment(surfaceHeight, 45);
  const sun = createSurfaceSun();
  group.add(sky, terrain, water, precipitation, splashes.points, details.root, landingEquipment);
  group.add(sun.light, sun.target, new THREE.HemisphereLight(0x547a82, 0x071011, 0.75));
  return {
    group,
    sampleSites: details.sampleSites,
    getHeight: surfaceHeight,
    update: (time, camera) => {
      (water.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (sky.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (precipitation.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      splashes.update(time);
      sun.update(camera);
      sky.position.copy(camera.position);
      precipitation.position.set(
        camera.position.x,
        camera.position.y - 3.5,
        camera.position.z,
      );
      details.update(time);
    },
    dispose: () => disposeSpaceScene(group),
  };
}
