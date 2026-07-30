import * as THREE from 'three';

export function addHabitatRing(
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

export function addHullRibs(vessel: THREE.Group, metal: THREE.Material): void {
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

export function addHullArmor(vessel: THREE.Group, armor: THREE.Material): void {
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

export function addAntennae(vessel: THREE.Group, metal: THREE.Material): void {
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
