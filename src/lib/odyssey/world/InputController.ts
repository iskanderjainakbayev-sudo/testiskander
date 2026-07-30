export class InputController {
  private readonly keys = new Set<string>();
  private readonly justPressed = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private touchId: number | null = null;
  private touchX = 0;
  private touchY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onPointerLock: (locked: boolean) => void,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onLockChange);
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd);
  }

  isDown(code: string) {
    return this.keys.has(code);
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
    if (document.pointerLockElement !== this.canvas) void this.canvas.requestPointerLock();
  }

  releaseLock() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
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
    this.onPointerLock(document.pointerLockElement === this.canvas);
  };

  private readonly onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    this.touchId = touch.identifier;
    this.touchX = touch.clientX;
    this.touchY = touch.clientY;
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === this.touchId);
    if (!touch) return;
    this.mouseX += (touch.clientX - this.touchX) * 0.7;
    this.mouseY += (touch.clientY - this.touchY) * 0.7;
    this.touchX = touch.clientX;
    this.touchY = touch.clientY;
    event.preventDefault();
  };

  private readonly onTouchEnd = () => {
    this.touchId = null;
  };
}
