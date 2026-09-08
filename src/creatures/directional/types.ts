import type { Texture } from 'three';

export const DIRECTIONAL_VIEWS = [
  'front', 'frontRight', 'right', 'backRight',
  'back', 'backLeft', 'left', 'frontLeft',
] as const;
export type DirectionalView = typeof DIRECTIONAL_VIEWS[number];
export type DirectionalTextureSet = Readonly<Record<DirectionalView, Texture>>;
export const DIRECTIONAL_LABELS: Record<DirectionalView, string> = {
  front: 'FRONT', frontRight: 'FRONT_RIGHT', right: 'RIGHT', backRight: 'BACK_RIGHT',
  back: 'BACK', backLeft: 'BACK_LEFT', left: 'LEFT', frontLeft: 'FRONT_LEFT',
};

export const DIRECTIONAL_16_VIEWS = [
  'front', 'frontFrontRight', 'frontRight', 'rightFront',
  'right', 'rightBack', 'backRight', 'backBackRight',
  'back', 'backBackLeft', 'backLeft', 'leftBack',
  'left', 'leftFront', 'frontLeft', 'frontFrontLeft',
] as const;
export type DirectionalView16 = typeof DIRECTIONAL_16_VIEWS[number];
export type HorizontalDirectionalView = DirectionalView | DirectionalView16;
export type DirectionalTextureSet16 = Readonly<Record<DirectionalView16, Texture>>;
export type HorizontalDirectionalTextureSet = DirectionalTextureSet | DirectionalTextureSet16;

export const DIRECTIONAL_16_LABELS: Record<DirectionalView16, string> = {
  front: 'FRONT', frontFrontRight: 'FRONT_FRONT_RIGHT', frontRight: 'FRONT_RIGHT',
  rightFront: 'RIGHT_FRONT', right: 'RIGHT', rightBack: 'RIGHT_BACK',
  backRight: 'BACK_RIGHT', backBackRight: 'BACK_BACK_RIGHT', back: 'BACK',
  backBackLeft: 'BACK_BACK_LEFT', backLeft: 'BACK_LEFT', leftBack: 'LEFT_BACK',
  left: 'LEFT', leftFront: 'LEFT_FRONT', frontLeft: 'FRONT_LEFT',
  frontFrontLeft: 'FRONT_FRONT_LEFT',
};

export const getDirectionalLabel = (view: HorizontalDirectionalView): string =>
  DIRECTIONAL_16_LABELS[view as DirectionalView16] ?? DIRECTIONAL_LABELS[view as DirectionalView];

const missingViews = new WeakMap<object, readonly HorizontalDirectionalView[]>();
export function setMissingDirectionalViews(
  textures: object,
  views: readonly HorizontalDirectionalView[],
): void { missingViews.set(textures, views); }
export function getMissingDirectionalViews(textures: object): readonly HorizontalDirectionalView[] {
  return missingViews.get(textures) ?? [];
}
