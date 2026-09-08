import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Creature } from '../src/creatures/Creature';
import {
  GentleRoamLocomotion,
  getDeterministicLocomotionSeed,
  getHeadingSpeedFactor,
  normalizeAngle,
  shortestAngleDelta,
  type HorizontalMovementBounds,
} from '../src/creatures/motion/gentleRoam';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { WORLD_LIMITS } from '../src/world/worldLimits';

const config=ammoniteSpecies.movement.locomotion;
if(!config.enabled) throw new Error('Ammonite gentle roam must be enabled');
const bounds:HorizontalMovementBounds={minX:-10,maxX:10,minZ:-10,maxZ:10};
const home=new THREE.Vector3(0,3.2,2);
const seed=getDeterministicLocomotionSeed('ammonite','test-instance');
const create=()=>new GentleRoamLocomotion(home.clone(),Math.PI/2,config,bounds,seed);
const first=create(),second=create();
assert.deepEqual(first.target.toArray(),second.target.toArray());
assert.equal(seed,getDeterministicLocomotionSeed('ammonite','test-instance'));
assert.notEqual(seed,getDeterministicLocomotionSeed('ammonite','other-instance'));

const checkTarget=(movement:GentleRoamLocomotion,from:THREE.Vector3):void=>{
  assert.ok(Math.hypot(movement.target.x-home.x,movement.target.z-home.z)<=config.horizontalRoamRadius+1e-12);
  assert.ok(Math.hypot(movement.target.x-from.x,movement.target.z-from.z)>=config.minimumTargetDistance-1e-12);
  assert.ok(movement.target.x>=bounds.minX&&movement.target.x<=bounds.maxX);
  assert.ok(movement.target.z>=bounds.minZ&&movement.target.z<=bounds.maxZ);
};
checkTarget(first,home);

let transitions=0;
let priorState=first.state;
let priorTarget=first.target.clone();
let previousWaypoint=home.clone();
for(let frame=0;frame<24000&&transitions<4;frame++){
  first.update(1/60);second.update(1/60);
  assert.ok(first.speed<=config.cruiseSpeed+1e-12);
  assert.equal(first.position.y,home.y);
  assert.ok(first.position.distanceToSquared(second.position)<1e-20);
  assert.equal(first.state,second.state);
  assert.equal(first.pauseRemainingSeconds,second.pauseRemainingSeconds);
  if(priorState==='PAUSED'&&first.state==='MOVING'){
    transitions++;
    checkTarget(first,previousWaypoint);
    assert.deepEqual(first.target.toArray(),second.target.toArray());
    previousWaypoint=priorTarget.clone();
    priorTarget.copy(first.target);
  }
  if(priorState==='MOVING'&&first.state==='PAUSED'){
    assert.ok(first.pauseRemainingSeconds>=config.pauseMinSeconds);
    assert.ok(first.pauseRemainingSeconds<=config.pauseMaxSeconds);
    previousWaypoint.copy(first.position);
  }
  priorState=first.state;
}
assert.equal(transitions,4);

// Acceleration and deceleration use units/second and never jump to cruise speed.
const accelerating=create();
accelerating.headingRadians=accelerating.targetHeadingRadians;
accelerating.update(.5);
assert.ok(accelerating.speed>0);
assert.ok(accelerating.speed<=config.acceleration*.5+1e-12);
const decelerating=create();
decelerating.speed=config.cruiseSpeed;
decelerating.headingRadians=decelerating.targetHeadingRadians;
decelerating.position.x=decelerating.target.x-Math.cos(decelerating.targetHeadingRadians)*.4;
decelerating.position.z=decelerating.target.z-Math.sin(decelerating.targetHeadingRadians)*.4;
decelerating.update(.5);
assert.ok(decelerating.speed<config.cruiseSpeed);
assert.ok(decelerating.speed>=config.cruiseSpeed-config.deceleration*.5-1e-12);

// Arrival snaps once into PAUSED and cannot oscillate around the target.
const arriving=create();
arriving.position.x=arriving.target.x-.1;
arriving.position.z=arriving.target.z;
arriving.update(1/60);
assert.equal(arriving.state,'PAUSED');
assert.ok(arriving.distanceToTarget<=config.arrivalRadius);
const arrivedAt=arriving.position.clone();
const pauseDuration=arriving.pauseRemainingSeconds;
arriving.update(.5);
assert.deepEqual(arriving.position.toArray(),arrivedAt.toArray());
assert.equal(arriving.pauseRemainingSeconds,pauseDuration-.5);
const arrivingReplay=create();
arrivingReplay.position.x=arrivingReplay.target.x-.1;
arrivingReplay.position.z=arrivingReplay.target.z;
arrivingReplay.update(1/60);
assert.equal(arrivingReplay.pauseRemainingSeconds,pauseDuration);

// Heading wraps through the shortest arc and obeys the configured turn-rate cap.
assert.ok(Math.abs(THREE.MathUtils.radToDeg(shortestAngleDelta(THREE.MathUtils.degToRad(170),THREE.MathUtils.degToRad(-170)))-20)<1e-9);
assert.ok(Math.abs(normalizeAngle(Math.PI*3)+Math.PI)<1e-9);
const turning=create();
turning.headingRadians=normalizeAngle(turning.targetHeadingRadians+Math.PI/2);
const beforeHeading=turning.headingRadians;
turning.update(.5);
assert.ok(Math.abs(THREE.MathUtils.radToDeg(shortestAngleDelta(beforeHeading,turning.headingRadians)))<=12+1e-9);
assert.equal(getHeadingSpeedFactor(THREE.MathUtils.degToRad(110)),0);
const facingAway=create();
facingAway.headingRadians=normalizeAngle(facingAway.targetHeadingRadians+Math.PI);
facingAway.update(1);
assert.equal(facingAway.speed,0);

// A home near the world edge still produces only bounded waypoints.
const edgeBounds={
  minX:WORLD_LIMITS.minX+1.6,maxX:WORLD_LIMITS.maxX-1.6,
  minZ:WORLD_LIMITS.minZ+1.6,maxZ:WORLD_LIMITS.maxZ-1.6,
};
const edgeHome=new THREE.Vector3(edgeBounds.maxX,3.2,edgeBounds.maxZ);
const edge=new GentleRoamLocomotion(edgeHome,Math.PI/2,config,edgeBounds,12345);
assert.ok(edge.target.x>=edgeBounds.minX&&edge.target.x<=edgeBounds.maxX);
assert.ok(edge.target.z>=edgeBounds.minZ&&edge.target.z<=edgeBounds.maxZ);
assert.ok(Math.hypot(edge.target.x-edgeHome.x,edge.target.z-edgeHome.z)<=config.horizontalRoamRadius+1e-12);
assert.ok(Math.hypot(edge.target.x-edge.position.x,edge.target.z-edge.position.z)>=config.minimumTargetDistance-1e-12);

// Creature integration keeps home, locomotion and ambient positions independent.
const geometry=new THREE.PlaneGeometry(1,1);
const camera=new THREE.PerspectiveCamera();camera.position.set(0,3.2,10);
const creature=new Creature(ammoniteSpecies,{...AMMONITE_SPAWN,locomotionSeed:seed},geometry);
const scale=creature.object3d.scale.clone();
creature.update(1,camera);
const combined=creature.locomotionPosition.clone().add(creature.motionOffset);
assert.ok(creature.object3d.position.distanceTo(combined)<1e-12);
assert.equal(creature.locomotionPosition.y,creature.anchorPosition.y);
assert.deepEqual(creature.object3d.scale.toArray(),scale.toArray());
assert.equal(creature.object3d.rotation.z,0);
// Horizontal Sprite selection follows current heading even when camera does not move.
camera.position.set(creature.object3d.position.x,creature.object3d.position.y,creature.object3d.position.z+8);
creature.locomotion!.headingRadians=Math.PI/2;creature.update(0,camera);
assert.equal(creature.horizontalTransition.target,'front');
creature.locomotion!.headingRadians=0;creature.update(0,camera);
assert.equal(creature.horizontalTransition.target,'right');
// Pitch layer continues to use the current rendered position.
camera.position.set(creature.object3d.position.x,creature.object3d.position.y+10,creature.object3d.position.z+8);
creature.update(0,camera);
assert.equal(creature.currentPitchLayer,'top');
creature.dispose();geometry.dispose();

console.log('PASS: deterministic bounded waypoints/pause, smooth speed/turn/arrival, separated positions and heading-aware 24-direction integration');
