import * as THREE from 'three';
import { createTerrain, updateTerrainCaustics } from './terrain';
import type { BiomeId } from './types';
import { createGodRays, updateGodRays } from './waterEffects';

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
    float glint = pow(max(0., sin((vUv.x + vUv.y) * 90. + uTime * 3.)), 14.);
    gl_FragColor = vec4(vec3(.12, .72, .78) + glint * .35, .42);
  }
`;

export class OceanEnvironment {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(76, 1, 0.08, 240);
  readonly renderer: THREE.WebGLRenderer;
  readonly light = new THREE.SpotLight(0xbffcff, 0, 32, Math.PI / 5, 0.7);
  private readonly sun = new THREE.DirectionalLight(0xd9fff5, 2.7);
  private readonly hemi = new THREE.HemisphereLight(0x8dfff1, 0x08292e, 1.4);
  private readonly surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly terrain = createTerrain();
  private readonly godRays = createGodRays();
  private readonly bubbles: THREE.Points;
  private readonly bubblePositions: Float32Array;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.background = new THREE.Color(0x2c9ea7);
    this.scene.fog = new THREE.FogExp2(0x25848d, 0.016);
    this.scene.add(this.terrain, this.godRays, this.sun, this.hemi);
    this.sun.position.set(-35, 70, 25);
    this.surface = this.createSurface();
    this.bubblePositions = new Float32Array(360);
    this.bubbles = this.createBubbles();
    this.scene.add(this.surface, this.bubbles);
    this.camera.add(this.light);
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, -1);
    this.camera.add(this.light.target);
    this.scene.add(this.camera);
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
    this.updateBubbles(time);
  }

  resize = (): void => {
    const width = this.canvas.clientWidth || innerWidth;
    const height = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  };

  dispose(): void {
    this.renderer.dispose();
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

  private createBubbles(): THREE.Points {
    for (let index = 0; index < this.bubblePositions.length; index += 3) {
      this.bubblePositions[index] = (Math.random() - 0.5) * 120;
      this.bubblePositions[index + 1] = -Math.random() * 120;
      this.bubblePositions[index + 2] = (Math.random() - 0.5) * 120;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.bubblePositions, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xc8ffff, size: 0.16, transparent: true, opacity: 0.46, depthWrite: false,
    }));
  }

  private updateBubbles(time: number): void {
    for (let index = 1; index < this.bubblePositions.length; index += 3) {
      this.bubblePositions[index] = ((this.bubblePositions[index] + 0.035 + time * 0.00001) % 121) - 120;
    }
    this.bubbles.geometry.attributes.position.needsUpdate = true;
    this.bubbles.position.copy(this.camera.position).multiplyScalar(0.45);
  }
}
