const ATMOSPHERE_NOISE = `
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
  float value=0.0,amplitude=0.53;
  for(int i=0;i<4;i++){value+=noise2(p)*amplitude;p=p*2.07+6.1;amplitude*=0.47;}
  return value;
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
${ATMOSPHERE_NOISE}
void main(){
  vec3 d=normalize(vDirection);
  float altitude=clamp(d.y,0.0,1.0);
  float opticalDepth=exp(-max(d.y,0.0)*6.8);
  vec3 color=mix(vec3(0.39,0.16,0.065),vec3(0.028,0.039,0.067),pow(altitude,0.48));
  vec3 sunDir=normalize(vec3(-0.68,0.66,0.32));
  float sunDot=max(dot(d,sunDir),0.0);
  color+=pow(sunDot,1700.0)*vec3(5.0,3.05,1.30);
  color+=pow(sunDot,16.0)*opticalDepth*vec3(0.72,0.25,0.045);
  vec2 skyUv=d.xz/(0.28+max(d.y,0.0))*2.05+vec2(uTime*0.0013,0.0);
  float warp=noise2(skyUv*0.43+vec2(2.7,-1.1));
  float stream=fbm2(skyUv+vec2(warp*1.8,-uTime*0.002));
  float highDust=smoothstep(0.51,0.77,stream)*smoothstep(-0.08,0.08,d.y);
  vec3 dustLight=mix(vec3(0.12,0.035,0.012),vec3(0.53,0.20,0.055),pow(sunDot,3.0));
  color=mix(color,dustLight,highDust*opticalDepth*0.48);
  float distantVeil=smoothstep(0.59,0.83,noise2(vec2(skyUv.x*3.4+uTime*0.005,d.y*4.0)));
  color=mix(color,vec3(0.245,0.082,0.027),distantVeil*exp(-abs(d.y-0.035)*15.0)*0.35);
  color+=(hash21(gl_FragCoord.xy+19.0)-0.5)/255.0;
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
  p.y+=sin(uTime*0.21+aPhase*17.0)*0.36;
  p.z+=uTime*(1.8+aPhase)-floor((p.z+uTime*(1.8+aPhase)+90.0)/180.0)*180.0;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_PointSize=clamp(aSize*92.0/max(1.0,-mv.z),0.65,4.0);
  float rangeFade=1.0-smoothstep(32.0,155.0,length(mv.xyz));
  float altitudeFade=1.0-smoothstep(18.0,78.0,p.y);
  vAlpha=(0.14+0.27*aPhase)*rangeFade*(0.42+altitudeFade*0.58);
  gl_Position=projectionMatrix*mv;
}`;

export const NACRE_DUST_FRAGMENT = `
precision highp float;
varying float vAlpha;
void main(){
  vec2 p=gl_PointCoord-0.5;
  float body=1.0-smoothstep(0.05,0.5,length(p*vec2(0.38,1.0)));
  gl_FragColor=vec4(0.71,0.32,0.105,body*vAlpha);
}`;
