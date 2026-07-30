export const PLUME_VERTEX = `
varying vec2 vUvLocal;
#include <fog_pars_vertex>
void main(){
  vUvLocal=uv;
  vec4 localPosition=vec4(position,1.0);
  #ifdef USE_INSTANCING
    localPosition=instanceMatrix*localPosition;
  #endif
  vec4 mvPosition=modelViewMatrix*localPosition;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

export const PLUME_FRAGMENT = `
uniform float uTime;
varying vec2 vUvLocal;
#include <fog_pars_fragment>
void main(){
  float radial=abs(vUvLocal.x-.5)*2.0;
  float axial=1.0-vUvLocal.y;
  float pulse=.82+.18*sin(uTime*19.0+axial*31.0);
  float core=pow(max(0.0,1.0-radial),3.0);
  float fade=smoothstep(1.0,.08,axial)*smoothstep(0.0,.12,axial);
  float alpha=(core*.78+.12)*fade*pulse;
  vec3 color=mix(vec3(.04,.24,.72),vec3(.64,1.45,2.7),core);
  gl_FragColor=vec4(color*alpha,alpha);
  #include <fog_fragment>
}`;

export const LANE_VERTEX = `
attribute float aPhase;
varying float vPhase;
#include <fog_pars_vertex>
void main(){
  vPhase=aPhase;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

export const LANE_FRAGMENT = `
uniform float uTime;
varying float vPhase;
#include <fog_pars_fragment>
void main(){
  float beacon=pow(.5+.5*sin(vPhase*85.0-uTime*2.4),12.0);
  float alpha=.055+beacon*.16;
  gl_FragColor=vec4(vec3(.12,.38,.58)*alpha,alpha);
  #include <fog_fragment>
}`;
