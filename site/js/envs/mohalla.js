/* ENV: Mohalla — an old-city lane drawn as flat gouache / screen-print vectors (saloon.wtf-like): vermilion, terracotta, ochre, cream, olive, 1.2px dark ink.
   The painted street/sky/houses come from the backdrop image behind the canvas (window.MOHALLA_BACKDROP), so sky() and far() are transparent.
   Every layer scales the 960x640 canvas by K and draws in 480x320 scene coordinates, anchored to Art.L. */
(() => {
'use strict';
const INK = '#1f1410', FONT = '"Noto Sans Devanagari","Nirmala UI","Mangal",sans-serif';
const C = { verm: '#c8452c', terra: '#b5593a', ochre: '#d9a441', cream: '#efe0bd', olive: '#6b7a3a', plaster: '#dcc896', wood: '#7a4a2c', steel: '#b8bcb4', teal: '#2f5d6a' };
let c, a;

const F = h => a.tone(h);
const sh = (h, v) => a.shade(h, v);
const path = (pts, fill, o = {}) => {
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
  if (fill) { c.fillStyle = F(fill); c.fill(); }
  if (o.ink !== false) { c.strokeStyle = INK; c.lineWidth = o.lw || 1.2; c.stroke(); }
};
const rect = (x, y, w, h, fill, o = {}) => {
  c.beginPath(); if (o.r) c.roundRect(x, y, w, h, o.r); else c.rect(x, y, w, h);
  if (fill) { c.fillStyle = F(fill); c.fill(); }
  if (o.ink !== false) { c.strokeStyle = INK; c.lineWidth = o.lw || 1.2; c.stroke(); }
};
const ell = (x, y, rx, ry, fill, o = {}) => {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  if (fill) { c.fillStyle = F(fill); c.fill(); }
  if (o.ink !== false) { c.strokeStyle = INK; c.lineWidth = o.lw || 1.2; c.stroke(); }
};
const ln = (x0, y0, x1, y1, col, w = 1) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.strokeStyle = col[0] === '#' ? F(col) : col; c.lineWidth = w; c.stroke(); };
// flat box: fill, one darker side/bottom shade, a lighter top edge, ink outline
const box = (x, y, w, h, fill, o = {}) => {
  rect(x, y, w, h, fill, { ink: false, r: o.r });
  c.save(); c.beginPath(); if (o.r) c.roundRect(x, y, w, h, o.r); else c.rect(x, y, w, h); c.clip();
  c.fillStyle = F(sh(fill, -.2)); c.fillRect(x + w - Math.max(2, w * .16), y, Math.max(2, w * .16), h);
  c.fillStyle = F(sh(fill, .2)); c.fillRect(x, y, w, Math.min(1.6, h / 2));
  c.restore();
  rect(x, y, w, h, null, { r: o.r, lw: o.lw });
};
const grain = (x, y, w, h, seed, n, al = .1) => {
  const r = a.rng(seed);
  for (let i = 0; i < n; i++) { c.fillStyle = r() < .55 ? `rgba(31,20,16,${al})` : `rgba(255,236,200,${al * .8})`; c.fillRect(x + r() * w, y + r() * h, r() < .2 ? 2 : 1, 1); }
};
const text = (s, x, y, size, col, o = {}) => { c.font = `${o.bold === false ? 500 : 800} ${size}px ${FONT}`; c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = F(col); c.fillText(s, x, y); };
const wrap = fn => (ctx, api) => { c = ctx; a = api; c.save(); c.scale(api.K, api.K); c.imageSmoothingEnabled = true; c.lineJoin = 'round'; c.lineCap = 'round'; try { return fn(); } finally { c.restore(); } };
const pole = (x, y0, y1, w = 6) => { rect(x - w / 2, y0, w, y1 - y0, '#b99a4e'); c.fillStyle = F('#8f7436'); c.fillRect(x + w / 2 - 2, y0, 2, y1 - y0); for (let y = y0 + 9; y < y1; y += 15) ln(x - w / 2, y, x + w / 2, y, INK, 1); };
const marigold = (x, y, r = 2.3) => { ell(x, y, r, r, '#e8962a', { lw: .6 }); ell(x - .5, y - .5, r * .45, r * .45, '#f6c64a', { ink: false }); };

/* ---------- roof: tin awning, bamboo poles, cloth valance ---------- */
const roof = wrap(() => {
  pole(98, 20, 92); pole(392, 20, 92);
  path([[50, 26], [440, 26], [452, 52], [38, 52]], C.terra);
  c.save(); c.beginPath(); c.moveTo(50, 26); c.lineTo(440, 26); c.lineTo(452, 52); c.lineTo(38, 52); c.closePath(); c.clip();
  for (let i = 0; i < 66; i++) { const t = i / 66, x0 = 50 + 390 * t, x1 = 38 + 414 * t; ln(x0, 26, x1, 52, sh(C.terra, -.22), 1.6); ln(x0 + 2, 26, x1 + 2, 52, sh(C.terra, .2), .9); }
  const r = a.rng(4); for (let i = 0; i < 9; i++) { const x = 60 + r() * 370, y = 28 + r() * 18; path([[x, y], [x + 8 + r() * 14, y + 1], [x + 6 + r() * 12, y + 6 + r() * 6], [x - 1, y + 5]], i % 3 ? '#8a3f2a' : '#6b7a3a', { ink: false }); }
  path([[300, 26], [356, 26], [360, 40], [296, 40]], '#356b73', { lw: 1 }); // a patch of blue tarpaulin
  for (let x = 304; x < 356; x += 8) ln(x, 28, x + 2, 38, 'rgba(255,255,255,.18)', 1);
  rect(50, 26, 390, 3, '#e6b27c', { ink: false }); grain(38, 26, 414, 26, 11, 380, .14);
  c.restore();
  // cloth valance with scalloped edge
  c.beginPath(); c.moveTo(38, 52); c.lineTo(452, 52); c.lineTo(452, 58);
  for (let x = 452; x > 38; x -= 14) c.quadraticCurveTo(x - 7, 66, x - 14, 58);
  c.lineTo(38, 52); c.closePath(); c.fillStyle = F(C.verm); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
  for (let x = 45; x < 450; x += 14) ell(x, 58, 1.4, 1.4, C.cream, { ink: false });
  ln(38, 52, 452, 52, INK, 1.6); ln(98, 20, 52, 28, '#6b4a2a', 1); ln(392, 20, 440, 28, '#6b4a2a', 1);
});

/* ---------- back wall: plaster, shelves, jars, shrine, fridge, chips strip ---------- */
function jar(x, y, w, h, col, lid) {
  rect(x, y - h, w, h, '#cfe0d6', { r: 1.5, lw: 1 });
  rect(x + 1.2, y - h + 3, w - 2.4, h - 4.2, col, { ink: false, r: 1 });
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 2, y - h + 4, 1.5, h - 7);
  rect(x - .8, y - h - 3, w + 1.6, 3.2, lid, { lw: 1 });
}
const backWall = wrap(() => {
  const r = a.rng(123);
  // wall: warm plaster, ochre dado, peeled patches showing brick
  rect(100, 92, 296, 170, '#d6bf8a', { ink: false });
  rect(100, 226, 296, 36, C.olive, { ink: false }); ln(100, 226, 396, 226, INK, 1); ln(100, 230, 396, 230, C.cream, 1);
  for (let i = 0; i < 6; i++) { const x = 104 + r() * 270, y = 98 + r() * 120, w = 14 + r() * 26; path([[x, y], [x + w, y + 2], [x + w * .8, y + 14 + r() * 8], [x + 3, y + 10]], '#b86a45', { ink: false }); for (let j = 0; j < 3; j++) ln(x + 1, y + 3 + j * 4, x + w - 2, y + 3 + j * 4, 'rgba(60,25,15,.35)', .6); }
  grain(100, 92, 296, 170, 6, 700, .1);
  c.fillStyle = 'rgba(31,20,16,.16)'; c.fillRect(100, 92, 296, 9); c.fillStyle = 'rgba(31,20,16,.08)'; c.fillRect(100, 101, 296, 8); // shade under the awning
  ln(100, 92, 100, 262, INK, 1.6); ln(396, 92, 396, 262, INK, 1.6);
  // hanging chips strips + biscuit packets (x104-160, y96-150)
  ln(104, 96, 160, 96, INK, 1.2); const pc = ['#e0a82a', '#2a6ab0', '#c8452c', '#4b8a4a', '#d8742a'];
  for (let k = 0; k < 7; k++) { const px = 107 + k * 7.4; ln(px + 3, 96, px + 3, 100, INK, .8); for (let m = 0; m < 4; m++) { const col = pc[(k + m * 2) % 5], py = 100 + m * 11; box(px, py, 6.4, 10, col, { lw: .9 }); ell(px + 3.2, py + 5, 1.8, 1.8, C.cream, { ink: false }); c.fillStyle = F(sh(col, -.3)); c.fillRect(px, py, 6.4, 1.4); } }
  // calendar + clock face (hands are drawn by the engine)
  box(284, 100, 22, 28, '#efe3c4', { lw: 1 }); rect(284, 100, 22, 8, C.verm, { lw: 1 }); text('चैत', 295, 106.5, 6, C.cream, { align: 'center' });
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { c.fillStyle = F('#4a3a2a'); c.fillRect(287 + i * 4.6, 113 + j * 4.4, 2.6, 2.4); }
  ell(318, 108, 9.5, 9.5, '#7a4a2c'); ell(318, 108, 7.4, 7.4, '#f4ead0', { lw: .8 }); for (let k = 0; k < 12; k++) { const an = k * Math.PI / 6; ln(318 + Math.sin(an) * 5.6, 108 - Math.cos(an) * 5.6, 318 + Math.sin(an) * 6.7, 108 - Math.cos(an) * 6.7, INK, .7); }
  // shelves
  for (const [sy, x0, x1] of [[124, 150, 366], [152, 150, 296]]) { box(x0, sy, x1 - x0, 4.5, '#8a5a34'); path([[x0 + 6, sy + 4.5], [x0 + 14, sy + 4.5], [x0 + 6, sy + 10]], '#6b4a2a', { lw: 1 }); path([[x1 - 14, sy + 4.5], [x1 - 6, sy + 4.5], [x1 - 6, sy + 10]], '#6b4a2a', { lw: 1 }); }
  // glass jars on the top shelf
  const jc = ['#e0a84a', '#c8552e', '#efe2b0', '#7a9a52', '#d8884a'], lc = ['#c8452c', '#2f5d6a', '#d9a441'];
  for (let i = 0; i < 10; i++) jar(154 + i * 17, 124, 12, 12 + (i % 3) * 2, jc[i % 5], lc[i % 3]);
  // second shelf: steel tins, bottles and Parle-G style biscuit packets
  for (let i = 0; i < 4; i++) { const tx = 154 + i * 21; box(tx, 138, 16, 14, i % 2 ? '#b8bcb4' : '#9aa09a', { r: 1.5, lw: 1 }); ln(tx + 1, 142, tx + 15, 142, 'rgba(255,255,255,.55)', 1); ln(tx + 1, 148, tx + 15, 148, 'rgba(31,20,16,.3)', 1); }
  for (let i = 0; i < 3; i++) { const bx = 240 + i * 17; box(bx, 137, 14, 15, '#e8b02a', { lw: 1 }); ell(bx + 6, bx > 0 ? 144 : 144, 3.2, 3.2, '#fff4d4', { ink: false }); c.fillStyle = F(C.verm); c.fillRect(bx + 4.6, 142.6, 2.8, 2.8); }
  // shrine: framed deity with marigold garland, brass holder
  box(230, 126, 22, 30, '#8a4a22', { lw: 1.2 }); rect(233, 129, 16, 24, '#f2d9a0', { ink: false }); ell(241, 137, 6, 6, '#e8962a', { ink: false });
  ell(241, 139, 3, 3.6, '#2f5d8a', { lw: .7 }); path([[237.8, 135.6], [241, 130.6], [244.2, 135.6]], '#e0b030', { lw: .7 }); path([[236, 151], [241, 144], [246, 151]], '#c8452c', { lw: .7 });
  for (let i = 0; i < 8; i++) marigold(229 + i * 3.4, 142 + Math.sin(i / 7 * Math.PI) * 5, 1.8); // garland
  box(224, 158, 36, 4, '#6b4a2a', { lw: 1 }); box(238, 153, 7, 5, '#d4a548', { r: 1, lw: .9 }); ln(241, 153, 241, 148, '#4a3a2a', .9);
  ell(254, 156.5, 2.6, 1.6, '#d9a441', { lw: .8 }); // diya
  // fridge (x366-392, y104-208) with red cooler cap
  box(366, 104, 26, 104, '#e9e2d0', { r: 2 }); box(366, 104, 26, 17, C.verm, { r: 2 }); text('ठंडा', 379, 116, 8, C.cream, { align: 'center' });
  rect(368.5, 124, 21, 80, '#233a40', { r: 1.5, lw: 1 });
  for (let s = 0; s < 4; s++) { const fy = 128 + s * 20; ln(369, fy + 17, 389, fy + 17, '#51656a', 1.4); for (let b = 0; b < 5; b++) { const col = ['#c8452c', '#d9a441', '#4b8a4a', '#efe0bd', '#c8452c'][(b + s) % 5]; rect(370.5 + b * 3.8, fy + 4, 3, 12.5, col, { lw: .7 }); rect(371 + b * 3.8, fy + 2, 2, 2.4, '#bfc4bc', { lw: .6 }); } }
  rect(390, 134, 1.8, 16, '#8a8a84', { lw: .7 });
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(371, 126, 4, 76);
  // plant on top of the fridge
  box(372, 92, 9, 12, '#a85a30', { lw: 1 }); for (let i = 0; i < 7; i++) path([[376.5, 92], [368 + i * 4.4, 76 + (i % 3) * 3], [378 + i * 2.8, 91]], i % 2 ? '#5a7a32' : '#7a9a42', { lw: .8 });
  // bulbs on cords (lamps) and the tube-light housing
  for (const b of a.L.lamps.slice(0, 3)) { ln(b.x, 92, b.x, b.y - 5, INK, 1); box(b.x - 2.5, b.y - 6, 5, 4, '#2c2622', { lw: .8 }); ell(b.x, b.y - 1, 3.4, 4.4, '#efe6c4', { lw: .9 }); }
  rect(164, 102, 76, 3.4, '#cfd2cc', { r: 1.2, lw: 1 }); ln(170, 98, 170, 102, INK, 1); ln(234, 98, 234, 102, INK, 1);
});

/* ---------- sign board: "चाय" hand-painted ---------- */
const sign = wrap(() => {
  const X = 108, Y = 58, W = 280, H = 40;
  rect(X - 3, Y - 3, W + 6, H + 6, '#7a4a2c', { lw: 1.4 }); box(X, Y, W, H, '#f0e2bc', { lw: 1.2 });
  rect(X + 3, Y + 3, W - 6, H - 6, null, { lw: 1.4 }); c.strokeStyle = F(C.verm); c.lineWidth = 1.4; c.strokeRect(X + 3.5, Y + 3.5, W - 7, H - 7);
  grain(X, Y, W, H, 91, 260, .12);
  for (const [px, py] of [[X + 7, Y + 7], [X + W - 7, Y + 7], [X + 7, Y + H - 7], [X + W - 7, Y + H - 7]]) marigold(px, py, 2.6);
  text('चाय', X + 76, Y + 30.5, 27, '#6b1d12', { align: 'center' }); text('चाय', X + 75, Y + 29, 27, C.verm, { align: 'center' });
  text('राकेश टी स्टॉल', X + 76, Y + 11, 7, '#2a1a10', { align: 'center' }); text('गरमा गरम • समोसा • पकोड़ा • कचौरी', X + 76, Y + 37, 6.2, '#4a2a1c', { align: 'center' });
  // painted glass of chai + samosa plate
  const px = X + 190, py = Y + 8;
  ell(px + 14, py + 24, 14, 5, '#f4ead0'); path([[px + 5, py + 21], [px + 11, py + 8], [px + 17, py + 21]], '#e0a030', { lw: 1 }); path([[px + 13, py + 22], [px + 20, py + 11], [px + 26, py + 22]], '#d08a22', { lw: 1 });
  path([[px + 44, py + 10], [px + 58, py + 10], [px + 55, py + 27], [px + 47, py + 27]], '#c47a3c', { lw: 1.1 }); rect(px + 45, py + 11.5, 12.5, 4, '#f2e2c0', { ink: false }); ell(px + 61, py + 17, 3, 4, null, { lw: 1.4 });
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(px + 48 + i * 4, py + 7); c.bezierCurveTo(px + 44 + i * 4, py + 3, px + 52 + i * 4, py + 1, px + 48 + i * 4, py - 2); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.stroke(); }
});

/* ---------- menu board ---------- */
const board = wrap(() => {
  ln(60, 106, 60, 120, '#6b4a2a', 1.2); ln(84, 106, 84, 120, '#6b4a2a', 1.2); ln(60, 106, 72, 100, '#6b4a2a', 1.2); ln(84, 106, 72, 100, '#6b4a2a', 1.2);
  box(46, 118, 50, 89, '#8a5a34', { lw: 1.3 }); rect(49.5, 121.5, 43, 82, '#34402e', { ink: false, lw: 1 }); grain(49, 121, 44, 82, 5, 200, .1);
  text('मेन्यू', 71, 131.5, 8.5, C.cream, { align: 'center' }); ln(53, 134.5, 90, 134.5, 'rgba(239,224,189,.8)', 1);
  const rows = [['समोसा', '15'], ['पकोड़ा', '15'], ['कचौरी', '20'], ['आलू बड़ा', '15'], ['चाय', '10'], ['कॉफी', '15'], ['ठंडा पेय', '20']];
  rows.forEach((q, i) => { text(q[0], 53, 146 + i * 8.6, 6.6, i === 4 ? C.ochre : C.cream, { bold: true }); text(q[1], 89, 146 + i * 8.6, 6.6, '#f0b8a0', { align: 'right' }); });
  box(46, 205, 50, 3, '#6b4a2a', { lw: 1 }); box(60, 200, 4, 5, '#efe0bd', { lw: .7 });
});

/* ---------- ground: flagstone lane, gutter, road edge (opaque from y 262) ---------- */
const ground = wrap(() => {
  const r = a.rng(200);
  rect(0, 262, 480, 58, '#b88a62', { ink: false });
  for (let j = 0; j < 6; j++) { const y = 262 + j * 8 + j * j * .4, h = 8 + j; for (let i = -1; i < 14; i++) { const x = i * 40 + (j % 2) * 20 - 4 + r() * 3; rect(x, y, 38, h - 1, ['#c19a70', '#b58c64', '#a97f58'][(i + j + 3) % 3], { lw: .8 }); c.fillStyle = 'rgba(255,230,190,.28)'; c.fillRect(x + 1, y + 1, 36, 1.2); } }
  grain(0, 262, 480, 44, 9, 900, .13);
  for (let i = 0; i < 16; i++) { const x = r() * 470, y = 266 + r() * 36; c.fillStyle = F(['#d9a441', '#c8452c', '#efe0bd'][i % 3]); c.fillRect(x, y, 2 + r() * 3, 1.4); } // marigold petals + rangoli dust
  for (let i = 0; i < 10; i++) { const x = r() * 470, y = 270 + r() * 32; ln(x, y, x + 3 + r() * 4, y + r() * 1.5, 'rgba(60,35,20,.4)', .8); } // cracks
  rect(0, 306, 480, 5, '#cbb08a', { ink: false }); ln(0, 306, 480, 306, INK, 1.2); c.fillStyle = F('#8a6a4c'); c.fillRect(0, 309.5, 480, 1.5);
  rect(0, 311, 480, 9, '#8a5a40', { ink: false }); ln(0, 311, 480, 311, INK, 1.2);
  if (a.T.wet) { c.fillStyle = 'rgba(70,110,150,.22)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(40 + i * 82 + r() * 20, 296 + r() * 10, 22 + r() * 14, 2.4, 0, 0, 6.2832); c.fill(); } }
  c.fillStyle = 'rgba(31,20,16,.38)'; c.fillRect(0, 262, 480, 2.4); // shadow line under the counter
  grain(0, 311, 480, 9, 13, 160, .18);
});

/* ---------- furnBack: crates, dustbin, matka stand, stools ---------- */
const furnBack = wrap(() => {
  for (let k = 0; k < 3; k++) { const cy = 262 - 12 * (k + 1), col = k % 2 ? '#2f5d6a' : '#c8452c'; box(40, cy, 36, 12, col, { lw: 1.1 }); for (let b = 0; b < 4; b++) { rect(43.5 + b * 8, cy - 8, 5, 8, '#5a2a1c', { lw: .8 }); rect(44.5 + b * 8, cy - 11, 3, 3, '#bfc4bc', { lw: .7 }); } rect(46, cy + 3.5, 24, 5, '#efe0bd', { ink: false }); }
  box(18, 232, 22, 30, '#7f8a8a', { r: 1.5 }); box(15, 228.5, 28, 4.5, '#a6b0ae', { r: 1.5, lw: 1 }); for (let i = 0; i < 4; i++) ln(21 + i * 5, 237, 21 + i * 5, 258, 'rgba(31,20,16,.4)', 1);
  // earthen water matka on an iron ring stand (right)
  for (const x of [408, 424]) ln(x, 242, x - 2, 262, INK, 2);
  path([[406, 242], [428, 242], [424, 246], [410, 246]], '#555d5a', { lw: 1 }); ell(417, 228, 13, 15, '#c96a40'); ell(417, 215, 7, 2.4, '#8a3f26'); ellip(417, 238, 8);
  c.fillStyle = 'rgba(255,230,190,.3)'; c.beginPath(); c.ellipse(411, 226, 2.4, 8, .2, 0, 6.2832); c.fill(); rect(404, 211, 26, 5, '#e8d8b0', { r: 1.5, lw: 1 }); // lid cloth
  const cols = ['#c8452c', '#2f5d6a'];
  a.L.seats.forEach((s, i) => { const x0 = s.x - 11, col = cols[i % 2]; for (const lx of [x0 + 2, x0 + 17]) { rect(lx, s.y + 4, 3, 22, sh(col, -.25), { lw: 1 }); } rect(x0 + 2, s.y + 14, 18, 2, sh(col, -.3), { lw: .9 }); box(x0, s.y, 22, 4.5, col, { r: 1.5, lw: 1.1 }); });
});
function ellip(x, y, rx) { ell(x, y, rx, 1.2, '#8a3f26', { ink: false }); }

/* ---------- benches ---------- */
const tables = wrap(() => {
  const r = a.rng(9);
  for (const t of a.L.tables) {
    const w = t.x1 - t.x0, y = 262;
    for (const lx of [t.x0 + 4, t.x1 - 8]) rect(lx, y + 6, 4, 24, '#5a3a22', { lw: 1 });
    rect(t.x0 + 5, y + 19, w - 10, 2.4, '#4a2e1a', { lw: .9 });
    box(t.x0, y, w, 6.5, '#9a6a3c', { lw: 1.2 }); ln(t.x0, y + 6.5, t.x1, y + 6.5, '#3a2412', 1.4);
    for (let i = 8; i < w - 4; i += 12 + r() * 6) ln(t.x0 + i, y + 1.5, t.x0 + i + 3, y + 5, 'rgba(60,35,20,.5)', .8);
    grain(t.x0, y, w, 6, t.x0, 40, .1);
  }
});

/* ---------- counter: top slab, painted front panel, cases, stove, cylinder, soundbox, QR ---------- */
const counter = wrap(() => {
  const r = a.rng(66);
  // carton (98-124, y184-208)
  box(98, 190, 26, 18, '#c49a62', { lw: 1.1 }); ln(111, 190, 111, 208, 'rgba(31,20,16,.4)', 1); box(100, 184, 9, 7, '#b88a52', { lw: 1 }); box(113, 183, 10, 8, '#b88a52', { lw: 1 }); for (let i = 0; i < 3; i++) rect(104 + i * 6, 186, 4.4, 6, ['#d9a441', '#c8452c', '#2f5d6a'][i], { lw: .7 });
  // front panel: terracotta with cream border band and diamond motif, chipped paint
  rect(98, 215, 304, 47, '#b24a30', { lw: 1.2 });
  c.save(); c.beginPath(); c.rect(98, 215, 304, 47); c.clip();
  for (let i = 0; i < 6; i++) { ln(98 + i * 60.8, 215, 98 + i * 60.8, 262, sh('#b24a30', -.3), 1); }
  c.strokeStyle = F(C.cream); c.lineWidth = 1.4; c.strokeRect(102, 219, 296, 39);
  for (let x = 108; x < 394; x += 12) { path([[x, 231], [x + 5, 226], [x + 10, 231], [x + 5, 236]], (x / 12 | 0) % 2 ? C.ochre : C.cream, { lw: .8 }); }
  ln(104, 241, 396, 241, C.olive, 1.6);
  for (let i = 0; i < 9; i++) { const x = 100 + r() * 290, y = 217 + r() * 40; path([[x, y], [x + 4 + r() * 8, y + 1], [x + 3 + r() * 6, y + 3 + r() * 5], [x - 1, y + 3]], '#8a6238', { ink: false }); }
  grain(98, 215, 304, 47, 66, 520, .12); rect(98, 258.5, 304, 3.5, '#6b2a1c', { ink: false }); c.restore();
  // gas cylinder + sack under the counter
  box(108, 224, 22, 36, '#a8281e', { r: 4, lw: 1.1 }); box(112, 219, 14, 6, '#7a1c18', { r: 1.5, lw: 1 }); ln(108, 240, 130, 240, F('#e8d8b8'), 3); text('LPG', 119, 252, 6, C.cream, { align: 'center' });
  path([[136, 242], [162, 242], [164, 260], [134, 260]], '#d6bf8a', { lw: 1.1 }); ln(138, 246, 160, 246, 'rgba(31,20,16,.3)', 1); ln(138, 251, 160, 251, 'rgba(31,20,16,.3)', 1);
  // QR sticker (376-398, y226-252)
  box(376, 226, 22, 26, '#f4f2ea', { lw: 1 }); rect(378, 228, 18, 4, '#1a4fb4', { ink: false }); text('Paytm', 387, 231.4, 3.6, '#ffffff', { align: 'center' }); const q = a.rng(3);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (q() < .55) { c.fillStyle = F('#14141c'); c.fillRect(380 + i * 2, 235 + j * 2, 2, 2); }
  for (const [qx, qy] of [[380, 235], [390, 235], [380, 245]]) { rect(qx, qy, 4.4, 4.4, '#14141c', { ink: false }); rect(qx + 1, qy + 1, 2.4, 2.4, '#ffffff', { ink: false }); }
  // counter top slab with brass edge
  box(94, 208, 314, 6, '#a8703c', { lw: 1.3 }); ln(94, 214, 408, 214, '#d4a548', 1.2); for (let i = 0; i < 314; i += 11) ln(97 + i, 209.4, 98 + i, 212.4, 'rgba(60,35,20,.4)', .8);
  grain(94, 208, 314, 6, 3, 80, .1);
  // case bases (steel trays)
  for (const [cx, w] of [[112, 66], [180, 66], [248, 52]]) { box(cx, 202, w, 6, '#aeb4ac', { lw: 1 }); ln(cx + 1, 203, cx + w - 1, 203, 'rgba(255,255,255,.5)', .8); }
  // stove x300-356 (kettle and kadhai are drawn by the engine)
  box(300, 198, 56, 10, '#2a2622', { lw: 1.2 }); rect(304, 196.5, 16, 2.4, '#14110e', { ink: false }); rect(334, 196.5, 16, 2.4, '#14110e', { ink: false }); grain(300, 198, 56, 10, 22, 60, .22);
  // steel water container + tap, soundbox
  box(358, 190, 18, 18, '#b8bcb4', { r: 2, lw: 1.1 }); ln(360, 193, 360, 205, 'rgba(255,255,255,.55)', 1.2); rect(357, 201, 4, 2.4, '#8a8e86', { lw: .8 }); rect(359, 187, 14, 3.4, '#9aa09a', { r: 1, lw: 1 });
  box(380, 196, 14, 12, '#1f4fa8', { r: 1.5, lw: 1.1 }); ell(387, 202, 3.4, 3.4, '#0e2f6e', { lw: .8 }); rect(382, 197.4, 10, 1.6, '#f2f2f4', { ink: false });
});

/* ---------- glass on the display cases ---------- */
const glass = wrap(() => {
  const cs = [[112, 66], [180, 66], [248, 52]];
  for (const [cx, w] of cs) {
    c.fillStyle = 'rgba(200,232,236,.2)'; c.fillRect(cx, 176, w, 26);
    c.strokeStyle = 'rgba(31,20,16,.75)'; c.lineWidth = 1; c.strokeRect(cx + .5, 176.5, w - 1, 26);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(cx + 5, 178, 1.4, 20); c.fillRect(cx + 9, 178, .8, 12); c.fillRect(cx + w - 10, 180, 1, 14);
    c.fillStyle = F('#aeb4ac'); c.fillRect(cx - 1, 174.4, w + 2, 2.4); c.strokeStyle = INK; c.lineWidth = .8; c.strokeRect(cx - .6, 174.6, w + 1.2, 2.2);
  }
});

/* ---------- canopy: peepal trunk + branches (left) ---------- */
const canopy = wrap(() => {
  const bark = '#6e4a32', r = a.rng(808);
  const branch = (x0, y0, x1, y1, w0, w1) => { const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy), nx = -dy / n, ny = dx / n; path([[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]], bark); ln(x0 - nx * w0 * .1, y0 - ny * w0 * .1, x1 - nx * w1 * .1, y1 - ny * w1 * .1, sh(bark, .22), Math.max(1, w1 * .35)); };
  const pts = [[-2, 40]]; for (let y = 40; y <= 296; y += 8) pts.push([36 + (y - 40) / 266 * 14 + Math.sin(y * .07) * 2, y]); pts.push([62, 306], [-2, 306]);
  c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = F(bark); c.fill(); c.clip();
  c.fillStyle = F(sh(bark, -.28)); c.fillRect(30, 40, 40, 270); c.fillStyle = F(sh(bark, .2)); c.fillRect(0, 40, 8, 270);
  for (let i = 0; i < 26; i++) { const x = 4 + r() * 40, y = 50 + r() * 240; ln(x, y, x + (r() - .5) * 3, y + 6 + r() * 16, 'rgba(31,20,16,.45)', 1); }
  for (let i = 0; i < 6; i++) ell(6 + r() * 30, 80 + r() * 200, 3, 1.6, '#5c7a38', { ink: false });
  c.restore(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
  branch(30, 90, 74, 40, 14, 8); branch(60, 46, 112, 18, 9, 4); branch(34, 70, 56, 16, 10, 5); branch(40, 100, 96, 70, 7, 3); branch(70, 40, 128, 8, 5, 2);
  // a little shrine thread tied around the trunk
  ln(0, 220, 48, 226, C.verm, 2.2); ln(0, 223, 48, 229, C.ochre, 1.2);
});

/* ---------- foliage: swaying olive leaf clumps (960-space sprites) ---------- */
const FOLIAGE = [[14, 22, 34, 30], [46, 12, 36, 24], [86, 8, 36, 22], [124, 16, 34, 24], [160, 10, 30, 18], [196, 14, 30, 20], [232, 8, 26, 16], [270, 12, 24, 16], [310, 8, 22, 14],
  [18, 64, 30, 26], [52, 52, 30, 22], [92, 36, 28, 18], [132, 40, 26, 18], [170, 34, 22, 14], [210, 30, 20, 12], [250, 26, 18, 10], [8, 98, 22, 20], [40, 92, 20, 16], [70, 74, 22, 14]];
const foliage = (ctx, api) => {
  a = api; const r = api.rng(515), greens = ['#33401c', '#4a5c28', '#667a36', '#8a9a46', '#b2b658'], out = [], K = api.K;
  FOLIAGE.forEach(([cx, cy, rx, ry], k) => {
    const pad = 8, m = api.mk((rx * 2 + pad * 2) * K, (ry * 2 + pad * 2) * K), g = m.x; g.scale(K, K); g.imageSmoothingEnabled = true;
    const blobs = []; for (let i = 0; i < rx * ry / 38; i++) { const an = r() * 6.283, d = Math.sqrt(r()) * .9, u = Math.cos(an) * d, v = Math.sin(an) * d; blobs.push({ x: rx + pad + u * rx, y: ry + pad + v * ry, u, v, s: 4.5 + r() * 4 }); }
    blobs.sort((p, q) => p.y - q.y);
    g.fillStyle = INK; for (const b of blobs) { g.beginPath(); g.ellipse(b.x, b.y, b.s + 1.3, b.s * .8 + 1.3, 0, 0, 6.2832); g.fill(); }
    for (const b of blobs) {
      const lit = api.clamp(.55 - b.v * .5 - b.u * .3 + (r() - .5) * .35, 0, .999), col = greens[Math.floor(lit * greens.length)];
      g.fillStyle = F(sh(col, -.22)); g.beginPath(); g.ellipse(b.x, b.y + .8, b.s, b.s * .8, 0, 0, 6.2832); g.fill();
      g.fillStyle = F(col); g.beginPath(); g.ellipse(b.x - .3, b.y - .4, b.s * .92, b.s * .66, 0, 0, 6.2832); g.fill();
      if (r() < .4) { g.fillStyle = F(sh(col, .3)); g.beginPath(); g.ellipse(b.x - b.s * .25, b.y - b.s * .3, b.s * .35, b.s * .18, -.4, 0, 6.2832); g.fill(); }
    }
    out.push({ c: m.c, x: (cx - rx - pad) * K, y: (cy - ry - pad) * K, amp: (1.1 + r() * .9) * K, sp: .5 + r() * .5, ph: r() * 6.28 });
  });
  const lf = api.mk(8 * K, 6 * K), g = lf.x; g.scale(K, K); g.imageSmoothingEnabled = true; g.fillStyle = INK; g.beginPath(); g.ellipse(4, 3, 3.6, 2.2, .5, 0, 6.2832); g.fill(); g.fillStyle = F('#8a9a46'); g.beginPath(); g.ellipse(4, 3, 2.7, 1.4, .5, 0, 6.2832); g.fill();
  for (let i = 0; i < 18; i++) { const f = FOLIAGE[(r() * FOLIAGE.length) | 0]; out.push({ c: lf.c, x: (f[0] + (r() * 2 - 1) * f[2]) * K, y: (f[1] + (r() * 2 - 1) * f[3] * .8) * K, amp: (1.6 + r() * 1.4) * K, sp: 1.6 + r() * 1.4, ph: r() * 6.28, loose: true }); }
  return out;
};

/* ---------- emit: warm bulbs, fridge glow, case lights, sign wash, stove embers ---------- */
const emit = wrap(() => {
  const lamps = a.T.lamps, l = Math.max(lamps, a.name === 'day' ? .12 : .2), fillG = (x, y, w, h, rgb, al) => { c.fillStyle = `rgba(${rgb},${al})`; c.fillRect(x, y, w, h); };
  fillG(368.5, 124, 21, 80, '170,215,235', .3 * l + .05); fillG(370, 126, 18, 3, '235,248,255', .4 * l);
  for (const [cx, w] of [[112, 66], [180, 66], [248, 52]]) { fillG(cx + 1, 178, w - 2, 24, '255,196,100', .22 * l + .04); fillG(cx + 1, 178, w - 2, 3, '255,230,170', .3 * l); }
  fillG(382, 197.4, 10, 1.6, '150,190,255', .4);
  if (lamps > .1) {
    fillG(108, 58, 280, 40, '255,200,130', .1 * lamps);
    for (const b of a.L.lamps.slice(0, 3)) { const g = c.createRadialGradient(b.x, b.y - 1, 0, b.x, b.y - 1, 16); g.addColorStop(0, `rgba(255,214,130,${.55 * lamps})`); g.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = g; c.fillRect(b.x - 16, b.y - 17, 32, 32); c.fillStyle = 'rgba(255,244,205,.95)'; c.beginPath(); c.ellipse(b.x, b.y - 1, 2.6, 3.6, 0, 0, 6.2832); c.fill(); }
    fillG(304, 197, 12, 1.4, '255,120,40', .75 * lamps); fillG(336, 197, 12, 1.4, '255,120,40', .75 * lamps);
    const mg = c.createRadialGradient(414, 217, 0, 414, 217, 14); mg.addColorStop(0, 'rgba(255,170,70,.35)'); mg.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = mg; c.fillRect(400, 203, 28, 28); // diya-like glow on the matka
    fillG(254, 155.6, 5, 1.8, '255,200,90', .8); // diya flame
  }
});

/* ---------- dynamic touches ---------- */
const dynamic = [
  { z: 'sky', draw(g, t, dt, api) { // paper kite on a string + pigeons above the roof
    if (api.name === 'night') return; const K = api.K; g.save(); g.scale(K, K); g.lineJoin = 'round'; g.lineCap = 'round';
    const x = 360 + Math.sin(t * .22) * 34, y = 12 + Math.sin(t * .35) * 5, rot = Math.sin(t * .6) * .12;
    g.strokeStyle = 'rgba(31,20,16,.5)'; g.lineWidth = .6; g.beginPath(); g.moveTo(x, y + 10); g.quadraticCurveTo(x + 40, y + 36, 478, 118); g.stroke();
    g.translate(x, y); g.rotate(rot);
    g.beginPath(); g.moveTo(0, -11); g.lineTo(8, -2); g.lineTo(0, 10); g.lineTo(-8, -2); g.closePath(); g.fillStyle = api.tone(C.verm); g.fill();
    g.beginPath(); g.moveTo(0, -11); g.lineTo(8, -2); g.lineTo(0, -2); g.closePath(); g.fillStyle = api.tone(C.ochre); g.fill();
    g.beginPath(); g.moveTo(0, -2); g.lineTo(-8, -2); g.lineTo(0, 10); g.closePath(); g.fillStyle = api.tone(C.cream); g.fill();
    g.beginPath(); g.moveTo(0, -11); g.lineTo(8, -2); g.lineTo(0, 10); g.lineTo(-8, -2); g.closePath(); g.strokeStyle = INK; g.lineWidth = .9; g.stroke(); g.beginPath(); g.moveTo(0, -11); g.lineTo(0, 10); g.moveTo(-8, -2); g.lineTo(8, -2); g.lineWidth = .5; g.stroke();
    g.strokeStyle = api.tone(C.verm); g.lineWidth = 1; g.beginPath(); g.moveTo(0, 10); for (let i = 1; i <= 6; i++) g.lineTo(Math.sin(t * 3 + i) * 3.2, 10 + i * 3.4); g.stroke();
    g.restore();
    g.save(); g.scale(K, K); for (let i = 0; i < 4; i++) { const px = (t * 12 + i * 40) % 560 - 50, py = 8 + Math.sin(t * .8 + i * 2) * 3 + (i % 2) * 5, fl = Math.sin(t * 9 + i * 1.7) * 3;
      g.fillStyle = api.tone('#8a8f94'); g.strokeStyle = INK; g.lineWidth = .7; g.beginPath(); g.ellipse(px, py, 3.2, 1.8, 0, 0, 6.2832); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(px - 1, py); g.lineTo(px - 3, py - 3 - fl); g.lineTo(px + 1.5, py - .6); g.moveTo(px + 1, py); g.lineTo(px + 3, py - 3 + fl); g.lineTo(px + 2, py - .2); g.stroke(); }
    g.restore(); } },
  { z: 'front', draw(g, t, dt, api) { // marigold & flag bunting swaying under the awning + flickering tube light
    const K = api.K; g.save(); g.scale(K, K); g.lineJoin = 'round';
    for (const [x0, x1] of [[40, 108], [388, 452]]) { const n = Math.round((x1 - x0) / 9);
      g.strokeStyle = 'rgba(31,20,16,.7)'; g.lineWidth = .8; g.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; g.lineTo(x0 + (x1 - x0) * u, 62 + Math.sin(u * Math.PI) * 7); } g.stroke();
      for (let i = 0; i < n; i++) { const u = (i + .5) / n, x = x0 + (x1 - x0) * u, y = 62 + Math.sin(u * Math.PI) * 7, sw = Math.sin(t * 2.2 + i * .9) * 1.2;
        g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.lineTo(x + sw, y + 7); g.closePath(); g.fillStyle = api.tone([C.verm, C.ochre, C.cream, C.olive][i % 4]); g.fill(); g.strokeStyle = INK; g.lineWidth = .7; g.stroke(); } }
    g.restore();
    const lamps = api.T.lamps; if (lamps > .1) { const fl = Math.sin(t * 40) * Math.sin(t * 13.7) > .93 ? .25 : (Math.sin(t * 1.3) > .985 ? .1 : 1);
      g.save(); g.scale(K, K); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(215,240,255,${.95 * fl * Math.min(1, lamps + .3)})`; g.fillRect(166, 102.6, 72, 2); const gr = g.createRadialGradient(202, 104, 0, 202, 104, 40); gr.addColorStop(0, `rgba(190,225,255,${.3 * fl * lamps})`); gr.addColorStop(1, 'rgba(190,225,255,0)'); g.fillStyle = gr; g.fillRect(160, 62, 84, 80); g.restore(); }
  } }
];

Art.registerEnv('mohalla', {
  label: 'Mohalla', icon: 'M', backdrop: window.MOHALLA_BACKDROP || null,
  mix: { traffic: 1.3, birds: 1.1, crickets: .6, crowd: 1.4 },
  people: { age: { young: 3, mid: 4, old: 3 }, outfits: ['kurta', 'kurta', 'shirt', 'shirt', 'waistcoat', 'tee', 'dhoti'], female: .42 },
  layers: { sky() {}, far() {}, roof, backWall, sign, board, ground, furnBack, tables, counter, glass, canopy, foliage, emit },
  dynamic
});
})();
