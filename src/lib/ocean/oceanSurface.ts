export const SURFACE_VERTEX = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform float uTime;
  uniform float uWave;
  void main() {
    vec3 p = position;
    float phaseA = p.x * .075 + uTime * 1.15;
    float phaseB = p.y * .055 - uTime * .82;
    float phaseC = (p.x + p.y) * .16 + uTime * 1.7;
    float height = sin(phaseA) * .62 + cos(phaseB) * .4 + sin(phaseC) * .18;
    float dx = cos(phaseA) * .0465 + cos(phaseC) * .0288;
    float dy = -sin(phaseB) * .022 + cos(phaseC) * .0288;
    p.z += height * uWave;
    vWorldPosition = (modelMatrix * vec4(p, 1.)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * vec3(-dx * uWave, -dy * uWave, 1.));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  }
`;

export const SURFACE_FRAGMENT = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  uniform float uTime;
  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(vec3(-.38, .86, .34));
    float fresnel = pow(1. - clamp(abs(dot(viewDirection, normal)), 0., 1.), 4.);
    float broadGlint = pow(max(dot(reflect(-sunDirection, normal), viewDirection), 0.), 72.);
    float capillary = sin(vWorldPosition.x * 1.6 + uTime * 2.7)
      * cos(vWorldPosition.z * 1.35 - uTime * 2.15);
    float sparkle = pow(max(capillary, 0.), 14.) * smoothstep(.15, .8, fresnel);
    vec3 deep = vec3(.018, .17, .24);
    vec3 shallow = vec3(.045, .48, .53);
    vec3 water = mix(deep, shallow, .34 + fresnel * .66);
    water += vec3(.7, .94, .88) * (broadGlint * 1.5 + sparkle * .22);
    float alpha = mix(.55, .82, fresnel) + broadGlint * .12;
    gl_FragColor = vec4(water, clamp(alpha, 0., .94));
  }
`;
