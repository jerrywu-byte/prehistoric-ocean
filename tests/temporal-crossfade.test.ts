import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TemporalDirectionTransition } from '../src/creatures/directional/TemporalDirectionTransition';
import { getDirectionalView } from '../src/creatures/directional/getDirectionalView';
import { DIRECTIONAL_VIEWS } from '../src/creatures/directional/types';
import { Creature } from '../src/creatures/Creature';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';

const rad = THREE.MathUtils.degToRad;
const t = new TemporalDirectionTransition(140);
t.select('front'); t.select('frontLeft');
assert.equal(t.active, true);
for (let i=0;i<7;i++) {
  const elapsed=t.elapsed;
  t.select('frontLeft'); // Stationary camera cannot restart the timer.
  assert.equal(t.elapsed,elapsed);
  t.update(.02);
  if(i<6) assert.ok(t.elapsed>elapsed);
  assert.ok(t.blend>=0 && t.blend<=1);
}
assert.equal(t.current,'frontLeft'); assert.equal(t.active,false);
assert.equal(t.source,null); assert.equal(t.destination,null);
t.select('left'); t.update(.1); t.select('backLeft');
assert.equal(t.source,'left'); // Destination was dominant.
assert.equal(t.destination,'backLeft');
t.update(.01); t.select('front');
assert.equal(t.source,'left'); // Source is dominant this time.
t.update(.14); assert.equal(t.current,'front');
let selected = 'front' as typeof t.current;
for(const a of [-22,-23,-21,-24,-22]) {
  selected=getDirectionalView(rad(a),selected,rad(4)); assert.equal(selected,'front');
}
assert.equal(getDirectionalView(rad(-27),selected,rad(4)),'frontLeft');
for(const a of [179,-179,180,-180,540]) assert.equal(getDirectionalView(rad(a),'back',rad(4)),'back');

let disposals=0;
const textures=Object.fromEntries(['top','mid','bottom'].map(layer=>[layer,
  Object.fromEntries(DIRECTIONAL_VIEWS.map(view=>{
    const texture=new THREE.Texture(); texture.name=layer+'-'+view;
    texture.addEventListener('dispose',()=>disposals++); return [view,texture];
  }))])) as any;
const species={...ammoniteSpecies,
  directionalAssets:{id:'test',load:()=>textures},
  movement:{...ammoniteSpecies.movement,enabled:false,
    ambientMotion:{...ammoniteSpecies.movement.ambientMotion,enabled:false}}};
const geometry=new THREE.PlaneGeometry(1,1);
const c=new Creature(species,AMMONITE_SPAWN,geometry);
const camera=new THREE.PerspectiveCamera();
function observe(angle:number,y=0) {
  const a=c.headingRadians+rad(angle);
  camera.position.set(c.object3d.position.x+8*Math.cos(a),c.object3d.position.y+y,c.object3d.position.z+8*Math.sin(a));
}
function idle() {
  assert.equal(c.horizontalTransition.active,false);
  assert.equal(c.object3d.visible,true); assert.equal(c.object3d.material.opacity,1);
  assert.equal(c.secondaryObject3d.visible,false); assert.equal(c.secondaryObject3d.material.opacity,0);
  assert.equal(c.secondaryObject3d.material.map,null);
}
observe(0); c.update(0,camera); c.initializeAssets(()=>{}); idle();
const scale=c.object3d.scale.clone();
observe(-28); c.update(0,camera);
assert.equal(c.horizontalTransition.active,true);
for(let i=0;i<7;i++) {
  c.update(.02,camera);
  assert.ok(Math.abs(c.object3d.material.opacity+c.secondaryObject3d.material.opacity-1)<1e-12);
  assert.equal(c.object3d.children.length,1);
}
idle(); assert.equal(c.view,'frontLeft');
observe(-22.5); // Stop exactly at the boundary for 60 seconds.
for(let i=0;i<3600;i++) { c.update(1/60,camera); idle(); }
observe(-75); c.update(.05,camera);
assert.equal(c.horizontalTransition.active,true);
observe(-75,10); c.update(0,camera); idle();
assert.equal(c.currentPitchLayer,'top'); assert.equal(c.object3d.material.map!.name,'top-left');
observe(-120,10); c.update(.1,camera);
observe(-165,10); c.update(0,camera);
assert.equal(c.horizontalTransition.source,'backLeft');
c.update(.14,camera); idle();
// Heading changes at a fixed camera trigger the same edge-based mechanism.
c.headingRadians+=rad(60); c.update(0,camera);
assert.equal(c.horizontalTransition.active,true); c.update(.14,camera); idle();
assert.deepEqual(c.object3d.scale.toArray(),scale.toArray()); assert.equal(c.object3d.rotation.z,0);
let materialDisposals=0;
c.object3d.material.addEventListener('dispose',()=>materialDisposals++);
c.secondaryObject3d.material.addEventListener('dispose',()=>materialDisposals++);
c.dispose(); c.dispose(); geometry.dispose();
assert.equal(disposals,24); assert.equal(materialDisposals,2);
console.log('PASS: temporal completion, 60-second stationary boundary, interruptions, cleanup, pitch isolation, heading, fallback-compatible lifecycle');
