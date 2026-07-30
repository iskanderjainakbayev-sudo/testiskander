export const NACRE_INSTANCE_VERTEX = `
precision highp float;
varying vec3 vWorld;
varying vec3 vLocal;
varying float vScale;
void main(){
  vec4 instanced=instanceMatrix*vec4(position,1.0);
  vWorld=(modelMatrix*instanced).xyz;
  vLocal=position;
  vScale=length(instanceMatrix[1].xyz);
  gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
}`;

const COMMON = `
float hash31(vec3 p){
  p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);
  return fract((p.x+p.y)*p.z);
}
vec3 faceNormal(){
  vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
  return gl_FrontFacing?n:-n;
}
float fogFactor(){return clamp(1.0-exp(-distance(cameraPosition,vWorld)*0.00315),0.0,0.91);}
`;

export const NACRE_ROCK_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vLocal;
varying float vScale;
${COMMON}
void main(){
  vec3 n=faceNormal(),l=normalize(vec3(-0.68,0.66,0.32));
  float grain=hash31(floor(vWorld*1.7));
  float strata=0.5+0.5*sin(vWorld.y*1.1+grain*3.0);
  vec3 albedo=mix(vec3(0.12,0.033,0.014),vec3(0.43,0.16,0.038),strata);
  float diffuse=max(dot(n,l),0.0),wrap=max((dot(n,l)+0.28)/1.28,0.0);
  vec3 color=albedo*(0.12+diffuse*0.76+wrap*0.18);
  color=mix(color,vec3(0.34,0.145,0.065),fogFactor());
  color+=(hash31(vec3(gl_FragCoord.xy,vScale))-0.5)/255.0;
  gl_FragColor=vec4(color,1.0);
}`;

export const NACRE_MOUNTAIN_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vLocal;
varying float vScale;
${COMMON}
void main(){
  vec3 n=faceNormal(),l=normalize(vec3(-0.68,0.66,0.32));
  float strata=0.5+0.5*sin(vWorld.y*0.17+hash31(floor(vWorld*0.08))*5.0);
  float cap=smoothstep(0.34,0.92,vLocal.y)*hash31(floor(vWorld*0.17));
  vec3 albedo=mix(vec3(0.105,0.026,0.012),vec3(0.49,0.18,0.042),strata*0.54);
  albedo=mix(albedo,vec3(0.67,0.42,0.18),cap*0.38);
  float diffuse=max(dot(n,l),0.0),back=max(dot(n,-l),0.0);
  vec3 color=albedo*(0.09+diffuse*0.86)+vec3(0.07,0.016,0.007)*back*0.18;
  color=mix(color,vec3(0.31,0.125,0.055),fogFactor());
  gl_FragColor=vec4(color,1.0);
}`;

export const NACRE_MINERAL_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vLocal;
varying float vScale;
uniform float uTime;
${COMMON}
void main(){
  vec3 n=faceNormal(),v=normalize(cameraPosition-vWorld);
  vec3 l=normalize(vec3(-0.68,0.66,0.32));
  float internal=hash31(floor(vWorld*2.8))+0.5*sin(vLocal.y*18.0+vScale);
  float fresnel=pow(1.0-max(dot(n,v),0.0),2.7);
  float diffuse=max(dot(n,l),0.0);
  float pulse=0.93+0.07*sin(uTime*0.42+vWorld.x*0.07+vWorld.z*0.05);
  vec3 core=mix(vec3(0.23,0.038,0.012),vec3(1.0,0.52,0.13),clamp(internal,0.0,1.0));
  vec3 color=core*(0.13+diffuse*0.52)*pulse;
  color+=fresnel*vec3(1.0,0.53,0.17)*0.82;
  color+=pow(max(dot(n,normalize(l+v)),0.0),54.0)*vec3(1.0,0.88,0.55);
  color=mix(color,vec3(0.34,0.145,0.065),fogFactor()*0.74);
  gl_FragColor=vec4(color,0.76+fresnel*0.2);
}`;
