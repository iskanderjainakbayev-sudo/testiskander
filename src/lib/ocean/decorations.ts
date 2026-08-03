import * as THREE from 'three';
import { createHabitat, type HabitatModules } from './habitat';
import { hydrateOceanHero } from './OceanHeroModels';
import { createBiomeDecorField } from './biomeDecorField';

export interface OceanDecor {
  plants: THREE.Object3D[];
  pod: THREE.Group;
  submarine: THREE.Group;
  rocket: THREE.Group;
  habitat: HabitatModules;
}

function material(color: number, emissive = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 1.8 : 0, roughness: 0.72 });
}

export function createDecorations(scene: THREE.Scene): OceanDecor {
  const biomeDecor = createBiomeDecorField();
  const plants: THREE.Object3D[] = [biomeDecor];
  scene.add(biomeDecor);
  const pod = createPod();
  const submarine = createSubmarine();
  const rocket = createRocket();
  const habitat = createHabitat(scene);
  scene.add(pod, submarine, rocket);
  return { plants, pod, submarine, rocket, habitat };
}

function createPod(): THREE.Group {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(3.3, 18, 12), material(0xe8e5d4));
  shell.scale.y = 0.62;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.32, 8, 24), material(0xf2703f, 0x542211));
  stripe.rotateX(Math.PI / 2);
  group.add(shell, stripe);
  hydrateOceanHero(group, 'damaged-lifepod');
  group.position.set(0, -1.1, 8);
  return group;
}

function createSubmarine(): THREE.Group {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 3.8, 6, 12), material(0xe5d8ae));
  hull.rotateX(Math.PI / 2);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.82, 14, 9), material(0x185c72, 0x082637));
  glass.position.z = -2.4;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), material(0xe86e3d));
  fin.position.z = 0.6;
  group.add(hull, glass, fin);
  hydrateOceanHero(group, 'nereid-micro-sub');
  group.position.set(7, -5, 9);
  group.visible = false;
  return group;
}

function createRocket(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.7, 9, 12), material(0xf0e8cf));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.25, 3.2, 12), material(0xf07442));
  body.position.y = 4.5;
  nose.position.y = 10.6;
  group.add(body, nose);
  group.position.set(-9, 0.1, 8);
  group.visible = false;
  return group;
}
