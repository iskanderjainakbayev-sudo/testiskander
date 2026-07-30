import * as THREE from 'three';

const PLANE_VERTEX = `
varying vec2 vUvLocal;
varying vec2 vPosition;
void main(){
  vUvLocal=uv;
  vPosition=position.xy;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const DISC_FRAGMENT = `
precision highp float;
varying vec2 vPosition;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main(){
  vec2 p=vPosition/125.0;
  float r=length(p),a=atan(p.y,p.x);
  float shear=noise(vec2(a*5.0-r*22.0-uTime*0.75,r*19.0));
  float filaments=pow(0.5+0.5*sin(a*17.0-r*76.0-uTime*2.2+shear*4.0),7.0);
  float body=smoothstep(0.98,0.32,r)*smoothstep(0.175,0.23,r);
  float hot=exp(-pow((r-0.25)*13.0,2.0));
  float alpha=body*(0.14+filaments*0.82)*(0.46+hot);
  vec3 outer=vec3(0.23,0.025,0.08);
  vec3 middle=vec3(1.0,0.16,0.035);
  vec3 inner=vec3(1.9,0.94,0.48);
  vec3 color=mix(outer,middle,smoothstep(0.86,0.30,r));
  color=mix(color,inner,hot);
  if(alpha<0.012)discard;
  gl_FragColor=vec4(color,alpha);
}`;

const LENS_FRAGMENT = `
precision highp float;
varying vec2 vUvLocal;
uniform float uTime;
void main(){
  vec2 p=(vUvLocal-0.5)*2.0;
  float r=length(p);
  float photon=exp(-pow((r-0.265)*64.0,2.0));
  float outer=exp(-pow((r-0.34)*24.0,2.0))*0.22;
  float bend=abs(p.y)-(0.18+0.25*p.x*p.x);
  float upper=exp(-pow(bend*56.0,2.0))*smoothstep(0.86,0.18,abs(p.x));
  float lower=exp(-pow((abs(p.y)+(0.06*cos(p.x*8.0))-0.22)*62.0,2.0);
  float eclipse=step(0.245,r);
  float flicker=0.92+0.08*sin(uTime*3.0+p.x*21.0);
  float alpha=(photon+outer+(upper+lower)*0.34*eclipse)*flicker;
  vec3 color=mix(vec3(0.55,0.05,0.18),vec3(1.0,0.67,0.28),photon);
  if(alpha<0.01)discard;
  gl_FragColor=vec4(color*alpha,alpha);
}`;

const HALO_VERTEX = `
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main(){
  vWorld=(modelMatrix*vec4(position,1.0)).xyz;
  vNormalWorld=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const HALO_FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormalWorld;
void main(){
  float rim=pow(1.0-abs(dot(normalize(vNormalWorld),normalize(cameraPosition-vWorld))),4.5);
  gl_FragColor=vec4(vec3(0.22,0.015,0.08)*rim,rim*0.28);
}`;

export interface VeilVisual {
  root: THREE.Group;
  materials: THREE.ShaderMaterial[];
  update: (time: number, cameraInertial: THREE.Vector3) => void;
}

export function createVeil(): VeilVisual {
  const root = new THREE.Group();
  root.name = 'The Veil gravitational wound';

  const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const voidSphere = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 32), voidMaterial);
  voidSphere.renderOrder = 2;
  root.add(voidSphere);

  const discMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: PLANE_VERTEX,
    fragmentShader: DISC_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), discMaterial);
  disc.rotation.set(1.23, 0.17, 0.28);
  disc.renderOrder = 1;
  root.add(disc);

  const lensMaterial = discMaterial.clone();
  lensMaterial.fragmentShader = LENS_FRAGMENT;
  lensMaterial.needsUpdate = true;
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(145, 145), lensMaterial);
  lens.renderOrder = 3;
  root.add(lens);

  const haloMaterial = new THREE.ShaderMaterial({
    vertexShader: HALO_VERTEX,
    fragmentShader: HALO_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(35, 32, 24), haloMaterial);
  root.add(halo);

  const direction = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  return {
    root,
    materials: [discMaterial, lensMaterial, haloMaterial],
    update: (time, cameraInertial) => {
      disc.rotation.z = 0.28 + time * 0.007;
      direction.copy(cameraInertial).sub(root.position).normalize();
      lens.quaternion.setFromUnitVectors(zAxis, direction);
    },
  };
}
