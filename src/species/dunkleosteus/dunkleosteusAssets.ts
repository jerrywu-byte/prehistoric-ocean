import type { DirectionalAssetSource } from '../SpeciesDefinition';
import {
  DIRECTIONAL_16_LABELS,
  DIRECTIONAL_16_VIEWS,
  DIRECTIONAL_VIEWS,
  type DirectionalView16,
} from '../../creatures/directional/types';
import { loadDirectionalPngTextures } from '../assets/loadDirectionalPngTextures';

// Replace the eight clearly labelled temporary PNGs in place; no renderer changes required.
export const DUNKLEOSTEUS_DIRECTIONAL_MODE: 'directional_8' | 'directional_16' = 'directional_16';

export const DUNKLEOSTEUS_TEXTURE_URLS = Object.fromEntries(DIRECTIONAL_16_VIEWS.map(view => [
  view, './assets/creatures/dunkleosteus/dunkleosteus_mid_' + DIRECTIONAL_16_LABELS[view].toLowerCase() + '.png',
])) as Readonly<Record<DirectionalView16, string>>;

export const DUNKLEOSTEUS_INTERMEDIATE_FALLBACKS: Readonly<Partial<Record<DirectionalView16, DirectionalView16>>> = {
  frontFrontRight: 'front', rightFront: 'frontRight', rightBack: 'right', backBackRight: 'backRight',
  backBackLeft: 'back', leftBack: 'backLeft', leftFront: 'left', frontFrontLeft: 'frontLeft',
};

export const dunkleosteusAssets: DirectionalAssetSource = {
  id: 'dunkleosteus/png/' + DUNKLEOSTEUS_DIRECTIONAL_MODE.replace('_', '-'),
  load: () => DUNKLEOSTEUS_DIRECTIONAL_MODE === 'directional_16'
    ? loadDirectionalPngTextures(DUNKLEOSTEUS_TEXTURE_URLS, DIRECTIONAL_16_VIEWS, DUNKLEOSTEUS_INTERMEDIATE_FALLBACKS)
    : loadDirectionalPngTextures(
        Object.fromEntries(DIRECTIONAL_VIEWS.map(view => [view, DUNKLEOSTEUS_TEXTURE_URLS[view]])),
        DIRECTIONAL_VIEWS,
      ),
};
