import * as THREE from "three";
import { buildTacticalSoldier } from "./tacticalSoldier";

export type HumanoidBot = {
  group: THREE.Group;
  muzzle: THREE.Object3D;
  armor: THREE.MeshStandardMaterial;
  core: THREE.Mesh;
  limbs: { leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group };
};

export function makeHumanoidBot(): HumanoidBot {
  const soldier = buildTacticalSoldier();
  soldier.group.traverse((part) => {
    if (part instanceof THREE.Mesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  return soldier;
}
