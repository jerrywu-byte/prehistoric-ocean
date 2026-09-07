import * as THREE from 'three';
import { DIRECTIONAL_LABELS } from './types';
import { DIRECTIONAL_VIEWS, type DirectionalView } from './getDirectionalView';

export type DirectionalTextures = Record<DirectionalView, THREE.CanvasTexture>;

type ViewSide = 'left' | 'right';

// Each three-quarter view has a single continuous head/body contour.
// Reflection only pairs the left/right versions of this dedicated drawing.
function drawFrontThreeQuarter(ctx: CanvasRenderingContext2D, side: ViewSide): void {
  ctx.save();
  if (side === 'left') { ctx.translate(512, 0); ctx.scale(-1, 1); }

  // Small, foreshortened tail and dorsal fin behind the body.
  ctx.fillStyle = '#12a999';
  ctx.beginPath();
  ctx.moveTo(180, 158);
  ctx.bezierCurveTo(153, 144, 144, 129, 134, 119);
  ctx.quadraticCurveTo(142, 161, 134, 199);
  ctx.quadraticCurveTo(158, 181, 180, 172);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#087c87';
  ctx.beginPath();
  ctx.moveTo(216, 111); ctx.quadraticCurveTo(235, 78, 257, 66);
  ctx.quadraticCurveTo(267, 93, 284, 110);
  ctx.closePath(); ctx.fill();

  // Broad forehead flows into the back and belly without an attached head oval.
  ctx.fillStyle = '#39dcc8';
  ctx.beginPath();
  ctx.moveTo(172, 155);
  ctx.bezierCurveTo(192, 113, 224, 91, 278, 86);
  ctx.bezierCurveTo(330, 81, 369, 110, 380, 153);
  ctx.bezierCurveTo(389, 182, 367, 216, 329, 231);
  ctx.bezierCurveTo(273, 251, 210, 219, 173, 175);
  ctx.quadraticCurveTo(165, 166, 172, 155);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#087c87';
  ctx.beginPath();
  ctx.moveTo(276, 163);
  ctx.quadraticCurveTo(249, 178, 230, 197);
  ctx.quadraticCurveTo(260, 200, 281, 181);
  ctx.closePath(); ctx.fill();

  // One near eye, slightly narrower than the full side eye; no far eye.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(329, 137, 15, 21, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#113846';
  ctx.beginPath(); ctx.ellipse(334, 139, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#087c87'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(360, 180);
  ctx.quadraticCurveTo(367, 184, 373, 179); ctx.stroke();
  ctx.restore();
}

function drawRearThreeQuarter(ctx: CanvasRenderingContext2D, side: ViewSide): void {
  ctx.save();
  if (side === 'left') { ctx.translate(512, 0); ctx.scale(-1, 1); }

  ctx.fillStyle = '#087c87';
  ctx.beginPath();
  ctx.moveTo(235, 126); ctx.quadraticCurveTo(253, 84, 268, 74);
  ctx.quadraticCurveTo(274, 104, 286, 123);
  ctx.closePath(); ctx.fill();

  // A single taper: broad near caudal body, small distant head tip.
  ctx.fillStyle = '#30cbbb';
  ctx.beginPath();
  ctx.moveTo(202, 145);
  ctx.bezierCurveTo(221, 109, 258, 99, 288, 111);
  ctx.bezierCurveTo(317, 120, 341, 136, 348, 153);
  ctx.quadraticCurveTo(357, 173, 336, 184);
  ctx.bezierCurveTo(299, 204, 245, 224, 207, 191);
  ctx.quadraticCurveTo(192, 173, 202, 145);
  ctx.closePath(); ctx.fill();

  // Broad near tail overlaps the body; its lobes dominate the small head.
  ctx.fillStyle = '#087c87';
  ctx.beginPath();
  ctx.moveTo(232, 164);
  ctx.bezierCurveTo(206, 147, 177, 120, 151, 103);
  ctx.quadraticCurveTo(161, 156, 154, 178);
  ctx.quadraticCurveTo(139, 207, 145, 242);
  ctx.bezierCurveTo(178, 233, 208, 208, 235, 180);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#39dcc8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(225, 171); ctx.quadraticCurveTo(188, 159, 160, 123);
  ctx.moveTo(226, 176); ctx.quadraticCurveTo(192, 207, 157, 226);
  ctx.stroke();
  // Rear views deliberately have neither a visible eye nor a separate head.
  ctx.restore();
}

// Eight transparent, code-drawn fixtures; no external assets or per-frame drawing.
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
      if (view === 'left' || view === 'right') {
        ctx.save();
        if (view === 'left') { ctx.translate(512, 0); ctx.scale(-1, 1); }
        const color = '#39dcc8';
        triangle(165, 160, 45, 85, 45, 235, color);
        triangle(210, 115, 265, 55, 310, 125, '#087c87');
        ellipse(285, 160, 170, 75, color);
        triangle(265, 155, 205, 190, 270, 210, '#087c87');
        ellipse(390, 140, 21, 21, '#ffffff');
        ellipse(396, 140, 10, 12, '#113846');
        ctx.restore();
      } else if (view === 'frontRight' || view === 'frontLeft') {
        drawFrontThreeQuarter(ctx, view === 'frontLeft' ? 'left' : 'right');
      } else if (view === 'backRight' || view === 'backLeft') {
        drawRearThreeQuarter(ctx, view === 'backLeft' ? 'left' : 'right');
      } else if (view === 'front') {
        triangle(208, 140, 114, 190, 213, 199, '#12a999');
        triangle(304, 140, 398, 190, 299, 199, '#12a999');
        ellipse(256, 161, 69, 104, '#39dcc8');
        ellipse(222, 133, 20, 26, '#ffffff');
        ellipse(290, 133, 20, 26, '#ffffff');
        ellipse(225, 136, 10, 14, '#113846');
        ellipse(287, 136, 10, 14, '#113846');
        ellipse(256, 204, 16, 8, '#087c87');
      } else {
        ellipse(256, 151, 44, 86, '#30cbbb');
        triangle(256, 153, 207, 242, 305, 242, '#087c87');
        ctx.strokeStyle = '#39dcc8';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(256, 162); ctx.lineTo(256, 231); ctx.stroke();
      }
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(DIRECTIONAL_LABELS[view].split('_').map(part => part[0]).join(''), 256, 292);
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
