import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { AMMONITE_TEXTURE_URLS, getAmmoniteDirectionalTextures } from '../src/species/ammonite/ammoniteAssets';
import { CreatureManager } from '../src/creatures/CreatureManager';
import { AMMONITE_SPAWN } from '../src/world/creatureSpawns';
import { DIRECTIONAL_VIEWS } from '../src/creatures/directional/types';

// Controlled image events exercise TextureLoader without claiming real PNG decoding.
const pending: Array<{url: string; finish: (success: boolean) => void}> = [];
class ImageAdapter {
  listeners = new Map<string, () => void>();
  addEventListener(type: string, fn: () => void) { this.listeners.set(type, fn); }
  removeEventListener(type: string) { this.listeners.delete(type); }
  set src(url: string) {
    pending.push({url, finish: success => this.listeners.get(success ? 'load' : 'error')?.call(this)});
  }
}
Object.assign(globalThis, {document: {createElementNS: () => new ImageAdapter()}});
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const originalDispose = THREE.Texture.prototype.dispose;
const disposals = new Map<THREE.Texture, number>();
THREE.Texture.prototype.dispose = function () {
  disposals.set(this, (disposals.get(this) ?? 0) + 1);
  originalDispose.call(this);
};
try {
  // Each missing direction, full success, and disposal before all requests finish.
  for (const missing of [null, ...DIRECTIONAL_VIEWS, 'late'] as const) {
    pending.length = 0; disposals.clear();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 3.2, 10);
    const states: any[] = [];
    const manager = new CreatureManager(scene, camera, () => {}, state => states.push(state));
    const creature = manager.spawnCreature(AMMONITE_SPAWN);
    const mesh = creature.object3d;
    assert.equal(pending.length, 8);
    assert.deepEqual(pending.map(p => p.url), Object.values(AMMONITE_TEXTURE_URLS));
    assert.equal(states.at(-1).textureStatus, 'LOADING');
    assert.equal(mesh.material.map, null);
    // All-or-nothing: seven loaded views must not replace the fallback.
    for (const request of pending.slice(0, 7)) {
      request.finish(missing === null || missing === 'late' || request.url !== AMMONITE_TEXTURE_URLS[missing]);
    }
    await tick();
    assert.equal(mesh.material.map, null);
    if (missing === 'late') manager.dispose();
    pending[7].finish(missing === null || missing === 'late' || pending[7].url !== AMMONITE_TEXTURE_URLS[missing]);
    await tick();
    if (missing !== 'late') {
      assert.equal(states.at(-1).textureStatus, missing === null ? 'YES' : 'ERROR');
      assert.equal(states.at(-1).materialMode, missing === null ? 'TEXTURE' : 'FALLBACK');
      assert.equal(states.at(-1).speciesId, 'ammonite');
      assert.equal(states.at(-1).creatureName, '菊石 / Ammonite');
      assert.equal(states.at(-1).textureMode, 'DIRECTIONAL_8');
      assert.equal(mesh.visible, true);
      if (missing === null) {
        assert.equal(mesh.material.map!.colorSpace, THREE.SRGBColorSpace);
        assert.equal(mesh.material.transparent, true);
        assert.equal(mesh.material.alphaTest, .05);
        assert.equal(mesh.material.depthTest, true);
        assert.equal(mesh.material.depthWrite, false);
        assert.equal(mesh.material.fog, true);
        assert.equal(mesh.material.toneMapped, false);
        assert.equal(mesh.material.side, THREE.DoubleSide);
      } else {
        assert.equal(mesh.material.color.getHex(), 0xffa500);
        assert.equal(mesh.material.map, null);
      }
      for (let i=0;i<120;i++) manager.update(1/60);
      assert.deepEqual(mesh.position.toArray(), [0,3.2,2]);
      manager.dispose();
    }
    assert.equal(disposals.size, 8);
    assert.ok([...disposals.values()].every(count => count === 1));
  }
} finally { THREE.Texture.prototype.dispose = originalDispose; }
console.log('PASS: atomic eight-PNG provider, each missing direction fallback, debug, materials, disposal and late completion');


// Read the supplied files through the real TextureLoader's ImageLoader callbacks.
// This verifies URLs/bytes; actual browser decoding/rendering is a separate check.
class FileImage extends ImageAdapter {
  set src(url: string) {
    void readFile('public/' + url.replace(/^\.\//, '')).then(bytes => {
      assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10]);
      this.listeners.get('load')?.call(this);
    }).catch(error => {
      console.error('PNG file verification failed', url, error);
      this.listeners.get('error')?.call(this);
    });
  }
}
Object.assign(globalThis, {document: {createElementNS: () => new FileImage()}});
const actual = await getAmmoniteDirectionalTextures();
assert.equal(Object.keys(actual).length, 8);
assert.equal(new Set(Object.values(actual)).size, 8);
for (const texture of Object.values(actual)) {
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  texture.dispose();
}
console.log('PASS: eight supplied PNG paths/signatures loaded through TextureLoader file-event adapter');
