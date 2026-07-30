import * as THREE from 'three';
import { CameraPose, setCameraFov } from './CameraPose';

export class CameraBlender {
  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  fromPose(
    start: CameraPose,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    fov: number,
    alpha: number,
  ): void {
    this.camera.position.lerpVectors(start.position, position, alpha);
    this.camera.quaternion.slerpQuaternions(start.quaternion, quaternion, alpha);
    setCameraFov(this.camera, THREE.MathUtils.lerp(start.fov, fov, alpha));
  }

  toPose(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    fov: number,
    end: CameraPose,
    alpha: number,
  ): void {
    this.camera.position.lerpVectors(position, end.position, alpha);
    this.camera.quaternion.slerpQuaternions(quaternion, end.quaternion, alpha);
    setCameraFov(this.camera, THREE.MathUtils.lerp(fov, end.fov, alpha));
  }

  between(start: CameraPose, end: CameraPose, alpha: number): void {
    this.camera.position.lerpVectors(start.position, end.position, alpha);
    this.camera.quaternion.slerpQuaternions(start.quaternion, end.quaternion, alpha);
    setCameraFov(this.camera, THREE.MathUtils.lerp(start.fov, end.fov, alpha));
  }

  apply(position: THREE.Vector3, quaternion: THREE.Quaternion, fov: number): void {
    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    setCameraFov(this.camera, fov);
  }
}
