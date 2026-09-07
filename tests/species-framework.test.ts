import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SpeciesRegistry, getSpeciesById, listAvailableSpecies } from '../src/species/speciesRegistry';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { Creature } from '../src/creatures/Creature';
import { DIRECTIONAL_VIEWS, type DirectionalTextureSet } from '../src/creatures/directional/types';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';

assert.equal(getSpeciesById('ammonite'), ammoniteSpecies);
assert.deepEqual(listAvailableSpecies(), [ammoniteSpecies]);
assert.throws(() => getSpeciesById('missing'), /Unknown species/);
assert.throws(() => new SpeciesRegistry([ammoniteSpecies, ammoniteSpecies]), /Duplicate species/);
assert.equal(ammoniteSpecies.behaviorProfile, 'gentle_drifter');
assert.equal(ammoniteSpecies.movement.enabled, false);
assert.equal(ammoniteSpecies.animation.framesPerDirection, 1);
const geometry = new THREE.PlaneGeometry(1, 1);
const first = new Creature(ammoniteSpecies, {...AMMONITE_SPAWN, headingDegrees: undefined}, geometry);
const second = new Creature(ammoniteSpecies, {...AMMONITE_SPAWN, id:'second', scaleOverride:[2,3,1], scaleMultiplier:2}, geometry);
assert.equal(first.species, second.species);
assert.deepEqual(first.object3d.scale.toArray(), [3.2,3.2,1]);
assert.equal(first.headingRadians, Math.PI/2);
assert.deepEqual(second.object3d.scale.toArray(), [4,6,2]);
assert.throws(() => new Creature(ammoniteSpecies, {...AMMONITE_SPAWN, position:[NaN,0,0]}, geometry), /Invalid/);
assert.throws(() => new Creature(ammoniteSpecies, {...AMMONITE_SPAWN, scaleMultiplier:0}, geometry), /Invalid/);
first.dispose(); second.dispose();

// Synchronous provider failures keep the visible fallback and update working.
const broken = new Creature({...ammoniteSpecies, directionalAssets:{id:'broken', load:() => {throw new Error('intentional provider failure');}}}, AMMONITE_SPAWN, geometry);
broken.initializeAssets(() => {});
assert.equal(broken.textureStatus, 'ERROR');
assert.equal(broken.object3d.visible, true);
assert.equal(broken.object3d.material.map, null);
assert.equal(broken.object3d.material.color.getHex(), 0xffa500);
broken.update(.1, new THREE.PerspectiveCamera());
broken.dispose();

// Late asynchronous completion must release owned assets without reviving a disposed instance.
let complete!: (textures: DirectionalTextureSet) => void;
const delayed = new Creature({...ammoniteSpecies, directionalAssets:{id:'delayed', load:() => new Promise(resolve => {complete=resolve;})}}, AMMONITE_SPAWN, geometry);
let changes=0;
delayed.initializeAssets(() => changes++);
delayed.dispose();
let disposed=0;
const textures = Object.fromEntries(DIRECTIONAL_VIEWS.map(view => {
  const texture = new THREE.Texture();
  texture.addEventListener('dispose', () => disposed++);
  return [view,texture];
})) as DirectionalTextureSet;
complete(textures);
await Promise.resolve();
assert.equal(disposed,8);
assert.equal(changes,0);
geometry.dispose();
console.log('PASS: registry, shared species, spawn defaults/overrides, validation, provider failure and late asset disposal');
