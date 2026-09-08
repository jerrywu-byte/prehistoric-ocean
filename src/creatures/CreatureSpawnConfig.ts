import type { Vector3Tuple } from '../species/SpeciesDefinition';

export interface CreatureSpawnConfig {
  readonly id: string;
  readonly speciesId: string;
  readonly position: Vector3Tuple;
  // atan2(forwardZ, forwardX): 90 degrees points toward world +Z.
  readonly headingDegrees?: number;
  // Override replaces species dimensions; multiplier is applied afterwards.
  readonly scaleOverride?: Vector3Tuple;
  readonly scaleMultiplier?: number;
  // Radians. When omitted, a stable phase is derived from the instance ID.
  readonly motionPhase?: number;
  // Optional deterministic locomotion seed. Defaults to species ID + instance ID.
  readonly locomotionSeed?: number;
  // Reserved instance metadata for future runtime state extensions.
  readonly initialState?: { readonly speedMultiplier?: number; readonly status?: string };
}
