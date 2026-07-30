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
}
vec3 detailNormal(vec3 p,vec3 n,float height,float strength){
  vec3 dp1=dFdx(p),dp2=dFdy(p);
  vec3 r1=cross(dp2,n),r2=cross(n,dp1);
  float determinant=dot(dp1,r1);
  vec2 gradient=vec2(dFdx(height),dFdy(height))*strength;
  return normalize(abs(determinant)*n-sign(determinant)*(gradient.x*r1+gradient.y*r2));
}`;

export const OCEAN_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
uniform vec3 uLightDirection;
${NOISE_GLSL}
void main() {
  vec3 localNormal = normalize(vLocal);
  float continental = fbm(localNormal * 3.1 + vec3(0.0, uTime * 0.004, 0.0));
  float fine = fbm(localNormal * 18.0);
  float detailFade=1.0-smoothstep(120.0,620.0,distance(cameraPosition,vWorld));
  vec3 normalWorld=detailNormal(vWorld,normalize(vNormalWorld),(fine-0.5)*0.085,detailFade);
  float latitude = abs(localNormal.y);
  float ice = smoothstep(0.62, 0.92, latitude + (continental - 0.5) * 0.24);
  float shelf = smoothstep(0.48, 0.63, continental) * (1.0 - ice);
  vec3 ocean = mix(vec3(0.002,0.018,0.040), vec3(0.008,0.105,0.145), fine * 0.52);
  ocean = mix(ocean, vec3(0.018,0.21,0.25), shelf * 0.48);
  vec3 iceColor = mix(vec3(0.27,0.38,0.43), vec3(0.72,0.84,0.85), fine);
  vec3 albedo = mix(ocean, iceColor, ice);
  vec3 lightDir = normalize(uLightDirection);
  float diffuse = max(dot(normalWorld, lightDir), 0.0);
  float twilight = smoothstep(-0.24, 0.22, dot(normalWorld, lightDir));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 halfDir = normalize(lightDir + viewDir);
  float glint = pow(max(dot(normalWorld, halfDir), 0.0), 150.0) * (1.0 - ice);
  float fresnel = pow(1.0-max(dot(normalWorld,viewDir),0.0),4.0);
  vec3 color = albedo * (0.035 + diffuse * 1.08) * twilight;
  color += vec3(0.18,0.65,0.82) * glint * 1.8;
  color += vec3(0.005,0.09,0.14) * fresnel * 0.68;
  float life = smoothstep(0.79,0.96,fbm(localNormal*27.0+vec3(4.0))) * (1.0-twilight);
  color += vec3(0.0,0.11,0.15) * life;
  gl_FragColor = vec4(color,1.0);
}`;

export const CLOUD_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
uniform vec3 uLightDirection;
${NOISE_GLSL}
void main() {
  vec3 p=normalize(vLocal);
  float large=fbm(p*5.6+vec3(uTime*0.008,0.0,0.0));
  float detail=fbm(p*19.0-vec3(uTime*0.011,0.0,0.0));
  float bands=sin(p.y*25.0+large*6.0)*0.07;
  float density=smoothstep(0.58,0.76,large*0.72+detail*0.30+bands);
  vec3 normalWorld=normalize(vNormalWorld);
  vec3 lightDir=normalize(uLightDirection);
  float ndl=max(dot(normalWorld,lightDir),0.0);
  float light=0.16+ndl*0.84;
  float rim=pow(1.0-max(dot(normalWorld,normalize(cameraPosition-vWorld)),0.0),3.0);
  float silver=pow(rim,2.0)*smoothstep(-0.08,0.55,dot(normalWorld,lightDir));
  vec3 cloudColor=vec3(0.47,0.57,0.59)*light+silver*vec3(0.18,0.34,0.38);
  gl_FragColor=vec4(cloudColor,density*(0.50+ndl*0.13));
}`;

export const ATMOSPHERE_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform vec3 uLightDirection;
void main() {
  vec3 viewDir=normalize(cameraPosition-vWorld);
  vec3 normalWorld=normalize(vNormalWorld);
  vec3 lightDir=normalize(uLightDirection);
  float rim=pow(1.0-abs(dot(normalWorld,viewDir)),3.0);
  float day=smoothstep(-0.34,0.32,dot(normalWorld,lightDir));
  float terminator=pow(1.0-abs(dot(normalWorld,lightDir)),8.0);
  float forward=pow(max(dot(viewDir,lightDir),0.0),9.0);
  vec3 color=mix(vec3(0.003,0.033,0.075),vec3(0.075,0.39,0.58),day);
  color+=terminator*vec3(0.19,0.20,0.15)+forward*vec3(0.11,0.25,0.27);
  gl_FragColor=vec4(color*rim*1.32,rim*(0.43+day*0.25));
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
