export class InputController {
  private readonly keys = new Set<string>();
  private readonly justPressed = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private readonly touchKeys = new Set<string>();
  private movementTouchId: number | null = null;
  private lookTouchId: number | null = null;
  private moveStartX = 0;
  private moveStartY = 0;
  private lookX = 0;
  private lookY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onPointerLock: (locked: boolean) => void,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.clear);
    document.addEventListener('pointerlockchange', this.onLockChange);
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);
  }

  isDown(code: string) {
    return this.keys.has(code) || this.touchKeys.has(code);
  }

  consume(code: string) {
    const pressed = this.justPressed.has(code);
    this.justPressed.delete(code);
    return pressed;
  }

  takeLook() {
    const look = { x: this.mouseX, y: this.mouseY };
    this.mouseX = 0;
    this.mouseY = 0;
    return look;
  }

  requestLock() {
    if (document.pointerLockElement !== this.canvas) {
      void this.canvas.requestPointerLock().catch(() => undefined);
    }
  }

  releaseLock() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  clear = () => {
    this.keys.clear();
    this.justPressed.clear();
    this.touchKeys.clear();
    this.movementTouchId = null;
    this.lookTouchId = null;
    this.mouseX = 0;
    this.mouseY = 0;
  };

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!this.keys.has(event.code)) this.justPressed.add(event.code);
    this.keys.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    this.mouseX += event.movementX;
    this.mouseY += event.movementY;
  };

  private readonly onLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked) this.clear();
    this.onPointerLock(locked);
  };

  private readonly onTouchStart = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.clientX < this.canvas.clientWidth * 0.46 && this.movementTouchId === null) {
        this.movementTouchId = touch.identifier;
        this.moveStartX = touch.clientX;
        this.moveStartY = touch.clientY;
      } else if (this.lookTouchId === null) {
        this.lookTouchId = touch.identifier;
        this.lookX = touch.clientX;
        this.lookY = touch.clientY;
      }
    }
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === this.movementTouchId) this.updateTouchMovement(touch);
      if (touch.identifier === this.lookTouchId) {
        this.mouseX += (touch.clientX - this.lookX) * 0.7;
        this.mouseY += (touch.clientY - this.lookY) * 0.7;
        this.lookX = touch.clientX;
        this.lookY = touch.clientY;
      }
    }
    event.preventDefault();
  };

  private readonly onTouchEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === this.movementTouchId) {
        this.movementTouchId = null;
        this.touchKeys.clear();
      }
      if (touch.identifier === this.lookTouchId) this.lookTouchId = null;
    }
  };

  private updateTouchMovement(touch: Touch) {
    const x = touch.clientX - this.moveStartX;
    const y = touch.clientY - this.moveStartY;
    this.touchKeys.clear();
    if (y < -14) this.touchKeys.add('KeyW');
    if (y > 14) this.touchKeys.add('KeyS');
    if (x < -14) this.touchKeys.add('KeyA');
    if (x > 14) this.touchKeys.add('KeyD');
  }
}
