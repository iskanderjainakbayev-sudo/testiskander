import * as THREE from 'three';
import { nacreHeight } from './nacreNoise';

const SHADOW_VERTEX = `
precision highp float;
varying vec2 vUv;
void main(){
  vUv=uv;
  vec4 instancePosition=instanceMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*modelViewMatrix*instancePosition;
}`;

const SHADOW_FRAGMENT = `
precision highp float;
varying vec2 vUv;
void main(){
  vec2 p=(vUv-0.5)*2.0;
  float radial=dot(p,p);
  float core=1.0-smoothstep(0.08,1.0,radial);
  gl_FragColor=vec4(0.055,0.012,0.004,core*0.31);
}`;

export function createNacreGrounding(count: number) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHADOW_VERTEX,
    fragmentShader: SHADOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = 'Soft contact shadows beneath canyon talus';
  mesh.renderOrder = 1;
  return mesh;
}

const PLANE_NORMAL = new THREE.Vector3(0, 0, 1);
const terrainNormal = new THREE.Vector3();
const contactPosition = new THREE.Vector3();
const groundingDummy = new THREE.Object3D();

export function placeNacreGrounding(
  mesh: THREE.InstancedMesh,
  index: number,
  x: number,
  z: number,
  scale: number,
) {
  const shadowX = x + scale * 0.2;
  const shadowZ = z - scale * 0.1;
  const step = Math.max(0.55, scale * 0.2);
  terrainNormal.set(
    nacreHeight(shadowX - step, shadowZ) - nacreHeight(shadowX + step, shadowZ),
    step * 2,
    nacreHeight(shadowX, shadowZ - step) - nacreHeight(shadowX, shadowZ + step),
  ).normalize();
  contactPosition
    .set(shadowX, nacreHeight(shadowX, shadowZ), shadowZ)
    .addScaledVector(terrainNormal, 0.035);
  groundingDummy.position.copy(contactPosition);
  groundingDummy.quaternion.setFromUnitVectors(PLANE_NORMAL, terrainNormal);
  groundingDummy.scale.set(scale * 1.45, scale * 0.78, 1);
  groundingDummy.updateMatrix();
  mesh.setMatrixAt(index, groundingDummy.matrix);
}
