import * as THREE from 'three';

const PORTAL_VERTEX = `
varying vec2 vUvLocal;
void main(){
  vUvLocal=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const PORTAL_FRAGMENT = `
precision highp float;
varying vec2 vUvLocal;
uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.08+4.7;a*=0.48;}
  return v;
}
void main(){
  vec2 p=(vUvLocal-0.5)*2.0;
  float r=length(p),a=atan(p.y,p.x);
  float spiral=fbm(vec2(a*2.3-r*8.0-uTime*0.08,r*9.0));
  float filaments=pow(0.5+0.5*sin(a*8.0-r*31.0+spiral*6.0-uTime*0.3),5.0);
  float rim=exp(-pow((r-0.94)*29.0,2.0));
  float aperture=1.0-smoothstep(0.89,1.0,r);
  float star=step(0.993,hash(floor(p*190.0+uTime*0.02)))*aperture;
  float depth=exp(-r*2.1)*(0.4+spiral*0.6);
  vec3 color=mix(vec3(0.006,0.015,0.035),vec3(0.025,0.25,0.34),depth);
  color+=vec3(0.06,0.64,0.78)*(filaments*0.18+rim*0.72);
  color+=star*vec3(0.75,0.94,1.0);
  float alpha=aperture*(0.18+depth*0.41+filaments*0.08)+rim*0.34;
  if(alpha<0.01)discard;
  gl_FragColor=vec4(color,alpha);
}`;

export interface AtlasVisual {
  root: THREE.Group;
  materials: THREE.ShaderMaterial[];
  update: (time: number) => void;
}

function addRadialInstances(
  parent: THREE.Group,
  material: THREE.Material,
): THREE.InstancedMesh {
  const geometry = new THREE.BoxGeometry(8, 29, 10);
  const segments = new THREE.InstancedMesh(geometry, material, 32);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 111, Math.sin(angle) * 111, 0);
    dummy.rotation.z = angle - Math.PI / 2;
    dummy.scale.set(index % 4 === 0 ? 1.35 : 0.76, 1, index % 4 === 0 ? 1.2 : 0.7);
    dummy.updateMatrix();
    segments.setMatrixAt(index, dummy.matrix);
  }
  segments.instanceMatrix.needsUpdate = true;
  parent.add(segments);
  return segments;
}

function addGlyphs(parent: THREE.Group, material: THREE.Material): void {
  const geometry = new THREE.BoxGeometry(1.9, 7.5, 1.1);
  const glyphs = new THREE.InstancedMesh(geometry, material, 48);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 48; index += 1) {
    const angle = (index / 48) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 92, Math.sin(angle) * 92, 7);
    dummy.rotation.z = angle;
    dummy.scale.y = index % 5 === 0 ? 1.8 : 0.72 + (index % 3) * 0.18;
    dummy.updateMatrix();
    glyphs.setMatrixAt(index, dummy.matrix);
  }
  glyphs.instanceMatrix.needsUpdate = true;
  parent.add(glyphs);
}

function addCrownArcs(parent: THREE.Group, material: THREE.Material): THREE.Group {
  const crown = new THREE.Group();
  const geometry = new THREE.TorusGeometry(139, 2.3, 7, 46, Math.PI * 0.43);
  for (let index = 0; index < 4; index += 1) {
    const arc = new THREE.Mesh(geometry, material);
    arc.rotation.z = index * Math.PI * 0.5 + 0.18;
    crown.add(arc);
  }
  parent.add(crown);
  return crown;
}

export function createAtlas(): AtlasVisual {
  const root = new THREE.Group();
  root.name = 'Atlas Gate';
  root.rotation.set(-0.04, 0.02, 0.11);

  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x18232c,
    metalness: 0.91,
    roughness: 0.27,
    clearcoat: 0.22,
  });
  metal.fog = false;
  const innerMetal = new THREE.MeshStandardMaterial({
    color: 0x34434b,
    metalness: 0.82,
    roughness: 0.38,
  });
  innerMetal.fog = false;
  const glyphMaterial = new THREE.MeshBasicMaterial({
    color: 0x62ddef,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
  });
  glyphMaterial.fog = false;
  const mainRing = new THREE.Mesh(new THREE.TorusGeometry(111, 10, 14, 160), metal);
  root.add(mainRing);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(91, 2.8, 8, 128), innerMetal);
  root.add(innerRing);
  addRadialInstances(root, metal);
  addGlyphs(root, glyphMaterial);
  const crown = addCrownArcs(root, innerMetal);

  const portalMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: PORTAL_VERTEX,
    fragmentShader: PORTAL_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(178, 178), portalMaterial);
  portal.position.z = -2;
  portal.renderOrder = -1;
  root.add(portal);

  const anchorGeometry = new THREE.BoxGeometry(24, 92, 27);
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const anchor = new THREE.Mesh(anchorGeometry, metal);
    anchor.position.set(Math.cos(angle) * 154, Math.sin(angle) * 154, 0);
    anchor.rotation.z = angle;
    root.add(anchor);
  }

  return {
    root,
    materials: [portalMaterial],
    update: (time) => {
      innerRing.rotation.z = -time * 0.012;
      crown.rotation.z = time * 0.004;
      glyphMaterial.opacity = 0.62 + Math.sin(time * 1.1) * 0.1;
    },
  };
}
