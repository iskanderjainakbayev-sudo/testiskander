const SKY_NOISE = `
float hash21(vec2 p){
  p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);
  return fract(p.x*p.y);
}
float noise2(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
    mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);
}
float fbm2(vec2 p){
  float value=0.0,amplitude=0.53;
  for(int i=0;i<4;i++){value+=noise2(p)*amplitude;p=p*2.03+6.17;amplitude*=0.48;}
  return value;
}`;

export const SKY_FRAGMENT = `
precision highp float;
varying vec3 vDirection;
uniform float uTime;
${SKY_NOISE}
void main(){
  vec3 d=normalize(vDirection);
  float altitude=clamp(d.y,0.0,1.0);
  float horizon=exp(-max(d.y,0.0)*7.5);
  vec3 zenith=vec3(0.009,0.026,0.041);
  vec3 horizonAir=vec3(0.105,0.205,0.208);
  vec3 color=mix(horizonAir,zenith,pow(altitude,0.42));
  vec3 sunDir=normalize(vec3(-0.48,0.31,-0.82));
  float sunDot=max(dot(d,sunDir),0.0);
  float rayleigh=0.72+0.28*pow(max(dot(d,vec3(0,1,0)),0.0),2.0);
  color*=rayleigh;
  color+=pow(sunDot,1500.0)*vec3(3.4,2.55,1.62);
  color+=pow(sunDot,22.0)*horizon*vec3(0.22,0.16,0.095);
  vec2 skyUv=d.xz/(0.30+max(d.y,0.0))*1.72+vec2(uTime*0.0017,0.0);
  float warp=noise2(skyUv*0.48+vec2(1.7,-2.4));
  float cloudMacro=fbm2(skyUv+vec2(warp*1.7,uTime*0.002));
  float cloudDetail=noise2(skyUv*4.1-vec2(uTime*0.006,0.0));
  float cloud=smoothstep(0.43,0.73,cloudMacro*0.76+cloudDetail*0.24);
  cloud*=smoothstep(-0.08,0.05,d.y);
  float cloudLight=0.52+0.48*max(dot(d,sunDir),0.0);
  vec3 cloudColor=mix(vec3(0.055,0.083,0.091),vec3(0.30,0.36,0.35),cloudLight);
  color=mix(color,cloudColor,cloud*0.79);
  float rainBand=smoothstep(0.62,0.86,fbm2(vec2(skyUv.x*2.1+uTime*0.004,d.y*2.4)));
  float curtain=rainBand*exp(-abs(d.y-0.055)*17.0);
  color=mix(color,vec3(0.045,0.087,0.094),curtain*0.43);
  float aurora=pow(max(0.0,sin(d.x*17.0+d.z*8.0+uTime*0.025)),11.0)
    *smoothstep(0.20,0.58,d.y)*smoothstep(0.94,0.52,d.y)*(1.0-cloud);
  color+=aurora*vec3(0.018,0.13,0.12)*0.34;
  color+=(hash21(gl_FragCoord.xy+37.0)-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const RAIN_VERTEX = `
precision highp float;
attribute float aTail;
attribute float aSpeed;
uniform float uTime;
varying float vOpacity;
void main(){
  float fall=mod(position.y-uTime*aSpeed+42.0,42.0);
  float driftX=mod(position.x+uTime*1.05+50.0,100.0)-50.0;
  float driftZ=mod(position.z+uTime*0.22+50.0,100.0)-50.0;
  vec3 p=vec3(driftX-aTail*0.13,fall-aTail*(0.42+aSpeed*0.035),driftZ);
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  float rangeFade=1.0-smoothstep(18.0,86.0,length(mv.xyz));
  vOpacity=mix(0.24,0.035,aTail)*rangeFade;
  gl_Position=projectionMatrix*mv;
}`;

export const RAIN_FRAGMENT = `
precision highp float;
varying float vOpacity;
void main(){
  gl_FragColor=vec4(0.54,0.67,0.68,vOpacity);
}`;
