import * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import { createNacrePlanet } from '../nacre';
import type { DiscoveryId } from '../types';
import { createAtlas } from './atlas';
import { createDeepSky } from './deepSky';
import { disposeSpaceScene } from './disposeSpaceScene';
import { createPilgrim } from './pilgrim';
import { createSolace } from './solace';
import { createDistantStars, createNearStars } from './starfield';
import { createTrafficSystem, type TrafficUpdate } from './traffic/createTrafficSystem';
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
  ) => TrafficUpdate;
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

  const traffic = createTrafficSystem();
  const solace = createSolace();
  const nacre = createNacrePlanet();
  const veil = createVeil();
  const pilgrim = createPilgrim();
  const atlas = createAtlas();
  const bodies: Record<DiscoveryId, THREE.Object3D> = {
    solace: solace.root,
    nacre: nacre.root,
    veil: veil.root,
    pilgrim: pilgrim.root,
    atlas: atlas.root,
  };
  (Object.keys(bodies) as DiscoveryId[]).forEach((id) => {
    setBodyPosition(bodies[id], id);
    group.add(bodies[id]);
  });
  group.add(traffic.group);

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
    ...nacre.materials,
    ...veil.materials,
    ...atlas.materials,
  ];
  const cameraScenePosition = new THREE.Vector3();
  const cameraInertial = new THREE.Vector3();
  const shipQuaternion = new THREE.Quaternion();
  const inertialLightDirection = new THREE.Vector3(-0.72, 0.32, 0.46).normalize();
  const renderedLightDirection = new THREE.Vector3();
  let warpTarget = 0;
  let warpStrength = 0;
  let previousTime = 0;

  const update = (
    time: number,
    camera: THREE.Camera,
    shipPosition: THREE.Vector3,
    inverseShipQuaternion: THREE.Quaternion,
  ): TrafficUpdate => {
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
    renderedLightDirection.copy(inertialLightDirection).applyQuaternion(inverseShipQuaternion);
    animatedMaterials.forEach((material) => {
      const timeUniform = material.uniforms.uTime;
      const warpUniform = material.uniforms.uWarp;
      const lightUniform = material.uniforms.uLightDirection;
      if (timeUniform) timeUniform.value = time;
      if (warpUniform) warpUniform.value = warpStrength;
      if (lightUniform?.value instanceof THREE.Vector3) {
        lightUniform.value.copy(renderedLightDirection);
      }
    });

    solace.update(time);
    nacre.update(time);
    veil.update(time, cameraInertial);
    pilgrim.update(time);
    atlas.update(time);
    return traffic.update(time, shipPosition);
  };

  return {
    group,
    starRotation,
    bodies,
    update,
    setWarp: (strength) => {
      warpTarget = THREE.MathUtils.clamp(strength, 0, 1);
    },
    dispose: () => {
      traffic.dispose();
      disposeSpaceScene(group);
    },
  };
}
