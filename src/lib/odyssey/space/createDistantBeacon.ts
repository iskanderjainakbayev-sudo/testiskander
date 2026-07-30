import * as THREE from 'three';

const VERTEX = `
precision highp float;
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 p=(vUv-0.5)*2.0;
  float r=length(p);
  float core=exp(-r*r*3100.0);
  float corona=exp(-r*18.0)*(0.55+0.08*sin(43.0*r-uTime*1.7));
  float horizontal=exp(-abs(p.y)*92.0)*exp(-abs(p.x)*3.2);
  float vertical=exp(-abs(p.x)*180.0)*exp(-abs(p.y)*5.5);
  float ring=exp(-pow((r-0.12)*46.0,2.0))*0.18;
  float grain=(hash(gl_FragCoord.xy+uTime)-0.5)*0.035*corona;
  vec3 color=vec3(1.0,0.76,0.47)*core*5.5;
  color+=vec3(0.52,0.72,1.0)*corona*0.55;
  color+=vec3(0.43,0.67,1.0)*(horizontal*0.22+vertical*0.1+ring);
  color+=grain;
  float alpha=clamp(core+corona*0.56+horizontal*0.17+vertical*0.08+ring,0.0,1.0);
  if(alpha<0.003)discard;
  gl_FragColor=vec4(color,alpha);
}`;

export interface DistantBeacon {
  group: THREE.Group;
  material: THREE.ShaderMaterial;
  update: (time: number, cameraInertial: THREE.Vector3) => void;
}

export function createDistantBeacon(): DistantBeacon {
  const group = new THREE.Group();
  group.name = 'HELIOS NULL distant blue-white primary';
  group.position.set(-2_400, 1_050, -4_100);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(620, 620), material);
  flare.frustumCulled = false;
  flare.renderOrder = -65;
  group.add(flare);
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, 1);
  return {
    group,
    material,
    update: (time, cameraInertial) => {
      material.uniforms.uTime.value = time;
      direction.copy(cameraInertial).sub(group.position).normalize();
      group.quaternion.setFromUnitVectors(forward, direction);
    },
  };
}
