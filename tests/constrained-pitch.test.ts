import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Creature } from '../src/creatures/Creature';
import { ammoniteSpecies as productionSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { DIRECTIONAL_VIEWS } from '../src/creatures/directional/types';
import { getTargetPitch, smoothPitch } from '../src/creatures/directional/constrainedPitch';

const ammoniteSpecies = {
  ...productionSpecies,
  rendering: {
    ...productionSpecies.rendering,
    mode: 'directional_8' as const,
    billboard: 'constrainedPitch' as const,
  },
  movement: {
    ...productionSpecies.movement,
    enabled:false,
    ambientMotion: {...productionSpecies.movement.ambientMotion,enabled:false},
  },
};
const rad = THREE.MathUtils.degToRad;
const config = ammoniteSpecies.orientation;
const close = (a:number,b:number) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
for (const degrees of [-3,-2,0,2,3]) close(getTargetPitch(rad(degrees),8,0,config),0);
close(getTargetPitch(rad(80),8,0,config),rad(30));
close(getTargetPitch(rad(-80),8,0,config),rad(-30));
close(getTargetPitch(rad(90),0,rad(10),config),rad(10));
close(smoothPitch(0,rad(30),.18,.18),rad(28.5));
let p30=0, p120=0;
for(let i=0;i<6;i++) p30=smoothPitch(p30,rad(30),1/30,.18);
for(let i=0;i<24;i++) p120=smoothPitch(p120,rad(30),1/120,.18);
close(p30,p120);
close(smoothPitch(.1,.2,0,.18),.1);
close(smoothPitch(.1,.2,NaN,.18),.1);
const geometry = new THREE.PlaneGeometry(1,1);
const creature = new Creature(ammoniteSpecies,AMMONITE_SPAWN,geometry);
const camera = new THREE.PerspectiveCamera();
const normal = new THREE.Vector3();
for(let i=0;i<8;i++) {
  const azimuth=Math.PI/2+i*Math.PI/4;
  for (const elevation of [0,45,-45,80,-80]) {
    camera.position.set(8*Math.cos(azimuth),3.2+8*Math.tan(rad(elevation)),2+8*Math.sin(azimuth));
    camera.rotation.set(.9,2,.6); // Camera rotation must have no influence.
    for(let frame=0;frame<120;frame++) creature.update(1/60,camera);
    assert.equal(creature.view,DIRECTIONAL_VIEWS[i]);
    const expected=rad(Math.max(-30,Math.min(30,elevation)));
    close(creature.targetPitch,expected);
    close(creature.appliedPitch,expected);
    assert.equal(creature.object3d.rotation.order,'YXZ');
    assert.equal(creature.object3d.rotation.z,0);
    normal.set(0,0,1).applyQuaternion(creature.object3d.quaternion);
    close(normal.y,Math.sin(expected));
    close(normal.x,Math.cos(azimuth)*Math.cos(expected));
    close(normal.z,Math.sin(azimuth)*Math.cos(expected));
  }
}
// Cross the vertical pole with tiny horizontal jitter: no yaw/view/target flip.
const yaw=creature.object3d.rotation.y, view=creature.view, target=creature.targetPitch;
for(const dx of [0,1e-12,-1e-12,0]) {
  camera.position.set(dx,20,2);
  creature.update(1/60,camera);
  close(creature.object3d.rotation.y,yaw);
  close(creature.targetPitch,target);
  assert.equal(creature.view,view);
  assert.ok(creature.object3d.quaternion.toArray().every(Number.isFinite));
  assert.ok(Math.abs(creature.appliedPitch)<=rad(30));
}
camera.position.copy(creature.object3d.position); creature.update(1/60,camera);
assert.ok(Number.isFinite(creature.verticalAngle));
assert.equal(creature.distance,0);
creature.dispose();
const cylindrical=new Creature({...ammoniteSpecies,rendering:{...ammoniteSpecies.rendering,billboard:'cylindrical'}},AMMONITE_SPAWN,geometry);
camera.position.set(0,20,10); cylindrical.update(1,camera);
close(cylindrical.appliedPitch,0);
cylindrical.dispose(); geometry.dispose();
console.log('PASS: level/up/down, clamp/dead zone, damping/frame rate, eight elevated views, normal signs, zero roll and pole safety');
