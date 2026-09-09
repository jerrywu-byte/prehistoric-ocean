import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { DIRECTIONAL_16_VIEWS, getMissingDirectionalViews } from '../src/creatures/directional/types';
import { getDirectionalView } from '../src/creatures/directional/getDirectionalView';
import { CreatureManager, type CreatureDebugState } from '../src/creatures/CreatureManager';
import { SpeciesRegistry, getSpeciesById } from '../src/species/speciesRegistry';
import { dunkleosteusSpecies } from '../src/species/dunkleosteus/dunkleosteusSpecies';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { DUNKLEOSTEUS_DIRECTIONAL_MODE, DUNKLEOSTEUS_INTERMEDIATE_FALLBACKS,
  DUNKLEOSTEUS_TEXTURE_URLS, dunkleosteusAssets } from '../src/species/dunkleosteus/dunkleosteusAssets';
import { DUNKLEOSTEUS_SPAWN } from '../src/world/creatureSpawns';

const rad=THREE.MathUtils.degToRad;
assert.equal(getSpeciesById('dunkleosteus'),dunkleosteusSpecies);
assert.equal(DUNKLEOSTEUS_DIRECTIONAL_MODE,'directional_16');
assert.equal(dunkleosteusSpecies.rendering.mode,'directional_16');
assert.equal(dunkleosteusSpecies.rendering.billboard,'cameraFacing');
assert.equal(dunkleosteusSpecies.rendering.horizontalDirectionTransition.durationMs,110);
assert.equal(dunkleosteusSpecies.rendering.horizontalDirectionTransition.hysteresisDegrees,2.5);
assert.equal(ammoniteSpecies.rendering.mode,'pitch_directional_8x3');
assert.equal(ammoniteSpecies.rendering.horizontalDirectionTransition.durationMs,140);
assert.deepEqual(Object.keys(DUNKLEOSTEUS_TEXTURE_URLS),DIRECTIONAL_16_VIEWS);
assert.equal(new Set(Object.values(DUNKLEOSTEUS_TEXTURE_URLS)).size,16);
assert.equal(Object.keys(DUNKLEOSTEUS_INTERMEDIATE_FALLBACKS).length,8);
assert.equal(360/DIRECTIONAL_16_VIEWS.length,22.5);
for(let i=0;i<16;i++) assert.equal(
  getDirectionalView(rad(i*22.5),null,rad(2.5),DIRECTIONAL_16_VIEWS),DIRECTIONAL_16_VIEWS[i]);
for(const degrees of [179,-179,180,-180,540]) assert.equal(
  getDirectionalView(rad(degrees),'back',rad(2.5),DIRECTIONAL_16_VIEWS),'back');
for(const degrees of [10.5,11.5,10.8,11.7]) assert.equal(
  getDirectionalView(rad(degrees),'front',rad(2.5),DIRECTIONAL_16_VIEWS),'front');
assert.equal(getDirectionalView(rad(13.8),'front',rad(2.5),DIRECTIONAL_16_VIEWS),'frontFrontRight');

for(const view of DIRECTIONAL_16_VIEWS) {
  const file='public/'+DUNKLEOSTEUS_TEXTURE_URLS[view].replace(/^\.\//,'');
  const bytes=await readFile(file);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
}

const pending:Array<{url:string;finish:(success:boolean)=>void}>=[];
class ImageAdapter {
  listeners=new Map<string,()=>void>();
  addEventListener(type:string,fn:()=>void){this.listeners.set(type,fn);}
  removeEventListener(type:string){this.listeners.delete(type);}
  set src(url:string){pending.push({url,finish:ok=>this.listeners.get(ok?'load':'error')?.call(this)});}
}
Object.assign(globalThis,{document:{createElementNS:()=>new ImageAdapter()}});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const originalDispose=THREE.Texture.prototype.dispose;
let disposalCount=0;
THREE.Texture.prototype.dispose=function(){disposalCount++;originalDispose.call(this);};
try {
  pending.length=0;disposalCount=0;
  const loading=dunkleosteusAssets.load();
  assert.equal(pending.length,16);
  for(const request of pending) request.finish(true);
  const textures=await loading;
  assert.equal(getMissingDirectionalViews(textures).length,0);
  assert.equal(new Set(Object.values(textures)).size,16);
  assert.equal(disposalCount,0);

  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera();
  const home=new THREE.Vector3(...DUNKLEOSTEUS_SPAWN.position);
  camera.position.copy(home).add(new THREE.Vector3(0,0,8));
  let debug!:CreatureDebugState;
  const staticSpecies={...dunkleosteusSpecies,directionalAssets:{id:'fixture',load:()=>textures},
    movement:{...dunkleosteusSpecies.movement,enabled:false,
      ambientMotion:{...dunkleosteusSpecies.movement.ambientMotion,enabled:false}}};
  const manager=new CreatureManager(scene,camera,()=>{},state=>debug=state,new SpeciesRegistry([staticSpecies]));
  const creature=manager.spawnCreature(DUNKLEOSTEUS_SPAWN);
  assert.equal(debug.textureMode,'DIRECTIONAL_16');assert.equal(debug.sectorSizeDegrees,22.5);
  assert.equal(debug.missingAssetKeys?.length,0);
  assert.equal(debug.textureStatus,'YES');
  assert.equal(debug.materialMode,'TEXTURE');
  const maps=new Set<THREE.Texture>();
  for(let index=0;index<16;index++) {
    const angle=index*Math.PI/8;
    camera.position.set(home.x-Math.sin(angle)*8,home.y,home.z+Math.cos(angle)*8);
    manager.update(.001);
    assert.equal(creature.horizontalTransition.target,DIRECTIONAL_16_VIEWS[index]);
    manager.update(.11);
    assert.equal(creature.view,DIRECTIONAL_16_VIEWS[index]);
    assert.equal(creature.horizontalTransition.active,false);
    assert.equal(creature.object3d.material.opacity,1);
    assert.equal(creature.secondaryObject3d.visible,false);
    maps.add(creature.object3d.material.map!);
  }
  assert.equal(pending.length,16);assert.equal(maps.size,16);
  const scale=creature.object3d.scale.clone();const y=creature.locomotionPosition.y;
  manager.dispose();
  assert.deepEqual(creature.object3d.scale,scale);assert.equal(creature.object3d.rotation.z,0);
  assert.equal(creature.locomotionPosition.y,y);assert.equal(disposalCount,16);

  // Capability remains available: one missing intermediate aliases a neighbor.
  pending.length=0;disposalCount=0;
  const fallbackLoading=dunkleosteusAssets.load();
  const missingIntermediate='frontFrontRight';
  for(const request of pending) request.finish(request.url!==DUNKLEOSTEUS_TEXTURE_URLS[missingIntermediate]);
  const fallbackTextures=await fallbackLoading;
  assert.deepEqual(getMissingDirectionalViews(fallbackTextures),[missingIntermediate]);
  assert.equal(fallbackTextures[missingIntermediate],fallbackTextures.front);
  for(const texture of new Set(Object.values(fallbackTextures))) texture.dispose();
  assert.equal(disposalCount,16); // one failed placeholder + fifteen unique loaded textures

  // A missing original still has no safe alias and retains the orange fallback.
  pending.length=0;
  disposalCount=0;
  const fallbackManager=new CreatureManager(new THREE.Scene(),camera,()=>{},()=>{});
  const fallbackCreature=fallbackManager.spawnCreature(DUNKLEOSTEUS_SPAWN);
  for(const request of pending) request.finish(request.url!==DUNKLEOSTEUS_TEXTURE_URLS.front);
  await tick();
  assert.equal(fallbackCreature.textureStatus,'ERROR');
  assert.equal(fallbackCreature.object3d.visible,true);assert.equal(fallbackCreature.object3d.material.map,null);
  fallbackManager.dispose();
  assert.equal(disposalCount,16);
} finally {THREE.Texture.prototype.dispose=originalDispose;}

assert.equal(dunkleosteusSpecies.movement.locomotion.enabled,true);
if(dunkleosteusSpecies.movement.locomotion.enabled) {
  assert.equal(dunkleosteusSpecies.movement.locomotion.cruiseSpeed,.22);
  assert.equal(dunkleosteusSpecies.movement.locomotion.horizontalRoamRadius,3.5);
  assert.equal(dunkleosteusSpecies.movement.locomotion.maxTurnRateDegreesPerSecond,18);
}
console.log('PASS: 16/16 directional assets, mapping, no normal fallback, temporal collapse, fallback capability, no reload, disposal, unchanged locomotion/ammonite');
