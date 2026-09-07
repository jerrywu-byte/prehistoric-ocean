import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getPitchLayer, PITCH_LAYERS, type PitchLayer } from '../src/creatures/directional/pitchLayers';
import { DIRECTIONAL_VIEWS, DIRECTIONAL_LABELS } from '../src/creatures/directional/types';
import { AMMONITE_TEXTURE_URLS } from '../src/species/ammonite/ammoniteAssets';
import { CreatureManager } from '../src/creatures/CreatureManager';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
const select=(angle:number,previous:PitchLayer|null)=>getPitchLayer(angle,previous,20,5);
assert.equal(select(21,null),'top');
assert.equal(select(-21,null),'bottom');
assert.equal(select(20,null),'mid');
assert.equal(select(-20,null),'mid');
for (const sign of [1,-1]) {
  let state:PitchLayer='mid';
  for(const a of [19,21,19,22,20,25]) { state=select(sign*a,state); assert.equal(state,'mid'); }
  state=select(sign*25.01,state);
  assert.equal(state,sign===1?'top':'bottom');
  for(const a of [24,21,19,16,15]) assert.equal(select(sign*a,state),state);
  assert.equal(select(sign*14.99,state),'mid');
}
assert.equal(select(-89,'top'),'bottom');
assert.equal(select(89,'bottom'),'top');

// Exercise production provider, manager and map selection with controlled image events.
let requests=0;
class ImageAdapter {
  url='';
  listeners=new Map<string,()=>void>();
  addEventListener(type:string,fn:()=>void){this.listeners.set(type,fn);}
  removeEventListener(type:string){this.listeners.delete(type);}
  set src(url:string){this.url=url;requests++;queueMicrotask(()=>this.listeners.get('load')?.call(this));}
}
Object.assign(globalThis,{document:{createElementNS:()=>new ImageAdapter()}});
const camera=new THREE.PerspectiveCamera();
camera.position.set(0,3.2,10);
const scene=new THREE.Scene();
const debug:any[]=[];
const proximity:any[]=[];
const manager=new CreatureManager(scene,camera,s=>proximity.push(s),s=>debug.push(s));
const creature=manager.spawnCreature(AMMONITE_SPAWN);
await new Promise(resolve=>setTimeout(resolve,0));
const mesh=creature.object3d;
assert.equal(requests,24);
assert.equal(mesh.scale.x,mesh.scale.y); // Square PNGs must not be stretched.
const maps=new Set<THREE.Texture>();
const normal=new THREE.Vector3(),towards=new THREE.Vector3();
for(const [layer,elevation] of [['mid',0],['top',40],['bottom',-40]] as const) {
  for(let i=0;i<8;i++){
    const azimuth=Math.PI/2+i*Math.PI/4;
    camera.position.set(8*Math.cos(azimuth),3.2+8*Math.tan(THREE.MathUtils.degToRad(elevation)),2+8*Math.sin(azimuth));
    camera.rotation.set(.6,1.5,.9); // Ignore camera roll and look direction.
    manager.update(.1);
    assert.equal(creature.view,DIRECTIONAL_VIEWS[i]);
    assert.equal(creature.currentPitchLayer,layer);
    assert.equal(debug.at(-1).textureKey,layer.toUpperCase()+'_'+DIRECTIONAL_LABELS[DIRECTIONAL_VIEWS[i]]);
    assert.equal(debug.at(-1).pitchThreshold,20);
    assert.equal(debug.at(-1).pitchHysteresis,5);
    assert.equal(debug.at(-1).textureMode,'PITCH_DIRECTIONAL_8X3');
    assert.equal(mesh.material.map!.image.url,AMMONITE_TEXTURE_URLS[layer][DIRECTIONAL_VIEWS[i]]);
    maps.add(mesh.material.map!);
    normal.set(0,0,1).applyQuaternion(mesh.quaternion);
    towards.copy(camera.position).sub(mesh.position).normalize();
    assert.ok(normal.dot(towards)>.999999);
    assert.equal(mesh.rotation.z,0);
    const version=mesh.material.version, map=mesh.material.map;
    for(let frame=0;frame<60;frame++) manager.update(1/60);
    assert.equal(mesh.material.version,version);
    assert.equal(mesh.material.map,map);
  }
}
assert.equal(maps.size,24);
assert.equal(requests,24);
// Same horizontal FRONT position, full vertical round trip.
for(const [elevation,layer] of [[0,'mid'],[40,'top'],[0,'mid'],[-40,'bottom']] as const){
  camera.position.set(0,3.2+8*Math.tan(THREE.MathUtils.degToRad(elevation)),10);
  manager.update(.1);
  assert.equal(creature.currentPitchLayer,layer);
  assert.equal(creature.view,'front');
}
// Exact poles always pick their layer, even on first update; coincident camera remains finite.
for(const [height,layer] of [[20,'top'],[-20,'bottom']] as const){
  camera.position.set(0,3.2+height,2);manager.update(.1);
  assert.equal(creature.currentPitchLayer,layer);
  assert.ok(mesh.quaternion.toArray().every(Number.isFinite));
  normal.set(0,0,1).applyQuaternion(mesh.quaternion);
  assert.ok(normal.y*Math.sign(height)>.999999);
}
camera.position.copy(mesh.position);manager.update(.1);
assert.equal(debug.at(-1).observation,'TOO CLOSE');
assert.equal(proximity.at(-1).isNearby,true);
assert.ok(mesh.quaternion.toArray().every(Number.isFinite));
manager.dispose();
for(const height of [20,-20]){
 const cam=new THREE.PerspectiveCamera();cam.position.set(0,3.2+height,2);
 const m=new CreatureManager(new THREE.Scene(),cam,()=>{},()=>{});
 const c=m.spawnCreature(AMMONITE_SPAWN);
 assert.equal(c.currentPitchLayer,height>0?'top':'bottom');
 assert.equal(c.view,'front');
 m.dispose();
}
assert.deepEqual(PITCH_LAYERS,['top','mid','bottom']);
console.log('PASS: pitch boundaries/hysteresis, all 24 keys/maps, orbit, no reload, pole startup, roll-free facing and proximity');
