export interface PointerLockDebug {
  setLocked(isLocked: boolean): void;
  setCanvasClicked(): void;
  setError(errorName: string): void;
  setCameraPosition(x: number, y: number, z: number): void;
}

export function createPointerLockDebug(): PointerLockDebug {
  const debug = document.createElement('aside');
  debug.className = 'pointer-lock-debug';
  debug.setAttribute('aria-label', 'Pointer Lock 除錯資訊');

  const pointerLock = document.createElement('span');
  const canvasClick = document.createElement('span');
  const error = document.createElement('span');
  const camera = document.createElement('span');
  debug.append(pointerLock, canvasClick, error, camera);
  document.body.appendChild(debug);

  let lastCameraText = '';
  pointerLock.textContent = 'Pointer Lock: UNLOCKED';
  canvasClick.textContent = 'Canvas Click: NO';
  error.textContent = 'Pointer Lock Error: NONE';
  camera.textContent = 'Camera: 0.00 / 0.00 / 0.00';

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
  };
}
