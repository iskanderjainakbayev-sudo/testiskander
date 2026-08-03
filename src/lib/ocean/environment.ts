import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createTerrain, updateTerrainCaustics } from './terrain';
import { createSeabedDetails } from './seabedDetails';
import { BIOME_PALETTES } from './biomes';
import { getOceanClimate } from './climate';
import type { BiomeId, GraphicsQuality } from './types';
import { createGodRays, updateGodRays } from './waterEffects';
import { WaterParticles } from './WaterParticles';
import { createSurfaceWorld, updateSurfaceWorld } from './surfaceWorld';
import { UnderwaterPostEffect } from './UnderwaterPostEffect';
import { SURFACE_FRAGMENT, SURFACE_VERTEX } from './oceanSurface';
import { OceanResolutionScaler } from './OceanResolutionScaler';
import { BiomeVfx } from './BiomeVfx';

export class OceanEnvironment {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(76, 1, 0.08, 520);
  readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.58, 0.42, 0.78);
  readonly light = new THREE.SpotLight(0xbffcff, 0, 32, Math.PI / 5, 0.7);
  private readonly sun = new THREE.DirectionalLight(0xd9fff5, 2.7);
  private readonly hemi = new THREE.HemisphereLight(0x8dfff1, 0x08292e, 1.4);
  private readonly surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly terrain = createTerrain();
  private readonly seabedDetails = createSeabedDetails();
  private readonly godRays = createGodRays();
  private readonly particles: WaterParticles;
  private readonly surfaceWorld = createSurfaceWorld();
  private readonly underwaterPost = new UnderwaterPostEffect();
  private readonly resolutionScaler: OceanResolutionScaler;
  private readonly biomeVfx: BiomeVfx;
  private readonly visualColor = new THREE.Color(0x2c9ea7);
  private lastVisualTime = 0;

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
    this.scene.add(this.terrain, this.seabedDetails, this.godRays, this.sun, this.hemi, this.surfaceWorld);
    this.terrain.traverse((object) => {
      if (object instanceof THREE.Mesh) object.receiveShadow = true;
    });
    this.sun.position.set(-35, 70, 25);
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.00012;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    this.sun.shadow.camera.left = -90;
    this.sun.shadow.camera.right = 90;
    this.sun.shadow.camera.top = 90;
    this.sun.shadow.camera.bottom = -90;
    this.surface = this.createSurface();
    this.particles = new WaterParticles(this.scene);
    this.biomeVfx = new BiomeVfx(this.scene);
    this.scene.add(this.surface);
    this.camera.add(this.light);
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, -1);
    this.camera.add(this.light.target);
    this.scene.add(this.camera);
    this.composer = this.createComposer();
    this.resolutionScaler = new OceanResolutionScaler(this.renderer, this.composer);
    this.resize();
  }

  update(time: number, elapsed: number, biome: BiomeId, lightsOn: boolean): void {
    const climate = getOceanClimate(elapsed);
    const visualDelta = this.lastVisualTime === 0 ? 1 / 60 : Math.min(0.05, time - this.lastVisualTime);
    this.lastVisualTime = time;
    const blend = 1 - Math.exp(-visualDelta * 2.8);
    this.surface.material.uniforms.uTime.value = time;
    this.surface.material.uniforms.uWave.value = climate.waveStrength;
    updateTerrainCaustics(this.terrain, time);
    updateGodRays(this.godRays, time, Math.max(0, -this.camera.position.y));
    this.godRays.position.set(this.camera.position.x, 0, this.camera.position.z);
    const sunOffsetX = Math.sin(time * 0.025) * 55;
    this.sun.position.set(this.camera.position.x + sunOffsetX, 70, this.camera.position.z + 25);
    this.sun.target.position.set(this.camera.position.x, -12, this.camera.position.z);
    this.sun.target.updateMatrixWorld();
    this.sun.intensity = (1.65 + climate.daylight * 1.2) * climate.sunMultiplier;
    this.light.intensity = lightsOn ? 48 : 0;
    const palette = BIOME_PALETTES[biome];
    const underwaterColor = new THREE.Color(palette.color).multiplyScalar(0.42 + climate.daylight * 0.58);
    const surfaceSky = new THREE.Color(climate.phase === 'Night' ? 0x07142e
      : climate.phase === 'Sunset' ? 0xc27865 : 0x78c8dc);
    const surfaceBlend = THREE.MathUtils.smoothstep(this.camera.position.y, -0.35, 0.5);
    const color = underwaterColor.lerp(surfaceSky, surfaceBlend);
    this.visualColor.lerp(color, blend);
    this.scene.background = this.visualColor;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.visualColor);
      const targetDensity = THREE.MathUtils.lerp(
        palette.fog * climate.fogMultiplier,
        0.0022 * climate.fogMultiplier,
        surfaceBlend,
      );
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetDensity, blend);
    }
    this.particles.update(time, this.camera);
    this.biomeVfx.update(time, biome, visualDelta);
    updateSurfaceWorld(this.surfaceWorld, time);
    this.underwaterPost.update(time, -this.camera.position.y, this.visualColor);
    const underwaterLight = palette.light * (0.38 + climate.daylight * 0.62);
    const surfaceLight = 0.45 + climate.daylight * 1.85;
    this.hemi.intensity = THREE.MathUtils.lerp(underwaterLight, surfaceLight, surfaceBlend);
  }

  setQuality(quality: GraphicsQuality): void {
    this.resolutionScaler.setQuality(quality);
    this.renderer.shadowMap.enabled = quality === 'High' || quality === 'Ultra';
    this.bloom.enabled = quality !== 'Low';
    this.bloom.strength = quality === 'Medium' ? 0.42 : quality === 'High' ? 0.55 : 0.64;
    this.underwaterPost.setQuality(quality);
    this.biomeVfx.setQuality(quality);
    this.resize();
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

  samplePerformance(delta: number): void {
    this.resolutionScaler.sample(delta);
  }

  private createSurface() {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uWave: { value: 1 } },
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(620, 620, 112, 112), material);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.y = 0.15;
    mesh.renderOrder = 1;
    return mesh;
  }

  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    composer.addPass(this.bloom);
    composer.addPass(this.underwaterPost.pass);
    composer.addPass(new OutputPass());
    return composer;
  }
}
