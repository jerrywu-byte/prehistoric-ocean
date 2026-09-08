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
  const textureUrl = document.createElement('span');
  const materialMode = document.createElement('span');
  const directionInfo = document.createElement('span');
  directionInfo.style.whiteSpace = 'pre-line';
  debug.append(
    directionInfo,
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
    textureUrl,
    materialMode,
  );
  document.body.appendChild(debug);

  let lastCameraText = '';
  pointerLock.textContent = 'Pointer Lock: UNLOCKED';
  canvasClick.textContent = 'Canvas Click: NO';
  error.textContent = 'Pointer Lock Error: NONE';
  camera.textContent = 'Camera: 0.00 / 0.00 / 0.00';
  creatureCount.textContent = 'Creature Count: 0';
  creatureVisible.textContent = 'Creature Visible: NO';
  creaturePosition.textContent = 'Current Position:';
  creaturePositionX.textContent = 'X: 0.00';
  creaturePositionY.textContent = 'Y: 0.00';
  creaturePositionZ.textContent = 'Z: 0.00';
  textureLoaded.textContent = 'Texture Status: FALLBACK';
  textureUrl.textContent = 'Texture URL: —';
  materialMode.textContent = 'Material Mode: FALLBACK';

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
      directionInfo.textContent = [
        '— Rendering —',
        `Species ID: ${state.speciesId ?? '—'}`,
        `Creature Name: ${state.creatureName ?? '—'}`,
        `Horizontal View: ${state.view ?? '—'}`,
        `Previous View: ${state.previousView ?? '—'}`,
        `Direction Index: ${state.directionIndex ?? '—'}`,
        `Hysteresis: ${state.hysteresisDegrees ?? '—'}°`,
        `Relative Angle: ${(state.relativeAngle ?? 0).toFixed(1)}°`,
        `Creature Heading: ${(state.heading ?? 0).toFixed(1)}°`,
        `Distance: ${(state.distance ?? 0).toFixed(2)}`,
        `Observation: ${state.observation ?? 'NORMAL'}`,
        `Rendering Mode: ${state.textureMode ?? '—'}`,
        `Vertical Angle: ${(state.verticalAngle ?? 0).toFixed(1)}°`,
        ...(state.textureMode === 'PITCH_DIRECTIONAL_8X3' ? [
          `Pitch Layer: ${state.pitchLayer ?? '—'}`,
          `Pitch Threshold: ${state.pitchThreshold ?? '—'}°`,
          `Pitch Hysteresis: ${state.pitchHysteresis ?? '—'}°`,
          `Texture Key: ${state.textureKey ?? '—'}`,
        ] : [
          `Target Pitch: ${(state.targetPitch ?? 0).toFixed(1)}°`,
          `Applied Pitch: ${(state.appliedPitch ?? 0).toFixed(1)}°`,
          `Pitch Limit: ${state.pitchLimit ?? '—'}°`,
          `Pitch Dead Zone: ${state.pitchDeadZone ?? '—'}°`,
          `Billboard Mode: ${state.billboardMode ?? '—'}`,
        ]),
        '— Ambient —',
        `Ambient Motion: ${state.ambientMotionEnabled ? 'ON' : 'OFF'}`,
        `Ambient Offset: ${(state.motionOffsetX ?? 0).toFixed(2)} / ${(state.motionOffsetY ?? 0).toFixed(2)} / ${(state.motionOffsetZ ?? 0).toFixed(2)}`,
        `Vertical Bob: ${(state.motionOffsetY ?? 0) >= 0 ? '+' : ''}${(state.motionOffsetY ?? 0).toFixed(2)}`,
        '— Locomotion —',
        `Locomotion: ${state.locomotionState ?? 'OFF'}`,
        `Home: ${(state.anchorX ?? 0).toFixed(2)} / ${(state.anchorY ?? 0).toFixed(2)} / ${(state.anchorZ ?? 0).toFixed(2)}`,
        `Locomotion Position: ${(state.locomotionX ?? 0).toFixed(2)} / ${(state.locomotionY ?? 0).toFixed(2)} / ${(state.locomotionZ ?? 0).toFixed(2)}`,
        `Target X/Z: ${(state.targetX ?? 0).toFixed(2)} / ${(state.targetZ ?? 0).toFixed(2)}`,
        `Target Distance / Speed: ${(state.distanceToTarget ?? 0).toFixed(2)} / ${(state.speed ?? 0).toFixed(2)}`,
        `Target Heading / Delta: ${(state.targetHeading ?? 0).toFixed(1)}° / ${(state.headingDelta ?? 0).toFixed(1)}°`,
        `Roam Radius: ${(state.roamRadius ?? 0).toFixed(1)}`,
        `Pause Remaining: ${(state.pauseRemaining ?? 0).toFixed(1)} sec`,
      ].join('\n');
      creatureCount.textContent = `Creature Count: ${state.count}`;
      creatureVisible.textContent = `Creature Visible: ${state.visible ? 'YES' : 'NO'}`;
      creaturePositionX.textContent = `X: ${state.x.toFixed(2)}`;
      creaturePositionY.textContent = `Y: ${state.y.toFixed(2)}`;
      creaturePositionZ.textContent = `Z: ${state.z.toFixed(2)}`;
      textureLoaded.textContent = `Texture Status: ${state.textureStatus === 'YES' ? 'READY' : state.textureStatus === 'ERROR' ? 'ERROR' : 'FALLBACK'}`;
      textureUrl.textContent = `Texture URL: ${state.textureUrl}`;
      materialMode.textContent = `Material Mode: ${state.materialMode}`;
    },
  };
}
