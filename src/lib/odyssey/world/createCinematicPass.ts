import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const CINEMATIC_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVelocity: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVelocity;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 center = vUv - 0.5;
      float radius = length(center);
      vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
      vec2 dispersion = normalize(center + vec2(0.0001)) * pixel * 1.15
        * smoothstep(0.25, 0.82, radius);
      vec2 velocity = center * pixel * 8.0 * uVelocity;
      vec3 color;
      color.r = texture2D(tDiffuse, vUv + dispersion - velocity).r;
      color.g = texture2D(tDiffuse, vUv - velocity * 0.5).g;
      color.b = texture2D(tDiffuse, vUv - dispersion).b;
      color += texture2D(tDiffuse, vUv - velocity * 1.5).rgb * uVelocity * 0.16;
      color /= 1.0 + uVelocity * 0.16;

      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color += vec3(-0.004, 0.002, 0.007) * (1.0 - smoothstep(0.03, 0.5, luminance));
      color += vec3(0.006, 0.002, -0.003) * smoothstep(0.58, 1.0, luminance);
      float vignette = 1.0 - smoothstep(0.34, 0.93, radius) * 0.27;
      color *= vignette;

      float grain = hash(gl_FragCoord.xy + fract(uTime) * vec2(173.0, 97.0));
      float dither = (grain - 0.5) / 255.0;
      float filmGrain = (grain - 0.5) * 0.008 * (0.35 + 0.65 * (1.0 - luminance));
      color += vec3(dither + filmGrain);
      gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
  `,
};

export interface CinematicPass {
  pass: ShaderPass;
  update: (time: number, width: number, height: number) => void;
  setVelocity: (strength: number) => void;
}

export function createCinematicPass(): CinematicPass {
  const pass = new ShaderPass(CINEMATIC_SHADER);
  return {
    pass,
    update: (time, width, height) => {
      pass.uniforms.uTime.value = time;
      (pass.uniforms.uResolution.value as THREE.Vector2).set(width, height);
    },
    setVelocity: (strength) => {
      pass.uniforms.uVelocity.value = THREE.MathUtils.clamp(strength, 0, 1);
    },
  };
}
