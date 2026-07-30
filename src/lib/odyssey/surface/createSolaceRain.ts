import * as THREE from 'three';
import { seededRandom } from './terrainNoise';
import {
  RAIN_FRAGMENT,
  RAIN_VERTEX,
} from './surfaceAtmosphereShaders';

export function createSolaceRain(): THREE.LineSegments {
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
  const rain = new THREE.LineSegments(geometry, material);
  rain.name = 'Camera-anchored Solace rain volume';
  return rain;
}
