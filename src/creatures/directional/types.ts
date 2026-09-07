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
