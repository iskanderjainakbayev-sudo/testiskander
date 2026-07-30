import * as THREE from 'three';
export function createLandingEquipment(
  getHeight: (x: number, z: number) => number,
  rampZ: number,
) {
  const root = new THREE.Group();
  root.name = 'LYRA deployed boarding ramp';
  const ground = getHeight(0, rampZ);
  const rise = 6.5;
  const length = 13;
  const angle = Math.atan2(rise, length);
  const rampMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x263034,
    roughness: 0.68,
    metalness: 0.54,
    clearcoat: 0.08,
  });
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, length), rampMaterial);
  ramp.position.set(0, ground + rise * 0.5 + 0.24, rampZ + 6);
  ramp.rotation.x = -angle;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  root.add(ramp);

  const treadGeometry = new THREE.BoxGeometry(2.65, 0.08, 0.24);
  const treadMaterial = new THREE.MeshStandardMaterial({
    color: 0x798083,
    roughness: 0.56,
    metalness: 0.72,
  });
  const treads = new THREE.InstancedMesh(treadGeometry, treadMaterial, 9);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 9; index += 1) {
    const ratio = (index + 0.5) / 9;
    dummy.position.set(0, ground + 0.44 + rise * ratio, rampZ - 0.5 + length * ratio);
    dummy.rotation.x = -angle;
    dummy.updateMatrix();
    treads.setMatrixAt(index, dummy.matrix);
  }
  treads.instanceMatrix.needsUpdate = true;
  root.add(treads);

  const beaconMaterial = new THREE.MeshBasicMaterial({
    color: 0xeab56e,
    toneMapped: false,
  });
  const beacons = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.09, 1),
    beaconMaterial,
    12,
  );
  for (let index = 0; index < 6; index += 1) {
    const ratio = index / 5;
    for (const side of [-1, 1]) {
      dummy.position.set(side * 1.34, ground + 0.52 + rise * ratio, rampZ - 0.5 + length * ratio);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      beacons.setMatrixAt(index * 2 + (side > 0 ? 1 : 0), dummy.matrix);
    }
  }
  beacons.instanceMatrix.needsUpdate = true;
  root.add(beacons);
  return root;
}
