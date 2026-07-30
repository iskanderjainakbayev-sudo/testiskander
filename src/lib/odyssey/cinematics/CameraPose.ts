import * as THREE from 'three';

export class CameraPose {
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  fov = 68;

  capture(camera: THREE.PerspectiveCamera): void {
    this.position.copy(camera.position);
    this.quaternion.copy(camera.quaternion);
    this.fov = camera.fov;
  }

  apply(camera: THREE.PerspectiveCamera): void {
    camera.position.copy(this.position);
    camera.quaternion.copy(this.quaternion);
    setCameraFov(camera, this.fov);
  }
}

export function setCameraFov(camera: THREE.PerspectiveCamera, fov: number): void {
  if (Math.abs(camera.fov - fov) < 0.001) return;
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
