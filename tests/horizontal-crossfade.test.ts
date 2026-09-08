import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Creature } from '../src/creatures/Creature';
import {
  getHorizontalDirectionBlend,
  smoothstep01,
} from '../src/creatures/directional/horizontalDirectionBlend';
import { DIRECTIONAL_VIEWS, type DirectionalTextureSet } from '../src/creatures/directional/types';
import type { PitchDirectionalTextureSet } from '../src/creatures/directional/pitchLayers';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';

const rad=(degrees:number)=>THREE.MathUtils.degToRad(degrees);
const close=(actual:number,expected:number,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

assert.equal(smoothstep01(-1),0);
assert.equal(smoothstep01(0),0);
assert.equal(smoothstep01(.5),.5);
assert.equal(smoothstep01(1),1);
assert.equal(smoothstep01(2),1);

for(let index=0;index<8;index++){
  const state=getHorizontalDirectionBlend(rad(index*45),16);
  assert.equal(state.primaryView,DIRECTIONAL_VIEWS[index]);
  assert.equal(state.secondaryView,null);
  assert.equal(state.blend,0);
}
const frontRight=getHorizontalDirectionBlend(rad(22.5),16);
assert.equal(frontRight.primaryView,'front');
assert.equal(frontRight.secondaryView,'frontRight');
close(frontRight.blend,.5);
close(THREE.MathUtils.radToDeg(frontRight.boundaryAngle!),22.5);
const frontLeft=getHorizontalDirectionBlend(rad(-22.5),16);
assert.equal(frontLeft.primaryView,'frontLeft');
assert.equal(frontLeft.secondaryView,'front');
close(frontLeft.blend,.5);
const backRight=getHorizontalDirectionBlend(rad(157.5),16);
assert.equal(backRight.primaryView,'backRight');
assert.equal(backRight.secondaryView,'back');
const backLeft=getHorizontalDirectionBlend(rad(-157.5),16);
assert.equal(backLeft.primaryView,'back');
assert.equal(backLeft.secondaryView,'backLeft');
for(const degrees of [180,-180,540,-540]){
  const state=getHorizontalDirectionBlend(rad(degrees),16);
  assert.equal(state.primaryView,'back');
  assert.equal(state.secondaryView,null);
}
const wrappedFrontLeft=getHorizontalDirectionBlend(rad(337.5),16);
assert.equal(wrappedFrontLeft.primaryView,frontLeft.primaryView);
assert.equal(wrappedFrontLeft.secondaryView,frontLeft.secondaryView);
close(wrappedFrontLeft.blend,frontLeft.blend);
close(wrappedFrontLeft.boundaryAngle!,frontLeft.boundaryAngle!);
assert.equal(getHorizontalDirectionBlend(rad(14.4),16).secondaryView,null);
assert.equal(getHorizontalDirectionBlend(rad(30.6),16).secondaryView,null);
for(let degrees=-720;degrees<=720;degrees+=.25){
  const blend=getHorizontalDirectionBlend(rad(degrees),16).blend;
  assert.ok(blend>=0&&blend<=1);
}

const textures={} as Record<'top'|'mid'|'bottom',DirectionalTextureSet>;
for(const layer of ['top','mid','bottom'] as const){
  textures[layer]=Object.fromEntries(DIRECTIONAL_VIEWS.map(view=>{
    const texture=new THREE.Texture();
    texture.name=layer+'-'+view;
    return [view,texture];
  })) as DirectionalTextureSet;
}
const textureSet=textures as PitchDirectionalTextureSet;
const staticSpecies={
  ...ammoniteSpecies,
  directionalAssets:{id:'crossfade-test',load:()=>textureSet},
  movement:{
    ...ammoniteSpecies.movement,
    enabled:false,
    ambientMotion:{...ammoniteSpecies.movement.ambientMotion,enabled:false},
  },
};
const geometry=new THREE.PlaneGeometry(1,1);
const creature=new Creature(staticSpecies,AMMONITE_SPAWN,geometry);
const camera=new THREE.PerspectiveCamera();
const setObserverAngle=(relativeDegrees:number,height=0):void=>{
  const worldAngle=rad(relativeDegrees)+creature.headingRadians;
  camera.position.set(
    creature.object3d.position.x+Math.cos(worldAngle)*8,
    creature.object3d.position.y+height,
    creature.object3d.position.z+Math.sin(worldAngle)*8,
  );
};
setObserverAngle(0);
creature.update(0,camera);
creature.initializeAssets(()=>{});
assert.equal(creature.currentPitchLayer,'mid');
assert.equal(creature.object3d.material.map!.name,'mid-front');
assert.equal(creature.secondaryObject3d.visible,false);

setObserverAngle(22.5);
creature.update(0,camera);
assert.equal(creature.view,'front');
assert.equal(creature.secondaryDirectionalView,'frontRight');
close(creature.horizontalBlend,.5);
assert.equal(creature.object3d.material.map!.name,'mid-front');
assert.equal(creature.secondaryObject3d.material.map!.name,'mid-frontRight');
close(creature.object3d.material.opacity,.5);
close(creature.secondaryObject3d.material.opacity,.5);
assert.equal(creature.secondaryObject3d.visible,true);
assert.equal(creature.object3d.material.depthWrite,false);
assert.equal(creature.secondaryObject3d.material.depthWrite,false);
assert.ok(creature.object3d.renderOrder<creature.secondaryObject3d.renderOrder);
const primaryVersion=creature.object3d.material.version;
const secondaryVersion=creature.secondaryObject3d.material.version;
creature.update(0,camera);
assert.equal(creature.object3d.material.version,primaryVersion);
assert.equal(creature.secondaryObject3d.material.version,secondaryVersion);

// Pitch switches both maps within the same layer; no horizontal cross-layer blend occurs.
setObserverAngle(22.5,8);
creature.update(0,camera);
assert.equal(creature.currentPitchLayer,'top');
assert.equal(creature.object3d.material.map!.name,'top-front');
assert.equal(creature.secondaryObject3d.material.map!.name,'top-frontRight');

// A stationary camera still changes blend when Creature heading changes.
camera.position.set(creature.object3d.position.x,creature.object3d.position.y,creature.object3d.position.z+8);
creature.headingRadians=rad(67.5);
creature.update(0,camera);
close(creature.horizontalBlend,.5);
assert.equal(creature.view,'front');
assert.equal(creature.secondaryDirectionalView,'frontRight');
creature.headingRadians=rad(90);
creature.update(0,camera);
assert.equal(creature.view,'front');
assert.equal(creature.secondaryDirectionalView,null);
assert.equal(creature.horizontalBlend,0);

// Camera movement independently enters the opposite FRONT/FRONT_LEFT blend.
setObserverAngle(-22.5);
creature.update(0,camera);
assert.equal(creature.view,'frontLeft');
assert.equal(creature.secondaryDirectionalView,'front');
close(creature.horizontalBlend,.5);
assert.equal(creature.object3d.rotation.z,0);
creature.object3d.updateMatrixWorld(true);
const primaryScale=new THREE.Vector3(),secondaryScale=new THREE.Vector3();
creature.object3d.getWorldScale(primaryScale);
creature.secondaryObject3d.getWorldScale(secondaryScale);
assert.ok(primaryScale.distanceTo(secondaryScale)<1e-12);

assert.equal(ammoniteSpecies.movement.locomotion.mode,'gentle_roam');
assert.equal(ammoniteSpecies.movement.ambientMotion.verticalAmplitude,.16);
let disposed=0;
for(const texture of Object.values(textures).flatMap(layer=>Object.values(layer))){
  texture.addEventListener('dispose',()=>disposed++);
}
creature.dispose();geometry.dispose();
assert.equal(disposed,24);

console.log('PASS: 16-degree smooth horizontal crossfade, wrap/boundaries, dual-plane rendering, heading/camera updates, pitch isolation and disposal');
