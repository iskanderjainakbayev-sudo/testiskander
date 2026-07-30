export const NACRE_TERRAIN_VERTEX = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main(){
  vWorld=(modelMatrix*vec4(position,1.0)).xyz;
  vNormalWorld=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
}`;

const NOISE_2D = `
float hash21(vec2 p){
  p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);
  return fract(p.x*p.y);
}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
    mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);
}
float fbm2(vec2 p){
  float sum=0.0,amp=0.52;
  for(int i=0;i<5;i++){sum+=noise2(p)*amp;p=p*2.11+7.3;amp*=0.47;}
  return sum;
}`;

export const NACRE_TERRAIN_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
${NOISE_2D}
void main(){
  vec3 n=normalize(vNormalWorld);
  float macro=fbm2(vWorld.xz*0.012);
  float grain=fbm2(vWorld.xz*0.12);
  float micro=noise2(vWorld.xz*0.78);
  float slope=1.0-clamp(n.y,0.0,1.0);
  float strata=0.5+0.5*sin(vWorld.y*0.72+macro*7.0+grain*1.8);
  float silica=smoothstep(0.66,0.91,grain+slope*0.14);
  vec3 ochre=mix(vec3(0.16,0.052,0.018),vec3(0.61,0.255,0.065),macro);
  vec3 albedo=mix(ochre,vec3(0.89,0.65,0.31),silica*0.52);
  albedo*=mix(0.63,1.12,strata*0.46+micro*0.54);
  albedo=mix(albedo,vec3(0.095,0.025,0.012),smoothstep(0.3,0.82,slope)*0.72);
  float shelf=1.0-smoothstep(25.0,47.0,length(vec2(vWorld.x,(vWorld.z-58.0)*0.78)));
  albedo=mix(albedo,vec3(0.57,0.36,0.17)*(0.86+micro*0.16),shelf*0.56);
  vec3 l=normalize(vec3(-0.68,0.66,0.32));
  vec3 v=normalize(cameraPosition-vWorld);
  float ndl=max(dot(n,l),0.0),wrap=max((dot(n,l)+0.3)/1.3,0.0);
  float roughness=mix(0.91,0.61,silica);
  float specPower=mix(7.0,42.0,1.0-roughness);
  float spec=pow(max(dot(n,normalize(l+v)),0.0),specPower)*(1.0-roughness)*0.46;
  float cavity=1.0-smoothstep(0.28,0.95,slope)*0.28;
  vec3 color=albedo*(0.11+ndl*0.77+wrap*0.18)*cavity;
  color+=vec3(1.0,0.71,0.37)*spec;
  float distanceFog=1.0-exp(-distance(cameraPosition,vWorld)*0.0032);
  float lowFog=clamp(distanceFog*(0.72+(1.0-smoothstep(-12.0,34.0,vWorld.y))*0.2),0.0,0.91);
  color=mix(color,vec3(0.34,0.145,0.065),lowFog);
  color+=(hash21(gl_FragCoord.xy)-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const NACRE_SKY_VERTEX = `
precision highp float;
varying vec3 vDirection;
void main(){
  vDirection=normalize(position);
  vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  gl_Position=clip.xyww;
}`;

export const NACRE_SKY_FRAGMENT = `
precision highp float;
varying vec3 vDirection;
uniform float uTime;
${NOISE_2D}
void main(){
  vec3 d=normalize(vDirection);
  float altitude=clamp(d.y*0.5+0.5,0.0,1.0);
  float horizon=pow(1.0-abs(d.y),3.4);
  vec3 color=mix(vec3(0.40,0.17,0.075),vec3(0.035,0.045,0.072),pow(altitude,0.68));
  color+=horizon*vec3(0.34,0.13,0.035);
  vec3 sunDir=normalize(vec3(-0.68,0.47,-0.56));
  float sunDot=max(dot(d,sunDir),0.0);
  color+=pow(sunDot,1450.0)*vec3(5.2,3.1,1.25);
  color+=pow(sunDot,18.0)*vec3(0.58,0.18,0.025);
  float stream=fbm2(vec2(atan(d.z,d.x)*3.5+uTime*0.004,d.y*18.0));
  float highDust=smoothstep(0.61,0.82,stream)*horizon;
  color+=highDust*vec3(0.17,0.052,0.012);
  color+=(hash21(gl_FragCoord.xy+37.0)-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const NACRE_DUST_VERTEX = `
precision highp float;
attribute float aPhase;
attribute float aSize;
uniform float uTime;
varying float vAlpha;
void main(){
  vec3 p=position;
  p.x+=sin(uTime*0.13+aPhase*6.283)*13.0;
  p.z+=uTime*(1.8+aPhase)-floor((p.z+uTime*(1.8+aPhase)+90.0)/180.0)*180.0;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_PointSize=clamp(aSize*95.0/max(1.0,-mv.z),0.7,4.2);
  vAlpha=(0.24+0.38*aPhase)*(1.0-smoothstep(28.0,160.0,-mv.z));
  gl_Position=projectionMatrix*mv;
}`;

export const NACRE_DUST_FRAGMENT = `
precision highp float;
varying float vAlpha;
void main(){
  vec2 p=gl_PointCoord-0.5;
  float body=1.0-smoothstep(0.02,0.5,length(p*vec2(0.42,1.0)));
  gl_FragColor=vec4(0.93,0.48,0.17,body*vAlpha);
}`;
