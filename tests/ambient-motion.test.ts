import assert from 'node:assert/strict';
import * as THREE from 'three';
import { calculateAmbientMotionOffset, getDeterministicMotionPhase } from '../src/creatures/motion/ambientMotion';
import { Creature } from '../src/creatures/Creature';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { WORLD_LIMITS, getSeabedHeightAt } from '../src/world/worldLimits';

const config=ammoniteSpecies.movement.ambientMotion;
const offset=new THREE.Vector3();
assert.equal(config.enabled,true);
calculateAmbientMotionOffset(0,0,config,offset);
assert.deepEqual(offset.toArray(),[0,0,0]);
for(let time=0;time<=80;time+=.05){
  calculateAmbientMotionOffset(time,0,config,offset);
  assert.ok(Math.abs(offset.x)<=config.driftXAmplitude+1e-12);
  assert.ok(Math.abs(offset.y)<=config.verticalAmplitude+1e-12);
  assert.ok(Math.abs(offset.z)<=config.driftZAmplitude+1e-12);
}
calculateAmbientMotionOffset(1,0,config,offset);
const sampleAtOneSecond=offset.toArray();
calculateAmbientMotionOffset(10,0,config,offset);
assert.notDeepEqual(sampleAtOneSecond,offset.toArray());
assert.equal(getDeterministicMotionPhase('ammonite-002'),getDeterministicMotionPhase('ammonite-002'));
assert.notEqual(getDeterministicMotionPhase('ammonite-002'),getDeterministicMotionPhase('ammonite-003'));

const geometry=new THREE.PlaneGeometry(1,1);
const camera=new THREE.PerspectiveCamera();camera.position.set(0,3.2,10);
const creature=new Creature(ammoniteSpecies,AMMONITE_SPAWN,geometry);
const anchor=creature.anchorPosition.clone();
const scale=creature.object3d.scale.clone();
const heading=creature.headingRadians;
creature.update(0,camera);
assert.deepEqual(creature.object3d.position.toArray(),anchor.toArray());
for(let index=0;index<600;index++) creature.update(1/60,camera);
const afterTenSeconds=creature.object3d.position.clone();
assert.notDeepEqual(afterTenSeconds.toArray(),anchor.toArray());
assert.deepEqual(creature.object3d.scale.toArray(),scale.toArray());
assert.equal(creature.headingRadians,heading);
assert.equal(creature.object3d.rotation.z,0);
// Replaying elapsed time on a fresh instance yields the same world position.
const replay=new Creature(ammoniteSpecies,AMMONITE_SPAWN,geometry);
for(let index=0;index<600;index++) replay.update(1/60,camera);
assert.ok(replay.object3d.position.distanceTo(afterTenSeconds)<1e-12);
// Updating further recomputes anchor + bounded offset; it never adds the previous offset.
for(let index=0;index<6000;index++) creature.update(1/60,camera);
assert.ok(Math.abs(creature.object3d.position.x-anchor.x)<=config.driftXAmplitude+1e-12);
assert.ok(Math.abs(creature.object3d.position.y-anchor.y)<=config.verticalAmplitude+1e-12);
assert.ok(Math.abs(creature.object3d.position.z-anchor.z)<=config.driftZAmplitude+1e-12);

// Viewer selection uses the actual displayed position, not the anchor.
const actual=creature.object3d.position;
camera.position.set(actual.x,actual.y,actual.z+8);
creature.update(0,camera);
assert.equal(creature.view,'front');
assert.equal(creature.currentPitchLayer,'mid');
camera.position.set(creature.object3d.position.x,creature.object3d.position.y+10,creature.object3d.position.z+8);
creature.update(0,camera);
assert.equal(creature.currentPitchLayer,'top');

// A boundary/seabed spawn remains inside the simple safety envelope.
const edge=new Creature(ammoniteSpecies,{...AMMONITE_SPAWN,id:'edge',position:[WORLD_LIMITS.maxX, -10, WORLD_LIMITS.maxZ]},geometry);
for(let index=0;index<600;index++) edge.update(1/60,camera);
assert.ok(edge.object3d.position.x<=WORLD_LIMITS.maxX-edge.object3d.scale.x/2);
assert.ok(edge.object3d.position.z<=WORLD_LIMITS.maxZ-edge.object3d.scale.x/2);
assert.ok(edge.object3d.position.y>=getSeabedHeightAt(edge.object3d.position.x,edge.object3d.position.z)+edge.object3d.scale.y/2);
assert.ok(edge.object3d.position.y<=WORLD_LIMITS.maxY);
creature.dispose();replay.dispose();edge.dispose();geometry.dispose();
console.log('PASS: bounded anchor motion, fixed scale/roll/heading, deterministic phase/replay, actual-position views and world safety');
