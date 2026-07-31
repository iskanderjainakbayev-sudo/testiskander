import * as THREE from 'three';
import { createHabitat, type HabitatModules } from './habitat';
import { floorAt, seededRandom } from './terrain';

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

function createCoral(random: () => number): THREE.Group {
  const group = new THREE.Group();
  const colors = [0xff8b7b, 0xffcc66, 0x8cf1c5, 0xb895ff];
  for (let arm = 0; arm < 4 + random() * 4; arm += 1) {
    const height = 0.5 + random() * 1.8;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, height, 6), material(colors[arm % colors.length]));
    mesh.position.set((random() - 0.5) * 0.8, height / 2, (random() - 0.5) * 0.8);
    mesh.rotation.z = (random() - 0.5) * 0.45;
    group.add(mesh);
  }
  return group;
}

function createKelp(random: () => number): THREE.Group {
  const group = new THREE.Group();
  for (let stem = 0; stem < 3; stem += 1) {
    const height = 5 + random() * 7;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, height, 7), material(0x2fbd88, 0x0a4f3d));
    mesh.position.set((stem - 1) * 0.45, height / 2, (random() - 0.5) * 0.5);
    mesh.userData.phase = random() * Math.PI * 2;
    group.add(mesh);
    for (let leaf = 1; leaf < 4; leaf += 1) {
      const frond = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 4), material(0x7cf7af, 0x175d36));
      frond.scale.set(0.25, 1.2, 0.12);
      frond.position.set(stem * 0.25 - 0.3, height * leaf / 5, 0);
      group.add(frond);
    }
  }
  return group;
}

function createCrystal(random: () => number): THREE.Group {
  const group = new THREE.Group();
  for (let shard = 0; shard < 3 + random() * 4; shard += 1) {
    const height = 1.2 + random() * 3.5;
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.25 + random() * 0.25, height, 5), material(0x3ae1ff, 0x158fb7));
    mesh.position.set((random() - 0.5) * 1.6, height / 2, (random() - 0.5) * 1.6);
    mesh.rotation.z = (random() - 0.5) * 0.35;
    group.add(mesh);
  }
  return group;
}

export function createDecorations(scene: THREE.Scene): OceanDecor {
  const random = seededRandom(77421);
  const plants: THREE.Object3D[] = [];
  for (let index = 0; index < 186; index += 1) {
    const radius = 8 + random() * 262;
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = 8 + Math.sin(angle) * radius;
    const object = radius < 38 || (radius > 90 && index % 5 === 0)
      ? createCoral(random) : radius < 92 || index % 3 === 0 ? createKelp(random) : createCrystal(random);
    object.position.set(x, floorAt(x, z), z);
    object.rotation.y = random() * Math.PI * 2;
    scene.add(object);
    plants.push(object);
  }
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
