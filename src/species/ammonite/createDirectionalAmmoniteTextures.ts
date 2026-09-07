import * as THREE from 'three';
import { DIRECTIONAL_VIEWS, type DirectionalView } from '../../creatures/directional/getDirectionalView';

import type { DirectionalTextureSet } from '../../creatures/directional/types';

const VIEW_ANGLES: Record<DirectionalView, number> = {
  front: 0, frontRight: 45, right: 90, backRight: 135,
  back: 180, backLeft: -135, left: -90, frontLeft: -45,
};

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawShell(ctx: CanvasRenderingContext2D, sideAmount: number, rear: boolean): void {
  const width = 0.47 + 0.53 * sideAmount;
  // Layered rounded rim gives the compressed shell a visible thickness.
  ellipse(ctx, 228, 135, 111 * width + 12, 109, '#574331');
  ellipse(ctx, 224, 133, 109 * width + 8, 107, '#917452');
  ellipse(ctx, 219, 130, 105 * width + 5, 103, '#b99a6c');
  ctx.save();
  ctx.translate(216, 129);
  ctx.scale(width, 1);
  ellipse(ctx, 0, 0, 102, 101, '#cfb889');
  ellipse(ctx, -5, -7, 94, 92, '#d9c698');

  // Fine radial ribs follow the same shell across all eight views.
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI * 2 / 48;
    ctx.strokeStyle = i % 3 === 0 ? '#94744e' : '#b29668';
    ctx.lineWidth = i % 3 === 0 ? 2.3 : 1.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 78, Math.sin(a) * 77);
    ctx.quadraticCurveTo(Math.cos(a + .035) * 94, Math.sin(a + .035) * 94,
      Math.cos(a + .07) * 102, Math.sin(a + .07) * 101);
    ctx.stroke();
  }
  // Spiral whorls are strongest on the flanks; a rear edge view hides them.
  if (!rear || sideAmount > .1) {
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const t = i / 240;
      const a = -Math.PI / 2 + t * Math.PI * 5.4;
      const r = 4 * Math.exp(t * Math.log(23));
      const x = r * Math.cos(a), y = r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#73573b'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = '#ad8857'; ctx.lineWidth = 3; ctx.stroke();
    ellipse(ctx, 0, 0, 5, 5, '#71543a');
  } else {
    ctx.strokeStyle = '#ad8857'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -96); ctx.quadraticCurveTo(19, 0, 0, 96); ctx.stroke();
  }
  ctx.restore();
}

function drawSoftBody(ctx: CanvasRenderingContext2D, sideAmount: number, rear: boolean): void {
  const x = 224 + 70 * sideAmount;
  const y = 211;
  // Dark aperture surrounded by the thick shell lip.
  ellipse(ctx, x, y - 7, 26, 32, '#a58960');
  ellipse(ctx, x + 3, y - 3, 21, 27, '#3b302a');
  ellipse(ctx, x + 9 * sideAmount, y + 5, 16, 21, '#987c69');
  const count = rear ? 3 : 9;
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) / Math.max(1, (count - 1) / 2);
    const startX = x + 8 * sideAmount + spread * 9;
    const startY = y + 12;
    const endX = x + sideAmount * (rear ? 57 : 128) + spread * (1 - sideAmount * .6) * 62;
    const endY = y + 43 + Math.cos(i * 1.7) * 16 + spread * 13;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + sideAmount * 29 + spread * 20, startY + 28,
      endX - sideAmount * 26 - spread * 8, endY + 16, endX, endY);
    ctx.strokeStyle = '#675049'; ctx.lineWidth = 7 - Math.abs(spread) * 2; ctx.stroke();
    ctx.strokeStyle = '#c5a18a'; ctx.lineWidth = 3 - Math.abs(spread); ctx.stroke();
  }
  if (!rear) {
    ellipse(ctx, x + 12, y + 1, 3.5, 4, '#231e1b');
    if (sideAmount < .2) ellipse(ctx, x - 12, y + 1, 3.5, 4, '#231e1b');
  }
}

// Stylized reconstruction, not a species-specific anatomical reconstruction.
// The shared shell proportions keep all views aligned; rear soft parts are
// drawn first so the shell naturally occludes the opening and arms.
export function createDirectionalAmmoniteTextures(): DirectionalTextureSet {
  const textures = {} as Record<DirectionalView, THREE.CanvasTexture>;
  try {
    for (const view of DIRECTIONAL_VIEWS) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Ammonite textures require Canvas 2D');
      const angle = VIEW_ANGLES[view];
      const sideAmount = Math.abs(Math.sin(angle * Math.PI / 180));
      const rear = Math.abs(angle) > 90;
      ctx.save();
      if (angle < 0) { ctx.translate(512, 0); ctx.scale(-1, 1); }
      // Center narrow front/back views without changing world position/scale.
      ctx.translate(32 * (1 - sideAmount), 0);
      if (rear && sideAmount > .1) drawSoftBody(ctx, sideAmount, true);
      drawShell(ctx, sideAmount, rear);
      if (!rear) drawSoftBody(ctx, sideAmount, false);
      ctx.restore();
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures[view] = texture;
    }
    return textures;
  } catch (error) {
    for (const texture of Object.values(textures)) texture.dispose();
    throw error;
  }
}
