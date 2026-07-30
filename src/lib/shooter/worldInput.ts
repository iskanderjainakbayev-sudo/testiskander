import * as THREE from "three";
import { lookCamera } from "./playerMotion";

type ShooterInputOptions = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  isRunning: () => boolean;
  onAction: (key: string) => void;
};

export class ShooterInput {
  readonly keys = new Set<string>();
  firing = false;
  aiming = false;

  constructor(private readonly options: ShooterInputOptions) {
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    window.addEventListener("mouseup", this.mouseUp);
    document.addEventListener("mousemove", this.look);
    options.renderer.domElement.addEventListener("mousedown", this.mouseDown);
    options.renderer.domElement.addEventListener("contextmenu", this.preventContextMenu);
    this.resize();
  }

  dispose() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    window.removeEventListener("mouseup", this.mouseUp);
    document.removeEventListener("mousemove", this.look);
    this.options.renderer.domElement.removeEventListener("mousedown", this.mouseDown);
    this.options.renderer.domElement.removeEventListener("contextmenu", this.preventContextMenu);
  }

  private keyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.keys.add(key);
    this.options.onAction(key);
  };
  private keyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private mouseDown = (event: MouseEvent) => {
    if (!this.options.isRunning() || document.pointerLockElement !== this.options.renderer.domElement) return;
    if (event.button === 0) this.firing = true;
    if (event.button === 2) this.aiming = true;
  };
  private mouseUp = (event: MouseEvent) => {
    if (event.button === 0) this.firing = false;
    if (event.button === 2) this.aiming = false;
  };
  private preventContextMenu = (event: MouseEvent) => event.preventDefault();
  private look = (event: MouseEvent) => {
    if (this.options.isRunning() && document.pointerLockElement === this.options.renderer.domElement) lookCamera(this.options.camera, event);
  };
  private resize = () => {
    const { renderer, camera } = this.options;
    const { clientWidth, clientHeight } = renderer.domElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };
}
