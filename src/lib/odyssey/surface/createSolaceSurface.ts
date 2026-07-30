import * as THREE from 'three';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import { createLandingEquipment } from './createLandingEquipment';
import { createRainSplashes } from './createRainSplashes';
import { createSurfaceDetails } from './createSurfaceDetails';
import { seededRandom, surfaceHeight } from './terrainNoise';
import {
  TERRAIN_FRAGMENT,
  TERRAIN_VERTEX,
  WATER_FRAGMENT,
} from './surfaceShaders';
import {
  RAIN_FRAGMENT,
  RAIN_VERTEX,
  SKY_FRAGMENT,
} from './surfaceAtmosphereShaders';

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

function createPrecipitation() {
  const random = seededRandom(0x501ace);
  const count = 760;
  const positions = new Float32Array(count * 6);
  const tails = new Float32Array(count * 2);
  const speeds = new Float32Array(count * 2);
  for (let index = 0; index < count; index += 1) {
    const base = index * 6;
    const x = (random() - 0.5) * 100;
    const y = random() * 42;
    const z = (random() - 0.5) * 100;
    const speed = 6.4 + random() * 5.1;
    positions.set([x, y, z, x, y, z], base);
    tails[index * 2 + 1] = 1;
    speeds[index * 2] = speeds[index * 2 + 1] = speed;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTail', new THREE.BufferAttribute(tails, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: RAIN_VERTEX,
    fragmentShader: RAIN_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.LineSegments(geometry, material);
}

export function createSolaceSurface(): SolaceSurface {
  const group = new THREE.Group();
  group.name = 'Solace surface biome';
  group.visible = false;
  const terrain = createTerrain();
  const water = createWater();
  const sky = createSky();
  const precipitation = createPrecipitation();
  const details = createSurfaceDetails();
  const splashes = createRainSplashes();
  const landingEquipment = createLandingEquipment(surfaceHeight, 45);
  group.add(sky, terrain, water, precipitation, splashes.points, details.root, landingEquipment);
  const sun = new THREE.DirectionalLight(0xb9d6d2, 2.7);
  sun.position.set(-140, 210, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -90;
  sun.shadow.camera.right = sun.shadow.camera.top = 90;
  group.add(sun, new THREE.HemisphereLight(0x547a82, 0x071011, 0.75));
  return {
    group,
    sampleSites: details.sampleSites,
    getHeight: surfaceHeight,
    update: (time, camera) => {
      (water.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (sky.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (precipitation.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      splashes.update(time);
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
