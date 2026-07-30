export const SURFACE_VERTEX = `
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main() {
  vLocal = position;
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const NOISE_GLSL = `
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  float f=0.0, a=0.52;
  for(int i=0;i<5;i++){ f+=a*noise(p); p=p*2.03+3.7; a*=0.49; }
  return f;
}`;

export const OCEAN_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
${NOISE_GLSL}
void main() {
  vec3 n = normalize(vLocal);
  float continental = fbm(n * 3.1 + vec3(0.0, uTime * 0.004, 0.0));
  float fine = fbm(n * 18.0);
  float latitude = abs(n.y);
  float ice = smoothstep(0.62, 0.92, latitude + (continental - 0.5) * 0.24);
  float shelf = smoothstep(0.48, 0.63, continental) * (1.0 - ice);
  vec3 ocean = mix(vec3(0.002,0.018,0.040), vec3(0.008,0.105,0.145), fine * 0.52);
  ocean = mix(ocean, vec3(0.018,0.21,0.25), shelf * 0.48);
  vec3 iceColor = mix(vec3(0.27,0.38,0.43), vec3(0.72,0.84,0.85), fine);
  vec3 albedo = mix(ocean, iceColor, ice);
  vec3 lightDir = normalize(vec3(-0.72, 0.32, 0.46));
  float diffuse = max(dot(n, lightDir), 0.0);
  float twilight = smoothstep(-0.24, 0.22, dot(n, lightDir));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 halfDir = normalize(lightDir + normalize(viewDir));
  float glint = pow(max(dot(n, halfDir), 0.0), 150.0) * (1.0 - ice);
  float fresnel = pow(1.0-max(dot(normalize(vNormalWorld),viewDir),0.0),4.0);
  vec3 color = albedo * (0.035 + diffuse * 1.08) * twilight;
  color += vec3(0.18,0.65,0.82) * glint * 1.8;
  color += vec3(0.005,0.09,0.14) * fresnel * 0.68;
  float life = smoothstep(0.79,0.96,fbm(n*27.0+vec3(4.0))) * (1.0-twilight);
  color += vec3(0.0,0.11,0.15) * life;
  gl_FragColor = vec4(color,1.0);
}`;

export const CLOUD_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
${NOISE_GLSL}
void main() {
  vec3 p=normalize(vLocal);
  float large=fbm(p*5.6+vec3(uTime*0.008,0.0,0.0));
  float detail=fbm(p*19.0-vec3(uTime*0.011,0.0,0.0));
  float bands=sin(p.y*25.0+large*6.0)*0.07;
  float density=smoothstep(0.58,0.76,large*0.72+detail*0.30+bands);
  vec3 lightDir=normalize(vec3(-0.72,0.32,0.46));
  float light=0.2+max(dot(p,lightDir),0.0)*0.8;
  float rim=pow(1.0-max(dot(normalize(vNormalWorld),normalize(cameraPosition-vWorld)),0.0),3.0);
  gl_FragColor=vec4(vec3(0.60,0.73,0.76)*light+rim*vec3(0.08,0.28,0.34),density*0.63);
}`;

export const ATMOSPHERE_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main() {
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float rim=pow(1.0-abs(dot(normalize(vNormalWorld),viewDir)),3.1);
  float sun=smoothstep(-0.38,0.38,dot(normalize(vNormalWorld),normalize(vec3(-0.72,0.32,0.46))));
  vec3 color=mix(vec3(0.005,0.10,0.19),vec3(0.12,0.61,0.88),sun);
  gl_FragColor=vec4(color*rim*1.45,rim*0.74);
}`;

export const RING_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
uniform float uTime;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main() {
  float r=length(vLocal.xy);
  float a=atan(vLocal.y,vLocal.x);
  float bands=sin(r*1.7)+sin(r*5.3)*0.34+sin(r*13.0)*0.12;
  float broken=smoothstep(0.17,0.84,hash21(floor(vec2(a*52.0,r*0.29))));
  float opacity=(0.11+0.18*bands)*broken*smoothstep(82.0,91.0,r)*smoothstep(133.0,121.0,r);
  vec3 color=mix(vec3(0.19,0.27,0.30),vec3(0.52,0.64,0.65),broken);
  gl_FragColor=vec4(color,clamp(opacity,0.0,0.46));
}`;
