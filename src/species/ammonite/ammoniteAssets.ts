import type { DirectionalAssetSource } from '../SpeciesDefinition';
import type { DirectionalTextureSet } from '../../creatures/directional/types';
import { createDirectionalAmmoniteTextures } from './createDirectionalAmmoniteTextures';

export function getAmmoniteDirectionalTextures(): DirectionalTextureSet {
  return createDirectionalAmmoniteTextures();
}

export const ammoniteAssets: DirectionalAssetSource = {
  id: 'ammonite/canvas/directional-8',
  load: getAmmoniteDirectionalTextures,
};
