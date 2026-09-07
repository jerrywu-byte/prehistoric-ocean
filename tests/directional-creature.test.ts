import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getDirectionalView, getRelativeAngle } from '../src/creatures/directional/getDirectionalView';
import { CreatureManager } from '../src/creatures/CreatureManager';
import { PROTOTYPE_CREATURE } from '../src/creatures/creatureConfig';
const rad = (degrees: number) => degrees * Math.PI / 180;
for (const [angle, expected] of [[0,'FRONT'],[90,'RIGHT'],[180,'BACK'],[270,'LEFT']] as const) {
  assert.equal(getDirectionalView(rad(angle), null, rad(8)), expected);
}
for (const angle of [44,46,43,48,45,52]) {
  assert.equal(getDirectionalView(rad(angle), 'FRONT', rad(8)), 'FRONT');
}
assert.equal(getDirectionalView(rad(54), 'FRONT', rad(8)), 'RIGHT');
assert.equal(getDirectionalView(rad(40), 'RIGHT', rad(8)), 'RIGHT');
assert.equal(getDirectionalView(rad(36), 'RIGHT', rad(8)), 'FRONT');
assert.equal(getDirectionalView(rad(-179), 'BACK', rad(8)), 'BACK');
assert.equal(getDirectionalView(rad(179), 'BACK', rad(8)), 'BACK');
assert.equal(getRelativeAngle(0,8,Math.PI/2), 0);

// Canvas drawing adapter tests lifecycle/math/materials, not raster appearance.
let canvases = 0;
const context = new Proxy({}, {get: () => () => {}, set: () => true});
Object.assign(globalThis, {document: {createElement: () => {
  canvases++;
  return {width:0,height:0,getContext: () => context};
}}});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.set(0,3.2,10);
const states: any[] = [];
const proximity: any[] = [];
const manager = new CreatureManager(scene, camera, PROTOTYPE_CREATURE,
  s=>proximity.push(s), s=>states.push(s));
const mesh = scene.children[0] as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
assert.equal(canvases, 4);
assert.equal(states.at(-1).view, 'FRONT');
assert.equal(mesh.material.fog, true);
assert.equal(mesh.material.alphaTest, .05);
assert.equal(mesh.material.depthWrite, false);
assert.equal(mesh.material.map!.colorSpace, THREE.SRGBColorSpace);
const maps = new Set();
for (const [x,z,view] of [[0,10,'FRONT'],[-8,2,'RIGHT'],[0,-6,'BACK'],[8,2,'LEFT'],[0,10,'FRONT']] as const) {
  camera.position.set(x,3.2,z);
  camera.rotation.set(.8,.3,.2);
  manager.update(.1);
  assert.equal(states.at(-1).view, view);
  assert.equal(mesh.rotation.x,0);
  assert.equal(mesh.rotation.z,0);
  const normal = new THREE.Vector3(0,0,1).applyQuaternion(mesh.quaternion);
  const towards = camera.position.clone().sub(mesh.position).setY(0).normalize();
  assert.ok(normal.dot(towards) > .999);
  maps.add(mesh.material.map);
}
assert.equal(maps.size,4);
const originalMap = mesh.material.map;
for(let i=0;i<120;i++) manager.update(1/60);
assert.equal(mesh.material.map,originalMap);
assert.equal(canvases,4);
camera.position.set(0,3.2,4);
manager.update(.1);
assert.equal(states.at(-1).distance,2);
assert.equal(states.at(-1).observation,'TOO CLOSE');
assert.equal(proximity.at(-1).isNearby,true);
camera.position.set(0,3.2,10); manager.update(.1);
assert.equal(proximity.at(-1).isNearby,false);
assert.deepEqual(mesh.position.toArray(),[0,3.2,2]);
camera.position.set(0,12,2); manager.update(.1);
assert.ok(mesh.quaternion.toArray().every(Number.isFinite));
let disposed = 0;
for(const map of maps) (map as THREE.Texture).addEventListener('dispose',()=>disposed++);
manager.dispose();
assert.equal(disposed,4);
assert.equal(scene.children.length,0);
console.log('PASS: four views, orbit, hysteresis, upright plane, textures reused/disposed, distance/proximity/fog');
