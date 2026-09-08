import type { DirectionalAssetSource } from '../SpeciesDefinition';
import { DIRECTIONAL_LABELS, DIRECTIONAL_VIEWS, type DirectionalView } from '../../creatures/directional/types';
import { loadDirectionalPngTextures } from '../assets/loadDirectionalPngTextures';

// Replace the eight clearly labelled temporary PNGs in place; no renderer changes required.
export const DUNKLEOSTEUS_TEXTURE_URLS = Object.fromEntries(DIRECTIONAL_VIEWS.map(view => [
  view, './assets/creatures/dunkleosteus/dunkleosteus_mid_' + DIRECTIONAL_LABELS[view].toLowerCase() + '.png',
])) as Readonly<Record<DirectionalView, string>>;

export const dunkleosteusAssets: DirectionalAssetSource = {
  id: 'dunkleosteus/png/directional-8',
  load: () => loadDirectionalPngTextures(DUNKLEOSTEUS_TEXTURE_URLS),
};
