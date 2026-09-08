import * as THREE from 'three';
import type { AmbientMotionDefinition } from '../../species/SpeciesDefinition';
import { hashString } from './deterministicRandom';

const TAU = Math.PI * 2;

export function getDeterministicMotionPhase(instanceId: string): number {
  return (hashString(instanceId) / 0x100000000) * TAU;
}

export function calculateAmbientMotionOffset(
  elapsedSeconds: number,
  phase: number,
  config: AmbientMotionDefinition,
  target: THREE.Vector3,
): THREE.Vector3 {
  if (!config.enabled) return target.set(0, 0, 0);
  const time = Math.max(0, elapsedSeconds);
  return target.set(
    config.driftXAmplitude * Math.sin(TAU * time / config.driftXPeriodSeconds + phase * 0.754),
    config.verticalAmplitude * Math.sin(TAU * time / config.verticalPeriodSeconds + phase),
    config.driftZAmplitude * Math.sin(TAU * time / config.driftZPeriodSeconds + phase * 1.347),
  );
}
