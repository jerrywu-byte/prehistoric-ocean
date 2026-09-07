import { MathUtils } from 'three';
import type { CreatureSpeciesDefinition } from '../../species/SpeciesDefinition';

type Orientation = CreatureSpeciesDefinition['orientation'];

// Semantic pitch: positive means the plane normal tilts up toward the observer.
export function getTargetPitch(
  verticalAngle: number,
  horizontalDistance: number,
  previousTarget: number,
  config: Orientation,
): number {
  const limit = MathUtils.degToRad(config.maxBillboardPitchDegrees);
  if (horizontalDistance < config.billboardHorizontalEpsilon) {
    return MathUtils.clamp(previousTarget, -limit, limit);
  }
  if (Math.abs(verticalAngle) <= MathUtils.degToRad(config.billboardPitchDeadZoneDegrees)) return 0;
  return MathUtils.clamp(verticalAngle, -limit, limit);
}

// Frame-rate independent exponential damping; responseSeconds reaches 95% of a step.
export function smoothPitch(current: number, target: number, deltaSeconds: number, responseSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return current;
  if (responseSeconds <= 0) return target;
  const amount = -Math.expm1(-Math.log(20) * deltaSeconds / responseSeconds);
  return current + (target - current) * amount;
}
