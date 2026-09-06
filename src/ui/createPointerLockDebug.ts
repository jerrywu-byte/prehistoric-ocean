import type { CreatureDebugState } from '../creatures/CreatureManager';

export interface PointerLockDebug {
  setLocked(isLocked: boolean): void;
  setCanvasClicked(): void;
  setError(errorName: string): void;
  setCameraPosition(x: number, y: number, z: number): void;
  setCreatureState(state: CreatureDebugState): void;
}

export function createPointerLockDebug(): PointerLockDebug {
  const debug = document.createElement('aside');
  debug.className = 'pointer-lock-debug';
  debug.setAttribute('aria-label', 'Pointer Lock 除錯資訊');

  const pointerLock = document.createElement('span');
  const canvasClick = document.createElement('span');
  const error = document.createElement('span');
  const camera = document.createElement('span');
  const creatureCount = document.createElement('span');
  const creatureVisible = document.createElement('span');
  const creaturePosition = document.createElement('span');
  const creaturePositionX = document.createElement('span');
  const creaturePositionY = document.createElement('span');
  const creaturePositionZ = document.createElement('span');
  const textureLoaded = document.createElement('span');
  debug.append(
    pointerLock,
    canvasClick,
    error,
    camera,
    creatureCount,
    creatureVisible,
    creaturePosition,
    creaturePositionX,
    creaturePositionY,
    creaturePositionZ,
    textureLoaded,
  );
  document.body.appendChild(debug);

  let lastCameraText = '';
  pointerLock.textContent = 'Pointer Lock: UNLOCKED';
  canvasClick.textContent = 'Canvas Click: NO';
  error.textContent = 'Pointer Lock Error: NONE';
  camera.textContent = 'Camera: 0.00 / 0.00 / 0.00';
  creatureCount.textContent = 'Creature Count: 0';
  creatureVisible.textContent = 'Creature Visible: NO';
  creaturePosition.textContent = 'Creature Position:';
  creaturePositionX.textContent = 'X: 0.00';
  creaturePositionY.textContent = 'Y: 0.00';
  creaturePositionZ.textContent = 'Z: 0.00';
  textureLoaded.textContent = 'Texture Loaded: NO';

  return {
    setLocked(isLocked: boolean): void {
      pointerLock.textContent = `Pointer Lock: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`;
    },
    setCanvasClicked(): void {
      canvasClick.textContent = 'Canvas Click: YES';
    },
    setError(errorName: string): void {
      error.textContent = `Pointer Lock Error: ${errorName}`;
    },
    setCameraPosition(x: number, y: number, z: number): void {
      const cameraText = `Camera: ${x.toFixed(2)} / ${y.toFixed(2)} / ${z.toFixed(2)}`;

      if (cameraText !== lastCameraText) {
        camera.textContent = cameraText;
        lastCameraText = cameraText;
      }
    },
    setCreatureState(state: CreatureDebugState): void {
      creatureCount.textContent = `Creature Count: ${state.count}`;
      creatureVisible.textContent = `Creature Visible: ${state.visible ? 'YES' : 'NO'}`;
      creaturePositionX.textContent = `X: ${state.x.toFixed(2)}`;
      creaturePositionY.textContent = `Y: ${state.y.toFixed(2)}`;
      creaturePositionZ.textContent = `Z: ${state.z.toFixed(2)}`;
      textureLoaded.textContent = `Texture Loaded: ${state.textureLoaded ? 'YES' : 'NO'}`;
    },
  };
}
