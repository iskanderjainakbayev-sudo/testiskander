import * as THREE from 'three';

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

function addHabitatRing(
  vessel: THREE.Group,
  metal: THREE.Material,
  windowMaterial: THREE.Material,
): THREE.Group {
  const habitat = new THREE.Group();
  habitat.position.x = -14;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(31, 3.1, 10, 72), metal);
  ring.rotation.y = Math.PI / 2;
  habitat.add(ring);

  const spokeGeometry = new THREE.CylinderGeometry(0.55, 0.8, 57, 6);
  for (let index = 0; index < 6; index += 1) {
    const spoke = new THREE.Mesh(spokeGeometry, metal);
    spoke.rotation.x = (index / 6) * Math.PI;
    habitat.add(spoke);
  }

  const windowGeometry = new THREE.BoxGeometry(1.1, 2.1, 4.4);
  const windows = new THREE.InstancedMesh(windowGeometry, windowMaterial, 24);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    dummy.position.set(0, Math.cos(angle) * 31, Math.sin(angle) * 31);
    dummy.rotation.x = angle;
    dummy.updateMatrix();
    windows.setMatrixAt(index, dummy.matrix);
  }
  windows.instanceMatrix.needsUpdate = true;
  habitat.add(windows);
  vessel.add(habitat);
  return habitat;
}

function addHullRibs(vessel: THREE.Group, metal: THREE.Material): void {
  const geometry = new THREE.TorusGeometry(19.4, 0.72, 6, 40);
  const ribs = new THREE.InstancedMesh(geometry, metal, 17);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 17; index += 1) {
    const x = -48 + index * 6;
    const taper = 1 - Math.pow(Math.abs(x) / 70, 2) * 0.34;
    dummy.position.x = x;
    dummy.rotation.y = Math.PI / 2;
    dummy.scale.setScalar(taper);
    dummy.updateMatrix();
    ribs.setMatrixAt(index, dummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate = true;
  vessel.add(ribs);
}

function addArmor(vessel: THREE.Group, armor: THREE.Material): void {
  const geometry = new THREE.BoxGeometry(8.8, 1.2, 8.2);
  const plates = new THREE.InstancedMesh(geometry, armor, 34);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 34; index += 1) {
    const row = index % 2;
    const x = -47 + Math.floor(index / 2) * 5.8;
    const angle = row * Math.PI + (Math.floor(index / 2) % 2) * 0.18;
    dummy.position.set(x, Math.cos(angle) * 19, Math.sin(angle) * 19);
    dummy.rotation.set(angle, 0, Math.PI / 2);
    dummy.scale.set(0.82 + (index % 3) * 0.08, 1, 1);
    dummy.updateMatrix();
    plates.setMatrixAt(index, dummy.matrix);
  }
  plates.instanceMatrix.needsUpdate = true;
  vessel.add(plates);
}

function addAntennae(vessel: THREE.Group, metal: THREE.Material): void {
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.7, 29, 6), metal);
  mast.position.set(36, 27, 0);
  vessel.add(mast);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(8, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.31),
    metal,
  );
  dish.position.set(36, 41, 0);
  dish.rotation.z = -0.3;
  vessel.add(dish);
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
  addArmor(vessel, armorMetal);
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
