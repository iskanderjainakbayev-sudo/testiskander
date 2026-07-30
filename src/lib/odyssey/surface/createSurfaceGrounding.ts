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

export function placeSurfaceGrounding(
  mesh: THREE.InstancedMesh,
  dummy: THREE.Object3D,
  index: number,
  x: number,
  z: number,
  scale: number,
) {
  dummy.position.set(x + scale * 0.17, surfaceHeight(x, z) + 0.035, z - scale * 0.08);
  dummy.rotation.set(-Math.PI / 2, 0, 0);
  dummy.scale.set(scale * 1.5, scale * 0.8, 1);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}
