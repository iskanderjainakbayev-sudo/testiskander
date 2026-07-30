import * as THREE from 'three';
import { seededRandom, surfaceHeight } from './terrainNoise';

const VERTEX = `
precision highp float;
attribute float aPhase;
attribute float aSize;
uniform float uTime;
varying vec2 vUv;
varying float vAge;
void main(){
  vAge=fract(aPhase+uTime*(0.18+aPhase*0.07));
  vUv=uv;
  float radius=aSize*(0.06+vAge*0.42);
  vec3 local=vec3(position.xy*radius,position.z);
  vec4 world=modelMatrix*instanceMatrix*vec4(local,1.0);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
varying float vAge;
void main(){
  float radius=length(vUv-0.5);
  float ring=exp(-abs(radius-(0.13+vAge*0.30))*62.0);
  float crown=exp(-radius*19.0)*(1.0-vAge);
  float alpha=(ring*0.19+crown*0.12)*sin(vAge*3.14159)*(1.0-vAge);
  if(alpha<0.006)discard;
  gl_FragColor=vec4(0.43,0.65,0.66,alpha);
}`;

export interface RainSplashes {
  points: THREE.InstancedMesh;
  update: (time: number) => void;
}

const PLANE_NORMAL = new THREE.Vector3(0, 0, 1);
const surfaceNormal = new THREE.Vector3();
const impactPosition = new THREE.Vector3();

function orientImpact(
  dummy: THREE.Object3D,
  x: number,
  z: number,
  waterHeight: number,
) {
  const ground = surfaceHeight(x, z);
  const y = Math.max(ground, waterHeight);
  if (ground < waterHeight) {
    surfaceNormal.set(0, 1, 0);
  } else {
    const step = 0.65;
    surfaceNormal.set(
      surfaceHeight(x - step, z) - surfaceHeight(x + step, z),
      step * 2,
      surfaceHeight(x, z - step) - surfaceHeight(x, z + step),
    ).normalize();
  }
  impactPosition.set(x, y, z).addScaledVector(surfaceNormal, 0.035);
  dummy.position.copy(impactPosition);
  dummy.quaternion.setFromUnitVectors(PLANE_NORMAL, surfaceNormal);
  dummy.updateMatrix();
}

export function createRainSplashes(): RainSplashes {
  const count = 380;
  const random = seededRandom(0x5a1a5e);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const geometry = new THREE.PlaneGeometry(2, 2);
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  material.forceSinglePass = true;
  const points = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 10 + Math.sqrt(random()) * 255;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    phases[index] = random();
    sizes[index] = 0.72 + random() * 1.5;
    orientImpact(dummy, x, z, 1.78);
    points.setMatrixAt(index, dummy.matrix);
  }
  points.instanceMatrix.needsUpdate = true;
  points.computeBoundingSphere();
  points.name = 'Terrain-aligned Solace rain impact ripples';
  points.renderOrder = 7;
  return {
    points,
    update: (time) => { material.uniforms.uTime.value = time; },
  };
}
