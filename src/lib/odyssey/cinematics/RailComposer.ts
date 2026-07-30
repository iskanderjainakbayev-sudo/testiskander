import * as THREE from 'three';
import type { RailPose } from './railMath';
import type { CinematicFrame } from './types';

const UP = new THREE.Vector3(0, 1, 0);
const CAMERA_FORWARD = new THREE.Vector3(0, 0, -1);

export class RailComposer {
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  private readonly focus = new THREE.Vector3();
  private readonly targetLocal = new THREE.Vector3();
  private readonly inverseShip = new THREE.Quaternion();
  private readonly lookMatrix = new THREE.Matrix4();
  private readonly rollQuaternion = new THREE.Quaternion();

  compose(
    sample: RailPose,
    frame: CinematicFrame,
    targetRadius: number,
    shipScale: number,
  ): void {
    this.targetLocal.copy(frame.targetPosition);
    if (frame.targetSpace !== 'scene') {
      this.inverseShip.copy(frame.shipQuaternion).invert();
      this.targetLocal
        .sub(frame.shipPosition)
        .applyQuaternion(this.inverseShip);
    }

    const radiusRatio = THREE.MathUtils.clamp(targetRadius / 22, 0.75, 5.5);
    const offsetScale = THREE.MathUtils.lerp(1, radiusRatio, sample.radiusScale);
    this.position
      .copy(sample.position)
      .multiplyScalar(offsetScale * shipScale)
      .addScaledVector(this.targetLocal, sample.targetAnchor);
    this.focus
      .copy(sample.focus)
      .multiplyScalar(offsetScale * shipScale)
      .addScaledVector(this.targetLocal, sample.targetFocus);
    if (this.position.distanceToSquared(this.focus) < 0.0001) {
      this.focus.z -= 1;
    }
    this.lookMatrix.lookAt(this.position, this.focus, UP);
    this.quaternion.setFromRotationMatrix(this.lookMatrix);
    this.rollQuaternion.setFromAxisAngle(CAMERA_FORWARD, sample.roll);
    this.quaternion.multiply(this.rollQuaternion).normalize();
  }
}
