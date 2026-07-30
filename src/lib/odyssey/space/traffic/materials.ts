import * as THREE from 'three';
import type { TrafficMaterials } from './types';
import {
  LANE_FRAGMENT,
  LANE_VERTEX,
  PLUME_FRAGMENT,
  PLUME_VERTEX,
} from './trafficShaders';

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
