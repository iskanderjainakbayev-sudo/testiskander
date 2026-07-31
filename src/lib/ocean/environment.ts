import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createTerrain, updateTerrainCaustics } from './terrain';
import type { BiomeId } from './types';
import { createGodRays, updateGodRays } from './waterEffects';
import { WaterParticles } from './WaterParticles';
import { createSurfaceWorld, updateSurfaceWorld } from './surfaceWorld';

const SURFACE_VERTEX = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.x * .09 + uTime) * .55 + cos(p.y * .07 - uTime * .8) * .38;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const SURFACE_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float waveA = sin(vUv.x * 92. + uTime * 2.7);
    float waveB = cos(vUv.y * 76. - uTime * 2.1);
    float glint = pow(max(0., waveA * waveB), 10.);
    float horizon = smoothstep(0., .85, distance(vUv, vec2(.5)));
    vec3 water = mix(vec3(.07, .55, .62), vec3(.22, .86, .82), glint);
    water = mix(water, vec3(.03, .25, .34), horizon * .55);
    gl_FragColor = vec4(water, .48);
  }
`;

export class OceanEnvironment {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(76, 1, 0.08, 240);
  readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  readonly light = new THREE.SpotLight(0xbffcff, 0, 32, Math.PI / 5, 0.7);
  private readonly sun = new THREE.DirectionalLight(0xd9fff5, 2.7);
  private readonly hemi = new THREE.HemisphereLight(0x8dfff1, 0x08292e, 1.4);
  private readonly surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly terrain = createTerrain();
  private readonly godRays = createGodRays();
  private readonly particles: WaterParticles;
  private readonly surfaceWorld = createSurfaceWorld();

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(0x2c9ea7);
    this.scene.fog = new THREE.FogExp2(0x25848d, 0.016);
    this.scene.add(this.terrain, this.godRays, this.sun, this.hemi, this.surfaceWorld);
    this.terrain.traverse((object) => {
      if (object instanceof THREE.Mesh) object.receiveShadow = true;
    });
    this.sun.position.set(-35, 70, 25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -90;
    this.sun.shadow.camera.right = 90;
    this.sun.shadow.camera.top = 90;
    this.sun.shadow.camera.bottom = -90;
    this.surface = this.createSurface();
    this.particles = new WaterParticles(this.scene);
    this.scene.add(this.surface);
    this.camera.add(this.light);
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, -1);
    this.camera.add(this.light.target);
    this.scene.add(this.camera);
    this.composer = this.createComposer();
    this.resize();
  }

  update(time: number, biome: BiomeId, lightsOn: boolean): void {
    this.surface.material.uniforms.uTime.value = time;
    updateTerrainCaustics(this.terrain, time);
    updateGodRays(this.godRays, time, Math.max(0, -this.camera.position.y));
    this.sun.position.x = Math.sin(time * 0.025) * 55;
    this.sun.intensity = 2.15 + Math.sin(time * 0.025) * 0.7;
    this.light.intensity = lightsOn ? 48 : 0;
    const palette = biome === 'Safe Reef'
      ? [0x2b9fa7, 0.014, 1.45] : biome === 'Lumen Kelp'
        ? [0x0b4e5a, 0.024, 0.82] : [0x020b1a, 0.038, 0.28];
    const color = new THREE.Color(palette[0]);
    this.scene.background = color;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(color);
      this.scene.fog.density = palette[1];
    }
    this.hemi.intensity = palette[2];
    this.particles.update(time, this.camera);
    updateSurfaceWorld(this.surfaceWorld, time);
    if (this.camera.position.y > 0.12) {
      const surfaceSky = new THREE.Color(0x78c8dc);
      this.scene.background = surfaceSky;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(surfaceSky);
        this.scene.fog.density = 0.0022;
      }
      this.hemi.intensity = 2.3;
    }
  }

  resize = (): void => {
    const width = this.canvas.clientWidth || innerWidth;
    const height = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  };

  dispose(): void {
    this.composer.dispose();
    this.renderer.dispose();
  }

  render(): void {
    this.composer.render();
  }

  private createSurface() {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(330, 330, 32, 32), material);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.y = 0.15;
    return mesh;
  }

  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.58, 0.42, 0.78);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return composer;
  }
}
