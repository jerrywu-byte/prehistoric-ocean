import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import type { DirectionalAssetSource } from '../SpeciesDefinition';
import { DIRECTIONAL_VIEWS, type DirectionalView } from '../../creatures/directional/types';

import { PITCH_LAYERS, type PitchDirectionalTextureSet, type PitchLayer } from '../../creatures/directional/pitchLayers';
import { DIRECTIONAL_LABELS } from '../../creatures/directional/types';

// Built once. Relative URLs preserve Vite's './' base and Pages project subpaths.
export const AMMONITE_TEXTURE_URLS = Object.fromEntries(PITCH_LAYERS.map(layer => [
  layer, Object.fromEntries(DIRECTIONAL_VIEWS.map(view => [
    view, './assets/creatures/ammonite/ammonite_' + layer + '_' + DIRECTIONAL_LABELS[view].toLowerCase() + '.png',
  ])),
])) as Readonly<Record<PitchLayer, Readonly<Record<DirectionalView, string>>>>;

export async function getAmmoniteDirectionalTextures(): Promise<PitchDirectionalTextureSet> {
  const loader = new TextureLoader();
  const owned: Texture[] = [];
  const textures = { top: {}, mid: {}, bottom: {} } as Record<PitchLayer, Record<DirectionalView, Texture>>;
  const results = await Promise.allSettled(PITCH_LAYERS.flatMap(layer => DIRECTIONAL_VIEWS.map(view =>
    new Promise<void>((resolve, reject) => {
      const url = AMMONITE_TEXTURE_URLS[layer][view];
      const texture = loader.load(url, loaded => {
        loaded.colorSpace = SRGBColorSpace;
        textures[layer][view] = loaded;
        resolve();
      }, undefined, cause => {
        reject(new Error('Ammonite texture failed to load: ' + url, { cause }));
      });
      // TextureLoader also allocates a texture for a failed image request.
      owned.push(texture);
    }),
  )));
  const failure = results.find(result => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    // Wait for all requests, then release both successful and failed textures.
    // Never expose a partial set; Creature keeps its existing orange fallback.
    for (const texture of owned) texture.dispose();
    throw failure.reason;
  }
  // Ownership transfers to Creature, including disposal after a late resolution.
  return textures;
}

export const ammoniteAssets: DirectionalAssetSource = {
  id: 'ammonite/png/pitch-directional-8x3',
  load: getAmmoniteDirectionalTextures,
};
