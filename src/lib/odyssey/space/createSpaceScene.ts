import * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import type { DiscoveryId } from '../types';
import { createAtlas } from './atlas';
import { createDeepSky } from './deepSky';
import { disposeSpaceScene } from './disposeSpaceScene';
import { createPilgrim } from './pilgrim';
import { createSolace } from './solace';
import { createDistantStars, createNearStars } from './starfield';
import { createVeil } from './veil';

export interface SpaceSceneRig {
  group: THREE.Group;
  starRotation: THREE.Group;
  bodies: Record<DiscoveryId, THREE.Object3D>;
  update: (
    time: number,
    camera: THREE.Camera,
    shipPosition: THREE.Vector3,
    inverseShipQuaternion: THREE.Quaternion,
  ) => void;
  setWarp?: (strength: number) => void;
  dispose: () => void;
}

function setBodyPosition(object: THREE.Object3D, id: DiscoveryId): void {
  object.position.fromArray(DISCOVERIES[id].position);
}

export function createSpaceScene(): SpaceSceneRig {
  const group = new THREE.Group();
  group.name = 'Odyssey inertial space';

  const starRotation = new THREE.Group();
  starRotation.name = 'Infinite deep sky';
  group.add(starRotation);

  const deepSky = createDeepSky();
  const distantStars = createDistantStars();
  const nearStars = createNearStars();
  starRotation.add(deepSky.mesh, distantStars.points);
  group.add(nearStars.points);

  const solace = createSolace();
  const veil = createVeil();
  const pilgrim = createPilgrim();
  const atlas = createAtlas();
  const bodies: Record<DiscoveryId, THREE.Object3D> = {
    solace: solace.root,
    veil: veil.root,
    pilgrim: pilgrim.root,
    atlas: atlas.root,
  };
  (Object.keys(bodies) as DiscoveryId[]).forEach((id) => {
    setBodyPosition(bodies[id], id);
    group.add(bodies[id]);
  });

  const ambient = new THREE.AmbientLight(0x122134, 0.42);
  const keyLight = new THREE.DirectionalLight(0xb8d5ff, 2.25);
  const keyTarget = new THREE.Object3D();
  keyLight.position.set(-450, 720, 380);
  keyTarget.position.set(0, -100, -1300);
  keyLight.target = keyTarget;
  group.add(ambient, keyLight, keyTarget);

  const animatedMaterials = [
    deepSky.material,
    distantStars.material,
    nearStars.material,
    ...solace.materials,
    ...veil.materials,
    ...atlas.materials,
  ];
  const cameraScenePosition = new THREE.Vector3();
  const cameraInertial = new THREE.Vector3();
  const shipQuaternion = new THREE.Quaternion();
  let warpTarget = 0;
  let warpStrength = 0;
  let previousTime = 0;

  const update = (
    time: number,
    camera: THREE.Camera,
    shipPosition: THREE.Vector3,
    inverseShipQuaternion: THREE.Quaternion,
  ): void => {
    group.quaternion.copy(inverseShipQuaternion);
    group.position.copy(shipPosition).multiplyScalar(-1).applyQuaternion(inverseShipQuaternion);

    shipQuaternion.copy(inverseShipQuaternion).invert();
    camera.getWorldPosition(cameraScenePosition);
    cameraInertial
      .copy(cameraScenePosition)
      .applyQuaternion(shipQuaternion)
      .add(shipPosition);
    starRotation.position
      .copy(cameraScenePosition)
      .applyQuaternion(shipQuaternion)
      .add(shipPosition);

    const delta = previousTime === 0 ? 1 / 60 : Math.min(time - previousTime, 0.05);
    previousTime = time;
    warpStrength = THREE.MathUtils.damp(warpStrength, warpTarget, 8, Math.max(delta, 0));
    animatedMaterials.forEach((material) => {
      const timeUniform = material.uniforms.uTime;
      const warpUniform = material.uniforms.uWarp;
      if (timeUniform) timeUniform.value = time;
      if (warpUniform) warpUniform.value = warpStrength;
    });

    solace.update(time);
    veil.update(time, cameraInertial);
    pilgrim.update(time);
    atlas.update(time);
  };

  return {
    group,
    starRotation,
    bodies,
    update,
    setWarp: (strength) => {
      warpTarget = THREE.MathUtils.clamp(strength, 0, 1);
    },
    dispose: () => disposeSpaceScene(group),
  };
}
