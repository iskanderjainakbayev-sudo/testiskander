import * as THREE from 'three';
import {
  makeBrushedMetal,
  makeFloorSurface,
  makeMicroNormal,
  makeScreenTexture,
} from './interiorTextures';

export interface InteriorMaterials {
  shell: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  panel: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  recess: THREE.MeshStandardMaterial;
  conduit: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  cyan: THREE.MeshStandardMaterial;
  upholstery: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
}

export function createInteriorMaterials(): InteriorMaterials {
  const brushed = makeBrushedMetal();
  const floorMap = makeFloorSurface();
  const microNormal = makeMicroNormal();
  return {
    shell: standard(0x777d79, 0.62, 0.58, brushed, microNormal),
    frame: standard(0x151a1b, 0.46, 0.82, undefined, microNormal),
    panel: standard(0x3a4140, 0.72, 0.52, undefined, microNormal),
    floor: standard(0x5d6460, 0.86, 0.34, floorMap, microNormal),
    trim: standard(0x777166, 0.48, 0.78, undefined, microNormal),
    recess: standard(0x090d0e, 0.58, 0.72),
    conduit: standard(0x5a493d, 0.56, 0.78, undefined, microNormal),
    accent: emissive(0x38200e, 0xff9b49, 3.4),
    cyan: emissive(0x102c2e, 0x62d5d1, 2.2),
    upholstery: standard(0x171918, 0.94, 0.02, undefined, microNormal),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x78969a,
      roughness: 0.2,
      metalness: 0.02,
      transmission: 0.38,
      thickness: 0.08,
      ior: 1.46,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
}

function standard(
  color: number,
  roughness: number,
  metalness: number,
  map?: THREE.Texture,
  normalMap?: THREE.Texture,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    map,
    normalMap,
    normalScale: normalMap ? new THREE.Vector2(0.22, 0.22) : undefined,
  });
}

function emissive(color: number, glow: number, intensity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: glow,
    emissiveIntensity: intensity,
    roughness: 0.34,
    metalness: 0.58,
  });
}

export function createScreenMaterial(title: string, accent = '#eab16d'): THREE.MeshStandardMaterial {
  const texture = makeScreenTexture(title, accent);
  return new THREE.MeshStandardMaterial({
    color: 0xd9ffff,
    map: texture,
    emissive: 0x5abec0,
    emissiveMap: texture,
    emissiveIntensity: 0.72,
    roughness: 0.3,
    metalness: 0.08,
  });
}

type TextureSlot =
  | 'map'
  | 'normalMap'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'emissiveMap'
  | 'alphaMap';

const TEXTURE_SLOTS: readonly TextureSlot[] = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'alphaMap',
];

export function disposeMaterial(material: THREE.Material): void {
  const textured = material as THREE.Material & Partial<Record<TextureSlot, THREE.Texture | null>>;
  const textures = new Set<THREE.Texture>();
  TEXTURE_SLOTS.forEach((slot) => {
    const texture = textured[slot];
    if (texture) textures.add(texture);
  });
  textures.forEach((texture) => texture.dispose());
  material.dispose();
}
