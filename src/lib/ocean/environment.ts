import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createTerrain, updateTerrainCaustics } from './terrain';
import { BIOME_PALETTES } from './biomes';
import { getOceanClimate } from './climate';
import type { BiomeId, GraphicsQuality } from './types';
import { createGodRays, updateGodRays } from './waterEffects';
import { WaterParticles } from './WaterParticles';
import { createSurfaceWorld, updateSurfaceWorld } from './surfaceWorld';

const SURFACE_VERTEX = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uWave;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += (sin(p.x * .09 + uTime) * .55 + cos(p.y * .07 - uTime * .8) * .38) * uWave;
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
  readonly camera = new THREE.PerspectiveCamera(76, 1, 0.08, 520);
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

  update(time: number, elapsed: number, biome: BiomeId, lightsOn: boolean): void {
    const climate = getOceanClimate(elapsed);
    this.surface.material.uniforms.uTime.value = time;
    this.surface.material.uniforms.uWave.value = climate.waveStrength;
    updateTerrainCaustics(this.terrain, time);
    updateGodRays(this.godRays, time, Math.max(0, -this.camera.position.y));
    this.sun.position.x = Math.sin(time * 0.025) * 55;
    this.sun.intensity = (1.65 + climate.daylight * 1.2) * (climate.weather === 'Storm' ? 0.48 : 1);
    this.light.intensity = lightsOn ? 48 : 0;
    const palette = BIOME_PALETTES[biome];
    const color = new THREE.Color(palette.color).multiplyScalar(0.42 + climate.daylight * 0.58);
    this.scene.background = color;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(color);
      this.scene.fog.density = palette.fog * climate.fogMultiplier;
    }
    this.hemi.intensity = palette.light * (0.38 + climate.daylight * 0.62);
    this.particles.update(time, this.camera);
    updateSurfaceWorld(this.surfaceWorld, time);
    if (this.camera.position.y > 0.12) {
      const surfaceSky = new THREE.Color(climate.phase === 'Night' ? 0x07142e
        : climate.phase === 'Sunset' ? 0xc27865 : 0x78c8dc);
      this.scene.background = surfaceSky;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(surfaceSky);
        this.scene.fog.density = 0.0022 * climate.fogMultiplier;
      }
      this.hemi.intensity = 0.45 + climate.daylight * 1.85;
    }
  }

  setQuality(quality: GraphicsQuality): void {
    const pixelRatio = quality === 'Low' ? 0.75
      : quality === 'Medium' ? 1 : quality === 'High' ? 1.4 : 1.8;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, pixelRatio));
    this.renderer.shadowMap.enabled = quality === 'High' || quality === 'Ultra';
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

  private createSurface() {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uWave: { value: 1 } },
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(620, 620, 48, 48), material);
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
