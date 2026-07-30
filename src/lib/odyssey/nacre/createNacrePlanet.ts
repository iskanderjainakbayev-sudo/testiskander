import * as THREE from 'three';
import { disposeSpaceScene } from '../space/disposeSpaceScene';
import {
  NACRE_ATMOSPHERE_FRAGMENT,
  NACRE_DUST_FRAGMENT,
  NACRE_PLANET_VERTEX,
  NACRE_SURFACE_FRAGMENT,
} from './nacrePlanetShaders';

export interface NacrePlanet {
  root: THREE.Group;
  materials: THREE.ShaderMaterial[];
  update: (time: number) => void;
  dispose: () => void;
}

function createMaterial(
  fragmentShader: string,
  options: Partial<THREE.ShaderMaterialParameters> = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightDirection: { value: new THREE.Vector3(-0.68, 0.43, 0.59).normalize() },
    },
    vertexShader: NACRE_PLANET_VERTEX,
    fragmentShader,
    ...options,
  });
}

export function createNacrePlanet(): NacrePlanet {
  const root = new THREE.Group();
  root.name = 'NACRE silica world';

  const surfaceMaterial = createMaterial(NACRE_SURFACE_FRAGMENT);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(64, 96, 64),
    surfaceMaterial,
  );

  const dustMaterial = createMaterial(NACRE_DUST_FRAGMENT, {
    transparent: true,
    depthWrite: false,
  });
  const dust = new THREE.Mesh(new THREE.SphereGeometry(65.15, 88, 60), dustMaterial);
  dust.renderOrder = 2;

  const atmosphereMaterial = createMaterial(NACRE_ATMOSPHERE_FRAGMENT, {
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(69.8, 80, 56),
    atmosphereMaterial,
  );
  atmosphere.renderOrder = 3;
  root.add(surface, dust, atmosphere);

  const materials = [surfaceMaterial, dustMaterial, atmosphereMaterial];
  return {
    root,
    materials,
    update: (time) => {
      dust.rotation.y = time * 0.009;
      dust.rotation.z = Math.sin(time * 0.017) * 0.012;
      dustMaterial.uniforms.uTime.value = time;
    },
    dispose: () => disposeSpaceScene(root),
  };
}
