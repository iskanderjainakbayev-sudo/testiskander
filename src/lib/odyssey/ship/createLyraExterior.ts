import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GameMode } from '../types';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import {
  configureLyraModel,
  selectLyraLod,
  type LyraVariant,
} from './configureLyraModel';

export interface LyraExterior {
  spaceGroup: THREE.Group;
  landedGroup: THREE.Group;
  ready: Promise<boolean>;
  update: (
    camera: THREE.Camera,
    mode: GameMode,
    progress: number,
    groundHeight: (x: number, z: number) => number,
    rootZ: number,
  ) => void;
  setSpaceVisible: (visible: boolean) => void;
  dispose: () => void;
}

const MODEL_URL = new URL(
  '../../../../assets/models/odyssey/lyra-exterior.glb',
  import.meta.url,
).href;

export function createLyraExterior(
  scene: THREE.Scene,
  maxAnisotropy: number,
): LyraExterior {
  const spaceGroup = new THREE.Group();
  const landedGroup = new THREE.Group();
  spaceGroup.name = 'LYRA exterior in flight';
  landedGroup.name = 'LYRA exterior landed on planetary surface';
  spaceGroup.visible = false;
  landedGroup.visible = false;
  scene.add(spaceGroup, landedGroup);
  let space: LyraVariant | null = null;
  let landed: LyraVariant | null = null;
  let disposed = false;
  let wantsSpaceVisible = false;
  const ready = new Promise<boolean>((resolve) => {
    new GLTFLoader().load(MODEL_URL, (gltf) => {
      if (disposed) {
        disposeSpaceScene(gltf.scene);
        return resolve(false);
      }
      try {
        const landedScene = gltf.scene.clone(true);
        space = configureLyraModel(gltf.scene, false, maxAnisotropy);
        landed = configureLyraModel(landedScene, true, maxAnisotropy);
        spaceGroup.add(space.root);
        landedGroup.add(landed.root);
        spaceGroup.visible = wantsSpaceVisible;
        resolve(true);
      } catch {
        disposeSpaceScene(gltf.scene);
        resolve(false);
      }
    }, undefined, () => resolve(false));
  });

  const update = (
    camera: THREE.Camera,
    mode: GameMode,
    progress: number,
    groundHeight: (x: number, z: number) => number,
    rootZ: number,
  ) => {
    const ground = groundHeight(0, rootZ) + 7.55;
    const altitude = transitionAltitude(mode, progress);
    landedGroup.position.set(0, ground + altitude, rootZ);
    landedGroup.visible = Boolean(landed) && isLandedVisible(mode, progress);
    if (space) selectLyraLod(space, camera.position.length());
    if (landed) selectLyraLod(landed, camera.position.distanceTo(landedGroup.position));
  };

  return {
    spaceGroup,
    landedGroup,
    ready,
    update,
    setSpaceVisible: (visible) => {
      wantsSpaceVisible = visible;
      spaceGroup.visible = Boolean(space) && visible;
    },
    dispose: () => {
      disposed = true;
      scene.remove(spaceGroup, landedGroup);
      disposeSpaceScene(spaceGroup);
      landedGroup.clear();
    },
  };
}

function isLandedVisible(mode: GameMode, progress: number) {
  return mode === 'surface'
    || (mode === 'landing' && progress > 0.55)
    || (mode === 'takeoff' && progress < 0.58);
}

function transitionAltitude(mode: GameMode, progress: number) {
  if (mode === 'landing') return 42 * (1 - smoothstep(0.58, 1, progress));
  if (mode === 'takeoff') return 42 * smoothstep(0, 0.54, progress);
  return 0;
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return ratio * ratio * (3 - 2 * ratio);
}
