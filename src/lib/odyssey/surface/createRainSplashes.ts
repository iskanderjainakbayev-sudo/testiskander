import * as THREE from 'three';
import { seededRandom, surfaceHeight } from './terrainNoise';

const VERTEX = `
precision highp float;
attribute float aPhase;
attribute float aSize;
uniform float uTime;
varying float vAge;
varying float vAlpha;
void main(){
  vAge=fract(aPhase+uTime*(0.18+aPhase*0.07));
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(aSize*(1.0+vAge*4.2)*115.0/max(1.0,-mv.z),0.5,15.0);
  vAlpha=sin(vAge*3.14159)*(1.0-vAge);
}`;

const FRAGMENT = `
precision highp float;
varying float vAge;
varying float vAlpha;
void main(){
  float radius=length(gl_PointCoord-0.5);
  float ring=exp(-abs(radius-(0.16+vAge*0.26))*55.0);
  float crown=exp(-radius*18.0)*(1.0-vAge);
  float alpha=(ring*0.34+crown*0.22)*vAlpha;
  if(alpha<0.01)discard;
  gl_FragColor=vec4(0.48,0.78,0.80,alpha);
}`;

export interface RainSplashes {
  points: THREE.Points;
  update: (time: number) => void;
}

export function createRainSplashes(): RainSplashes {
  const count = 420;
  const random = seededRandom(0x5a1a5e);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 12 + Math.sqrt(random()) * 235;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.set([x, surfaceHeight(x, z) + 0.08, z], index * 3);
    phases[index] = random();
    sizes[index] = 0.75 + random() * 1.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'Solace rain impact crowns';
  points.renderOrder = 7;
  return {
    points,
    update: (time) => { material.uniforms.uTime.value = time; },
  };
}
