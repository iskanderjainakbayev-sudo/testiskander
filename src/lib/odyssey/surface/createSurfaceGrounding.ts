import * as THREE from 'three';
import { surfaceHeight } from './terrainNoise';

const VERTEX = `
precision highp float;
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
void main(){
  vec2 p=(vUv-0.5)*2.0;
  float radial=dot(p,p);
  float opacity=(1.0-smoothstep(0.06,1.0,radial))*0.34;
  gl_FragColor=vec4(0.006,0.018,0.022,opacity);
}`;

export function createSurfaceGrounding(count: number) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = 'Rain-softened rock contact shadows';
  mesh.renderOrder = 1;
  return mesh;
}

const PLANE_NORMAL = new THREE.Vector3(0, 0, 1);
const terrainNormal = new THREE.Vector3();
const contactPosition = new THREE.Vector3();

export function placeSurfaceGrounding(
  mesh: THREE.InstancedMesh,
  dummy: THREE.Object3D,
  index: number,
  x: number,
  z: number,
  scale: number,
) {
  const shadowX = x + scale * 0.17;
  const shadowZ = z - scale * 0.08;
  const step = Math.max(0.55, scale * 0.2);
  terrainNormal.set(
    surfaceHeight(shadowX - step, shadowZ) - surfaceHeight(shadowX + step, shadowZ),
    step * 2,
    surfaceHeight(shadowX, shadowZ - step) - surfaceHeight(shadowX, shadowZ + step),
  ).normalize();
  contactPosition
    .set(shadowX, surfaceHeight(shadowX, shadowZ), shadowZ)
    .addScaledVector(terrainNormal, 0.035);
  dummy.position.copy(contactPosition);
  dummy.quaternion.setFromUnitVectors(PLANE_NORMAL, terrainNormal);
  dummy.scale.set(scale * 1.5, scale * 0.8, 1);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}
