import type { DirectionalTextureSet, HorizontalDirectionalTextureSet } from './types';

export const PITCH_LAYERS = ['top', 'mid', 'bottom'] as const;
export type PitchLayer = typeof PITCH_LAYERS[number];
export type PitchDirectionalTextureSet = Readonly<Record<PitchLayer, DirectionalTextureSet>>;
export type CreatureTextureSet = HorizontalDirectionalTextureSet | PitchDirectionalTextureSet;

// Degrees, measured from the horizontal plane; equality retains the current layer.
export function getPitchLayer(
  angleDegrees: number, previous: PitchLayer | null,
  thresholdDegrees: number, hysteresisDegrees: number,
): PitchLayer {
  const enter = thresholdDegrees + hysteresisDegrees;
  const leave = thresholdDegrees - hysteresisDegrees;
  if (previous === null) {
    return angleDegrees > thresholdDegrees ? 'top' : angleDegrees < -thresholdDegrees ? 'bottom' : 'mid';
  }
  if (angleDegrees > enter) return 'top';
  if (angleDegrees < -enter) return 'bottom';
  if (previous === 'top' && angleDegrees >= leave) return 'top';
  if (previous === 'bottom' && angleDegrees <= -leave) return 'bottom';
  return 'mid';
}

export function isPitchTextureSet(set: CreatureTextureSet): set is PitchDirectionalTextureSet {
  return 'top' in set || 'mid' in set || 'bottom' in set;
}
