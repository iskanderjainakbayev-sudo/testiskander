import * as THREE from "three";
import type { Climbable, CollisionBox, WalkableSurface } from "./maps/types";

const up = new THREE.Vector3(0, 1, 0);
const eyeHeight = 1.75;
const walkSpeed = 6;
const sprintSpeed = 11.3;

export type PlayerMoveState = {
  isMoving: boolean;
  isSprinting: boolean;
  didJump: boolean;
  didLand: boolean;
};

export type JumpState = { velocity: number; grounded: boolean };
export const createJumpState = (): JumpState => ({
  velocity: 0,
  grounded: true,
});

export function movePlayer(
  camera: THREE.Camera,
  keys: Set<string>,
  delta: number,
  jump: JumpState,
  surfaces: WalkableSurface[],
  collision: CollisionBox[],
  climbables: Climbable[],
  bounds: number,
  canSprint: boolean,
): PlayerMoveState {
  if (moveOnLadder(camera, keys, delta, jump, climbables)) {
    return { isMoving: false, isSprinting: false, didJump: false, didLand: false };
  }
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
    up,
    camera.rotation.y,
  );
  const sideways = new THREE.Vector3(1, 0, 0).applyAxisAngle(
    up,
    camera.rotation.y,
  );
  const direction = forward
    .multiplyScalar(Number(keys.has("w")) - Number(keys.has("s")))
    .add(
      sideways.multiplyScalar(Number(keys.has("d")) - Number(keys.has("a"))),
    );
  const isMoving = Boolean(direction.lengthSq());
  const isSprinting = isMoving && canSprint && keys.has("shift");
  const moveSpeed = canSprint && keys.has("shift") ? sprintSpeed : walkSpeed;
  if (isMoving) {
    const movement = direction.normalize().multiplyScalar(moveSpeed * delta);
    const previousX = camera.position.x;
    camera.position.x += movement.x;
    if (insideCollision(camera.position, collision)) camera.position.x = previousX;
    const previousZ = camera.position.z;
    camera.position.z += movement.z;
    if (insideCollision(camera.position, collision)) camera.position.z = previousZ;
  }
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -bounds, bounds);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -bounds, bounds);
  const didJump = keys.has(" ") && jump.grounded;
  if (didJump) {
    jump.velocity = 8.6;
    jump.grounded = false;
    keys.delete(" ");
  }
  const currentFeet = camera.position.y - eyeHeight;
  jump.velocity -= 23 * delta;
  const nextFeet = currentFeet + jump.velocity * delta;
  const landing = highestLanding(
    camera.position,
    currentFeet,
    nextFeet,
    surfaces,
  );
  const wasInAir = !jump.grounded;
  if (landing !== undefined) {
    camera.position.y = landing + eyeHeight;
    jump.velocity = 0;
    jump.grounded = true;
    const didLand = wasInAir;
    if (didLand) return { isMoving, isSprinting, didJump, didLand };
  } else {
    camera.position.y = Math.max(eyeHeight, nextFeet + eyeHeight);
    jump.grounded = camera.position.y === eyeHeight;
    if (jump.grounded) jump.velocity = 0;
  }
  return { isMoving, isSprinting, didJump, didLand: false };
}

function moveOnLadder(camera: THREE.Camera, keys: Set<string>, delta: number, jump: JumpState, climbables: Climbable[]) {
  if (!keys.has("e")) return false;
  const vertical = Number(keys.has("w")) - Number(keys.has("s"));
  if (!vertical) return false;
  const facing = camera.getWorldDirection(new THREE.Vector3());
  const ladder = climbables.find((item) => {
    const offset = new THREE.Vector3(item.x - camera.position.x, 0, item.z - camera.position.z);
    return Math.abs(offset.x) < item.width / 2 && Math.abs(offset.z) < item.depth / 2 && facing.dot(offset.normalize()) > 0.25;
  });
  if (!ladder) return false;
  const minHeight = eyeHeight;
  const maxHeight = ladder.topHeight + eyeHeight;
  camera.position.y = THREE.MathUtils.clamp(camera.position.y + vertical * 4.8 * delta, minHeight, maxHeight);
  jump.velocity = 0;
  jump.grounded = false;
  return true;
}

function highestLanding(
  position: THREE.Vector3,
  currentFeet: number,
  nextFeet: number,
  surfaces: WalkableSurface[],
) {
  const landingSurfaces = [
    0,
    ...surfaces
      .filter(
        (platform) =>
          Math.abs(position.x - platform.x) < platform.width / 2 &&
          Math.abs(position.z - platform.z) < platform.depth / 2,
      )
      .map((platform) => platform.height),
  ];
  return landingSurfaces
    .filter((top) => currentFeet >= top - 0.04 && nextFeet <= top)
    .sort((a, b) => b - a)[0];
}

function insideCollision(position: THREE.Vector3, collision: CollisionBox[]) {
  const radius = 0.45;
  return collision.some(
    (box) =>
      Math.abs(position.x - box.x) < box.width / 2 + radius &&
      Math.abs(position.z - box.z) < box.depth / 2 + radius &&
      position.y - eyeHeight < (box.height ?? Number.POSITIVE_INFINITY),
  );
}

export function lookCamera(camera: THREE.Camera, event: MouseEvent) {
  camera.rotation.y -= event.movementX * 0.002;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - event.movementY * 0.002,
    -1.25,
    1.25,
  );
}
