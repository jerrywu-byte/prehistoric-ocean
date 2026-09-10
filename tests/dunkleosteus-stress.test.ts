import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { DIRECTIONAL_16_VIEWS, getMissingDirectionalViews } from '../src/creatures/directional/types';
import { getDirectionalView, getRelativeAngle, getWrappedDirectionIndexDelta } from '../src/creatures/directional/getDirectionalView';
import { CreatureManager, type CreatureDebugState } from '../src/creatures/CreatureManager';
import { SpeciesRegistry, getSpeciesById } from '../src/species/speciesRegistry';
import { dunkleosteusSpecies } from '../src/species/dunkleosteus/dunkleosteusSpecies';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { DUNKLEOSTEUS_DIRECTIONAL_MODE,
  DUNKLEOSTEUS_PITCH_TEXTURE_URLS, DUNKLEOSTEUS_TEXTURE_URLS,
  dunkleosteusAssets } from '../src/species/dunkleosteus/dunkleosteusAssets';
import { DUNKLEOSTEUS_SPAWN } from '../src/world/creatureSpawns';
import { isPitchTextureSet } from '../src/creatures/directional/pitchLayers';
import { constrainDiverPosition, getSeabedHeightAt, WORLD_LIMITS } from '../src/world/worldLimits';

const rad=THREE.MathUtils.degToRad;
assert.equal(getSpeciesById('dunkleosteus'),dunkleosteusSpecies);
assert.equal(DUNKLEOSTEUS_DIRECTIONAL_MODE,'pitch_directional_16x3');
assert.equal(dunkleosteusSpecies.rendering.mode,'pitch_directional_16x3');
assert.equal(dunkleosteusSpecies.rendering.billboard,'cameraFacing');
assert.equal(dunkleosteusSpecies.rendering.horizontalDirectionTransition.durationMs,110);
assert.equal(dunkleosteusSpecies.rendering.horizontalDirectionTransition.hysteresisDegrees,2.5);
assert.equal(dunkleosteusSpecies.orientation.pitchLayerThresholdDegrees,15);
assert.equal(dunkleosteusSpecies.orientation.pitchLayerHysteresisDegrees,3);
assert.equal(ammoniteSpecies.rendering.mode,'pitch_directional_8x3');
assert.equal(ammoniteSpecies.rendering.horizontalDirectionTransition.durationMs,140);
assert.deepEqual(DIRECTIONAL_16_VIEWS.map(view=>DUNKLEOSTEUS_TEXTURE_URLS[view]),[
  './assets/creatures/dunkleosteus/dunkleosteus_mid_front.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_front_front_right.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_front_right.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_right_front.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_right.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_right_back.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_back_right.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_back_back_right.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_back.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_back_back_left.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_back_left.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_left_back.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_left.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_left_front.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_front_left.png',
  './assets/creatures/dunkleosteus/dunkleosteus_mid_front_front_left.png',
]);
assert.equal(new Set(DIRECTIONAL_16_VIEWS.map(view=>DUNKLEOSTEUS_TEXTURE_URLS[view])).size,16);
assert.equal(360/DIRECTIONAL_16_VIEWS.length,22.5);
assert.deepEqual(DIRECTIONAL_16_VIEWS,[
  'front','frontFrontRight','frontRight','rightFront','right','rightBack','backRight','backBackRight',
  'back','backBackLeft','backLeft','leftBack','left','leftFront','frontLeft','frontFrontLeft',
]);
for(let i=0;i<16;i++) assert.equal(
  getDirectionalView(rad(i*22.5),null,rad(2.5),DIRECTIONAL_16_VIEWS),DIRECTIONAL_16_VIEWS[i]);
for(const degrees of [179,-179,180,-180,540]) assert.equal(
  getDirectionalView(rad(degrees),'back',rad(2.5),DIRECTIONAL_16_VIEWS),'back');
for(const degrees of [10.5,11.5,10.8,11.7]) assert.equal(
  getDirectionalView(rad(degrees),'front',rad(2.5),DIRECTIONAL_16_VIEWS),'front');
assert.equal(getDirectionalView(rad(13.8),'front',rad(2.5),DIRECTIONAL_16_VIEWS),'frontFrontRight');
assert.equal(getWrappedDirectionIndexDelta(15,0,16),1);
assert.equal(getWrappedDirectionIndexDelta(0,15,16),-1);

// The shared heading convention is atan2(z, x): heading +Z is 90 degrees.
// Camera vectors +Z / -X / -Z / +X produce 0 / +90 / -180 / -90.
assert.equal(getRelativeAngle(0,1,rad(90)),0);
assert.equal(getRelativeAngle(-1,0,rad(90)),rad(90));
assert.equal(getRelativeAngle(0,-1,rad(90)),rad(-180));
assert.equal(getRelativeAngle(1,0,rad(90)),rad(-90));

const sweep=(start:number,end:number,step:number):number[]=>{
  let previous:null|(typeof DIRECTIONAL_16_VIEWS)[number]=null;
  let previousIndex=-1;
  const indices:number[]=[];
  for(let degrees=start;step>0?degrees<=end:degrees>=end;degrees+=step){
    const next=getDirectionalView(rad(degrees),previous,rad(2.5),DIRECTIONAL_16_VIEWS) as (typeof DIRECTIONAL_16_VIEWS)[number];
    const index=DIRECTIONAL_16_VIEWS.indexOf(next);
    if(index!==previousIndex){
      if(previousIndex>=0) assert.ok(Math.abs(getWrappedDirectionIndexDelta(previousIndex,index,16))<=1);
      indices.push(index);previousIndex=index;
    }
    previous=next;
  }
  return indices;
};
assert.deepEqual(sweep(0,360,1),[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]);
assert.deepEqual(sweep(360,0,-1),[0,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0]);

for(const view of DIRECTIONAL_16_VIEWS) {
  const file='public/'+DUNKLEOSTEUS_TEXTURE_URLS[view].replace(/^\.\//,'');
  const bytes=await readFile(file);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16),1254);
  assert.equal(bytes.readUInt32BE(20),1254);
  assert.equal(bytes[25],6); // PNG color type 6: truecolor with alpha.
}
for(const layer of ['top','bottom'] as const) for(const view of ['front','right','back'] as const) {
  const file='public/'+DUNKLEOSTEUS_PITCH_TEXTURE_URLS[layer][view].replace(/^\.\//,'');
  const bytes=await readFile(file);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16),1254);assert.equal(bytes.readUInt32BE(20),1254);
  assert.equal(bytes[25],6);
}

const pending:Array<{url:string;finish:(success:boolean)=>void}>=[];
class ImageAdapter {
  listeners=new Map<string,()=>void>();
  currentSrc='';width=1254;height=1254;
  addEventListener(type:string,fn:()=>void){this.listeners.set(type,fn);}
  removeEventListener(type:string){this.listeners.delete(type);}
  set src(url:string){this.currentSrc=url;pending.push({url,finish:ok=>this.listeners.get(ok?'load':'error')?.call(this)});}
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
  await tick();
  assert.equal(pending.length,22);
  for(const request of pending.slice(16)) request.finish(true);
  const textures=await loading;
  assert.equal(isPitchTextureSet(textures),true);
  if(!isPitchTextureSet(textures)) throw new Error('Expected pitch texture set');
  assert.equal(getMissingDirectionalViews(textures).length,0);
  assert.equal(new Set(Object.values(textures).flatMap(layer=>Object.values(layer))).size,22);
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
  assert.equal(debug.textureMode,'PITCH_DIRECTIONAL_16X3');assert.equal(debug.sectorSizeDegrees,22.5);
  assert.equal(debug.missingAssetKeys?.length,0);
  assert.equal(debug.textureStatus,'YES');
  assert.equal(debug.materialMode,'TEXTURE');
  assert.equal(debug.currentTextureKey,'dunkleosteus_mid_front');
  assert.equal(debug.currentTextureUrl,DUNKLEOSTEUS_TEXTURE_URLS.front);
  assert.equal(debug.pitchLayer,'MID');assert.equal(debug.usingPitchFallback,false);
  assert.equal(debug.textureNativeWidth,1254);assert.equal(debug.textureNativeHeight,1254);
  assert.equal(debug.textureAspect,1);
  assert.equal(debug.planeGeometryWidth,1);assert.equal(debug.planeGeometryHeight,1);
  assert.equal(debug.meshScaleX,4.8);assert.equal(debug.meshScaleY,4.8);
  assert.equal(debug.finalDisplayAspect,1);
  assert.equal(debug.previousDirectionIndex,0);assert.equal(debug.currentDirectionIndex,0);
  assert.equal(debug.directionIndexDelta,0);assert.equal(debug.nonAdjacentDirectionJump,false);
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
    assert.ok(Math.abs(debug.directionIndexDelta ?? 0)<=1);
    assert.equal(debug.nonAdjacentDirectionJump,false);
  }
  assert.equal(pending.length,22);assert.equal(maps.size,16);

  const elevationY=(degrees:number)=>home.y+8*Math.tan(rad(degrees));
  for(const [index,view] of [[0,'front'],[4,'right'],[8,'back']] as const) {
    const angle=index*Math.PI/8;
    for(const [elevation,layer] of [[40,'top'],[0,'mid'],[-40,'bottom']] as const) {
      camera.position.set(home.x-Math.sin(angle)*8,elevationY(elevation),home.z+Math.cos(angle)*8);
      manager.update(.12);
      assert.equal(creature.directionIndex,index);
      assert.equal(creature.view,view);
      assert.equal(creature.currentPitchLayer,layer);
      const expected=layer==='mid' ? DUNKLEOSTEUS_TEXTURE_URLS[view] : DUNKLEOSTEUS_PITCH_TEXTURE_URLS[layer][view];
      assert.equal(creature.object3d.material.map!.image.currentSrc,expected);
      assert.equal(debug.requestedTextureKey,`dunkleosteus_${layer}_${view}`);
      assert.equal(debug.actualTextureKey,`dunkleosteus_${layer}_${view}`);
      assert.equal(debug.usingPitchFallback,false);
    }
  }
  for(const [elevation,layer] of [[40,'top'],[-40,'bottom']] as const) {
    const index=2,view='frontRight';const angle=index*Math.PI/8;
    camera.position.set(home.x-Math.sin(angle)*8,elevationY(elevation),home.z+Math.cos(angle)*8);
    manager.update(.12);
    assert.equal(creature.directionIndex,index);assert.equal(creature.currentPitchLayer,layer);
    assert.equal(creature.object3d.material.map!.image.currentSrc,DUNKLEOSTEUS_TEXTURE_URLS[view]);
    assert.equal(debug.requestedTextureKey,`dunkleosteus_${layer}_front_right`);
    assert.equal(debug.actualTextureKey,'dunkleosteus_mid_front_right');
    assert.equal(debug.usingPitchFallback,true);
  }

  // Reachability through the same world constraint used by DiverControls.
  const velocity=new THREE.Vector3();
  const reachableHorizontalDistance=6;
  const setReachableCameraY=(requestedY:number):void=>{
    camera.position.set(home.x,requestedY,home.z+reachableHorizontalDistance);
    constrainDiverPosition(camera.position,velocity);
    manager.update(.12);
  };
  setReachableCameraY(home.y);
  assert.equal(creature.currentPitchLayer,'mid');
  const horizontalIndexAtMid=creature.directionIndex;
  setReachableCameraY(WORLD_LIMITS.maxY);
  assert.equal(camera.position.y,WORLD_LIMITS.maxY);
  assert.equal(creature.currentPitchLayer,'top');
  assert.ok((debug.verticalAngle ?? 0)>18);
  assert.equal(creature.directionIndex,horizontalIndexAtMid);
  assert.equal(debug.cameraY,camera.position.y);
  assert.equal(debug.creatureY,creature.object3d.position.y);
  assert.equal(debug.verticalDifference,camera.position.y-creature.object3d.position.y);
  assert.equal(debug.horizontalDistance,reachableHorizontalDistance);
  setReachableCameraY(home.y);
  assert.equal(creature.currentPitchLayer,'mid');
  setReachableCameraY(-100);
  const minimumDiverY=getSeabedHeightAt(camera.position.x,camera.position.z)+WORLD_LIMITS.seabedClearance;
  assert.ok(Math.abs(camera.position.y-minimumDiverY)<1e-9);
  assert.equal(creature.currentPitchLayer,'bottom');
  assert.ok((debug.verticalAngle ?? 0)<-18);
  assert.equal(creature.directionIndex,horizontalIndexAtMid);
  const scale=creature.object3d.scale.clone();const y=creature.locomotionPosition.y;
  manager.dispose();
  assert.deepEqual(creature.object3d.scale,scale);assert.equal(creature.object3d.rotation.z,0);
  assert.equal(creature.locomotionPosition.y,y);assert.equal(disposalCount,22);

  // No direction borrows another asset: any missing PNG falls back at creature level.
  pending.length=0;disposalCount=0;
  const missingLoading=dunkleosteusAssets.load();
  const missingIntermediate='frontFrontRight';
  for(const request of pending) request.finish(request.url!==DUNKLEOSTEUS_TEXTURE_URLS[missingIntermediate]);
  await assert.rejects(missingLoading,/Directional texture failed to load/);
  assert.equal(disposalCount,16);

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
console.log('PASS: reachable TOP/MID/BOTTOM within diver world limits, MID fallback, no reload, disposal, unchanged locomotion/ammonite');
