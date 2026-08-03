export const SURFACE_VERTEX = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vCrest;
  uniform float uTime;
  uniform float uWave;

  vec3 wave(vec2 direction, float steepness, float wavelength, float speed, vec2 point) {
    direction = normalize(direction);
    float frequency = 6.2831853 / wavelength;
    float phase = frequency * (dot(direction, point) + speed * uTime);
    float amplitude = steepness / frequency;
    return vec3(direction.x * amplitude * cos(phase), amplitude * sin(phase),
      direction.y * amplitude * cos(phase));
  }

  vec3 waveTangent(vec2 direction, float steepness, float wavelength, float speed, vec2 point) {
    direction = normalize(direction);
    float frequency = 6.2831853 / wavelength;
    float phase = frequency * (dot(direction, point) + speed * uTime);
    return vec3(-direction.x * direction.x * steepness * sin(phase),
      direction.x * steepness * cos(phase),
      -direction.x * direction.y * steepness * sin(phase));
  }

  vec3 waveBinormal(vec2 direction, float steepness, float wavelength, float speed, vec2 point) {
    direction = normalize(direction);
    float frequency = 6.2831853 / wavelength;
    float phase = frequency * (dot(direction, point) + speed * uTime);
    return vec3(-direction.x * direction.y * steepness * sin(phase),
      direction.y * steepness * cos(phase),
      -direction.y * direction.y * steepness * sin(phase));
  }

  void main() {
    vec2 point = position.xy;
    float energy = mix(.42, 1., clamp(uWave, 0., 1.5));
    vec3 offset = vec3(0.);
    vec3 tangent = vec3(1., 0., 0.);
    vec3 binormal = vec3(0., 0., 1.);
    #define ADD_WAVE(D, S, L, V) offset += wave(D, S * energy, L, V, point); \
      tangent += waveTangent(D, S * energy, L, V, point); \
      binormal += waveBinormal(D, S * energy, L, V, point);
    ADD_WAVE(vec2(1., .22), .19, 31., 4.4)
    ADD_WAVE(vec2(-.34, 1.), .13, 18., 3.2)
    ADD_WAVE(vec2(.66, -.72), .095, 10.5, 2.6)
    ADD_WAVE(vec2(-.92, -.38), .055, 5.2, 1.7)
    ADD_WAVE(vec2(.18, .98), .028, 2.4, 1.15)
    vec3 displaced = vec3(position.x + offset.x, position.y + offset.z, position.z + offset.y);
    vWorldPosition = (modelMatrix * vec4(displaced, 1.)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normalize(cross(binormal, tangent)));
    vCrest = smoothstep(.32, 1.18, offset.y) * energy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.);
  }
`;

export const SURFACE_FRAGMENT = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vCrest;
  uniform float uTime;

  float ripple(vec2 point, vec2 direction, float frequency, float speed) {
    return sin(dot(point, normalize(direction)) * frequency + uTime * speed);
  }

  void main() {
    vec3 baseNormal = normalize(vWorldNormal);
    vec2 capillary = vec2(
      ripple(vWorldPosition.xz, vec2(.82, .57), 2.35, 2.8)
        + ripple(vWorldPosition.xz, vec2(-.31, .95), 4.1, -3.7),
      ripple(vWorldPosition.xz, vec2(.22, -.98), 2.9, 3.15)
        + ripple(vWorldPosition.xz, vec2(.93, .36), 5.2, -4.5)
    ) * .026;
    vec3 normal = normalize(baseNormal + vec3(capillary.x, 0., capillary.y));
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(vec3(-.38, .86, .34));
    float facing = clamp(abs(dot(viewDirection, normal)), 0., 1.);
    float fresnel = .025 + .975 * pow(1. - facing, 5.);
    float broadGlint = pow(max(dot(reflect(-sunDirection, normal), viewDirection), 0.), 96.);
    float glitter = pow(max(dot(reflect(-sunDirection, normalize(normal + vec3(capillary.x, 0., capillary.y) * 1.8)),
      viewDirection), 0.), 420.);
    vec3 deep = vec3(.008, .105, .165);
    vec3 shallow = vec3(.035, .39, .44);
    vec3 horizon = vec3(.36, .73, .76);
    vec3 water = mix(deep, shallow, .32 + max(normal.y, 0.) * .18);
    water = mix(water, horizon, fresnel * .62);
    water += vec3(.83, .98, .93) * (broadGlint * 2.4 + glitter * .75);
    float brokenCrest = smoothstep(.62, .93, vCrest + capillary.x * .75)
      * (.7 + .3 * sin(vWorldPosition.x * 1.7 + vWorldPosition.z * 1.23));
    water = mix(water, vec3(.72, .94, .91), brokenCrest * .34);
    float alpha = mix(.62, .9, fresnel) + broadGlint * .08 + brokenCrest * .08;
    gl_FragColor = vec4(water, clamp(alpha, 0., .96));
  }
`;
