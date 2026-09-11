import type { CreatureSpawnConfig } from '../creatures/CreatureSpawnConfig';
import { AMMONITE_SPAWN, DUNKLEOSTEUS_SPAWN } from './creatureSpawns';

export type EraSceneId = 'late_devonian' | 'western_interior_seaway_late_cretaceous';

export interface EraScenePreset {
  readonly id: EraSceneId;
  readonly name: { readonly zhTW: string; readonly en: string };
  readonly period: { readonly zhTW: string; readonly en: string };
  readonly approximateMillionYearsAgo: number;
  readonly location: { readonly zhTW: string; readonly en: string };
  readonly creatureSpawns: readonly CreatureSpawnConfig[];
}

export const LATE_DEVONIAN_SCENE: EraScenePreset = {
  id: 'late_devonian',
  name: { zhTW: '晚泥盆紀海洋', en: 'Late Devonian Sea' },
  period: { zhTW: '晚泥盆紀', en: 'Late Devonian' },
  approximateMillionYearsAgo: 360,
  location: { zhTW: '古熱帶海域', en: 'Ancient tropical sea' },
  // Dunkleosteus remains fully registered, but only this era spawns it.
  creatureSpawns: [DUNKLEOSTEUS_SPAWN],
};

export const WESTERN_INTERIOR_SEAWAY_SCENE: EraScenePreset = {
  id: 'western_interior_seaway_late_cretaceous',
  name: { zhTW: '西部內陸海道', en: 'Western Interior Seaway' },
  period: { zhTW: '晚白堊紀', en: 'Late Cretaceous' },
  approximateMillionYearsAgo: 80,
  location: { zhTW: '北美洲西部內陸海道', en: 'Western Interior Seaway, North America' },
  // Additional Late Cretaceous species will be added here as they are completed.
  creatureSpawns: [AMMONITE_SPAWN],
};

export const ERA_SCENE_PRESETS = [
  LATE_DEVONIAN_SCENE,
  WESTERN_INTERIOR_SEAWAY_SCENE,
] as const satisfies readonly EraScenePreset[];

export const ACTIVE_ERA_SCENE_ID: EraSceneId = 'western_interior_seaway_late_cretaceous';

export function getEraScenePreset(id: EraSceneId): EraScenePreset {
  const preset = ERA_SCENE_PRESETS.find(candidate => candidate.id === id);
  if (!preset) throw new Error(`Unknown era scene preset: ${id}`);
  return preset;
}

export const ACTIVE_ERA_SCENE = getEraScenePreset(ACTIVE_ERA_SCENE_ID);
