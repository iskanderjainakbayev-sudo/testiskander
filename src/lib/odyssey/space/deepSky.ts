import * as THREE from 'three';

const SKY_VERTEX = `
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww;
}`;

const SKY_FRAGMENT = `
precision highp float;
varying vec3 vDirection;
uniform float uTime;
uniform float uWarp;
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float value = 0.0, amplitude = 0.52;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise3(p);
    p = p * 2.03 + vec3(5.2, 1.3, 7.1);
    amplitude *= 0.48;
  }
  return value;
}
float cloudNoise(vec3 p) {
  return noise3(p) * 0.57
    + noise3(p * 2.07 + vec3(3.1, 7.4, 1.8)) * 0.29
    + noise3(p * 4.19 - vec3(2.7, 4.2, 6.3)) * 0.14;
}
float cloud(vec3 d, vec3 center, float radius) {
  float falloff = exp(-pow(length(d - center) / radius, 2.0) * 2.2);
  return falloff * smoothstep(0.39, 0.9, cloudNoise(d * 4.2 + center * 7.0));
}
void main() {
  vec3 d = normalize(vDirection);
  vec3 galacticNormal = normalize(vec3(-0.31, 0.91, 0.27));
  float latitude = abs(dot(d, galacticNormal));
  float grain = fbm(d * 8.0);
  float broadBand = exp(-latitude * 7.5);
  float brightLane = exp(-latitude * 23.0) * smoothstep(0.28, 0.82, grain);
  float dustGrain = mix(grain, noise3(d * 31.0 + 6.0), 0.62);
  float dustLane = exp(-latitude * 35.0) * smoothstep(0.48, 0.78, dustGrain);
  vec3 color = vec3(0.0018, 0.0027, 0.0075);
  color += broadBand * vec3(0.020, 0.024, 0.045) * (0.3 + grain);
  color += brightLane * vec3(0.12, 0.13, 0.17) * 0.43;
  color *= 1.0 - dustLane * 0.74;
  float cyan = cloud(d, normalize(vec3(0.55, 0.08, -0.83)), 0.55);
  float violet = cloud(d, normalize(vec3(-0.63, -0.23, -0.74)), 0.48);
  float ember = cloud(d, normalize(vec3(0.03, 0.52, -0.85)), 0.35);
  color += cyan * vec3(0.018, 0.085, 0.13);
  color += violet * vec3(0.055, 0.016, 0.095);
  color += ember * vec3(0.075, 0.025, 0.012);
  float cell = hash31(floor(d * 820.0));
  float pinStars = step(0.9977, cell) * pow(cell, 32.0);
  color += vec3(0.38, 0.51, 0.72) * pinStars * (0.35 + 0.65 * broadBand);
  color *= 1.0 + uWarp * 0.13;
  gl_FragColor = vec4(color, 1.0);
}`;

export interface DeepSky {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
}

export function createDeepSky(): DeepSky {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWarp: { value: 0 },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2600, 4), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  return { mesh, material };
}
