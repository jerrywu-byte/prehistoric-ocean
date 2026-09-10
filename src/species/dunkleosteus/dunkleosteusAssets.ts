import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import type { DirectionalAssetSource } from '../SpeciesDefinition';
import {
  DIRECTIONAL_16_VIEWS,
  type DirectionalTextureSet16,
  type DirectionalView16,
} from '../../creatures/directional/types';
import type { PitchDirectionalTextureSet, PitchLayer } from '../../creatures/directional/pitchLayers';
import { loadDirectionalPngTextures } from '../assets/loadDirectionalPngTextures';

export const DUNKLEOSTEUS_DIRECTIONAL_MODE = 'pitch_directional_16x3' as const;

export const DUNKLEOSTEUS_TEXTURE_URLS: Readonly<Record<DirectionalView16, string>> = {
  front: './assets/creatures/dunkleosteus/dunkleosteus_mid_front.png',
  frontFrontRight: './assets/creatures/dunkleosteus/dunkleosteus_mid_front_front_right.png',
  frontRight: './assets/creatures/dunkleosteus/dunkleosteus_mid_front_right.png',
  rightFront: './assets/creatures/dunkleosteus/dunkleosteus_mid_right_front.png',
  right: './assets/creatures/dunkleosteus/dunkleosteus_mid_right.png',
  rightBack: './assets/creatures/dunkleosteus/dunkleosteus_mid_right_back.png',
  backRight: './assets/creatures/dunkleosteus/dunkleosteus_mid_back_right.png',
  backBackRight: './assets/creatures/dunkleosteus/dunkleosteus_mid_back_back_right.png',
  back: './assets/creatures/dunkleosteus/dunkleosteus_mid_back.png',
  backBackLeft: './assets/creatures/dunkleosteus/dunkleosteus_mid_back_back_left.png',
  backLeft: './assets/creatures/dunkleosteus/dunkleosteus_mid_back_left.png',
  leftBack: './assets/creatures/dunkleosteus/dunkleosteus_mid_left_back.png',
  left: './assets/creatures/dunkleosteus/dunkleosteus_mid_left.png',
  leftFront: './assets/creatures/dunkleosteus/dunkleosteus_mid_left_front.png',
  frontLeft: './assets/creatures/dunkleosteus/dunkleosteus_mid_front_left.png',
  frontFrontLeft: './assets/creatures/dunkleosteus/dunkleosteus_mid_front_front_left.png',
};

type PitchTestView = 'front' | 'right' | 'back';
const PITCH_TEST_VIEWS = ['front', 'right', 'back'] as const;
export const DUNKLEOSTEUS_PITCH_TEXTURE_URLS: Readonly<
  Record<'top' | 'bottom', Readonly<Record<PitchTestView, string>>>
> = {
  top: {
    front: './assets/creatures/dunkleosteus/dunkleosteus_top_front.png',
    right: './assets/creatures/dunkleosteus/dunkleosteus_top_right.png',
    back: './assets/creatures/dunkleosteus/dunkleosteus_top_back.png',
  },
  bottom: {
    front: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front.png',
    right: './assets/creatures/dunkleosteus/dunkleosteus_bottom_right.png',
    back: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back.png',
  },
};

export async function getDunkleosteusPitchDirectionalTextures(): Promise<PitchDirectionalTextureSet> {
  const mid = await loadDirectionalPngTextures(
    DUNKLEOSTEUS_TEXTURE_URLS,
    DIRECTIONAL_16_VIEWS,
  ) as DirectionalTextureSet16;
  const loader = new TextureLoader();
  const owned: Texture[] = [];
  const loaded = { top: {}, bottom: {} } as Record<'top' | 'bottom', Partial<Record<PitchTestView, Texture>>>;
  const requests = (['top', 'bottom'] as const).flatMap(layer => PITCH_TEST_VIEWS.map(view =>
    new Promise<void>((resolve, reject) => {
      const url = DUNKLEOSTEUS_PITCH_TEXTURE_URLS[layer][view];
      const texture = loader.load(url, result => {
        result.colorSpace = SRGBColorSpace;
        loaded[layer][view] = result;
        resolve();
      }, undefined, cause => reject(new Error('Dunkleosteus pitch texture failed to load: ' + url, { cause })));
      owned.push(texture);
    }),
  ));
  const results = await Promise.allSettled(requests);
  const failure = results.find(result => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    for (const texture of new Set([...Object.values(mid), ...owned])) texture.dispose();
    throw failure.reason;
  }
  const textures = { top: {}, mid, bottom: {} } as Record<
    PitchLayer,
    Partial<Record<DirectionalView16, Texture>>
  >;
  for (const view of DIRECTIONAL_16_VIEWS) {
    textures.top[view] = loaded.top[view as PitchTestView] ?? mid[view];
    textures.bottom[view] = loaded.bottom[view as PitchTestView] ?? mid[view];
  }
  return textures;
}

export const dunkleosteusAssets: DirectionalAssetSource = {
  id: 'dunkleosteus/png/pitch-directional-16x3-prototype',
  load: getDunkleosteusPitchDirectionalTextures,
};
