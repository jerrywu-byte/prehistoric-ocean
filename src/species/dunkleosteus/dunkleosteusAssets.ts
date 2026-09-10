import type { DirectionalAssetSource } from '../SpeciesDefinition';
import {
  DIRECTIONAL_16_VIEWS,
  type DirectionalView16,
} from '../../creatures/directional/types';
import { loadDirectionalPngTextures } from '../assets/loadDirectionalPngTextures';

// Development A/B switch. The final integration uses all sixteen explicit URLs below.
export const DUNKLEOSTEUS_DIRECTIONAL_MODE: 'directional_8' | 'directional_16' = 'directional_16';

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

export const dunkleosteusAssets: DirectionalAssetSource = {
  id: 'dunkleosteus/png/' + DUNKLEOSTEUS_DIRECTIONAL_MODE.replace('_', '-'),
  load: () => DUNKLEOSTEUS_DIRECTIONAL_MODE === 'directional_16'
    ? loadDirectionalPngTextures(DUNKLEOSTEUS_TEXTURE_URLS, DIRECTIONAL_16_VIEWS)
    : loadDirectionalPngTextures(
        {
          front: DUNKLEOSTEUS_TEXTURE_URLS.front,
          frontRight: DUNKLEOSTEUS_TEXTURE_URLS.frontRight,
          right: DUNKLEOSTEUS_TEXTURE_URLS.right,
          backRight: DUNKLEOSTEUS_TEXTURE_URLS.backRight,
          back: DUNKLEOSTEUS_TEXTURE_URLS.back,
          backLeft: DUNKLEOSTEUS_TEXTURE_URLS.backLeft,
          left: DUNKLEOSTEUS_TEXTURE_URLS.left,
          frontLeft: DUNKLEOSTEUS_TEXTURE_URLS.frontLeft,
        },
      ),
};
