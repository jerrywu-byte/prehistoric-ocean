import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import {
  DIRECTIONAL_VIEWS,
  setMissingDirectionalViews,
  type HorizontalDirectionalTextureSet,
  type HorizontalDirectionalView,
} from '../../creatures/directional/types';

// An owned, complete eight-view set. Creature handles rejection with its normal fallback.
export async function loadDirectionalPngTextures(
  urls: Readonly<Record<string, string>>,
  views: readonly HorizontalDirectionalView[] = DIRECTIONAL_VIEWS,
  fallbackViews: Readonly<Partial<Record<HorizontalDirectionalView, HorizontalDirectionalView>>> = {},
): Promise<HorizontalDirectionalTextureSet> {
  const loader = new TextureLoader();
  const owned: Texture[] = [];
  const textures = {} as Record<HorizontalDirectionalView, Texture>;
  const results = await Promise.allSettled(views.map(view => new Promise<void>((resolve, reject) => {
    const url = urls[view];
    owned.push(loader.load(url, loaded => {
      loaded.colorSpace = SRGBColorSpace;
      textures[view] = loaded;
      resolve();
    }, undefined, cause => reject(new Error('Directional texture failed to load: ' + url, { cause }))));
  })));
  const missing = views.filter((_, index) => results[index].status === 'rejected');
  const requiredFailure = missing.find(view => fallbackViews[view] === undefined);
  if (requiredFailure !== undefined) {
    for (const texture of owned) texture.dispose();
    const failed = results[views.indexOf(requiredFailure)];
    throw failed.status === 'rejected' ? failed.reason : new Error('Required directional texture missing');
  }
  for (const view of missing) {
    owned[views.indexOf(view)].dispose();
    textures[view] = textures[fallbackViews[view]!];
  }
  setMissingDirectionalViews(textures, missing);
  return textures;
}
