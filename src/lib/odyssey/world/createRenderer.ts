import * as THREE from 'three';

export interface RenderRig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  resize: () => void;
  dispose: () => void;
}

export function createRenderer(canvas: HTMLCanvasElement): RenderRig {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010309);
  scene.fog = new THREE.FogExp2(0x06090e, 0.007);

  const camera = new THREE.PerspectiveCamera(68, 1, 0.04, 8000);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, width < 700 ? 1.35 : 1.8);
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
    resize,
    dispose: () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
