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
  private attackQueued = false;
  private equipToggleQueued = false;
  private abilityQueued = false;
  private virtualMove = { x: 0, z: 0 };
  private virtualJumpHeld = false;
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
    const wasHeld = this.keys.has(e.code);
    this.keys.add(e.code);
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      this.toggleShiftLock();
    }
    if (e.code === "Digit1" && !wasHeld) {
      this.equipToggleQueued = true;
    }
    if (e.code === "KeyE" && !wasHeld) {
      this.abilityQueued = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) this.rightDown = true;
    if (e.button === 0) this.attackQueued = true;
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
    if (x === 0 && z === 0) {
      // Fall back to the mobile virtual joystick when no keys are held.
      x = this.virtualMove.x;
      z = this.virtualMove.z;
    }
    const len = Math.hypot(x, z);
    return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
  }

  isJumpHeld(): boolean {
    return this.keys.has("Space") || this.virtualJumpHeld;
  }

  /** Mobile virtual joystick: x/z in [-1, 1], unnormalized (magnitude = deflection). */
  setVirtualMove(x: number, z: number): void {
    this.virtualMove = { x, z };
  }

  setVirtualJump(held: boolean): void {
    this.virtualJumpHeld = held;
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

  consumeAttack(): boolean {
    const v = this.attackQueued;
    this.attackQueued = false;
    return v;
  }

  consumeEquipToggle(): boolean {
    const v = this.equipToggleQueued;
    this.equipToggleQueued = false;
    return v;
  }

  consumeAbility(): boolean {
    const v = this.abilityQueued;
    this.abilityQueued = false;
    return v;
  }

  /** Lets a touch/mouse HUD button fire the same ability trigger as the E key. */
  triggerAbility(): void {
    this.abilityQueued = true;
  }

  /** Lets a touch/mouse HUD button fire the same attack trigger as a left click. */
  triggerAttack(): void {
    this.attackQueued = true;
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
