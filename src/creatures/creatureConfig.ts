export type CreatureFacingMode = 'billboard' | 'directional';

export interface CreatureConfig {
  readonly id: string;
  readonly displayName: string;
  readonly subtitle: string;
  readonly textureUrl: string;
  readonly facingMode: CreatureFacingMode;
  readonly width: number;
  readonly height: number;
  readonly spawnDistance: number;
  readonly spawnHeight: number;
  readonly baseSpeed: number;
  readonly speedVariation: number;
  readonly speedFrequency: number;
  readonly bobAmplitude: number;
  readonly bobFrequency: number;
  readonly swayAmplitude: number;
  readonly swayFrequency: number;
  readonly maxTurnRate: number;
  readonly roamRadius: number;
  readonly seabedClearance: number;
  readonly boundaryMargin: number;
  readonly interactionDistance: number;
}

export const PROTOTYPE_CREATURE: CreatureConfig = {
  id: 'prototype-creature',
  displayName: '測試生物',
  subtitle: 'Prototype Creature',
  textureUrl: './assets/creatures/prototype-creature.svg',
  facingMode: 'billboard',
  width: 4.2,
  height: 2.1,
  spawnDistance: 11,
  spawnHeight: 2.8,
  baseSpeed: 0.46,
  speedVariation: 0.09,
  speedFrequency: 0.42,
  bobAmplitude: 0.22,
  bobFrequency: 0.75,
  swayAmplitude: 0.42,
  swayFrequency: 0.2,
  maxTurnRate: 0.42,
  roamRadius: 9,
  seabedClearance: 1.7,
  boundaryMargin: 4,
  interactionDistance: 4.5,
};
