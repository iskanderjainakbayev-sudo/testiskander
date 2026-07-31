export class InputController {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onLockChange: (locked: boolean) => void,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.clear);
    document.addEventListener('pointerlockchange', this.handleLockChange);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
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
    if (document.pointerLockElement !== this.canvas) void this.canvas.requestPointerLock();
  }

  releaseLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('pointerlockchange', this.handleLockChange);
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
    if (document.pointerLockElement !== this.canvas) return;
    this.lookX += event.movementX;
    this.lookY += event.movementY;
  };

  private readonly clear = () => {
    this.keys.clear();
    this.pressed.clear();
  };

  private readonly handleLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked) this.clear();
    this.onLockChange(locked);
  };
}

