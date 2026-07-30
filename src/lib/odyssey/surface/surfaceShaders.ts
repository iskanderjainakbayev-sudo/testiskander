const SURFACE_NOISE = `
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
  for(int i=0;i<4;i++){value+=noise2(p)*amplitude;p=p*2.07+5.31;amplitude*=0.47;}
  return value;
}
vec3 detailNormal(vec3 p,vec3 n,float height,float strength){
  vec3 dp1=dFdx(p),dp2=dFdy(p);
  vec3 r1=cross(dp2,n),r2=cross(n,dp1);
  float determinant=dot(dp1,r1);
  vec2 gradient=vec2(dFdx(height),dFdy(height))*strength;
  return normalize(abs(determinant)*n-sign(determinant)*(gradient.x*r1+gradient.y*r2));
}`;

export const TERRAIN_VERTEX = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
varying float vHeight;
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorld=world.xyz;
  vHeight=world.y;
  vNormalWorld=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

export const TERRAIN_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
varying float vHeight;
${SURFACE_NOISE}
void main(){
  float viewDistance=distance(cameraPosition,vWorld);
  float detailFade=1.0-smoothstep(42.0,245.0,viewDistance);
  float macro=fbm2(vWorld.xz*0.014);
  float grain=noise2(vWorld.xz*0.17);
  float micro=noise2(vWorld.xz*0.74);
  float fracture=pow(1.0-abs(noise2(vWorld.xz*0.052)*2.0-1.0),11.0);
  vec3 baseNormal=normalize(vNormalWorld);
  float relief=(grain-0.5)*0.19+(micro-0.5)*0.055-fracture*0.08;
  vec3 n=detailNormal(vWorld,baseNormal,relief,detailFade*1.15);
  float slope=1.0-clamp(baseNormal.y,0.0,1.0);
  float snow=smoothstep(4.2,13.8,vHeight-slope*16.0+(macro-0.5)*4.8);
  float shore=1.0-smoothstep(1.9,5.0,vHeight);
  float wetness=clamp(shore*0.82+(1.0-smoothstep(0.05,0.42,slope))*0.18,0.0,1.0);
  vec3 basalt=mix(vec3(0.024,0.039,0.045),vec3(0.105,0.145,0.151),macro*0.62+grain*0.38);
  basalt=mix(basalt,vec3(0.012,0.025,0.029),fracture*0.64);
  vec3 ice=mix(vec3(0.20,0.31,0.34),vec3(0.59,0.70,0.70),macro*0.42+grain*0.58);
  vec3 albedo=mix(basalt,ice,snow);
  albedo=mix(albedo,vec3(0.014,0.051,0.058),wetness*0.68);
  vec3 lightDir=normalize(vec3(-0.48,0.72,0.31));
  vec3 viewDir=normalize(cameraPosition-vWorld);
  float ndl=max(dot(n,lightDir),0.0);
  float wrap=max((dot(n,lightDir)+0.25)/1.25,0.0);
  float roughness=mix(mix(0.88,0.46,snow),0.24,wetness);
  float specPower=mix(18.0,150.0,1.0-roughness);
  float spec=pow(max(dot(n,normalize(lightDir+viewDir)),0.0),specPower)
    *(1.0-roughness)*0.72;
  float fresnel=pow(1.0-max(dot(n,viewDir),0.0),4.0);
  vec3 color=albedo*(0.115+ndl*0.73+wrap*0.22);
  color+=vec3(0.50,0.69,0.70)*spec+vec3(0.08,0.22,0.25)*fresnel*wetness*0.25;
  float heightHaze=0.76+(1.0-smoothstep(1.0,32.0,vHeight))*0.24;
  float aerial=clamp((1.0-exp(-viewDistance*0.0041))*heightHaze,0.0,0.91);
  float forward=pow(max(dot(viewDir,lightDir),0.0),8.0)*aerial;
  vec3 fogColor=vec3(0.071,0.137,0.148)+forward*vec3(0.075,0.083,0.066);
  color=mix(color,fogColor,aerial);
  color+=(hash21(gl_FragCoord.xy)-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const WATER_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
uniform float uTime;
${SURFACE_NOISE}
void main(){
  vec2 p=vWorld.xz*0.061;
  float a=p.x*1.23+p.y*0.34+uTime*0.58;
  float b=p.y*1.71-p.x*0.27-uTime*0.43;
  float c=(p.x+p.y)*0.76+uTime*0.31;
  vec2 slope=vec2(cos(a)*0.034-cos(b)*0.011+cos(c)*0.018,
    cos(a)*0.009+cos(b)*0.041+cos(c)*0.018);
  vec3 n=normalize(vec3(-slope.x,1.0,-slope.y));
  vec3 viewDir=normalize(cameraPosition-vWorld);
  vec3 lightDir=normalize(vec3(-0.48,0.72,0.31));
  float ndv=max(dot(n,viewDir),0.0);
  float fresnel=0.025+0.975*pow(1.0-ndv,5.0);
  float sunGlint=pow(max(dot(n,normalize(lightDir+viewDir)),0.0),420.0);
  float chop=abs(sin(a)+sin(b)*0.72+sin(c)*0.43);
  float foam=smoothstep(1.78,2.12,chop)*(1.0-smoothstep(70.0,310.0,distance(cameraPosition,vWorld)));
  vec3 deep=vec3(0.004,0.021,0.028);
  vec3 reflected=vec3(0.105,0.245,0.258);
  vec3 color=mix(deep,reflected,fresnel);
  color+=sunGlint*vec3(0.72,0.78,0.70)*1.4+foam*vec3(0.23,0.36,0.36)*0.15;
  float aerial=clamp(1.0-exp(-distance(cameraPosition,vWorld)*0.0040),0.0,0.9);
  color=mix(color,vec3(0.071,0.137,0.148),aerial);
  color+=(hash21(gl_FragCoord.xy+13.0)-0.5)/255.0;
  gl_FragColor=vec4(color,0.77+fresnel*0.19);
}`;
