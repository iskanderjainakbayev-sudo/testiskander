import * as THREE from "three";
import { makeHumanoidBot, type HumanoidBot } from "./humanoidBot";

export type Enemy = {
  model: HumanoidBot;
  health: number;
  nextShot: number;
  strafe: number;
  pulse: number;
  isBoss: boolean;
};

export function addEnemies(scene: THREE.Scene, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const enemy: Enemy = {
      model: makeHumanoidBot(),
      health: 4,
      nextShot: 0,
      strafe: 1,
      pulse: Math.random() * Math.PI * 2,
      isBoss: false,
    };
    scene.add(enemy.model.group);
    resetEnemy(enemy, index);
    return enemy;
  });
}

export function resetEnemy(enemy: Enemy, index: number) {
  const angle = index * 2.41 + Math.random() * 0.4;
  const distance = 17 + Math.random() * 23;
  enemy.model.group.position.set(
    Math.cos(angle) * distance,
    0,
    Math.sin(angle) * distance,
  );
  enemy.health = 4;
  enemy.isBoss = false;
  enemy.model.group.scale.setScalar(1);
  enemy.nextShot = performance.now() + 1400 + Math.random() * 1000;
  enemy.strafe = Math.random() > 0.5 ? 1 : -1;
  enemy.model.group.visible = true;
}

export function prepareEnemies(enemies: Enemy[], activeCount: number, hasBoss = false) {
  enemies.forEach((enemy, index) => {
    if (index < activeCount) {
      resetEnemy(enemy, index);
      if (hasBoss && index === activeCount - 1) {
        enemy.isBoss = true;
        enemy.health = 18;
        enemy.model.group.scale.setScalar(1.75);
        enemy.model.group.position.set(0, 0, -18);
      }
    }
    else enemy.model.group.visible = false;
  });
}

export function updateEnemies(
  enemies: Enemy[],
  camera: THREE.Camera,
  delta: number,
  time: number,
  onShoot: (enemy: Enemy) => void,
) {
  enemies
    .filter((enemy) => enemy.model.group.visible)
    .forEach((enemy) => {
      const toPlayer = camera.position.clone().sub(enemy.model.group.position);
      const corePulse = 1 + Math.sin(time * 0.006 + enemy.pulse) * 0.035;
      enemy.model.core.scale.setScalar(corePulse);
      enemy.model.core.rotation.y += delta * 0.45;
      toPlayer.y = 0;
      const distance = toPlayer.length();
      const direction = toPlayer.normalize();
      enemy.model.group.lookAt(camera.position.x, 1.3, camera.position.z);
      const side = new THREE.Vector3(
        -direction.z,
        0,
        direction.x,
      ).multiplyScalar(enemy.strafe);
      if (distance > 11)
        enemy.model.group.position.addScaledVector(direction, delta * 1.65);
      if (distance < 7)
        enemy.model.group.position.addScaledVector(direction, -delta * 1.3);
      enemy.model.group.position.addScaledVector(side, delta * 0.7);
      animateSoldier(enemy, time, distance);
      if (time > enemy.nextShot && distance < 28) {
        enemy.nextShot = time + 1700 + Math.random() * 1000;
        enemy.strafe *= -1;
        onShoot(enemy);
      }
    });
}

function animateSoldier(enemy: Enemy, time: number, distance: number) {
  const moving = THREE.MathUtils.clamp((distance - 6) / 12, 0.16, 0.85);
  const swing = Math.sin(time * 0.009 + enemy.pulse) * moving;
  enemy.model.limbs.leftLeg.rotation.x = swing * 0.55;
  enemy.model.limbs.rightLeg.rotation.x = -swing * 0.55;
  enemy.model.limbs.leftArm.rotation.x = -0.35 - swing * 0.22;
  enemy.model.limbs.rightArm.rotation.x = -0.5 + swing * 0.12;
  enemy.model.group.rotation.z = Math.sin(time * 0.004 + enemy.pulse) * 0.025;
}

export function hitEnemy(enemies: Enemy[], object: THREE.Object3D, damage = 1) {
  const enemy = enemies.find((item) => item.model.group === enemyRoot(object));
  if (!enemy) return false;
  enemy.health -= object.name === "head" ? damage * 2 : damage;
  enemy.model.armor.emissive.setHex(0xff3434);
  window.setTimeout(() => enemy.model.armor.emissive.setHex(0x3d0710), 80);
  if (enemy.health > 0) return false;
  enemy.model.group.visible = false;
  return true;
}

function enemyRoot(object: THREE.Object3D) {
  let root = object;
  while (root.parent && root.parent.type !== "Scene") root = root.parent;
  return root;
}
