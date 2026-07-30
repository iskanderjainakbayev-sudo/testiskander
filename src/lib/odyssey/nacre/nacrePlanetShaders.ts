export const NACRE_PLANET_VERTEX = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main(){
  vLocal=position;
  vWorld=(modelMatrix*vec4(position,1.0)).xyz;
  vNormalWorld=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
}`;

const NOISE = `
float hash31(vec3 p){
  p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);
  return fract((p.x+p.y)*p.z);
}
float noise3(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),
    mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
    mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float sum=0.0,amp=0.52;
  for(int i=0;i<5;i++){sum+=noise3(p)*amp;p=p*2.07+4.17;amp*=0.48;}
  return sum;
}`;

export const NACRE_SURFACE_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform vec3 uLightDirection;
${NOISE}
void main(){
  vec3 sphere=normalize(vLocal);
  vec3 n=normalize(vNormalWorld);
  float continents=fbm(sphere*3.2);
  float ridges=1.0-abs(fbm(sphere*8.7+vec3(7.1))*2.0-1.0);
  float canyons=smoothstep(0.77,0.91,ridges)*smoothstep(0.39,0.58,continents);
  float silica=smoothstep(0.64,0.82,fbm(sphere*19.0+vec3(-3.0,8.0,2.0)));
  float grains=fbm(sphere*54.0);
  vec3 umber=mix(vec3(0.105,0.030,0.012),vec3(0.43,0.145,0.035),continents);
  vec3 ochre=mix(umber,vec3(0.82,0.43,0.12),grains*0.48);
  vec3 albedo=mix(ochre,vec3(0.055,0.018,0.012),canyons*0.88);
  albedo=mix(albedo,vec3(0.82,0.70,0.48),silica*0.58);
  vec3 l=normalize(uLightDirection),v=normalize(cameraPosition-vWorld);
  float ndl=max(dot(n,l),0.0);
  float wrap=max((dot(n,l)+0.22)/1.22,0.0);
  float horizon=pow(1.0-max(dot(n,v),0.0),3.2);
  float roughSpec=pow(max(dot(n,normalize(l+v)),0.0),18.0)*(0.08+silica*0.24);
  vec3 color=albedo*(0.035+ndl*0.86+wrap*0.17);
  color+=vec3(1.0,0.68,0.28)*roughSpec+vec3(0.32,0.07,0.015)*horizon*0.26;
  float night=1.0-smoothstep(-0.18,0.08,dot(n,l));
  color+=vec3(0.055,0.009,0.002)*night*silica;
  color+=(hash31(vec3(gl_FragCoord.xy,1.0))-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const NACRE_DUST_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform float uTime;
uniform vec3 uLightDirection;
${NOISE}
void main(){
  vec3 p=normalize(vLocal),n=normalize(vNormalWorld);
  float streams=fbm(p*9.0+vec3(uTime*0.006,0.0,-uTime*0.004));
  streams+=sin(p.y*43.0+p.x*13.0+uTime*0.018)*0.09;
  float density=smoothstep(0.66,0.82,streams);
  float light=0.24+max(dot(n,normalize(uLightDirection)),0.0)*0.76;
  float rim=pow(1.0-max(dot(n,normalize(cameraPosition-vWorld)),0.0),2.4);
  vec3 color=vec3(0.91,0.48,0.17)*light+rim*vec3(0.42,0.13,0.035);
  gl_FragColor=vec4(color,density*0.38);
}`;

export const NACRE_ATMOSPHERE_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform vec3 uLightDirection;
void main(){
  vec3 n=normalize(vNormalWorld),v=normalize(cameraPosition-vWorld);
  float rim=pow(1.0-abs(dot(n,v)),3.0);
  float day=smoothstep(-0.34,0.32,dot(n,normalize(uLightDirection)));
  float forward=pow(max(dot(v,-normalize(uLightDirection)),0.0),7.0);
  vec3 color=mix(vec3(0.16,0.018,0.003),vec3(1.0,0.40,0.095),day);
  color+=forward*vec3(0.75,0.20,0.03);
  gl_FragColor=vec4(color*rim*1.3,rim*(0.44+day*0.25));
}`;
