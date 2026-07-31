export class InputController {
  private readonly keys = new Set<string>();
  private readonly virtualKeys = new Set<string>();
  private readonly pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private lookTouchId: number | null = null;
  private touchX = 0;
  private touchY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onLockChange: (locked: boolean) => void,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.clear);
    document.addEventListener('pointerlockchange', this.handleLockChange);
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);
  }

  isDown(code: string): boolean {
    return this.keys.has(code) || this.virtualKeys.has(code);
  }

  consume(code: string): boolean {
    const active = this.pressed.has(code);
    this.pressed.delete(code);
    return active;
  }

  takeLook(): [number, number] {
    const result: [number, number] = [this.lookX, this.lookY];
    this.lookX = 0;
    this.lookY = 0;
    return result;
  }

  requestLock(): void {
    this.canvas.focus();
    if (document.pointerLockElement === this.canvas || !this.canvas.requestPointerLock) return;
    try {
      const request = this.canvas.requestPointerLock();
      void request?.catch(() => undefined);
    } catch {
      // Drag-look and keyboard turning remain available when pointer lock is blocked.
    }
  }

  releaseLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  setVirtualKey(code: string, active: boolean): void {
    if (active) {
      if (!this.virtualKeys.has(code)) this.pressed.add(code);
      this.virtualKeys.add(code);
    } else {
      this.virtualKeys.delete(code);
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('pointerlockchange', this.handleLockChange);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!this.keys.has(event.code)) this.pressed.add(event.code);
    this.keys.add(event.code);
    if (['Space', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas && event.buttons !== 1) return;
    this.lookX += event.movementX;
    this.lookY += event.movementY;
  };

  private readonly clear = () => {
    this.keys.clear();
    this.virtualKeys.clear();
    this.pressed.clear();
  };

  private readonly handleLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked) this.clear();
    this.onLockChange(locked);
  };

  private readonly onTouchStart = (event: TouchEvent) => {
    const touch = Array.from(event.changedTouches).find((item) => item.clientX > innerWidth * 0.38);
    if (!touch || this.lookTouchId !== null) return;
    this.lookTouchId = touch.identifier;
    this.touchX = touch.clientX;
    this.touchY = touch.clientY;
    event.preventDefault();
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === this.lookTouchId);
    if (!touch) return;
    this.lookX += (touch.clientX - this.touchX) * 0.72;
    this.lookY += (touch.clientY - this.touchY) * 0.72;
    this.touchX = touch.clientX;
    this.touchY = touch.clientY;
    event.preventDefault();
  };

  private readonly onTouchEnd = (event: TouchEvent) => {
    if (Array.from(event.changedTouches).some((item) => item.identifier === this.lookTouchId)) {
      this.lookTouchId = null;
    }
  };
}
