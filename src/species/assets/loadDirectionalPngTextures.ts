import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import { DIRECTIONAL_VIEWS, type DirectionalTextureSet, type DirectionalView } from '../../creatures/directional/types';

// An owned, complete eight-view set. Creature handles rejection with its normal fallback.
export async function loadDirectionalPngTextures(
  urls: Readonly<Record<DirectionalView, string>>,
): Promise<DirectionalTextureSet> {
  const loader = new TextureLoader();
  const owned: Texture[] = [];
  const textures = {} as Record<DirectionalView, Texture>;
  const results = await Promise.allSettled(DIRECTIONAL_VIEWS.map(view => new Promise<void>((resolve, reject) => {
    const url = urls[view];
    owned.push(loader.load(url, loaded => {
      loaded.colorSpace = SRGBColorSpace;
      textures[view] = loaded;
      resolve();
    }, undefined, cause => reject(new Error('Directional texture failed to load: ' + url, { cause }))));
  })));
  const failure = results.find(result => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    for (const texture of owned) texture.dispose();
    throw failure.reason;
  }
  return textures;
}
