import * as THREE from 'three';
import {
  ATMOSPHERE_FRAGMENT,
  CLOUD_FRAGMENT,
  OCEAN_FRAGMENT,
  RING_FRAGMENT,
  SURFACE_VERTEX,
} from './solaceShaders';

const MOON_FRAGMENT = `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalWorld;
uniform vec3 uLightDirection;
float hash(vec3 p){return fract(sin(dot(p,vec3(17.1,91.7,43.3)))*43758.5453);}
void main(){
  vec3 localNormal=normalize(vLocal);
  vec3 normalWorld=normalize(vNormalWorld);
  float pits=hash(floor(localNormal*28.0));
  float rock=0.48+0.28*pits;
  float light=max(dot(normalWorld,normalize(uLightDirection)),0.0);
  float rim=pow(1.0-max(dot(normalWorld,normalize(cameraPosition-vWorld)),0.0),3.0);
  gl_FragColor=vec4(vec3(0.19,0.23,0.25)*rock*(0.045+light)+vec3(0.025,0.07,0.09)*rim,1.0);
}`;

export interface SolaceVisual {
  root: THREE.Group;
  materials: THREE.ShaderMaterial[];
  update: (time: number) => void;
}

function shaderMaterial(
  fragmentShader: string,
  options: Partial<THREE.ShaderMaterialParameters> = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightDirection: { value: new THREE.Vector3(-0.72, 0.32, 0.46).normalize() },
    },
    vertexShader: SURFACE_VERTEX,
    fragmentShader,
    ...options,
  });
}

function createMoon(radius: number): THREE.Mesh {
  const material = shaderMaterial(MOON_FRAGMENT);
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 4), material);
  moon.castShadow = false;
  moon.receiveShadow = false;
  return moon;
}

export function createSolace(): SolaceVisual {
  const root = new THREE.Group();
  root.name = 'Solace ocean world';

  const oceanMaterial = shaderMaterial(OCEAN_FRAGMENT);
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(66, 64, 48), oceanMaterial);
  root.add(ocean);

  const cloudMaterial = shaderMaterial(CLOUD_FRAGMENT, {
    transparent: true,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(67.0, 56, 40), cloudMaterial);
  clouds.renderOrder = 3;
  root.add(clouds);

  const atmosphereMaterial = shaderMaterial(ATMOSPHERE_FRAGMENT, {
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false,
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(71.5, 48, 32),
    atmosphereMaterial,
  );
  atmosphere.renderOrder = 4;
  root.add(atmosphere);

  const ringMaterial = shaderMaterial(RING_FRAGMENT, {
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ringMaterial.forceSinglePass = true;
  const rings = new THREE.Mesh(new THREE.RingGeometry(82, 133, 192, 2), ringMaterial);
  rings.rotation.set(1.27, 0.18, -0.14);
  rings.renderOrder = 2;
  root.add(rings);

  const nearMoon = createMoon(7.4);
  const farMoon = createMoon(3.2);
  root.add(nearMoon, farMoon);
  const materials = [
    oceanMaterial,
    cloudMaterial,
    atmosphereMaterial,
    ringMaterial,
    nearMoon.material as THREE.ShaderMaterial,
    farMoon.material as THREE.ShaderMaterial,
  ];

  return {
    root,
    materials,
    update: (time) => {
      clouds.rotation.y = time * 0.012;
      rings.rotation.z = -0.14 + Math.sin(time * 0.035) * 0.008;
      nearMoon.position.set(
        Math.cos(time * 0.052) * 119,
        Math.sin(time * 0.031) * 23,
        Math.sin(time * 0.052) * 119,
      );
      farMoon.position.set(
        Math.cos(time * 0.024 + 2.1) * 174,
        Math.sin(time * 0.043) * 47,
        Math.sin(time * 0.024 + 2.1) * 174,
      );
    },
  };
}
