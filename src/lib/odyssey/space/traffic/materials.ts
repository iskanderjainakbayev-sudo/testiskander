import * as THREE from 'three';
import type { TrafficMaterials } from './types';

export interface TrafficMaterialBundle {
  materials: TrafficMaterials;
  textures: THREE.Texture[];
}

function hash(x: number, y: number): number {
  const value = Math.sin(x * 91.17 + y * 37.31) * 43758.5453;
  return value - Math.floor(value);
}

function createSurfaceTexture(roughness: boolean): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (x + y * size) * 4;
      const seam = x % 32 < 2 || y % 16 < 1;
      const plate = ((Math.floor(x / 32) + Math.floor(y / 16)) % 3) * 7;
      const noise = Math.floor(hash(x, y) * 22);
      const value = roughness
        ? THREE.MathUtils.clamp(132 + noise + plate + (seam ? 60 : 0), 0, 255)
        : THREE.MathUtils.clamp(211 + noise - plate - (seam ? 38 : 0), 0, 255);
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 7);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = roughness ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const PLUME_VERTEX = `
varying vec2 vUvLocal;
#include <fog_pars_vertex>
void main(){
  vUvLocal=uv;
  vec4 localPosition=vec4(position,1.0);
  #ifdef USE_INSTANCING
    localPosition=instanceMatrix*localPosition;
  #endif
  vec4 mvPosition=modelViewMatrix*localPosition;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const PLUME_FRAGMENT = `
uniform float uTime;
varying vec2 vUvLocal;
#include <fog_pars_fragment>
void main(){
  float radial=abs(vUvLocal.x-.5)*2.0;
  float axial=1.0-vUvLocal.y;
  float pulse=.82+.18*sin(uTime*19.0+axial*31.0);
  float core=pow(max(0.0,1.0-radial),3.0);
  float fade=smoothstep(1.0,.08,axial)*smoothstep(0.0,.12,axial);
  float alpha=(core*.78+.12)*fade*pulse;
  vec3 color=mix(vec3(.04,.24,.72),vec3(.64,1.45,2.7),core);
  gl_FragColor=vec4(color*alpha,alpha);
  #include <fog_fragment>
}`;

const LANE_VERTEX = `
attribute float aPhase;
varying float vPhase;
#include <fog_pars_vertex>
void main(){
  vPhase=aPhase;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const LANE_FRAGMENT = `
uniform float uTime;
varying float vPhase;
#include <fog_pars_fragment>
void main(){
  float beacon=pow(.5+.5*sin(vPhase*85.0-uTime*2.4),12.0);
  float alpha=.055+beacon*.16;
  gl_FragColor=vec4(vec3(.12,.38,.58)*alpha,alpha);
  #include <fog_fragment>
}`;

export function createTrafficMaterials(): TrafficMaterialBundle {
  const colorMap = createSurfaceTexture(false);
  const roughnessMap = createSurfaceTexture(true);
  const hull = new THREE.MeshPhysicalMaterial({
    color: 0xb7c0c4,
    map: colorMap,
    bumpMap: roughnessMap,
    bumpScale: .035,
    metalness: .76,
    roughness: .47,
    roughnessMap,
    clearcoat: .14,
    clearcoatRoughness: .62,
  });
  const detail = new THREE.MeshStandardMaterial({
    color: 0x1a2329,
    metalness: .87,
    roughness: .34,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x16404c,
    emissive: 0x0b8198,
    emissiveIntensity: 2.1,
    metalness: .42,
    roughness: .15,
  });
  const plume = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: PLUME_VERTEX,
    fragmentShader: PLUME_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: true,
  });
  const port = new THREE.MeshBasicMaterial({ color: 0xff3d36, toneMapped: false });
  const starboard = new THREE.MeshBasicMaterial({ color: 0x49ffc5, toneMapped: false });
  const contrail = new THREE.LineBasicMaterial({
    color: 0x4dbbe0,
    transparent: true,
    opacity: .21,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const lane = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: LANE_VERTEX,
    fragmentShader: LANE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: true,
  });
  return {
    materials: { hull, detail, glass, plume, port, starboard, contrail, lane },
    textures: [colorMap, roughnessMap],
  };
}
