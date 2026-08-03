import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { GraphicsQuality } from './types';

const shader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uStrength: { value: 1 },
    uImmersion: { value: 1 },
    uWaterTint: { value: new THREE.Color(0x25848d) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uDepth;
    uniform float uStrength;
    uniform float uImmersion;
    uniform vec3 uWaterTint;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 centered = vUv - .5;
      float edge = smoothstep(.28, .82, length(centered));
      float strength = uStrength * uImmersion;
      float aberration = .00065 * edge * strength;
      float red = texture2D(tDiffuse, vUv + centered * aberration).r;
      float green = texture2D(tDiffuse, vUv).g;
      float blue = texture2D(tDiffuse, vUv - centered * aberration).b;
      vec3 color = vec3(red, green, blue);
      float depthMix = smoothstep(25., 230., uDepth);
      vec3 absorption = exp(-vec3(.78, .27, .105) * depthMix * 1.15 * strength);
      color *= mix(vec3(.97, 1.018, 1.03), absorption, depthMix * .72);
      float horizon = smoothstep(.08, .82, vUv.y) * (1. - edge * .45);
      float volumeNoise = hash(floor(vUv * vec2(120., 68.)));
      float backscatter = (.025 + depthMix * .13) * horizon * strength;
      color += normalize(uWaterTint + vec3(.035)) * backscatter * (.94 + volumeNoise * .06);
      color += vec3(.008, .026, .031) * (1. - edge) * strength;
      color *= 1. - edge * .24 * strength;
      float grainA = hash(gl_FragCoord.xy);
      float grainB = hash(gl_FragCoord.yx + vec2(19.19, 73.73));
      float dither = (grainA + grainB - 1.) * .0045;
      color += dither * strength;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export class UnderwaterPostEffect {
  readonly pass = new ShaderPass(shader);
  private qualityEnabled = true;

  update(time: number, depth: number, waterTint: THREE.Color): void {
    this.pass.uniforms.uTime.value = time;
    this.pass.uniforms.uDepth.value = Math.max(0, depth);
    this.pass.uniforms.uImmersion.value = THREE.MathUtils.smoothstep(depth, -0.35, 0.45);
    (this.pass.uniforms.uWaterTint.value as THREE.Color).copy(waterTint);
    this.pass.enabled = this.qualityEnabled;
  }

  setQuality(quality: GraphicsQuality): void {
    this.qualityEnabled = quality !== 'Low';
    this.pass.uniforms.uStrength.value = quality === 'Low' ? 0 : quality === 'Medium' ? .45 : quality === 'High' ? .78 : 1;
    this.pass.enabled = this.qualityEnabled;
  }
}
