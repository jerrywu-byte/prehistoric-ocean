import { DIRECTIONAL_VIEWS, type HorizontalDirectionalView } from './types';
export { DIRECTIONAL_VIEWS, type DirectionalView } from './types';
const TAU = Math.PI * 2;

export function wrapAngle(angle: number): number {
  return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

// Heading is atan2(forwardZ, forwardX); positive relative angles are the
// creature's right side. Y is deliberately ignored for view selection.
export function getRelativeAngle(dx: number, dz: number, heading: number): number {
  return wrapAngle(Math.atan2(dz, dx) - heading);
}

export function getDirectionalView(
  angle: number,
  previous: HorizontalDirectionalView | null,
  hysteresis: number,
  views: readonly HorizontalDirectionalView[] = DIRECTIONAL_VIEWS,
): HorizontalDirectionalView {
  const sector = TAU / views.length;
  if (previous !== null) {
    const previousIndex = views.indexOf(previous);
    if (previousIndex >= 0) {
      const center = previousIndex * sector;
      if (Math.abs(wrapAngle(angle - center)) <= sector / 2 + hysteresis) return previous;
    }
  }
  const count = views.length;
  const index = ((Math.round(angle / sector) % count) + count) % count;
  return views[index];
}
