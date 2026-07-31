import * as THREE from 'three';
import type { RecipeId } from './types';

export type HabitatModules = Partial<Record<RecipeId, THREE.Group>>;

const shell = new THREE.MeshStandardMaterial({ color: 0xd8dacd, roughness: 0.52, metalness: 0.22 });
const orange = new THREE.MeshStandardMaterial({ color: 0xe96d3c, roughness: 0.58 });
const glow = new THREE.MeshStandardMaterial({
  color: 0x66f5df, emissive: 0x167e71, emissiveIntensity: 2, roughness: 0.3,
});

function moduleAt(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, -14.7, z);
  group.visible = false;
  return group;
}

export function createHabitat(scene: THREE.Scene): HabitatModules {
  const storage = moduleAt(-5.5, 1.5);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.25, 1.5), shell);
  const crateBand = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.22, 1.58), orange);
  crate.position.y = 0.7;
  crateBand.position.y = 0.75;
  storage.add(crate, crateBand);

  const fabricator = moduleAt(-2.6, -0.5);
  const fabBody = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 2.3, 10), shell);
  const fabScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), glow);
  fabBody.position.y = 1.15;
  fabScreen.position.set(0, 1.4, -0.78);
  fabricator.add(fabBody, fabScreen);

  const charger = moduleAt(0.6, -1.5);
  const chargerRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.13, 7, 18), glow);
  chargerRing.position.y = 0.9;
  chargerRing.rotation.x = Math.PI / 2;
  charger.add(chargerRing);

  const solar = moduleAt(3.5, -0.5);
  for (let index = 0; index < 5; index += 1) {
    const panel = new THREE.Mesh(new THREE.CircleGeometry(0.85, 6), new THREE.MeshStandardMaterial({
      color: 0x163f61, emissive: 0x08243e, emissiveIntensity: 0.7, metalness: 0.45,
    }));
    const angle = index / 5 * Math.PI * 2;
    panel.position.set(Math.cos(angle) * 0.7, 0.65, Math.sin(angle) * 0.7);
    panel.rotation.x = -Math.PI / 2;
    solar.add(panel);
  }

  const beacon = moduleAt(6, 2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 3.2, 7), orange);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), glow);
  mast.position.y = 1.6;
  lamp.position.y = 3.25;
  beacon.add(mast, lamp);

  const modules: HabitatModules = { storage, fabricator, charger, solar, beacon };
  Object.values(modules).forEach((module) => module && scene.add(module));
  return modules;
}

