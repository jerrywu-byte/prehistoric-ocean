import * as THREE from 'three';
import { DIRECTIONAL_VIEWS, type DirectionalView } from './getDirectionalView';

export type DirectionalTextures = Record<DirectionalView, THREE.CanvasTexture>;

// Four transparent, code-drawn fixtures; no external assets or per-frame drawing.
export function createDirectionalTestTextures(): DirectionalTextures {
  const textures = {} as DirectionalTextures;
  try {
    for (const view of DIRECTIONAL_VIEWS) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Directional texture requires Canvas 2D');
      const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      const triangle = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
        ctx.closePath(); ctx.fill();
      };
      if (view === 'LEFT' || view === 'RIGHT') {
        ctx.save();
        if (view === 'LEFT') { ctx.translate(512, 0); ctx.scale(-1, 1); }
        const color = view === 'LEFT' ? '#30cbbb' : '#68b6ee';
        triangle(165, 160, 45, 85, 45, 235, color);
        triangle(210, 115, 265, 55, 310, 125, '#087c87');
        ellipse(285, 160, 170, 75, color);
        triangle(265, 155, 205, 190, 270, 210, '#087c87');
        ellipse(390, 140, 21, 21, '#ffffff');
        ellipse(396, 140, 10, 12, '#113846');
        ctx.restore();
      } else if (view === 'FRONT') {
        triangle(208, 140, 114, 190, 213, 199, '#12a999');
        triangle(304, 140, 398, 190, 299, 199, '#12a999');
        ellipse(256, 161, 69, 104, '#39dcc8');
        ellipse(222, 133, 20, 26, '#ffffff');
        ellipse(290, 133, 20, 26, '#ffffff');
        ellipse(225, 136, 10, 14, '#113846');
        ellipse(287, 136, 10, 14, '#113846');
        ellipse(256, 204, 16, 8, '#087c87');
      } else {
        ellipse(256, 151, 44, 86, '#ad8ee6');
        triangle(256, 153, 207, 242, 305, 242, '#6f53b3');
        ctx.strokeStyle = '#d4c3ff';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(256, 162); ctx.lineTo(256, 231); ctx.stroke();
      }
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(view[0], 256, 292);
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
