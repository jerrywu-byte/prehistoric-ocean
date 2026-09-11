import assert from 'node:assert/strict';
import {
  ACTIVE_ERA_SCENE,
  ACTIVE_ERA_SCENE_ID,
  ERA_SCENE_PRESETS,
  LATE_DEVONIAN_SCENE,
  WESTERN_INTERIOR_SEAWAY_SCENE,
  getEraScenePreset,
} from '../src/world/eraScenePresets';
import { getSpeciesById } from '../src/species/speciesRegistry';

assert.equal(ERA_SCENE_PRESETS.length, 2);
assert.equal(new Set(ERA_SCENE_PRESETS.map(preset => preset.id)).size, 2);

assert.equal(LATE_DEVONIAN_SCENE.period.en, 'Late Devonian');
assert.equal(LATE_DEVONIAN_SCENE.approximateMillionYearsAgo, 360);
assert.deepEqual(
  LATE_DEVONIAN_SCENE.creatureSpawns.map(spawn => spawn.speciesId),
  ['dunkleosteus'],
);

assert.equal(WESTERN_INTERIOR_SEAWAY_SCENE.period.en, 'Late Cretaceous');
assert.equal(WESTERN_INTERIOR_SEAWAY_SCENE.approximateMillionYearsAgo, 80);
assert.deepEqual(
  WESTERN_INTERIOR_SEAWAY_SCENE.creatureSpawns.map(spawn => spawn.speciesId),
  ['ammonite'],
);

assert.equal(ACTIVE_ERA_SCENE_ID, 'western_interior_seaway_late_cretaceous');
assert.equal(ACTIVE_ERA_SCENE, WESTERN_INTERIOR_SEAWAY_SCENE);
assert.equal(getEraScenePreset('late_devonian'), LATE_DEVONIAN_SCENE);

for (const preset of ERA_SCENE_PRESETS) {
  const instanceIds = preset.creatureSpawns.map(spawn => spawn.id);
  assert.equal(new Set(instanceIds).size, instanceIds.length);
  for (const spawn of preset.creatureSpawns) {
    assert.equal(getSpeciesById(spawn.speciesId).id, spawn.speciesId);
  }
}

console.log('PASS: era scene presets isolate Late Devonian and Late Cretaceous spawns');
