import * as THREE from 'three';
import type { MultiToolModule } from './multitoolCatalog';
import { prepareViewModel } from './weaponModelParts';

export interface MultiToolRig {
  root: THREE.Group;
  rotor: THREE.Group;
  rails: THREE.Mesh[];
  emitter: THREE.Mesh;
  screen: THREE.MeshStandardMaterial;
  energy: THREE.MeshStandardMaterial;
}

const metal = (color: number, roughness: number) => new THREE.MeshStandardMaterial({
  color, metalness: 0.88, roughness, envMapIntensity: 1.4,
});

function box(size: [number, number, number], material: THREE.Material, position: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size, 2, 2, 2), material);
  mesh.position.set(...position);
  return mesh;
}

export function createMultiToolModel(): MultiToolRig {
  const root = new THREE.Group();
  const shell = metal(0x172b32, .24);
  const trim = metal(0x6d7d82, .18);
  const rubber = new THREE.MeshStandardMaterial({ color: 0x071619, roughness: .82, metalness: .08 });
  const energy = new THREE.MeshStandardMaterial({ color: 0x68fff0, emissive: 0x68fff0, emissiveIntensity: 3.2, roughness: .18 });
  const screen = energy.clone();
  const body = box([.25, .2, .56], shell, [0, .02, -.12]);
  body.geometry.rotateX(-.08);
  const top = box([.18, .075, .48], trim, [0, .15, -.13]);
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(.073, .28, 6, 10), rubber);
  grip.rotation.x = -.32;
  grip.position.set(0, -.24, .08);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(.12, .018, 6, 16, Math.PI * 1.35), trim);
  guard.rotation.set(Math.PI / 2, 0, -.55);
  guard.position.set(0, -.15, -.03);
  const display = box([.13, .008, .17], screen, [.001, .194, -.08]);
  display.rotation.x = -.08;
  root.add(body, top, grip, guard, display);

  const rotor = new THREE.Group();
  rotor.position.z = -.45;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .18, 12), shell);
  collar.rotation.x = Math.PI / 2;
  rotor.add(collar);
  const rails: THREE.Mesh[] = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * Math.PI * 2;
    const rail = box([.035, .035, .32], trim, [Math.cos(angle) * .105, Math.sin(angle) * .105, -.18]);
    rails.push(rail);
    rotor.add(rail);
  }
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(.055, .082, .12, 12), energy);
  emitter.rotation.x = Math.PI / 2;
  emitter.position.z = -.4;
  rotor.add(emitter);
  root.add(rotor);
  addDetails(root, shell, trim, energy);
  root.position.set(.38, -.32, -.7);
  root.rotation.set(-.05, -.12, -.04);
  prepareViewModel(root);
  return { root, rotor, rails, emitter, screen, energy };
}

export function colorMultiTool(rig: MultiToolRig, color: number): void {
  rig.energy.color.setHex(color);
  rig.energy.emissive.setHex(color);
  rig.screen.color.setHex(color);
  rig.screen.emissive.setHex(color);
}

export function moduleIndex(module: MultiToolModule): number {
  return ['mining', 'harpoon', 'repulsor', 'scanner', 'repair'].indexOf(module);
}

function addDetails(root: THREE.Group, shell: THREE.Material, trim: THREE.Material, energy: THREE.Material): void {
  [-1, 1].forEach((side) => {
    const cable = new THREE.Mesh(new THREE.TorusGeometry(.16, .012, 5, 16, 1.7), energy);
    cable.rotation.set(Math.PI / 2, side * .45, side * 1.25);
    cable.position.set(side * .13, -.02, -.14);
    root.add(cable);
    for (let index = 0; index < 3; index += 1) {
      const vent = box([.012, .055, .025], shell, [side * .132, .01 + index * .055, -.18]);
      root.add(vent);
    }
  });
  for (let index = 0; index < 6; index += 1) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .008, 8), trim);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(index % 2 ? .13 : -.13, index < 2 ? .1 : -.08, -.28 + (index % 3) * .18);
    root.add(screw);
  }
}
