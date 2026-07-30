export const TERRAIN_VERTEX = `
varying vec3 vWorld;
varying vec3 vNormalWorld;
varying float vHeight;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vHeight = world.y;
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const TERRAIN_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
varying float vHeight;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
    mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec3 n=normalize(vNormalWorld);
  float grain=noise(vWorld.xz*0.19)+noise(vWorld.xz*0.71)*0.28;
  float slope=1.0-clamp(n.y,0.0,1.0);
  float snow=smoothstep(4.0,13.0,vHeight+slope*-16.0+grain*5.0);
  float shore=1.0-smoothstep(1.8,4.8,vHeight);
  vec3 basalt=mix(vec3(0.035,0.055,0.063),vec3(0.11,0.15,0.16),grain);
  vec3 ice=mix(vec3(0.26,0.38,0.40),vec3(0.62,0.72,0.71),grain);
  vec3 color=mix(basalt,ice,snow);
  color=mix(color,vec3(0.025,0.075,0.082),shore*0.72);
  vec3 lightDir=normalize(vec3(-0.48,0.72,0.31));
  float diffuse=max(dot(n,lightDir),0.0);
  float wrap=max((dot(n,lightDir)+0.28)/1.28,0.0);
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float fresnel=pow(1.0-max(dot(n,viewDir),0.0),4.0);
  float spec=pow(max(dot(reflect(-lightDir,n),viewDir),0.0),72.0);
  color*=0.18+diffuse*0.72+wrap*0.28;
  color+=vec3(0.16,0.34,0.39)*fresnel*0.24+spec*vec3(0.68,0.78,0.77)*0.35;
  float distanceFog=smoothstep(90.0,620.0,distance(cameraPosition,vWorld));
  color=mix(color,vec3(0.075,0.14,0.16),distanceFog*0.78);
  gl_FragColor=vec4(color,1.0);
}`;

export const WATER_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
void main() {
  vec2 p=vWorld.xz*0.055;
  float wave=sin(p.x*1.4+uTime*0.7)+sin(p.y*1.9-uTime*0.53);
  vec3 n=normalize(vNormalWorld+vec3(cos(p.x+uTime)*0.025,0.0,sin(p.y-uTime)*0.025));
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float fresnel=pow(1.0-max(dot(n,viewDir),0.0),3.6);
  vec3 color=mix(vec3(0.006,0.026,0.034),vec3(0.10,0.30,0.34),fresnel);
  color+=vec3(0.18,0.42,0.43)*max(wave,0.0)*0.015;
  float alpha=0.72+fresnel*0.22;
  gl_FragColor=vec4(color,alpha);
}`;

export const SKY_FRAGMENT = `
precision highp float;
varying vec3 vDirection;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(41.7,289.1)))*45758.5453);}
void main() {
  vec3 d=normalize(vDirection);
  float horizon=pow(1.0-abs(d.y),3.2);
  vec3 zenith=vec3(0.012,0.035,0.052);
  vec3 color=mix(vec3(0.12,0.23,0.24),zenith,smoothstep(-0.05,0.72,d.y));
  color+=horizon*vec3(0.11,0.22,0.21);
  vec3 sunDir=normalize(vec3(-0.48,0.31,-0.82));
  float sun=pow(max(dot(d,sunDir),0.0),1800.0);
  float glow=pow(max(dot(d,sunDir),0.0),24.0);
  color+=sun*vec3(3.0,2.3,1.55)+glow*vec3(0.22,0.16,0.10);
  float aurora=pow(max(0.0,sin(d.x*18.0+d.z*9.0+uTime*0.035)),9.0)
    * smoothstep(0.12,0.68,d.y)*smoothstep(0.95,0.36,d.y);
  color+=aurora*vec3(0.025,0.19,0.17)*0.55;
  float stars=step(0.9983,hash(floor(d.xz*950.0)))*smoothstep(0.12,0.55,d.y);
  color+=stars*vec3(0.44,0.62,0.72);
  gl_FragColor=vec4(color,1.0);
}`;

export const RAIN_VERTEX = `
precision highp float;
attribute float aTail;
attribute float aSpeed;
uniform float uTime;
varying float vTail;
void main() {
  float fall=mod(position.y-uTime*aSpeed+42.0,42.0);
  vec3 p=vec3(
    position.x+sin(uTime*0.7+position.z)*0.34,
    fall-aTail*(0.42+aSpeed*0.035),
    position.z+uTime*0.22
  );
  vTail=aTail;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

export const RAIN_FRAGMENT = `
precision highp float;
varying float vTail;
void main() {
  gl_FragColor=vec4(0.58,0.78,0.79,mix(0.3,0.04,vTail));
}`;
