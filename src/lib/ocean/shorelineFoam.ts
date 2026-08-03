import * as THREE from 'three';

const VERTEX = `
  uniform float uTime;
  uniform float uWave;
  varying vec2 vLocal;
  varying vec3 vWorld;

  float waveHeight(vec2 point, vec2 direction, float steepness, float wavelength, float speed) {
    float frequency = 6.2831853 / wavelength;
    return steepness / frequency * sin(frequency * (dot(normalize(direction), point) + speed * uTime));
  }

  void main() {
    vLocal = position.xy;
    vec4 world = modelMatrix * vec4(position, 1.);
    float energy = mix(.42, 1., clamp(uWave, 0., 1.5));
    world.y = .18 + energy * (
      waveHeight(world.xz, vec2(1., .22), .19, 31., 4.4)
      + waveHeight(world.xz, vec2(-.34, 1.), .13, 18., 3.2)
      + waveHeight(world.xz, vec2(.66, -.72), .095, 10.5, 2.6)
      + waveHeight(world.xz, vec2(-.92, -.38), .055, 5.2, 1.7)
      + waveHeight(world.xz, vec2(.18, .98), .028, 2.4, 1.15));
    world.y += .025;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  varying vec2 vLocal;
  varying vec3 vWorld;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float radius = length(vLocal);
    float band = smoothstep(uInner, uInner + .8, radius)
      * (1. - smoothstep(uOuter - 1.25, uOuter, radius));
    float folds = sin(radius * 7. + atan(vLocal.y, vLocal.x) * 9. - uTime * 3.1);
    folds += sin(vWorld.x * 2.15 - vWorld.z * 1.72 + uTime * 2.35);
    float cells = hash(floor(vWorld.xz * 2.4 + uTime * .22));
    float lace = smoothstep(-.18, .72, folds * .5 + cells * .72);
    float pulse = .74 + .26 * sin(uTime * 1.35 + radius * 1.8);
    float alpha = band * lace * pulse * .55;
    vec3 color = mix(vec3(.38, .84, .81), vec3(.88, 1., .96), lace);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createShorelineFoam(inner: number, outer: number): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uWave: { value: 1 },
      uInner: { value: inner }, uOuter: { value: outer },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const foam = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96, 3), material);
  foam.rotation.x = -Math.PI / 2;
  foam.name = 'surface-foam';
  foam.renderOrder = 2;
  return foam;
}

export function updateShorelineFoam(foam: THREE.Object3D, time: number, wave: number): void {
  if (!(foam instanceof THREE.Mesh) || !(foam.material instanceof THREE.ShaderMaterial)) return;
  foam.material.uniforms.uTime.value = time;
  foam.material.uniforms.uWave.value = wave;
}
