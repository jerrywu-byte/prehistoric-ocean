import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { constrainDiverPosition } from '../world/worldLimits';
import { DIVER_MOVEMENT } from './diverConfig';

type MovementKey = 'forward' | 'backward' | 'left' | 'right' | 'ascend' | 'descend';

const KEY_BINDINGS: Readonly<Partial<Record<string, MovementKey>>> = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'ascend',
  ShiftLeft: 'descend',
  ShiftRight: 'descend',
};

export class DiverControls {
  private readonly pointerLock: PointerLockControls;
  private readonly velocity = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly horizontalInput = new THREE.Vector2();
  private readonly pressed: Record<MovementKey, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    ascend: false,
    descend: false,
  };

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly domElement: HTMLElement,
    private readonly startButton: HTMLButtonElement,
    private readonly onLockChange: (isLocked: boolean) => void,
    private readonly onCanvasClick: () => void,
    private readonly onPointerLockError: (errorName: string) => void,
  ) {
    this.pointerLock = new PointerLockControls(camera, domElement);
    this.pointerLock.pointerSpeed = DIVER_MOVEMENT.pointerSpeed;
    this.pointerLock.minPolarAngle = THREE.MathUtils.degToRad(5);
    this.pointerLock.maxPolarAngle = THREE.MathUtils.degToRad(175);

    this.domElement.addEventListener('click', this.handleCanvasClick);
    this.startButton.addEventListener('click', this.handleStartClick);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  update(deltaSeconds: number): void {
    const delta = Math.min(deltaSeconds, DIVER_MOVEMENT.maxDeltaSeconds);
    this.desiredVelocity.set(0, 0, 0);

    if (this.pointerLock.isLocked) {
      this.buildDesiredVelocity();
    }

    const hasInput = this.desiredVelocity.lengthSq() > 0;
    const response = hasInput ? DIVER_MOVEMENT.acceleration : DIVER_MOVEMENT.drag;
    const blend = 1 - Math.exp(-response * delta);
    this.velocity.lerp(this.desiredVelocity, blend);

    if (this.velocity.lengthSq() < 0.0001) {
      this.velocity.set(0, 0, 0);
    }

    this.camera.position.addScaledVector(this.velocity, delta);
    constrainDiverPosition(this.camera.position, this.velocity);
  }

  dispose(): void {
    this.clearInput();
    this.pointerLock.unlock();
    this.pointerLock.dispose();
    this.domElement.removeEventListener('click', this.handleCanvasClick);
    this.startButton.removeEventListener('click', this.handleStartClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private buildDesiredVelocity(): void {
    this.horizontalInput.set(
      Number(this.pressed.right) - Number(this.pressed.left),
      Number(this.pressed.forward) - Number(this.pressed.backward),
    );

    if (this.horizontalInput.lengthSq() > 0) {
      this.horizontalInput.normalize();
      this.pointerLock.getDirection(this.forward).normalize();
      this.right.crossVectors(this.forward, this.camera.up).normalize();

      this.desiredVelocity.addScaledVector(
        this.forward,
        this.horizontalInput.y * DIVER_MOVEMENT.moveSpeed,
      );
      this.desiredVelocity.addScaledVector(
        this.right,
        this.horizontalInput.x * DIVER_MOVEMENT.moveSpeed,
      );
    }

    const verticalInput = Number(this.pressed.ascend) - Number(this.pressed.descend);
    this.desiredVelocity.y += verticalInput * DIVER_MOVEMENT.verticalSpeed;
  }

  private requestPointerLock(): void {
    if (document.pointerLockElement === this.domElement) {
      return;
    }

    try {
      // Keep this call synchronous and directly inside the user's click event.
      void this.domElement.requestPointerLock();
    } catch (error) {
      this.reportPointerLockError(error);
    }
  }

  private readonly handleStartClick = (): void => {
    this.requestPointerLock();
  };

  private readonly handleCanvasClick = (): void => {
    this.onCanvasClick();
    this.requestPointerLock();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const movementKey = KEY_BINDINGS[event.code];

    if (!movementKey || !this.pointerLock.isLocked) {
      return;
    }

    event.preventDefault();
    this.pressed[movementKey] = true;
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const movementKey = KEY_BINDINGS[event.code];

    if (!movementKey) {
      return;
    }

    this.pressed[movementKey] = false;
  };

  private readonly handlePointerLockChange = (): void => {
    const isLocked = document.pointerLockElement === this.domElement;
    console.info('[PointerLock] change:', document.pointerLockElement);

    if (!isLocked) {
      this.clearInput();
    }

    this.onLockChange(isLocked);
  };

  private readonly handlePointerLockError = (event: Event): void => {
    const error = event instanceof ErrorEvent ? event.error : undefined;
    const errorName = error instanceof DOMException
      ? error.name
      : error instanceof Error
        ? error.name
        : 'PointerLockError';

    console.error('[PointerLock] pointerlockerror:', errorName, event);
    this.onPointerLockError(errorName);
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearInput();
    }
  };

  private readonly clearInput = (): void => {
    for (const movementKey of Object.keys(this.pressed) as MovementKey[]) {
      this.pressed[movementKey] = false;
    }
  };

  private reportPointerLockError(error: unknown): void {
    const errorName = error instanceof DOMException
      ? error.name
      : error instanceof Error
        ? error.name
        : 'UnknownError';

    console.error('[PointerLock] requestPointerLock failed:', errorName, error);
    this.onPointerLockError(errorName);
  }
}
