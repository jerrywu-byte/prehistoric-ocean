import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { CreatureManager } from '../src/creatures/CreatureManager';
import { ammoniteSpecies } from '../src/species/ammonite/ammoniteSpecies';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { SpeciesRegistry } from '../src/species/speciesRegistry';
import { DIRECTIONAL_VIEWS, type DirectionalTextureSet } from '../src/creatures/directional/types';

// Exercise the real TextureLoader/ImageLoader with a minimal image event adapter.
// File errors behave like browser image errors; GPU rendering requires Chrome.
class TestImage {
  listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, fn: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: () => void) { this.listeners.get(type)?.delete(fn); }
  set src(url: string) {
    readFile('public/' + url.replace(/^\.\//, '')).then(
      (bytes) => { assert.equal(bytes.subarray(1, 4).toString(), 'PNG'); this.emit('load'); },
      () => this.emit('error'),
    );
  }
  emit(type: string) { for (const fn of this.listeners.get(type) ?? []) fn.call(this); }
}
Object.assign(globalThis, { document: { createElementNS: () => new TestImage() } });
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
async function check(url: string, success: boolean) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, 1, .1, 500);
  camera.position.set(0, 3.2, 10);
  const states: any[] = [];
  const registry = new SpeciesRegistry([{...ammoniteSpecies,
    rendering: {...ammoniteSpecies.rendering, mode: 'directional_8', billboard: 'cylindrical'},
    movement: {...ammoniteSpecies.movement, enabled: false, ambientMotion: {...ammoniteSpecies.movement.ambientMotion, enabled: false}},
    directionalAssets: {id: url, load: async () => {
      const texture = await new THREE.TextureLoader().loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      return Object.fromEntries(DIRECTIONAL_VIEWS.map(view => [view, texture])) as DirectionalTextureSet;
    }},
  }]);
  const manager = new CreatureManager(scene, camera, () => {}, state => states.push(state), registry);
  manager.spawnCreature(AMMONITE_SPAWN);
  const mesh = scene.children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  assert.equal(states.at(-1).textureStatus, 'LOADING');
  assert.equal(mesh.material.map, null);
  assert.equal(mesh.material.color.getHex(), 0xffa500);
  for (let i=0; i<100 && states.at(-1).textureStatus === 'LOADING'; i++) await tick();
  assert.equal(states.at(-1).textureStatus, success ? 'YES' : 'ERROR');
  assert.equal(states.at(-1).materialMode, success ? 'TEXTURE' : 'FALLBACK');
  assert.equal(states.at(-1).count, 1);
  assert.equal(mesh.visible, true);
  assert.deepEqual(mesh.position.toArray(), [0,3.2,2]);
  assert.deepEqual(mesh.scale.toArray(), [3.2,3.2,1]);
  assert.equal(mesh.material.transparent, success);
  assert.equal(mesh.material.depthWrite, !success);
  assert.equal(mesh.material.depthTest, true);
  assert.equal(mesh.material.side, THREE.DoubleSide);
  assert.equal(mesh.material.fog, true);
  if (success) {
    assert.equal(mesh.material.color.getHex(), 0xffffff);
    assert.equal(mesh.material.map!.colorSpace, THREE.SRGBColorSpace);
    assert.equal(mesh.material.alphaTest, .05);
  } else assert.equal(mesh.material.color.getHex(), 0xffa500);
  for (let i=0;i<120;i++) manager.update(1/60);
  assert.deepEqual(mesh.position.toArray(), [0,3.2,2]);
  manager.dispose();
  assert.equal(scene.children.length, 0);
  console.log(success ? 'PASS: loading -> texture' : 'PASS: missing URL -> fallback; update continues');
}
await check('./assets/creatures/texture-test-creature.png', true);
await check('./assets/creatures/intentionally-missing.png', false);
