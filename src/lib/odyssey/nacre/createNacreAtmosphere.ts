import * as THREE from 'three';
import { nacreRandom } from './nacreNoise';
import {
  NACRE_DUST_FRAGMENT,
  NACRE_DUST_VERTEX,
  NACRE_SKY_FRAGMENT,
  NACRE_SKY_VERTEX,
} from './nacreSurfaceShaders';

export interface NacreAtmosphere {
  sky: THREE.Mesh;
  dust: THREE.Points;
  update: (time: number, camera: THREE.Camera) => void;
}

function createSky(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: NACRE_SKY_VERTEX,
    fragmentShader: NACRE_SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(720, 4), material);
  sky.name = 'NACRE sun and dusty sky';
  sky.frustumCulled = false;
  sky.renderOrder = -20;
  return sky;
}

function createDust(): THREE.Points {
  const random = nacreRandom(0xd057c10d);
  const count = 1_450;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 190;
    positions[index * 3 + 1] = 2.2 + Math.pow(random(), 1.18) * 112;
    positions[index * 3 + 2] = (random() - 0.5) * 180;
    phases[index] = random();
    sizes[index] = 0.55 + random() * 1.7;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: NACRE_DUST_VERTEX,
    fragmentShader: NACRE_DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(geometry, material);
  dust.name = 'High-altitude silica dust';
  dust.frustumCulled = false;
  dust.renderOrder = 8;
  return dust;
}

export function createNacreAtmosphere(): NacreAtmosphere {
  const sky = createSky();
  const dust = createDust();
  return {
    sky,
    dust,
    update: (time, camera) => {
      (sky.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (dust.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      sky.position.copy(camera.position);
      dust.position.set(camera.position.x, 0, camera.position.z);
    },
  };
}
