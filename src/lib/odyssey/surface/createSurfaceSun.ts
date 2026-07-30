import * as THREE from 'three';

const SHADOW_EXTENT = 90;
const SHADOW_MAP_SIZE = 1024;
const SHADOW_TEXEL = SHADOW_EXTENT * 2 / SHADOW_MAP_SIZE;

export interface SurfaceSun {
  light: THREE.DirectionalLight;
  target: THREE.Object3D;
  update: (camera: THREE.Camera) => void;
}

export function createSurfaceSun(): SurfaceSun {
  const light = new THREE.DirectionalLight(0xb9d6d2, 2.7);
  const target = new THREE.Object3D();
  light.target = target;
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  light.shadow.camera.left = -SHADOW_EXTENT;
  light.shadow.camera.right = SHADOW_EXTENT;
  light.shadow.camera.top = SHADOW_EXTENT;
  light.shadow.camera.bottom = -SHADOW_EXTENT;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 430;
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.normalBias = 0.035;
  light.position.set(-140, 210, 90);

  const update = (camera: THREE.Camera): void => {
    const x = Math.round(camera.position.x / SHADOW_TEXEL) * SHADOW_TEXEL;
    const z = Math.round(camera.position.z / SHADOW_TEXEL) * SHADOW_TEXEL;
    target.position.set(x, 0, z);
    light.position.set(x - 140, 210, z + 90);
  };
  return { light, target, update };
}
