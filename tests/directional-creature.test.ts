import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getDirectionalView, getRelativeAngle } from '../src/creatures/directional/getDirectionalView';
import { CreatureManager } from '../src/creatures/CreatureManager';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { DIRECTIONAL_VIEWS, DIRECTIONAL_LABELS } from '../src/creatures/directional/types';
const rad = (degrees: number) => degrees * Math.PI / 180;
const views = DIRECTIONAL_VIEWS;
const h = rad(ammoniteSpecies.orientation.directionalHysteresisDegrees);
for (let i=0; i<8; i++) {
  assert.equal(getDirectionalView(rad(i*45), null, h), views[i]);
  // Every boundary, both directions, including negative angles and wraparound.
  const boundary = i*45 + 22.5;
  const next = views[(i+1)%8];
  for (const offset of [-.5,.5,-1.5,1.5,-.5]) {
    for (const wrap of [0,-360]) {
      assert.equal(getDirectionalView(rad(boundary+offset+wrap), views[i], h), views[i]);
      assert.equal(getDirectionalView(rad(boundary+offset+wrap), next, h), next);
    }
  }
  assert.equal(getDirectionalView(rad(boundary+5.1), views[i], h), next);
  assert.equal(getDirectionalView(rad(boundary-5.1), next, h), views[i]);
}
for (const angle of [22,23,21,24,22]) {
  assert.equal(getDirectionalView(rad(angle),'front',h),'front');
}
assert.equal(getDirectionalView(rad(-179),'back',h),'back');
assert.equal(getDirectionalView(rad(179),'back',h),'back');
assert.equal(getRelativeAngle(0,8,Math.PI/2),0);

// Image event adapter tests the real TextureLoader and lifecycle/math, not PNG pixels.
let images = 0;
let disposedTextures = 0;
const originalDispose = THREE.Texture.prototype.dispose;
THREE.Texture.prototype.dispose = function () { disposedTextures++; originalDispose.call(this); };
class TestImage {
  private listeners = new Map<string, () => void>();
  addEventListener(type: string, fn: () => void) { this.listeners.set(type, fn); }
  removeEventListener(type: string) { this.listeners.delete(type); }
  set src(_url: string) { queueMicrotask(() => this.listeners.get('load')?.call(this)); }
}
Object.assign(globalThis, {document: {createElementNS: () => {
  images++;
  return new TestImage();
}}});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.set(0,3.2,10);
const states: any[] = [];
const proximity: any[] = [];
const manager = new CreatureManager(scene, camera,
  s=>proximity.push(s), s=>states.push(s));
manager.spawnCreature(AMMONITE_SPAWN);
await new Promise(resolve => setTimeout(resolve, 0));
const mesh = scene.children[0] as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
assert.equal(images, 24);
assert.equal(states.at(-1).view, 'FRONT');
assert.equal(states.at(-1).creatureName, '菊石 / Ammonite');
assert.equal(mesh.material.fog, true);
assert.equal(mesh.material.alphaTest, .05);
assert.equal(mesh.material.depthWrite, false);
assert.equal(mesh.material.map!.colorSpace, THREE.SRGBColorSpace);
const maps = new Set();
for (let i=0; i<=8; i++) {
  const angle = Math.PI/2 + rad(i*45);
  camera.position.set(8*Math.cos(angle),3.2,2+8*Math.sin(angle));
  const view = views[i%8];
  camera.rotation.set(.8,.3,.2);
  manager.update(.1);
  assert.equal(states.at(-1).view, DIRECTIONAL_LABELS[view]);
  assert.equal(states.at(-1).directionIndex, i%8);
  assert.equal(states.at(-1).textureMode, 'PITCH_DIRECTIONAL_8X3');
  assert.equal(mesh.rotation.x,0);
  assert.equal(mesh.rotation.z,0);
  const normal = new THREE.Vector3(0,0,1).applyQuaternion(mesh.quaternion);
  const towards = camera.position.clone().sub(mesh.position).setY(0).normalize();
  assert.ok(normal.dot(towards) > .999);
  maps.add(mesh.material.map);
}
assert.equal(maps.size,8);
const originalMap = mesh.material.map;
const originalVersion = mesh.material.version;
for(let i=0;i<120;i++) manager.update(1/60);
assert.equal(mesh.material.map,originalMap);
assert.equal(mesh.material.version, originalVersion);
assert.equal(images,24);
camera.position.set(0,3.2,4);
manager.update(.1);
assert.equal(states.at(-1).distance,2);
assert.equal(states.at(-1).observation,'TOO CLOSE');
assert.equal(proximity.at(-1).isNearby,true);
assert.equal(proximity.at(-1).name,'菊石');
assert.equal(proximity.at(-1).subtitle,'Ammonite');
camera.position.set(0,3.2,10); manager.update(.1);
assert.equal(proximity.at(-1).isNearby,false);
assert.deepEqual(mesh.position.toArray(),[0,3.2,2]);
camera.position.set(0,12,2); manager.update(.1);
assert.ok(mesh.quaternion.toArray().every(Number.isFinite));
let disposed = 0;
for(const map of maps) (map as THREE.Texture).addEventListener('dispose',()=>disposed++);
manager.dispose();
assert.equal(disposed,8);
assert.equal(disposedTextures,24);
THREE.Texture.prototype.dispose = originalDispose;
assert.equal(scene.children.length,0);
console.log('PASS: eight views, orbit, hysteresis, upright plane, textures reused/disposed, distance/proximity/fog');
