import { DoubleSide } from 'three';
import type { CreatureSpeciesDefinition } from '../SpeciesDefinition';
import { ammoniteAssets } from './ammoniteAssets';

export const ammoniteSpecies: CreatureSpeciesDefinition = {
  id: 'ammonite',
  name: { zhTW: '菊石', en: 'Ammonite' },
  scientificName: 'Ammonoidea',
  directionalAssets: ammoniteAssets,
  defaultScale: { width: 3.2, height: 2 },
  rendering: {
    mode: 'directional_8',
    billboard: 'cylindrical',
    fallbackColor: 0xffa500,
    transparent: true,
    alphaTest: 0.05,
    side: DoubleSide,
    depthTest: true,
    depthWrite: false,
    fog: true,
    toneMapped: false,
  },
  orientation: { defaultHeadingDegrees: 90, directionalHysteresisDegrees: 5 },
  interaction: { interactionDistance: 6, minimumObservationDistance: 2.25 },
  movement: { enabled: false },
  animation: { enabled: false, framesPerDirection: 1 },
  behaviorProfile: 'gentle_drifter',
  spawnDefaults: { scaleMultiplier: 1 },
};
