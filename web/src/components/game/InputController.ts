/**
 * Imperative keyboard/mouse input reader. Deliberately not React state —
 * movement/camera code polls this once per frame inside useFrame, so
 * re-rendering on every key/mouse event would be wasted work.
 */
export class InputController {
  private keys = new Set<string>();
  private rightDown = false;
  private mouseDX = 0;
  private mouseDY = 0;
  private wheelDY = 0;
  shiftLock = false;

  constructor(private element: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    element.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    element.addEventListener("wheel", this.onWheel, { passive: true });
    element.addEventListener("contextmenu", this.onContextMenu);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      this.toggleShiftLock();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) this.rightDown = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) this.rightDown = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.shiftLock || this.rightDown) {
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.wheelDY += e.deltaY;
  };

  private onContextMenu = (e: Event) => e.preventDefault();

  private onPointerLockChange = () => {
    if (document.pointerLockElement !== this.element) {
      this.shiftLock = false;
    }
  };

  toggleShiftLock(): void {
    this.shiftLock = !this.shiftLock;
    if (this.shiftLock) {
      this.element.requestPointerLock?.();
    } else if (document.pointerLockElement === this.element) {
      document.exitPointerLock();
    }
  }

  getMoveVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    const len = Math.hypot(x, z);
    return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
  }

  isJumpHeld(): boolean {
    return this.keys.has("Space");
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  consumeWheelDelta(): number {
    const dy = this.wheelDY;
    this.wheelDY = 0;
    return dy;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.element.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.element.removeEventListener("wheel", this.onWheel);
    this.element.removeEventListener("contextmenu", this.onContextMenu);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    if (document.pointerLockElement === this.element) document.exitPointerLock();
  }
}
