import * as THREE from 'three';

export class FirstPersonPlayer {
  readonly camera = new THREE.PerspectiveCamera(70, 1, .1, 140);
  readonly position = new THREE.Vector3();
  private keys = new Set<string>(); private yaw = 0; private pitch = 0; private bob = 0; private crouched = false;
  private onInteract?: () => void; private onFlashlight?: () => void;

  constructor(private readonly element: HTMLElement, callbacks: { interact: () => void; flashlight: () => void }) {
    this.onInteract = callbacks.interact; this.onFlashlight = callbacks.flashlight; this.position.set(0, 1.7, 0); this.camera.position.copy(this.position);
    window.addEventListener('keydown', this.down); window.addEventListener('keyup', this.up); element.addEventListener('click', this.lock); document.addEventListener('pointerlockchange', this.lockChanged); document.addEventListener('mousemove', this.mouse);
  }
  get isSprinting() { return this.keys.has('shift'); }
  get isMoving() { return ['w', 'a', 's', 'd'].some((key) => this.keys.has(key)); }
  update(delta: number, canMove: (point: THREE.Vector3) => boolean) {
    const forward = Number(this.keys.has('w')) - Number(this.keys.has('s')); const side = Number(this.keys.has('d')) - Number(this.keys.has('a'));
    const speed = (this.isSprinting ? 5.8 : 3.1) * (this.crouched ? .55 : 1); const vector = new THREE.Vector3(side, 0, -forward);
    if (vector.lengthSq()) { vector.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw); const next = this.position.clone().addScaledVector(vector, speed * delta); if (canMove(next)) this.position.copy(next); this.bob += delta * (this.isSprinting ? 14 : 9); }
    const eyeHeight = this.crouched ? 1.08 : 1.7; this.camera.position.set(this.position.x, eyeHeight + Math.sin(this.bob) * (this.isMoving ? .025 : 0), this.position.z); this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  dispose() { window.removeEventListener('keydown', this.down); window.removeEventListener('keyup', this.up); this.element.removeEventListener('click', this.lock); document.removeEventListener('pointerlockchange', this.lockChanged); document.removeEventListener('mousemove', this.mouse); }
  private down = (event: KeyboardEvent) => { const key = event.key.toLowerCase(); this.keys.add(key); if (key === 'e') this.onInteract?.(); if (key === 'f') this.onFlashlight?.(); if (key === 'c') this.crouched = !this.crouched; };
  private up = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private lock = () => { if (document.pointerLockElement !== this.element) this.element.requestPointerLock(); };
  private lockChanged = () => { if (document.pointerLockElement !== this.element) this.keys.clear(); };
  private mouse = (event: MouseEvent) => { if (document.pointerLockElement !== this.element) return; this.yaw -= event.movementX * .0022; this.pitch = THREE.MathUtils.clamp(this.pitch - event.movementY * .0022, -1.35, 1.35); };
}
