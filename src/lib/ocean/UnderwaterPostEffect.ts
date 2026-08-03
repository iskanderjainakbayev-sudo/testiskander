import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { GraphicsQuality } from './types';

const shader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uStrength: { value: 1 },
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
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 centered = vUv - .5;
      float edge = smoothstep(.28, .82, length(centered));
      float aberration = .0008 * edge * uStrength;
      float red = texture2D(tDiffuse, vUv + centered * aberration).r;
      float green = texture2D(tDiffuse, vUv).g;
      float blue = texture2D(tDiffuse, vUv - centered * aberration).b;
      vec3 color = vec3(red, green, blue);
      float depthMix = smoothstep(25., 230., uDepth);
      color *= mix(vec3(.96, 1.03, 1.04), vec3(.68, .82, 1.14), depthMix * .48);
      color += vec3(.01, .035, .04) * (1. - edge);
      color *= 1. - edge * .28 * uStrength;
      float grain = hash(vUv * vec2(1733., 947.) + floor(uTime * 24.)) - .5;
      color += grain * .018 * uStrength;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export class UnderwaterPostEffect {
  readonly pass = new ShaderPass(shader);

  update(time: number, depth: number): void {
    this.pass.uniforms.uTime.value = time;
    this.pass.uniforms.uDepth.value = depth;
    this.pass.enabled = depth > .15;
  }

  setQuality(quality: GraphicsQuality): void {
    this.pass.uniforms.uStrength.value = quality === 'Low' ? 0 : quality === 'Medium' ? .45 : quality === 'High' ? .78 : 1;
    this.pass.enabled = quality !== 'Low';
  }
}
