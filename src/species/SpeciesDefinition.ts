import type { Side } from 'three';
import type { CreatureTextureSet } from '../creatures/directional/pitchLayers';

export type Vector3Tuple = readonly [number, number, number];
export type BehaviorProfile =
  | 'gentle_drifter' | 'active_swimmer' | 'schooling_fish'
  | 'large_predator' | 'seabed_crawler';

export interface AmbientMotionDefinition {
  readonly enabled: boolean;
  readonly verticalAmplitude: number;
  readonly verticalPeriodSeconds: number;
  readonly driftXAmplitude: number;
  readonly driftXPeriodSeconds: number;
  readonly driftZAmplitude: number;
  readonly driftZPeriodSeconds: number;
}

export type LocomotionDefinition =
  | { readonly enabled: false; readonly mode: 'none' }
  | {
      readonly enabled: true;
      readonly mode: 'gentle_roam';
      readonly horizontalRoamRadius: number;
      readonly cruiseSpeed: number;
      readonly acceleration: number;
      readonly deceleration: number;
      readonly slowdownRadius: number;
      readonly arrivalRadius: number;
      readonly maxTurnRateDegreesPerSecond: number;
      readonly minimumTargetDistance: number;
      readonly pauseMinSeconds: number;
      readonly pauseMaxSeconds: number;
    };

// Each load returns an owned set. Caller disposes every unique texture.
// The same contract accepts synchronous Canvas or asynchronous image providers.
export interface DirectionalAssetSource {
  readonly id: string;
  readonly load: () => CreatureTextureSet | Promise<CreatureTextureSet>;
}

export interface CreatureSpeciesDefinition {
  readonly id: string;
  readonly name: { readonly zhTW: string; readonly en: string };
  readonly scientificName?: string;
  readonly directionalAssets: DirectionalAssetSource;
  readonly defaultScale: { readonly width: number; readonly height: number };
  readonly rendering: {
    // Discriminator for future rendering implementations, not implemented here.
    readonly mode: 'directional_8' | 'pitch_directional_8x3';
    readonly billboard: 'cylindrical' | 'constrainedPitch' | 'cameraFacing';
    readonly fallbackColor: number;
    readonly transparent: boolean;
    readonly alphaTest: number;
    readonly side: Side;
    readonly depthTest: boolean;
    readonly depthWrite: boolean;
    readonly fog: boolean;
    readonly toneMapped: boolean;
  };
  readonly orientation: {
    readonly defaultHeadingDegrees: number;
    readonly directionalHysteresisDegrees: number;
    readonly maxBillboardPitchDegrees: number;
    readonly billboardPitchDeadZoneDegrees: number;
    readonly billboardPitchResponseSeconds: number;
    readonly billboardHorizontalEpsilon: number;
    readonly pitchLayerThresholdDegrees: number;
    readonly pitchLayerHysteresisDegrees: number;
  };
  readonly interaction: {
    readonly interactionDistance: number;
    readonly minimumObservationDistance: number;
  };
  readonly movement: {
    // Active locomotion and local ambient displacement remain independent.
    readonly enabled: boolean;
    readonly locomotion: LocomotionDefinition;
    readonly ambientMotion: AmbientMotionDefinition;
  };
  readonly animation: { readonly enabled: boolean; readonly framesPerDirection: number };
  readonly behaviorProfile: BehaviorProfile;
  readonly spawnDefaults: { readonly scaleMultiplier: number };
}
