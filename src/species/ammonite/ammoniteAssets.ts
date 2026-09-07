import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import type { DirectionalAssetSource } from '../SpeciesDefinition';
import { DIRECTIONAL_VIEWS, type DirectionalTextureSet, type DirectionalView } from '../../creatures/directional/types';

// Relative URLs preserve Vite's base: './' and GitHub Pages project subpaths.
export const AMMONITE_TEXTURE_URLS: Readonly<Record<DirectionalView, string>> = {
  front: './assets/creatures/ammonite/ammonite_front.png',
  frontRight: './assets/creatures/ammonite/ammonite_front_right.png',
  right: './assets/creatures/ammonite/ammonite_right.png',
  backRight: './assets/creatures/ammonite/ammonite_back_right.png',
  back: './assets/creatures/ammonite/ammonite_back.png',
  backLeft: './assets/creatures/ammonite/ammonite_back_left.png',
  left: './assets/creatures/ammonite/ammonite_left.png',
  frontLeft: './assets/creatures/ammonite/ammonite_front_left.png',
};

export async function getAmmoniteDirectionalTextures(): Promise<DirectionalTextureSet> {
  const loader = new TextureLoader();
  const owned: Texture[] = [];
  const textures = {} as Record<DirectionalView, Texture>;
  const results = await Promise.allSettled(DIRECTIONAL_VIEWS.map(view =>
    new Promise<void>((resolve, reject) => {
      const url = AMMONITE_TEXTURE_URLS[view];
      const texture = loader.load(url, loaded => {
        loaded.colorSpace = SRGBColorSpace;
        textures[view] = loaded;
        resolve();
      }, undefined, cause => {
        reject(new Error('Ammonite texture failed to load: ' + url, { cause }));
      });
      // TextureLoader also allocates a texture for a failed image request.
      owned.push(texture);
    }),
  ));
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
  id: 'ammonite/png/directional-8',
  load: getAmmoniteDirectionalTextures,
};
