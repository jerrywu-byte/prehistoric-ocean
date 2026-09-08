import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import * as THREE from 'three';
import { DIRECTIONAL_VIEWS } from '../src/creatures/directional/types';
import { CreatureManager, type CreatureDebugState } from '../src/creatures/CreatureManager';
import { SpeciesRegistry, getSpeciesById } from '../src/species/speciesRegistry';
import { dunkleosteusSpecies } from '../src/species/dunkleosteus/dunkleosteusSpecies';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { DUNKLEOSTEUS_TEXTURE_URLS } from '../src/species/dunkleosteus/dunkleosteusAssets';
import { AMMONITE_SPAWN, DUNKLEOSTEUS_SPAWN } from '../src/world/creatureSpawns';

assert.equal(getSpeciesById('dunkleosteus'), dunkleosteusSpecies);
assert.equal(dunkleosteusSpecies.rendering.mode, 'directional_8');
assert.equal(dunkleosteusSpecies.rendering.billboard, 'cameraFacing');
assert.deepEqual(dunkleosteusSpecies.rendering.horizontalDirectionTransition,
  ammoniteSpecies.rendering.horizontalDirectionTransition);
const urls = Object.values(DUNKLEOSTEUS_TEXTURE_URLS);
assert.deepEqual(Object.keys(DUNKLEOSTEUS_TEXTURE_URLS), DIRECTIONAL_VIEWS);
assert.equal(new Set(urls).size, 8);
assert.deepEqual((await readdir('public/assets/creatures/dunkleosteus')).sort(),
  urls.map(url => url.split('/').at(-1)!).sort());
for (const url of urls) {
  const bytes = await readFile('public/' + url.replace(/^\.\//, ''));
  assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
}

// Exercise the real TextureLoader using controllable image completion events.
const pending: Array<{ url: string; finish: (success: boolean) => void }> = [];
class ImageAdapter {
  listeners = new Map<string, () => void>();
  addEventListener(type: string, fn: () => void) { this.listeners.set(type, fn); }
  removeEventListener(type: string) { this.listeners.delete(type); }
  set src(url: string) {
    pending.push({ url, finish: success => this.listeners.get(success ? 'load' : 'error')?.call(this) });
  }
}
Object.assign(globalThis, { document: { createElementNS: () => new ImageAdapter() } });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const originalDispose = THREE.Texture.prototype.dispose;
const disposals = new Map<THREE.Texture, number>();
THREE.Texture.prototype.dispose = function () {
  disposals.set(this, (disposals.get(this) ?? 0) + 1);
  originalDispose.call(this);
};
const staticSpecies = {
  ...dunkleosteusSpecies,
  movement: { ...dunkleosteusSpecies.movement, enabled: false,
    ambientMotion: { ...dunkleosteusSpecies.movement.ambientMotion, enabled: false } },
};
try {
  for (const missing of [null, ...urls, 'late']) {
    pending.length = 0; disposals.clear();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const home = new THREE.Vector3(...DUNKLEOSTEUS_SPAWN.position);
    camera.position.copy(home).add(new THREE.Vector3(0,0,8));
    camera.lookAt(home);
    let debug!: CreatureDebugState;
    const manager = new CreatureManager(scene, camera, () => {}, state => debug = state,
      new SpeciesRegistry([staticSpecies]));
    const creature = manager.spawnCreature(DUNKLEOSTEUS_SPAWN);
    assert.equal(creature.species, staticSpecies);
    assert.equal(scene.children[0], creature.object3d);
    assert.deepEqual(pending.map(p => p.url), urls);
    assert.equal(creature.textureStatus, 'LOADING');
    for (const p of pending.slice(0,7)) p.finish(p.url !== missing);
    await tick();
    assert.equal(creature.object3d.material.map, null);
    if (missing === 'late') manager.dispose();
    pending[7].finish(pending[7].url !== missing);
    await tick();
    if (missing !== 'late') {
      assert.equal(creature.textureStatus, missing === null ? 'YES' : 'ERROR');
      assert.equal(creature.object3d.visible, true);
      assert.equal(debug.speciesId, 'dunkleosteus');
      assert.equal(debug.creatureName, '鄧氏魚 / Dunkleosteus');
      assert.equal(debug.textureMode, 'DIRECTIONAL_8');
      if (missing === null) {
        assert.equal(creature.object3d.material.map!.colorSpace, THREE.SRGBColorSpace);
        const scale = creature.object3d.scale.clone();
        // Every horizontal sector uses the same heading convention and transition class.
        for (let index = 0; index < 8; index++) {
          const angle = index * Math.PI / 4;
          camera.position.set(home.x - Math.sin(angle)*8, home.y, home.z + Math.cos(angle)*8);
          manager.update(.02);
          assert.equal(creature.horizontalTransition.target, DIRECTIONAL_VIEWS[index]);
          manager.update(.14);
          assert.equal(creature.view, DIRECTIONAL_VIEWS[index]);
          assert.equal(creature.horizontalTransition.active, false);
          assert.equal(creature.object3d.material.opacity, 1);
          assert.equal(creature.secondaryObject3d.visible, false);
          assert.equal(creature.secondaryObject3d.material.opacity, 0);
          assert.equal(creature.currentPitchLayer, null);
          assert.deepEqual(creature.object3d.scale, scale);
          assert.equal(creature.object3d.rotation.z, 0);
        }
        // Stationary camera + changing heading selects a new target and fades with time.
        camera.position.copy(home).add(new THREE.Vector3(0,0,8));
        manager.update(.2);
        creature.headingRadians += Math.PI/4;
        manager.update(.02);
        assert.equal(creature.horizontalTransition.target, 'frontLeft');
        assert.equal(creature.horizontalTransition.active, true);
        assert.ok(creature.secondaryObject3d.material.opacity > 0);
        manager.update(.14);
        assert.equal(creature.view, 'frontLeft');
        assert.equal(creature.secondaryObject3d.visible, false);
        // Above/below observations retain a horizontal view, never select a pitch layer.
        for (const dy of [-8, 8]) {
          camera.position.y = home.y + dy;
          manager.update(.2);
          assert.equal(creature.currentPitchLayer, null);
          assert.equal(creature.view, 'frontLeft');
          const normal = new THREE.Vector3(0,0,1).applyQuaternion(creature.object3d.quaternion);
          assert.ok(normal.dot(camera.position.clone().sub(home).normalize()) > .99999);
          assert.equal(creature.object3d.rotation.z, 0);
        }
      } else {
        assert.equal(creature.object3d.material.map, null);
        assert.equal(creature.object3d.material.color.getHex(), 0xffa500);
        for (let i=0;i<60;i++) manager.update(1/60);
        assert.equal(creature.secondaryObject3d.visible, false);
      }
      manager.dispose(); manager.dispose();
    }
    assert.equal(disposals.size, 8);
    assert.ok([...disposals.values()].every(count => count === 1));
  }

  // Both actual species coexist; debug follows the crosshair even when the other is closer.
  pending.length=0; disposals.clear();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0,3.2,10);
  let debug!: CreatureDebugState;
  let proximityName = '';
  const manager = new CreatureManager(scene,camera,state => { proximityName=state.name; },state => debug=state);
  const ammonite = manager.spawnCreature(AMMONITE_SPAWN);
  const fish = manager.spawnCreature(DUNKLEOSTEUS_SPAWN);
  assert.equal(pending.length,32);
  for (const p of pending) p.finish(true);
  await tick();
  camera.lookAt(fish.object3d.position);
  manager.update(.1);
  assert.equal(debug.count,2);
  assert.equal(debug.speciesId,'dunkleosteus');
  camera.lookAt(ammonite.object3d.position);
  manager.update(.1);
  assert.equal(debug.speciesId,'ammonite');
  camera.position.copy(fish.object3d.position).add(new THREE.Vector3(0,0,2));
  camera.lookAt(fish.object3d.position);
  manager.update(.1);
  assert.equal(proximityName,'鄧氏魚');
  // Real movement profile runs through shared locomotion without adding pitch locomotion.
  for(let i=0;i<3600;i++) manager.update(1/60);
  assert.ok(fish.locomotionPosition.distanceTo(fish.anchorPosition) > .1);
  assert.ok(Math.hypot(fish.locomotionPosition.x-7,fish.locomotionPosition.z+6) <= 3.5);
  assert.equal(fish.locomotionPosition.y,3.2);
  assert.ok(fish.locomotion!.speed <= .22);
  assert.equal(fish.currentPitchLayer,null);
  assert.equal(ammonite.species,ammoniteSpecies);
  manager.dispose();
  assert.equal(disposals.size,32);
  assert.ok([...disposals.values()].every(count => count===1));
} finally { THREE.Texture.prototype.dispose=originalDispose; }
console.log('PASS: Dunkleosteus registry, eight PNGs, shared heading/fade, camera-facing, each missing asset fallback, late disposal, two-species debug/proximity and roaming');
