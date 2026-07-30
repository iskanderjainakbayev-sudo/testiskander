import * as THREE from 'three';

const STAR_VERTEX = `
attribute float aSize;
attribute float aHeat;
attribute float aPhase;
uniform float uTime;
uniform float uWarp;
varying float vHeat;
varying float vGlow;
varying float vAngle;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 clip = projectionMatrix * mv;
  gl_Position = clip;
  float pulse = 0.93 + 0.07 * sin(uTime * 0.8 + aPhase);
  float perspective = 1050.0 / max(520.0, -mv.z);
  gl_PointSize = clamp(aSize * perspective * pulse * (1.0 + uWarp * 7.0), 0.65, 20.0);
  vAngle = atan(clip.y / max(clip.w, 0.001), clip.x / max(clip.w, 0.001));
  vHeat = aHeat;
  vGlow = smoothstep(1.25, 3.7, aSize);
}`;

const STAR_FRAGMENT = `
precision highp float;
uniform float uWarp;
varying float vHeat;
varying float vGlow;
varying float vAngle;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAngle), s = sin(vAngle);
  p = mat2(c, -s, s, c) * p;
  p.y /= 1.0 + uWarp * 8.0;
  float d = length(p) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.36, d);
  float halo = exp(-5.8 * d * d) * (0.32 + vGlow * 0.7);
  float ray = exp(-42.0 * abs(p.x)) * exp(-4.0 * abs(p.y)) * vGlow;
  vec3 cool = vec3(0.53, 0.72, 1.0);
  vec3 neutral = vec3(0.94, 0.97, 1.0);
  vec3 warm = vec3(1.0, 0.66, 0.38);
  vec3 color = vHeat < 0.5
    ? mix(cool, neutral, vHeat * 2.0)
    : mix(neutral, warm, (vHeat - 0.5) * 2.0);
  float alpha = (core + halo + ray * 0.36) * (0.72 + 0.28 * vGlow);
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(color * (core * 1.45 + halo + ray), alpha);
}`;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function createMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWarp: { value: 0 },
    },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

function buildGeometry(
  count: number,
  seed: number,
  positionAt: (random: () => number, target: THREE.Vector3) => void,
): THREE.BufferGeometry {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const heats = new Float32Array(count);
  const phases = new Float32Array(count);
  const point = new THREE.Vector3();

  for (let index = 0; index < count; index += 1) {
    positionAt(random, point);
    point.toArray(positions, index * 3);
    const rareBrightStar = random() > 0.986;
    sizes[index] = rareBrightStar ? 3.2 + random() * 2.8 : 0.75 + random() * 1.75;
    heats[index] = random();
    phases[index] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aHeat', new THREE.BufferAttribute(heats, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export interface StarField {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
}

export function createDistantStars(): StarField {
  const geometry = buildGeometry(11_000, 0x5a17b9, (random, point) => {
    point.randomDirection().multiplyScalar(1350 + random() * 1050);
  });
  const material = createMaterial();
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -80;
  return { points, material };
}

export function createNearStars(): StarField {
  const geometry = buildGeometry(3_200, 0xc02dec, (random, point) => {
    point.set(
      (random() - 0.5) * 3200,
      (random() - 0.5) * 2100,
      600 - random() * 4300,
    );
  });
  const material = createMaterial();
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -70;
  return { points, material };
}
