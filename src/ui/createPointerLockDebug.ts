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
        `Horizontal Current: ${state.view ?? '—'} | Target: ${state.horizontalTarget ?? '—'}`,
        `Selection Previous: ${state.previousSelectedDirection ?? '—'} | Current: ${state.currentSelectedDirection ?? '—'}`,
        `Direction Index: ${state.previousDirectionIndex ?? -1} → ${state.currentDirectionIndex ?? -1}`,
        `Index Delta: ${(state.directionIndexDelta ?? 0) >= 0 ? '+' : ''}${state.directionIndexDelta ?? 0}`,
        `NON_ADJACENT_DIRECTION_JUMP: ${state.nonAdjacentDirectionJump ? 'YES' : 'NO'}`,
        `Transition: ${state.transitionActive ? 'ACTIVE' : 'IDLE'} | Progress: ${(state.transitionProgress ?? 0).toFixed(2)}`,
        `Source: ${state.transitionSource ?? 'NONE'} | Destination / Secondary: ${state.secondaryView ?? 'NONE'}`,
        `Primary Opacity: ${(state.primaryOpacity ?? 1).toFixed(2)} | Secondary Opacity: ${(state.secondaryOpacity ?? 0).toFixed(2)}`,
        `Horizontal Hysteresis: ${state.hysteresisDegrees ?? '—'}°`,
        `Sector Size: ${state.sectorSizeDegrees ?? '—'}°`,
        `Missing Assets: ${state.missingAssetKeys?.length ? state.missingAssetKeys.join(', ') : 'NONE'}`,
        `Current Texture Key: ${state.currentTextureKey ?? '—'}`,
        `Current Texture URL: ${state.currentTextureUrl ?? '—'}`,
        `Requested Texture: ${state.requestedTextureKey ?? '—'}`,
        `Actual Texture: ${state.actualTextureKey ?? '—'}`,
        `Using Pitch Fallback: ${state.usingPitchFallback ? 'YES' : 'NO'}`,
        `Texture Native Size: ${state.textureNativeWidth ?? 0} x ${state.textureNativeHeight ?? 0}`,
        `Texture Aspect: ${(state.textureAspect ?? 0).toFixed(3)}`,
        `Plane Geometry: ${state.planeGeometryWidth ?? 0} x ${state.planeGeometryHeight ?? 0}`,
        `Mesh Scale: ${(state.meshScaleX ?? 0).toFixed(2)} / ${(state.meshScaleY ?? 0).toFixed(2)}`,
        `Final Display Aspect: ${(state.finalDisplayAspect ?? 0).toFixed(3)}`,
        `Relative Horizontal Angle: ${(state.relativeAngle ?? 0).toFixed(1)}°`,
        `Current Heading: ${(state.heading ?? 0).toFixed(1)}°`,
        `Distance: ${(state.distance ?? 0).toFixed(2)}`,
        `Observation: ${state.observation ?? 'NORMAL'}`,
        `Rendering Mode: ${state.textureMode ?? '—'}`,
        `Vertical Angle: ${(state.verticalAngle ?? 0).toFixed(1)}°`,
        ...(state.textureMode === 'PITCH_DIRECTIONAL_8X3' || state.textureMode === 'PITCH_DIRECTIONAL_16X3' ? [
          `Pitch Layer: ${state.pitchLayer ?? '—'}`,
          `Pitch Threshold: ${state.pitchThreshold ?? '—'}°`,
          `Pitch Hysteresis: ${state.pitchHysteresis ?? '—'}°`,
          `Texture Key: ${state.textureKey ?? '—'}`,
        ] : state.billboardMode === 'YAW + LIMITED_PITCH' ? [
          `Target Pitch: ${(state.targetPitch ?? 0).toFixed(1)}°`,
          `Applied Pitch: ${(state.appliedPitch ?? 0).toFixed(1)}°`,
          `Pitch Limit: ${state.pitchLimit ?? '—'}°`,
          `Pitch Dead Zone: ${state.pitchDeadZone ?? '—'}°`,
          `Billboard Mode: ${state.billboardMode ?? '—'}`,
        ] : [
          `Pitch Layer: NONE | Billboard Mode: ${state.billboardMode ?? '—'}`,
        ]),
        '— Ambient —',
        `Ambient Motion: ${state.ambientMotionEnabled ? 'ON' : 'OFF'}`,
        `Ambient Offset: ${(state.motionOffsetX ?? 0).toFixed(2)} / ${(state.motionOffsetY ?? 0).toFixed(2)} / ${(state.motionOffsetZ ?? 0).toFixed(2)}`,
        `Vertical Bob: ${(state.motionOffsetY ?? 0) >= 0 ? '+' : ''}${(state.motionOffsetY ?? 0).toFixed(2)}`,
        '— Locomotion —',
        `Locomotion: ${state.locomotionState ?? 'OFF'}`,
        `Home: ${(state.anchorX ?? 0).toFixed(2)} / ${(state.anchorY ?? 0).toFixed(2)} / ${(state.anchorZ ?? 0).toFixed(2)}`,
        `Locomotion Position: ${(state.locomotionX ?? 0).toFixed(2)} / ${(state.locomotionY ?? 0).toFixed(2)} / ${(state.locomotionZ ?? 0).toFixed(2)}`,
        `Current Waypoint X/Z: ${(state.targetX ?? 0).toFixed(2)} / ${(state.targetZ ?? 0).toFixed(2)}`,
        `Distance To Target: ${(state.distanceToTarget ?? 0).toFixed(2)} | Speed: ${(state.speed ?? 0).toFixed(2)}`,
        `Target Heading: ${(state.targetHeading ?? 0).toFixed(1)}°`,
        `Heading Delta: ${(state.headingDelta ?? 0).toFixed(1)}° | Turn Direction: ${state.turnDirection ?? '—'}`,
        `Max Turn Rate: ${(state.maxTurnRateDegreesPerSecond ?? 0).toFixed(1)}°/s`,
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
