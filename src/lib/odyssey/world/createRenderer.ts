import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import type { LandablePlanetId } from '../types';

export interface RenderRig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  render: () => RenderStats;
  resize: () => void;
  setAtmosphere: (surfaceAmount: number, planet: LandablePlanetId) => void;
  setVelocityEffect: (strength: number) => void;
  dispose: () => void;
}

export interface RenderStats {
  calls: number;
  triangles: number;
}

export function createRenderer(canvas: HTMLCanvasElement): RenderRig {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010309);
  const fog = new THREE.FogExp2(0x010309, 0.00002);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(68, 1, 0.04, 8000);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
  } catch {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'default',
    });
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  let environment: THREE.Texture | null = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.045).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.38;
    disposeSpaceScene(room);
    pmrem.dispose();
  } catch {
    scene.environment = null;
  }
  const spaceFog = new THREE.Color(0x010309);
  const solaceFog = new THREE.Color(0x10262a);
  const nacreFog = new THREE.Color(0x5a2814);
  const renderStats: RenderStats = { calls: 0, triangles: 0 };

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, width < 700 ? 1.15 : 1.35);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener('resize', resize);
  return {
    scene,
    camera,
    renderer,
    render: () => {
      renderer.info.reset();
      renderer.render(scene, camera);
      renderStats.calls = renderer.info.render.calls;
      renderStats.triangles = renderer.info.render.triangles;
      return renderStats;
    },
    resize,
    setVelocityEffect: () => undefined,
    setAtmosphere: (surfaceAmount, planet) => {
      const blend = THREE.MathUtils.clamp(surfaceAmount, 0, 1);
      const surfaceFog = planet === 'nacre' ? nacreFog : solaceFog;
      fog.color.lerpColors(spaceFog, surfaceFog, blend);
      fog.density = THREE.MathUtils.lerp(
        0.00002,
        planet === 'nacre' ? 0.00175 : 0.0026,
        blend,
      );
      renderer.toneMappingExposure = THREE.MathUtils.lerp(
        1.06,
        planet === 'nacre' ? 1.16 : 1.12,
        blend,
      );
    },
    dispose: () => {
      window.removeEventListener('resize', resize);
      environment?.dispose();
      renderer.dispose();
    },
  };
}
