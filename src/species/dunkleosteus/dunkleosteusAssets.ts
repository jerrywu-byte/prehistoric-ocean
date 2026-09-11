import type { DirectionalAssetSource } from '../SpeciesDefinition';
import {
  DIRECTIONAL_16_VIEWS,
  type DirectionalTextureSet16,
  type DirectionalView16,
} from '../../creatures/directional/types';
import { PITCH_LAYERS, type PitchDirectionalTextureSet, type PitchLayer } from '../../creatures/directional/pitchLayers';
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

export const DUNKLEOSTEUS_PITCH_TEXTURE_URLS: Readonly<
  Record<PitchLayer, Readonly<Record<DirectionalView16, string>>>
> = {
  top: {
    front: './assets/creatures/dunkleosteus/dunkleosteus_top_front.png',
    frontFrontRight: './assets/creatures/dunkleosteus/dunkleosteus_top_front_front_right.png',
    frontRight: './assets/creatures/dunkleosteus/dunkleosteus_top_front_right.png',
    rightFront: './assets/creatures/dunkleosteus/dunkleosteus_top_right_front.png',
    right: './assets/creatures/dunkleosteus/dunkleosteus_top_right.png',
    rightBack: './assets/creatures/dunkleosteus/dunkleosteus_top_right_back.png',
    backRight: './assets/creatures/dunkleosteus/dunkleosteus_top_back_right.png',
    backBackRight: './assets/creatures/dunkleosteus/dunkleosteus_top_back_back_right.png',
    back: './assets/creatures/dunkleosteus/dunkleosteus_top_back.png',
    backBackLeft: './assets/creatures/dunkleosteus/dunkleosteus_top_back_back_left.png',
    backLeft: './assets/creatures/dunkleosteus/dunkleosteus_top_back_left.png',
    leftBack: './assets/creatures/dunkleosteus/dunkleosteus_top_left_back.png',
    left: './assets/creatures/dunkleosteus/dunkleosteus_top_left.png',
    leftFront: './assets/creatures/dunkleosteus/dunkleosteus_top_left_front.png',
    frontLeft: './assets/creatures/dunkleosteus/dunkleosteus_top_front_left.png',
    frontFrontLeft: './assets/creatures/dunkleosteus/dunkleosteus_top_front_front_left.png',
  },
  mid: DUNKLEOSTEUS_TEXTURE_URLS,
  bottom: {
    front: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front.png',
    frontFrontRight: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front_front_right.png',
    frontRight: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front_right.png',
    rightFront: './assets/creatures/dunkleosteus/dunkleosteus_bottom_right_front.png',
    right: './assets/creatures/dunkleosteus/dunkleosteus_bottom_right.png',
    rightBack: './assets/creatures/dunkleosteus/dunkleosteus_bottom_right_back.png',
    backRight: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back_right.png',
    backBackRight: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back_back_right.png',
    back: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back.png',
    backBackLeft: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back_back_left.png',
    backLeft: './assets/creatures/dunkleosteus/dunkleosteus_bottom_back_left.png',
    leftBack: './assets/creatures/dunkleosteus/dunkleosteus_bottom_left_back.png',
    left: './assets/creatures/dunkleosteus/dunkleosteus_bottom_left.png',
    leftFront: './assets/creatures/dunkleosteus/dunkleosteus_bottom_left_front.png',
    frontLeft: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front_left.png',
    frontFrontLeft: './assets/creatures/dunkleosteus/dunkleosteus_bottom_front_front_left.png',
  },
};

export async function getDunkleosteusPitchDirectionalTextures(): Promise<PitchDirectionalTextureSet> {
  const results = await Promise.allSettled(PITCH_LAYERS.map(layer =>
    loadDirectionalPngTextures(
      DUNKLEOSTEUS_PITCH_TEXTURE_URLS[layer],
      DIRECTIONAL_16_VIEWS,
    ) as Promise<DirectionalTextureSet16>,
  ));
  const failure = results.find(result => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const texture of Object.values(result.value)) texture.dispose();
      }
    }
    throw failure.reason;
  }
  return Object.fromEntries(PITCH_LAYERS.map((layer, index) => [
    layer,
    (results[index] as PromiseFulfilledResult<DirectionalTextureSet16>).value,
  ])) as PitchDirectionalTextureSet;
}

export const dunkleosteusAssets: DirectionalAssetSource = {
  id: 'dunkleosteus/png/pitch-directional-16x3',
  load: getDunkleosteusPitchDirectionalTextures,
};
