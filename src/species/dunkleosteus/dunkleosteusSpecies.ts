import { DoubleSide } from 'three';
import type { CreatureSpeciesDefinition } from '../SpeciesDefinition';
import { DUNKLEOSTEUS_DIRECTIONAL_MODE, dunkleosteusAssets } from './dunkleosteusAssets';

// Directional stress fixture, not a complete second species or final artwork.
export const dunkleosteusSpecies: CreatureSpeciesDefinition = {
  id: 'dunkleosteus',
  name: { zhTW: '鄧氏魚', en: 'Dunkleosteus' },
  scientificName: 'Dunkleosteus',
  directionalAssets: dunkleosteusAssets,
  defaultScale: { width: 4.8, height: 2.4 },
  rendering: {
    mode: DUNKLEOSTEUS_DIRECTIONAL_MODE,
    billboard: 'cameraFacing',
    fallbackColor: 0xffa500,
    transparent: true,
    alphaTest: 0.05,
    side: DoubleSide,
    depthTest: true,
    depthWrite: false,
    fog: true,
    toneMapped: false,
    horizontalDirectionTransition: DUNKLEOSTEUS_DIRECTIONAL_MODE === 'directional_16'
      ? { enabled: true, durationMs: 110, hysteresisDegrees: 2.5 }
      : { enabled: true, durationMs: 140, hysteresisDegrees: 4 },
  },
  orientation: {
    defaultHeadingDegrees: 90,
    directionalHysteresisDegrees: 5,
    maxBillboardPitchDegrees: 30,
    billboardPitchDeadZoneDegrees: 3,
    billboardPitchResponseSeconds: 0.18,
    billboardHorizontalEpsilon: 0.01,
    // Unused in directional_8; no TOP/BOTTOM selection or textures.
    pitchLayerThresholdDegrees: 20,
    pitchLayerHysteresisDegrees: 5,
  },
  interaction: { interactionDistance: 6, minimumObservationDistance: 2.25 },
  movement: {
    enabled: true,
    locomotion: {
      enabled: true,
      mode: 'gentle_roam',
      horizontalRoamRadius: 3.5,
      cruiseSpeed: 0.22,
      acceleration: 0.16,
      deceleration: 0.22,
      slowdownRadius: 0.9,
      arrivalRadius: 0.18,
      maxTurnRateDegreesPerSecond: 18,
      minimumTargetDistance: 1.2,
      pauseMinSeconds: 1.2,
      pauseMaxSeconds: 2.8,
    },
    ambientMotion: {
      enabled: true,
      verticalAmplitude: 0.16,
      verticalPeriodSeconds: 5.5,
      driftXAmplitude: 0.14,
      driftXPeriodSeconds: 8,
      driftZAmplitude: 0.1,
      driftZPeriodSeconds: 6.7,
    },
  },
  animation: { enabled: false, framesPerDirection: 1 },
  behaviorProfile: 'gentle_drifter',
  spawnDefaults: { scaleMultiplier: 1 },
};
