// Development-only Canvas 2D fixtures. Run explicitly with @napi-rs/canvas available.
// NEVER part of build/start: replacing these PNGs with supplied artwork is persistent.
const { createCanvas } = require('@napi-rs/canvas');
const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const output = resolve(__dirname, '../public/assets/creatures/dunkleosteus');
mkdirSync(output, { recursive: true });
const views = ['front', 'front_right', 'right', 'back_right', 'back', 'back_left', 'left', 'front_left'];
for (const [index, view] of views.entries()) {
  const canvas = createCanvas(768, 384);
  const c = canvas.getContext('2d');
  const angle = index * Math.PI / 4;
  const side = Math.sin(angle) < -0.01 ? -1 : 1;
  const sideAmount = Math.abs(Math.sin(angle));
  const rear = Math.cos(angle) < -0.01;
  const headX = 384 + side * sideAmount * 205;
  const tailX = 384 - side * sideAmount * 268;
  const poly = (points, color) => {
    c.fillStyle = color; c.strokeStyle = '#193c48'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(...points[0]);
    for (const p of points.slice(1)) c.lineTo(...p);
    c.closePath(); c.fill(); c.stroke();
  };
  const tail = () => {
    const spread = rear ? 76 : 36 + sideAmount * 18;
    poly([[tailX, 171], [tailX - side * (20 + sideAmount * 44), 171 - spread],
      [tailX - side * 20, 175], [tailX - side * (20 + sideAmount * 32), 175 + spread],
      [tailX + side * 35, 182]], '#429d9d');
  };
  if (!rear) tail();
  // Long tapered body, angular armour cap, distinct tail. Deliberately schematic.
  c.fillStyle = '#49b8ad'; c.strokeStyle = '#193c48'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(384, 172, 66 + sideAmount * 213, 62, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  poly([[350,120], [384,72], [425,122]], '#328080');
  const hw = rear ? 29 + sideAmount * 30 : 66 + sideAmount * 16;
  const hh = rear ? 43 : 67;
  poly([[headX-hw,172-hh*.7], [headX-hw*.55,172-hh], [headX+hw*.6,172-hh],
    [headX+hw,172-hh*.5], [headX+hw,172+hh*.5], [headX+hw*.5,172+hh],
    [headX-hw*.6,172+hh], [headX-hw,172+hh*.5]], '#96b8b2');
  c.strokeStyle = '#193c48'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(headX-hw*.8,185); c.lineTo(headX+hw*.8,185); c.stroke();
  if (!rear) {
    const eye = x => { c.fillStyle='#112c38'; c.beginPath(); c.arc(x,148,7,0,Math.PI*2); c.fill(); };
    eye(headX + side * hw * .48);
    if (sideAmount < .1) eye(headX - hw * .48);
    poly([[headX-hw*.6,186], [headX-hw*.35,199], [headX-hw*.1,186]], '#d8d8b8');
  }
  if (rear) tail();
  c.textAlign = 'center'; c.fillStyle = '#ffffff';
  c.font = 'bold 22px sans-serif';
  c.fillText('DUNKLEOSTEUS — PLACEHOLDER',384,315);
  c.font = 'bold 19px sans-serif'; c.fillText(view.toUpperCase(),384,343);
  writeFileSync(resolve(output, 'dunkleosteus_mid_' + view + '.png'), canvas.toBuffer('image/png'));
}
