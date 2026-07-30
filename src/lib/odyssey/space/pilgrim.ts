import * as THREE from 'three';
import {
  addAntennae,
  addHabitatRing,
  addHullArmor,
  addHullRibs,
} from './pilgrimDetails';

export interface PilgrimVisual {
  root: THREE.Group;
  update: (time: number) => void;
}

function makeMetal(color: number, roughness: number): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.78,
    roughness,
    clearcoat: 0.16,
    clearcoatRoughness: 0.45,
  });
  material.fog = false;
  return material;
}

export function createPilgrim(): PilgrimVisual {
  const root = new THREE.Group();
  root.name = 'Pilgrim ark vessel';
  const vessel = new THREE.Group();
  vessel.rotation.set(0.18, -0.54, 0.12);
  root.add(vessel);

  const hullMetal = makeMetal(0x111922, 0.31);
  const armorMetal = makeMetal(0x27313a, 0.44);
  const warmWindows = new THREE.MeshBasicMaterial({
    color: 0xffc578,
    toneMapped: false,
  });
  warmWindows.fog = false;
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(18, 96, 8, 24), hullMetal);
  hull.rotation.z = Math.PI / 2;
  vessel.add(hull);

  const prow = new THREE.Mesh(new THREE.ConeGeometry(18, 41, 32, 5), armorMetal);
  prow.position.x = 68;
  prow.rotation.z = -Math.PI / 2;
  vessel.add(prow);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(15, 18, 28, 24), hullMetal);
  tail.position.x = -66;
  tail.rotation.z = Math.PI / 2;
  vessel.add(tail);

  addHullRibs(vessel, armorMetal);
  addHullArmor(vessel, armorMetal);
  const habitat = addHabitatRing(vessel, armorMetal, warmWindows);
  addAntennae(vessel, armorMetal);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x163f43,
    emissive: 0x07261d,
    emissiveIntensity: 0.75,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.23,
    transparent: true,
    opacity: 0.84,
  });
  glass.fog = false;
  const garden = new THREE.Mesh(new THREE.SphereGeometry(13, 28, 18), glass);
  garden.scale.set(1.42, 0.72, 1);
  garden.position.set(23, 15, 0);
  vessel.add(garden);

  const keel = new THREE.Mesh(new THREE.BoxGeometry(122, 2.2, 3.2), armorMetal);
  keel.position.y = -20;
  vessel.add(keel);
  for (const x of [-48, -2, 43]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(13, 22, 1.1), armorMetal);
    fin.position.set(x, -29, 0);
    fin.rotation.z = -0.14;
    vessel.add(fin);
  }

  return {
    root,
    update: (time) => {
      habitat.rotation.x = time * 0.055;
      vessel.rotation.z = 0.12 + Math.sin(time * 0.08) * 0.012;
      garden.material.opacity = 0.8 + Math.sin(time * 0.7) * 0.035;
    },
  };
}
