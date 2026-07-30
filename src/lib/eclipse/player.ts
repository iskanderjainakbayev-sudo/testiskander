import * as THREE from 'three';

export type PlayerAction = 'attack' | 'bolt' | 'pulse' | 'interact' | 'grapple' | 'vehicle';

export type PlayerFrame = {
  position: THREE.Vector3;
  facing: THREE.Vector3;
  stamina: number;
  gliding: boolean;
  mounted: boolean;
  moving: boolean;
  invulnerable: boolean;
};

export class EclipsePlayer {
  private keys = new Set<string>();
  private actions: PlayerAction[] = [];
  private velocityY = 0;
  private jumpCount = 0;
  private dashFor = 0;
  private dashCooldown = 0;
  private gliding = false;
  private mounted = false;
  private enabled = false;
  private stamina = 100;
  private facing = new THREE.Vector3(0, 0, -1);
  private moveDirection = new THREE.Vector3();

  constructor(readonly mesh: THREE.Group) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
  }

  setEnabled(value: boolean) { this.enabled = value; this.keys.clear(); }
  setMounted(value: boolean) { this.mounted = value; }
  drainStamina(amount: number) { this.stamina = Math.max(0, this.stamina - amount); }
  restoreHealthOnRest() { this.stamina = Math.min(100, this.stamina + 20); }
  consumeActions() { const queued = [...this.actions]; this.actions = []; return queued; }
  pullToward(target: THREE.Vector3) {
    const direction = target.clone().sub(this.mesh.position);
    direction.y = Math.max(3, direction.y + 2);
    this.velocityY = Math.max(this.velocityY, 8);
    this.mesh.position.addScaledVector(direction.normalize(), 4.8);
  }
  update(delta: number): PlayerFrame {
    this.dashFor = Math.max(0, this.dashFor - delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    const horizontal = new THREE.Vector3(
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')),
      0,
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')),
    );
    const moving = horizontal.lengthSq() > 0;
    if (moving) {
      horizontal.normalize();
      this.moveDirection.lerp(horizontal, Math.min(1, delta * 14));
      this.facing.lerp(horizontal, Math.min(1, delta * 12)).normalize();
      this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    }
    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const canSprint = sprinting && this.stamina > 1 && moving && this.dashFor === 0;
    const speed = this.dashFor > 0 ? 22 : this.mounted ? 15 : canSprint ? 9.2 : 5.8;
    if (canSprint || this.dashFor > 0) this.drainStamina(delta * (this.dashFor > 0 ? 55 : 18));
    else this.stamina = Math.min(100, this.stamina + delta * 16);
    if (moving || this.dashFor > 0) this.mesh.position.addScaledVector(this.dashFor > 0 ? this.facing : horizontal, speed * delta);
    this.velocityY -= (this.gliding ? 6 : 24) * delta;
    this.mesh.position.y += this.velocityY * delta;
    if (this.mesh.position.y <= 0) { this.mesh.position.y = 0; this.velocityY = 0; this.jumpCount = 0; this.gliding = false; }
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -103, 103);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -103, 103);
    return { position: this.mesh.position, facing: this.facing, stamina: this.stamina, gliding: this.gliding, mounted: this.mounted, moving, invulnerable: this.dashFor > 0 };
  }
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
  }
  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) return;
    this.keys.add(event.code);
    if (event.repeat) return;
    if (event.code === 'Space' && this.jumpCount < 2) { this.velocityY = this.jumpCount === 0 ? 9 : 8; this.jumpCount += 1; return; }
    if (event.code === 'KeyQ' && this.stamina >= 25 && this.dashCooldown === 0) { this.dashFor = .23; this.dashCooldown = .55; this.drainStamina(25); return; }
    if (event.code === 'KeyG' && this.mesh.position.y > .3) { this.gliding = !this.gliding; return; }
    const actionForKey: Record<string, PlayerAction> = { KeyK: 'bolt', KeyX: 'pulse', KeyE: 'interact', KeyF: 'grapple', KeyV: 'vehicle' };
    const action = actionForKey[event.code];
    if (action) this.actions.push(action);
  };
  private onKeyUp = (event: KeyboardEvent) => { this.keys.delete(event.code); };
  private onMouseDown = () => { if (this.enabled) this.actions.push('attack'); };
}
