import * as THREE from 'three';
import { seededRandom } from './terrain';
import type { BiomeId, GraphicsQuality } from './types';

interface VfxLayer {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  targetOpacity: number;
}

const VERTEX_SHADER = `
  attribute float aPhase;
  attribute float aTravel;
  attribute float aSize;
  uniform float uTime;
  uniform float uMotion;
  varying float vLife;
  varying float vPhase;
  void main() {
    float life = fract(aPhase + uTime * uMotion);
    vec3 p = position;
    p.y += life * aTravel;
    float curl = sin(life * 12.566 + aPhase * 31.4 + uTime * .7);
    p.x += curl * life * (1.25 + aTravel * .025);
    p.z += cos(life * 9.42 + aPhase * 19.1 - uTime * .5) * life * .85;
    vec4 view = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * view;
    gl_PointSize = aSize * (210. / max(8., -view.z)) * sin(life * 3.14159);
    vLife = life;
    vPhase = aPhase;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSoftness;
  varying float vLife;
  varying float vPhase;
  void main() {
    vec2 centered = gl_PointCoord - .5;
    float radius = length(centered);
    float core = 1. - smoothstep(uSoftness, .5, radius);
    float textureNoise = .82 + .18 * sin((centered.x + centered.y + vPhase) * 23.);
    float envelope = sin(vLife * 3.14159) * (1. - vLife * .38);
    gl_FragColor = vec4(uColor, core * textureNoise * envelope * uOpacity);
  }
`;

function createLayer(
  emitters: Array<[number, number, number]>, countPerEmitter: number, seed: number,
  color: number, size: [number, number], travel: [number, number], additive: boolean,
): VfxLayer {
  const count = emitters.length * countPerEmitter;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const travels = new Float32Array(count);
  const sizes = new Float32Array(count);
  const random = seededRandom(seed);
  for (let index = 0; index < count; index += 1) {
    const emitter = emitters[Math.floor(index / countPerEmitter)];
    const radius = Math.sqrt(random()) * 1.2;
    const angle = random() * Math.PI * 2;
    positions[index * 3] = emitter[0] + Math.cos(angle) * radius;
    positions[index * 3 + 1] = emitter[1] + random() * .8;
    positions[index * 3 + 2] = emitter[2] + Math.sin(angle) * radius;
    phases[index] = random();
    travels[index] = THREE.MathUtils.lerp(travel[0], travel[1], random());
    sizes[index] = THREE.MathUtils.lerp(size[0], size[1], random());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aTravel', new THREE.BufferAttribute(travels, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uMotion: { value: .08 }, uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 }, uSoftness: { value: additive ? .08 : .02 },
    },
    vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER, transparent: true,
    depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = additive ? 3 : 0;
  return { points, targetOpacity: 0 };
}

const VENTS: Array<[number, number, number]> = [
  [82, -116, 94], [124, -151, 112], [-190, -173, -52], [218, -187, 34],
];
const ABYSS_GROVES: Array<[number, number, number]> = [
  [184, -145, 58], [-190, -160, -52], [126, -174, -176], [-142, -174, 176], [218, -184, 34],
];

export class BiomeVfx {
  private readonly ventSmoke = createLayer(VENTS, 32, 60213, 0x111b22, [3.8, 7.5], [13, 28], false);
  private readonly ventEmbers = createLayer(VENTS, 18, 79241, 0xff6d36, [1.1, 2.8], [7, 19], true);
  private readonly abyssLife = createLayer(ABYSS_GROVES, 54, 92177, 0x5cfff0, [.7, 2.2], [8, 24], true);
  private qualityScale = 1;

  constructor(scene: THREE.Scene) {
    scene.add(this.ventSmoke.points, this.ventEmbers.points, this.abyssLife.points);
    this.ventSmoke.points.material.uniforms.uMotion.value = .035;
    this.ventEmbers.points.material.uniforms.uMotion.value = .12;
    this.abyssLife.points.material.uniforms.uMotion.value = .025;
  }

  update(time: number, biome: BiomeId, delta: number): void {
    const volcanic = biome === 'Volcanic Depths' || biome === 'Black Trench';
    const abyss = biome === 'Bioluminescent Abyss' || biome === 'Black Trench';
    this.ventSmoke.targetOpacity = volcanic ? .28 * this.qualityScale : .08 * this.qualityScale;
    this.ventEmbers.targetOpacity = volcanic ? .92 * this.qualityScale : .18 * this.qualityScale;
    this.abyssLife.targetOpacity = abyss ? .88 * this.qualityScale : .12 * this.qualityScale;
    for (const layer of [this.ventSmoke, this.ventEmbers, this.abyssLife]) {
      const uniforms = layer.points.material.uniforms;
      uniforms.uTime.value = time;
      uniforms.uOpacity.value = THREE.MathUtils.damp(
        uniforms.uOpacity.value as number, layer.targetOpacity, 2.4, delta,
      );
      layer.points.visible = (uniforms.uOpacity.value as number) > .003;
    }
  }

  setQuality(quality: GraphicsQuality): void {
    this.qualityScale = quality === 'Low' ? 0 : quality === 'Medium' ? .58 : quality === 'High' ? .82 : 1;
  }
}
