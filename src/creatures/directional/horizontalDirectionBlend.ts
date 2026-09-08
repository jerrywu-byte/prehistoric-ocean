import { DIRECTIONAL_VIEWS, type DirectionalView } from './types';
import { wrapAngle } from './getDirectionalView';

const TAU = Math.PI * 2;
const SECTOR_RADIANS = TAU / DIRECTIONAL_VIEWS.length;

export interface HorizontalDirectionBlendState {
  readonly primaryView: DirectionalView;
  readonly secondaryView: DirectionalView | null;
  readonly blend: number;
  readonly boundaryAngle: number | null;
}

export function smoothstep01(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function viewAt(index: number): DirectionalView {
  const count = DIRECTIONAL_VIEWS.length;
  return DIRECTIONAL_VIEWS[((index % count) + count) % count];
}

export function getHorizontalDirectionBlend(
  relativeAngle: number,
  windowDegrees: number,
): HorizontalDirectionBlendState {
  const windowRadians = Math.max(0, Math.min(SECTOR_RADIANS, windowDegrees * Math.PI / 180));
  const coordinate = wrapAngle(relativeAngle) / SECTOR_RADIANS;
  const lowerIndex = Math.floor(coordinate);
  const sectorProgress = coordinate - lowerIndex;
  const distanceFromBoundary = sectorProgress - 0.5;
  const halfWindowProgress = windowRadians / SECTOR_RADIANS / 2;

  if (halfWindowProgress > 0 && Math.abs(distanceFromBoundary) < halfWindowProgress) {
    const linearBlend = (distanceFromBoundary + halfWindowProgress) / (halfWindowProgress * 2);
    return {
      primaryView: viewAt(lowerIndex),
      secondaryView: viewAt(lowerIndex + 1),
      blend: smoothstep01(linearBlend),
      boundaryAngle: wrapAngle((lowerIndex + 0.5) * SECTOR_RADIANS),
    };
  }

  return {
    primaryView: viewAt(Math.round(coordinate)),
    secondaryView: null,
    blend: 0,
    boundaryAngle: null,
  };
}
