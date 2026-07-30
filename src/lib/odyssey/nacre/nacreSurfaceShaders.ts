const NACRE_NOISE = `
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
  float value=0.0,amplitude=0.52;
  for(int i=0;i<4;i++){value+=noise2(p)*amplitude;p=p*2.11+7.3;amplitude*=0.47;}
  return value;
}
vec3 detailNormal(vec3 p,vec3 n,float height,float strength){
  vec3 dp1=dFdx(p),dp2=dFdy(p);
  vec3 r1=cross(dp2,n),r2=cross(n,dp1);
  float determinant=dot(dp1,r1);
  vec2 gradient=vec2(dFdx(height),dFdy(height))*strength;
  return normalize(abs(determinant)*n-sign(determinant)*(gradient.x*r1+gradient.y*r2));
}`;

export const NACRE_TERRAIN_VERTEX = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main(){
  vWorld=(modelMatrix*vec4(position,1.0)).xyz;
  vNormalWorld=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
}`;

export const NACRE_TERRAIN_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
${NACRE_NOISE}
void main(){
  float viewDistance=distance(cameraPosition,vWorld);
  float detailFade=1.0-smoothstep(46.0,270.0,viewDistance);
  vec2 macroP=vWorld.xz*0.011;
  vec2 warp=vec2(noise2(macroP*1.7+4.2),noise2(macroP*1.7-7.1))-0.5;
  float macro=fbm2(macroP+warp*0.48);
  float grain=fbm2(vWorld.xz*0.105);
  float micro=noise2(vWorld.xz*0.69);
  float vein=pow(1.0-abs(noise2(vWorld.xz*0.045+3.7)*2.0-1.0),13.0);
  vec3 baseNormal=normalize(vNormalWorld);
  float relief=(grain-0.5)*0.21+(micro-0.5)*0.07+vein*0.055;
  vec3 n=detailNormal(vWorld,baseNormal,relief,detailFade*1.22);
  float slope=1.0-clamp(baseNormal.y,0.0,1.0);
  float strata=0.5+0.5*sin(vWorld.y*0.69+macro*6.7+grain*1.5);
  float silica=smoothstep(0.66,0.92,grain+slope*0.12);
  vec3 ochre=mix(vec3(0.125,0.037,0.014),vec3(0.55,0.214,0.050),macro);
  vec3 albedo=mix(ochre,vec3(0.83,0.57,0.27),silica*0.46);
  albedo*=mix(0.68,1.10,strata*0.54+micro*0.46);
  albedo=mix(albedo,vec3(0.073,0.018,0.009),smoothstep(0.28,0.79,slope)*0.76);
  albedo=mix(albedo,vec3(0.51,0.31,0.135),vein*0.23);
  float shelf=1.0-smoothstep(25.0,47.0,length(vec2(vWorld.x,(vWorld.z-58.0)*0.78)));
  albedo=mix(albedo,vec3(0.51,0.31,0.14)*(0.87+micro*0.14),shelf*0.54);
  vec3 lightDir=normalize(vec3(-0.68,0.66,0.32));
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float ndl=max(dot(n,lightDir),0.0);
  float wrap=max((dot(n,lightDir)+0.27)/1.27,0.0);
  float roughness=mix(0.93,0.62,silica);
  float spec=pow(max(dot(n,normalize(lightDir+viewDir)),0.0),mix(16.0,72.0,1.0-roughness))
    *(1.0-roughness)*0.48;
  float cavity=1.0-smoothstep(0.26,0.92,slope)*0.25;
  vec3 color=albedo*(0.105+ndl*0.76+wrap*0.19)*cavity;
  color+=vec3(1.0,0.68,0.34)*spec;
  float lowLayer=0.78+(1.0-smoothstep(-8.0,34.0,vWorld.y))*0.22;
  float aerial=clamp((1.0-exp(-viewDistance*0.00345))*lowLayer,0.0,0.92);
  float forward=pow(max(dot(viewDir,lightDir),0.0),7.0)*aerial;
  vec3 fogColor=vec3(0.31,0.122,0.052)+forward*vec3(0.20,0.085,0.025);
  color=mix(color,fogColor,aerial);
  color+=(hash21(gl_FragCoord.xy)-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;
