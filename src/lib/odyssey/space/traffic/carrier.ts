import * as THREE from 'three';
import { DISCOVERIES } from '../../discoveries';
import { createCarrierGeometry } from './carrierGeometry';
import type { TrafficMaterials } from './types';

export interface CarrierRig {
  group: THREE.Group;
  update: (time: number) => void;
}

function setInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale = 1,
): void {
  mesh.setMatrixAt(
    index,
    new THREE.Matrix4().compose(
      position,
      new THREE.Quaternion(),
      new THREE.Vector3(scale, scale, scale),
    ),
  );
}

export function createCarrier(materials: TrafficMaterials): CarrierRig {
  const group = new THREE.Group();
  group.name = 'Ananke freeport carrier';
  group.position.fromArray(DISCOVERIES.solace.position).add(new THREE.Vector3(166, 61, -104));
  group.rotation.set(.13, -.42, -.08);

  const geometry = createCarrierGeometry();
  const hull = new THREE.Mesh(geometry.hull, materials.hull);
  const detail = new THREE.Mesh(geometry.detail, materials.detail);
  const hangars = new THREE.Mesh(geometry.hangars, materials.detail);
  const windows = new THREE.Mesh(geometry.windows, materials.glass);
  hull.name = 'Ananke sculpted pressure hull';
  hangars.name = 'Ananke deep hangar mouths';
  windows.name = 'Ananke inhabited decks';
  group.add(hull, detail, hangars, windows);

  const ringGeometry = new THREE.TorusGeometry(23, .72, 12, 72);
  const rings = new THREE.InstancedMesh(ringGeometry, materials.detail, 2);
  setInstance(rings, 0, new THREE.Vector3(0, 0, -15), 1);
  setInstance(rings, 1, new THREE.Vector3(0, 0, 19), .88);
  rings.instanceMatrix.needsUpdate = true;
  rings.name = 'Counter-rotating gravity rings';
  group.add(rings);

  const lightGeometry = new THREE.IcosahedronGeometry(.46, 1);
  const approachPort = new THREE.InstancedMesh(lightGeometry, materials.port, 12);
  const approachStarboard = new THREE.InstancedMesh(
    lightGeometry,
    materials.starboard,
    12,
  );
  for (let index = 0; index < 12; index += 1) {
    const z = -42 + index * 7;
    setInstance(approachPort, index, new THREE.Vector3(-18.8, -1.4, z));
    setInstance(approachStarboard, index, new THREE.Vector3(18.8, -1.4, z));
  }
  approachPort.instanceMatrix.needsUpdate = true;
  approachStarboard.instanceMatrix.needsUpdate = true;
  approachPort.name = 'Ananke port approach beacons';
  approachStarboard.name = 'Ananke starboard approach beacons';
  group.add(approachPort, approachStarboard);

  const reactorMaterial = new THREE.MeshBasicMaterial({
    color: 0x8be9ff,
    transparent: true,
    opacity: .72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const reactor = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 3), reactorMaterial);
  reactor.position.set(0, 0, -55);
  reactor.name = 'Ananke fusion torch';
  group.add(reactor);

  return {
    group,
    update: (time) => {
      rings.rotation.z = time * .035;
      reactor.scale.setScalar(.94 + Math.sin(time * 3.4) * .07);
      reactorMaterial.opacity = .63 + Math.sin(time * 2.7) * .11;
      group.rotation.z = -.08 + Math.sin(time * .025) * .012;
    },
  };
}
