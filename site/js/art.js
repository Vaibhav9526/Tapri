/* Tapri scene art — the whole stall is drawn in code on a 480x320 pixel grid so every time of day
   is literally the same shop, and the people drawn into it use the same palette and lighting. */
(() => {
'use strict';
const LW = 480, LH = 320, K = 2, RW = LW * K, RH = LH * K;
const mk = (w = RW, h = RH) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false; return { c, x }; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- time of day ---------- */
const TIMES = {
  morning: { amb: [1.0, 0.89, 0.76], lamps: 0.22, lampCol: '255,190,110', sky: ['#9fc3e6', '#f2c9a0', '#ffd9a8'], clouds: '#ffe3c4', stars: 0, moon: false, lit: 0.0, sunGlow: [70, 150, 'rgba(255,200,120,.35)'], wet: false },
  day: { amb: [1.0, 1.0, 0.96], lamps: 0, lampCol: '255,190,110', sky: ['#5ea5e8', '#8cc2f0', '#c6e2f8'], clouds: '#ffffff', stars: 0, moon: false, lit: 0.0, wet: false },
  dusk: { amb: [0.80, 0.70, 0.79], lamps: 0.7, lampCol: '255,176,86', sky: ['#2c2c64', '#8a4f84', '#f09a62'], clouds: '#b86a78', stars: 0.2, moon: false, lit: 0.35, sunGlow: [380, 190, 'rgba(255,140,70,.45)'], wet: false },
  night: { amb: [0.48, 0.56, 0.72], lamps: 0.8, lampCol: '255,170,80', sky: ['#070b22', '#101a42', '#1d2c5e'], clouds: '#1c2850', stars: 1, moon: true, lit: 0.7, wet: true }
};
let T = TIMES.day, tname = 'day', curEnv = null, curTheme = null, themeId = 'retro', envId = 'city';
const toneMemo = new Map();
function hex2(n) { return n.toString(16).padStart(2, '0'); }
function tone(c) { // apply ambient colour to an albedo, then the active theme's colour grade
  if (c[0] !== '#') return c; const k = tname + themeId + c; let v = toneMemo.get(k); if (v) return v;
  const n = parseInt(c.slice(1), 16), a = T.amb; v = '#' + hex2(clamp(Math.round((n >> 16) * a[0]), 0, 255)) + hex2(clamp(Math.round(((n >> 8) & 255) * a[1]), 0, 255)) + hex2(clamp(Math.round((n & 255) * a[2]), 0, 255));
  if (curTheme && curTheme.grade) v = curTheme.grade(v, c, T) || v; toneMemo.set(k, v); return v;
}
function shade(c, amt) { const n = parseInt(c.slice(1), 16), f = x => clamp(Math.round(amt < 0 ? x * (1 + amt) : x + (255 - x) * amt), 0, 255); return '#' + hex2(f(n >> 16)) + hex2(f((n >> 8) & 255)) + hex2(f(n & 255)); }
let ctx;
const P = (x, y, w, h, c) => { ctx.fillStyle = tone(c); ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };   // toned (lit by ambient)
const E = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };           // emissive (not toned)
function speckle(x, y, w, h, cols, dens, r) { for (let i = 0; i < w * h * dens; i++) P(x + (r() * w | 0), y + (r() * h | 0), 1, 1, cols[r() * cols.length | 0]); }
function disc(cx, cy, rad, c, f = P) { for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); f(cx - w, cy + y, w * 2 + 1, 1, c); } }
function line(x0, y0, x1, y1, c, f = P) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) f(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), 1, 1, c); }
function bx(x, y, w, h, c) { P(x, y, w, h, c); P(x, y, w, 1, shade(c, 0.22)); P(x, y, 1, h, shade(c, 0.12)); P(x + w - 1, y, 1, h, shade(c, -0.28)); P(x, y + h - 1, w, 1, shade(c, -0.34)); }
function pixelText(str, x, y, size, c, o = {}) { // crisp pixel lettering from a web font
  const S = 4, t = mk(Math.ceil(str.length * size * 1.3 * S) + 8, Math.ceil(size * 2.2 * S)), g = t.x; g.imageSmoothingEnabled = false;
  g.font = `${o.bold ? 700 : 500} ${size * S}px "Noto Sans Devanagari","Nirmala UI","Mangal","Pixelify Sans",sans-serif`; g.textBaseline = 'alphabetic'; g.fillStyle = '#000';
  const w = g.measureText(str).width; g.fillText(str, 4, size * S * 1.45);
  const ww = Math.ceil(w / S) + 2, hh = Math.ceil(size * 2.2), d = g.getImageData(0, 0, t.c.width, t.c.height).data, off = o.align === 'center' ? -Math.round(w / S / 2) : 0;
  for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { let a = 0; for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) a += d[((j * S + v) * t.c.width + i * S + u) * 4 + 3]; if (a / (S * S) > 108) (o.emissive ? E : P)(x + off + i - 1, y + j - Math.round(size * 1.45 / 1), 1, 1, c); }
  return w / S;
}

/* ---------- layout (also used by the people code) ---------- */
const L = {
  W: LW, H: LH, floor: 262, counterTop: 208, walkY: 304, standY: 278, seatDrop: 26,
  seats: [{ x: 68, y: 266, tab: 0 }, { x: 108, y: 266, tab: 0 }, { x: 258, y: 266, tab: 1 }, { x: 304, y: 266, tab: 1 }, { x: 412, y: 266, tab: 2 }, { x: 456, y: 266, tab: 2 }],
  tables: [{ x0: 48, x1: 128 }, { x0: 236, x1: 326 }, { x0: 392, x1: 474 }], tableTop: 262, ground: 292, helper: { x: 346, tubX: 326 },
  buy: [{ x: 162 }, { x: 206 }, { x: 384 }],
  owner: { x0: 118, x1: 372, stove: 336, shrine: 242, cases: 200, carton: 124, chips: 128, glass: 360 },
  lamps: [{ x: 150, y: 112, r: 62, a: 1 }, { x: 250, y: 112, r: 62, a: 1 }, { x: 340, y: 112, r: 62, a: 1 }, { x: 420, y: 24, r: 90, a: 0.9 }, { x: 62, y: 100, r: 40, a: .6 }],
  flyHome: { x: 205, y: 196 }, radio: { x: 276, y: 152 }, exitX: 112
};

/* ---------- static pieces ---------- */
function drawSky(c) {
  ctx = c.x; const r = rng(7), bands = T.sky; E(0, 0, LW, LH, bands[0]);
  for (let y = 0; y < 230; y++) { const k = y / 230, i = k < 0.5 ? 0 : 1, f = k < 0.5 ? k * 2 : (k - 0.5) * 2; const a = bands[i], b = bands[i + 1], n1 = parseInt(a.slice(1), 16), n2 = parseInt(b.slice(1), 16);
    const q = Math.round(f * 5) / 5, mix = (s) => Math.round(((n1 >> s) & 255) * (1 - q) + ((n2 >> s) & 255) * q); E(0, y, LW, 1, '#' + hex2(mix(16)) + hex2(mix(8)) + hex2(mix(0))); }
  if (T.sunGlow) { const g = ctx.createRadialGradient(T.sunGlow[0], T.sunGlow[1], 4, T.sunGlow[0], T.sunGlow[1], 160); g.addColorStop(0, T.sunGlow[2]); g.addColorStop(1, 'rgba(255,150,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, LW, 260); }
  for (let i = 0; i < 90 * T.stars; i++) { const x = r() * LW | 0, y = r() * 130 | 0; E(x, y, 1, 1, r() < .2 ? '#ffffff' : '#9fb4e8'); }
  if (T.moon) { disc(412, 42, 9, '#f4f0d8', E); disc(416, 39, 8, T.sky[0], E); E(405, 38, 1, 1, '#f4f0d8'); }
  const cc = (x, y, w) => { for (let i = 0; i < w; i += 2) { const h = 3 + Math.round(Math.sin(i / w * Math.PI) * 5); E(x + i, y - h, 3, h, T.clouds); } E(x - 2, y, w + 4, 3, T.clouds); };
  if (tname !== 'night') { cc(300, 52, 50); cc(380, 34, 38); cc(180, 28, 34); } else { cc(330, 56, 60); cc(160, 40, 40); }
}
function drawFarBuildings(x) {
  ctx = x; const r = rng(31), win = (bx, by, w, h, cols, rows, lit) => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const on = r() < lit; if (on) E(bx + 4 + i * 9, by + 5 + j * 12, 5, 7, r() < .5 ? '#ffd27a' : '#ffbe5c'); else P(bx + 4 + i * 9, by + 5 + j * 12, 5, 7, tname === 'day' || tname === 'morning' ? '#7d95b0' : '#26324f'); P(bx + 4 + i * 9, by + 4 + j * 12, 5, 1, '#3a3f4e'); } };
  const bl = (bx, by, w, h, c, cols, rows) => { P(bx, by, w, h, c); P(bx, by, w, 2, shade(c, 0.15)); P(bx + w - 3, by, 3, h, shade(c, -0.2)); win(bx, by, w, h, cols, rows, T.lit); };
  bl(414, 62, 70, 200, '#6a5a58', 7, 15); bl(452, 130, 40, 150, '#7a6a5e', 4, 11); bl(0, 118, 58, 150, '#5e5260', 5, 10); bl(26, 150, 44, 120, '#6c5c58', 4, 8);
  P(430, 54, 12, 8, '#3a3a40'); P(436, 44, 2, 10, '#3a3a40');
}
function drawPole(x) {
  ctx = x; P(444, 0, 6, 306, '#5a4030'); P(444, 0, 2, 306, '#7a5a40'); P(448, 0, 2, 306, '#3a281c'); P(430, 28, 34, 4, '#4a3426'); P(432, 24, 2, 4, '#cfcfd6'); P(444, 22, 2, 6, '#cfcfd6'); P(460, 24, 2, 4, '#cfcfd6');
  for (let i = 0; i < 6; i++) P(445, 60 + i * 38, 4, 3, '#2e2018');
  P(408, 22, 36, 3, '#3a3a40'); P(404, 24, 8, 6, '#4a4a52'); P(405, 28, 6, 2, '#fff2c0'); // street lamp arm + head
  const wire = (x0, y0, x1, y1, sag) => { for (let i = 0; i <= 120; i++) { const t = i / 120; P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag, 1, 1, '#1d1612'); } };
  wire(446, 30, 396, 44, 5); wire(446, 31, 480, 52, 4); wire(446, 29, 0, 12, 14); wire(446, 32, 330, 22, 6);
}
function drawShedAndTree(x) {
  ctx = x; const r = rng(55);
  P(8, 96, 82, 74, '#3d4a58'); P(8, 96, 82, 5, '#566574'); for (let i = 0; i < 82; i += 4) P(8 + i, 100, 2, 70, '#35414e'); speckle(8, 100, 82, 70, ['#4a3a30', '#2c3640'], 0.05, r);
  P(2, 90, 94, 8, '#4a5766'); for (let i = 0; i < 94; i += 3) P(2 + i, 90, 1, 8, '#6a7886');
}
function tin(x0, y0, w, h, r, base = '#7b838a') { // corrugated sheet
  for (let i = 0; i < w; i++) { const m = i % 4; P(x0 + i, y0, 1, h, m === 0 ? shade(base, 0.2) : m === 1 ? base : m === 2 ? shade(base, -0.1) : shade(base, -0.25)); }
  speckle(x0, y0, w, h, ['#8a5a3a', '#6a4430', '#a06a40'], 0.035, r);
  for (let i = 0; i < w / 14; i++) { const x = x0 + (r() * w | 0), y = y0 + (r() * (h - 6) | 0); P(x, y, 2, 4 + (r() * 5 | 0), '#7a4c30'); }
}
function drawRoof(x) {
  ctx = x; const r = rng(77);
  P(98, 20, 6, 70, '#3a2a1e'); P(392, 20, 6, 70, '#3a2a1e');
  tin(52, 24, 386, 20, r, '#69727a'); P(52, 22, 386, 3, '#8a929a'); P(52, 43, 386, 4, '#3a2e26'); P(52, 47, 386, 2, '#1e1814');
  for (let i = 0; i < 386; i += 4) P(52 + i, 22, 2, 1, '#b4bcc2');
  tin(44, 46, 400, 8, r, '#4e565e'); P(44, 54, 400, 3, '#1f1a16');
  P(30, 58, 70, 3, '#2a2018'); P(380, 58, 66, 3, '#2a2018');
}
function drawSign(x) {
  ctx = x; const r = rng(91), X0 = 108, Y0 = 58, W = 280, H = 40;
  P(X0 - 3, Y0 - 3, W + 6, H + 6, '#4a3020'); bx(X0, Y0, W, H, '#e9d8b0'); speckle(X0, Y0, W, H, ['#d6c294', '#f3e6c4', '#c8b080'], 0.14, r);
  const edge = T === TIMES.night || T === TIMES.dusk ? '#243c78' : '#8a2a22'; P(X0 + 2, Y0 + 2, W - 4, 1, edge); P(X0 + 2, Y0 + H - 3, W - 4, 1, edge); P(X0 + 2, Y0 + 2, 1, H - 4, edge); P(X0 + W - 3, Y0 + 2, 1, H - 4, edge);
  for (const [cx, cy] of [[X0 + 4, Y0 + 4], [X0 + W - 7, Y0 + 4], [X0 + 4, Y0 + H - 7], [X0 + W - 7, Y0 + H - 7]]) { P(cx, cy, 3, 3, edge); P(cx + 1, cy + 1, 1, 1, '#e9d8b0'); }
  const col = tname === 'dusk' ? '#1a2a78' : '#9a1c1c'; const w = pixelText('राकेश होटल', X0 + 14, Y0 + 27, 24, col, { bold: true }); pixelText('समोसा • पकोड़ा • कचौरी • चाय • ठंडा पेय', X0 + 14, Y0 + 37, 6, '#4a2a1c', { bold: true });
  speckle(X0 + 8, Y0 + 6, 150, 28, ['#e9d8b0'], 0.07, r);
  // samosa plate + chai glass painted on the right
  const px = X0 + 214, py = Y0 + 6; disc(px + 12, py + 22, 10, '#f4f0e6'); P(px + 3, py + 25, 20, 3, '#d8d2c4');
  for (const [sx, sy] of [[px + 4, py + 14], [px + 13, py + 12]]) { for (let i = 0; i < 8; i++) P(sx + 4 - Math.round(i / 2), sy + i, 1 + Math.round(i), 1, i < 2 ? '#e6a63c' : '#cc8a28'); P(sx + 1, sy + 6, 8, 1, '#a86a1c'); }
  bx(px + 27, py + 12, 9, 13, '#b8784a'); P(px + 28, py + 13, 7, 3, '#e8d2b8'); P(px + 36, py + 15, 3, 6, '#b8784a'); P(px + 38, py + 16, 1, 4, '#e9d8b0');
  
}
function drawBackWall(x, wall = true) { // wall = false: only the shelves, jars, shrine, fridge, chips strip (for open-air stalls)
  ctx = x; const r = rng(123);
  if (wall) {
  P(100, 92, 296, 170, '#4e4034'); speckle(100, 92, 296, 170, ['#5a4a3c', '#43362c', '#62503e'], 0.2, r);
  for (let j = 0; j < 8; j++) P(100, 100 + j * 20, 296, 1, '#42352b'); for (let i = 0; i < 12; i++) P(104 + i * 26, 92, 1, 116, '#42352b');
  P(100, 92, 296, 4, '#2a2018'); P(100, 92, 3, 170, '#2a2018'); P(393, 92, 3, 170, '#2a2018');
  }
  // shelves
  for (const [sy, x0, x1] of [[124, 150, 366], [152, 150, 296]]) { bx(x0, sy, x1 - x0, 4, '#6a4a2c'); P(x0, sy + 4, x1 - x0, 2, '#2a1c12'); }
  // jars on shelf 1
  const jc = ['#d8a24a', '#c4553a', '#e0d4a8', '#6a8a52', '#d8884a'], lc = ['#b8332a', '#2a5a9a', '#d8b02a'];
  for (let i = 0; i < 10; i++) { const jx = 154 + i * 17, h = 12 + (i % 3) * 2, c = jc[i % 5]; P(jx, 124 - h, 12, h, 'rgba' && '#9aaeb0'); P(jx + 1, 124 - h + 2, 10, h - 3, c); P(jx + 2, 124 - h + 2, 2, h - 3, shade(c, 0.3)); P(jx - 1, 124 - h - 3, 14, 3, lc[i % 3]); P(jx - 1, 124 - h - 3, 14, 1, shade(lc[i % 3], 0.3)); }
  // shelf 2: steel tins + bottles
  for (let i = 0; i < 5; i++) { const tx = 154 + i * 22; bx(tx, 152 - 14, 16, 14, i % 2 ? '#aab2ba' : '#8c949c'); P(tx + 2, 152 - 11, 12, 1, '#e0e4e8'); P(tx + 2, 152 - 5, 12, 1, '#6a727a'); }
  
  // calendar, clock, shrine
  bx(284, 100, 22, 28, '#e4d8bc'); P(285, 101, 20, 9, '#c4562a'); for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) P(287 + i * 3, 113 + j * 3, 2, 2, '#4a3a2a'); P(290, 103, 10, 5, '#f0d27a');
  disc(318, 108, 9, '#e8e0cc'); disc(318, 108, 7, '#f6f0e0'); P(317, 101, 1, 7, '#2a2018'); P(318, 108, 5, 1, '#2a2018');
  bx(230, 126, 22, 30, '#6a3a22'); P(233, 129, 16, 24, '#e8c070'); disc(241, 138, 5, '#2a5a9a'); P(238, 145, 6, 6, '#d8504a'); P(240, 132, 3, 3, '#f0d27a');
  P(228, 142, 26, 3, '#c43a2a'); for (let i = 0; i < 6; i++) P(230 + i * 4, 145, 2, 4 + (i % 2), '#e8a030'); // garland
  bx(224, 158, 36, 4, '#5a3a22'); bx(238, 153, 7, 5, '#c4a060'); P(240, 154, 3, 1, '#2a1c12');
  // plant above fridge, fridge
  bx(366, 104, 26, 104, '#c8c8cc'); P(366, 104, 26, 18, '#cc2a24'); P(368, 108, 22, 3, '#f4f4f4'); P(370, 112, 16, 2, '#f4f4f4'); P(368, 124, 22, 82, '#222a30');
  for (let sh = 0; sh < 4; sh++) { const fy = 128 + sh * 20; P(368, fy + 17, 22, 2, '#3a444c'); for (let b = 0; b < 5; b++) { const bc = ['#b8332a', '#d8884a', '#3a9a52', '#e8e8ee', '#b8332a'][(b + sh) % 5]; P(370 + b * 4, fy + 4, 3, 13, bc); P(370 + b * 4, fy + 2, 3, 2, '#c8c8d0'); P(370 + b * 4, fy + 6, 1, 8, shade(bc, 0.35)); } } P(392, 130, 2, 14, '#8a8a90'); bx(372, 90, 8, 14, '#5a3a22'); for (let i = 0; i < 9; i++) { P(371 + i * 2, 76 + (i % 3) * 3, 3, 14 - (i % 3) * 3, '#3f7a3a'); P(372 + i * 2, 78 + (i % 3) * 3, 1, 8, '#68a850'); }
  // hanging chips strips + biscuit packets
  P(104, 96, 56, 1, '#1d1612'); const pc = ['#e0a82a', '#2a6ab0', '#c43a2a', '#3a9a52', '#d86a2a'];
  for (let k = 0; k < 7; k++) { const px = 108 + k * 7; P(px + 2, 96, 1, 6, '#1d1612'); for (let m = 0; m < 4; m++) { const c = pc[(k + m * 2) % 5], py = 100 + m * 11; bx(px, py, 6, 10, c); P(px + 1, py + 3, 4, 3, '#f4f0e0'); P(px, py, 6, 2, shade(c, -0.2)); } }
  // cords for bulbs
  for (const b of L.lamps.slice(0, 3)) { P(b.x, 92, 1, b.y - 92, '#1a1410'); P(b.x - 2, b.y - 5, 5, 5, '#3a3a40'); }
}
function drawBoard(x) {
  ctx = x; const r = rng(5); P(46, 114, 52, 6, '#4a3020'); bx(48, 120, 46, 86, '#2f3a34'); P(46, 118, 50, 3, '#6a4a2c'); P(46, 204, 50, 3, '#6a4a2c'); speckle(50, 122, 42, 80, ['#38443e', '#262f2a'], 0.15, r);
  pixelText('मेन्यू', 71, 131, 9, '#f2ecd8', { bold: true, align: 'center' }); P(54, 135, 34, 1, '#d8d2c0');
  const rows = [['समोसा', '15'], ['पकोड़ा', '15'], ['कचौरी', '20'], ['आलू बड़ा', '15'], ['चाय', '10'], ['कॉफी', '15'], ['ठंडा पेय', '20']];
  rows.forEach((q, i) => { pixelText(q[0], 53, 147 + i * 10, 7, '#ece6d2', { bold: true }); pixelText(q[1], 83, 147 + i * 10, 7, '#ece6d2', { bold: true }); });
  P(52, 138, 40, 1, '#556a5c');
}
function drawGround(x) {
  ctx = x; const r = rng(200);
  P(0, 262, LW, 44, '#7a6a58'); // pavement
  for (let j = 0; j < 6; j++) { const y = 262 + j * 8 + j * j * 0.4 | 0, h = 8 + j; for (let i = -1; i < 14; i++) { const xx = i * 40 + (j % 2) * 20 - 4; P(xx, y, 38, h - 1, ['#85735f', '#7d6c59', '#8a7864'][(i + j + 3) % 3]); P(xx, y, 38, 1, '#9a8872'); P(xx, y + h - 1, 38, 1, '#4a3e32'); } }
  speckle(0, 262, LW, 44, ['#6a5a48', '#4c4034', '#a09078'], 0.08, r); for (let i = 0; i < 40; i++) P(r() * LW | 0, 264 + r() * 40 | 0, 3, 1, '#4f6a3a'); // moss
  P(0, 306, LW, 5, '#9a9488'); P(0, 306, LW, 1, '#bdb6a8'); P(0, 310, LW, 1, '#4a463e'); // curb
  P(0, 311, LW, 9, '#3c3a40'); speckle(0, 311, LW, 9, ['#4a484e', '#2c2a30'], 0.2, r);
  P(0, 262, LW, 2, '#4a3e32'); // base shadow line under counter
  for (let i = 0; i < 26; i++) { const lx = r() * LW | 0, ly = 266 + r() * 38 | 0; P(lx, ly, 3, 2, ['#c8902a', '#9a6a1c', '#6a8a30'][i % 3]); }
}
function drawFurnitureBack(x) { // crates, bins, matka drum, stools
  ctx = x; const r = rng(14);
  // crates (left outside)
  for (let k = 0; k < 3; k++) { const cy = 262 - 12 * (k + 1); bx(40, cy, 36, 12, k % 2 ? '#2a4e8a' : '#c0382a'); for (let b = 0; b < 4; b++) { P(43 + b * 8, cy - 8, 5, 8, '#5a2a1c'); P(44 + b * 8, cy - 11, 3, 3, '#b8b8c0'); } }
  // dustbin
  bx(18, 232, 22, 30, '#8a9298'); P(16, 229, 26, 4, '#aab2b8'); for (let i = 0; i < 4; i++) P(21 + i * 5, 236, 1, 22, '#6a7278');
  // water drum right
  bx(404, 214, 26, 40, '#2a5aa0'); P(404, 214, 26, 5, '#4a7ac0'); P(430, 232, 6, 3, '#8a8a90'); P(412, 254, 4, 8, '#5a4030'); P(420, 254, 4, 8, '#5a4030'); P(432, 235, 2, 6, '#7ac0e0');
  // stools (behind seated people)
  for (const s of L.seats) { const x0 = s.x - 11; bx(x0, s.y, 22, 4, ['#c0382a', '#2a4e8a'][L.seats.indexOf(s) % 2]); for (const lx of [x0 + 1, x0 + 17]) { P(lx, s.y + 4, 3, 22, ['#a02a20', '#1e3c6e'][L.seats.indexOf(s) % 2]); P(lx, s.y + 4, 1, 22, '#00000030'); } P(x0 + 2, s.y + 14, 18, 2, ['#a02a20', '#1e3c6e'][L.seats.indexOf(s) % 2]); }
}
function drawTables(x) { // in front of seated people (their laps are hidden behind the plank)
  ctx = x; const r = rng(9);
  for (const t of L.tables) { const y = 262, w = t.x1 - t.x0; bx(t.x0, y, w, 6, '#7a5230'); P(t.x0, y + 6, w, 2, '#2a1a10'); for (let i = 0; i < w; i += 11) P(t.x0 + i, y + 1, 1, 4, '#5a3a20'); speckle(t.x0, y, w, 6, ['#8a6238', '#684422'], 0.15, r);
    for (const lx of [t.x0 + 4, t.x1 - 8]) { P(lx, y + 8, 4, 22, '#4a3018'); P(lx, y + 8, 1, 22, '#6a4a2a'); } P(t.x0 + 4, y + 20, w - 8, 2, '#3a2412'); }
}
function drawCounter(x) {
  ctx = x; const r = rng(66);
  bx(94, 208, 314, 5, '#8a6a46'); for (let i = 0; i < 314; i += 9) P(96 + i, 209, 1, 3, '#6a4e30'); P(94, 213, 314, 2, '#2a1c12');
  P(98, 215, 304, 47, '#4a6a86'); speckle(98, 215, 304, 47, ['#56788f', '#3e5c78', '#6a4a30', '#7a4a2c'], 0.14, r);
  for (let i = 0; i < 9; i++) { const rx = 100 + (r() * 296 | 0), ry = 217 + (r() * 30 | 0); P(rx, ry, 6 + (r() * 8 | 0), 3 + (r() * 4 | 0), '#8a4e2c'); P(rx + 1, ry + 3, 2, 4 + (r() * 8 | 0), '#7a4426'); }
  for (let i = 0; i < 5; i++) { P(98 + i * 76, 215, 2, 47, '#2e445a'); P(99 + i * 76, 215, 1, 47, '#6a8aa4'); } P(98, 244, 304, 2, '#2e445a'); P(98, 260, 304, 3, '#22344a');
  // paytm QR on the front panel + sticker
  bx(376, 226, 22, 26, '#f2f2f4'); P(378, 228, 18, 4, '#1a4fb4'); pixelText('Paytm', 387, 231, 4, '#ffffff', { align: 'center', bold: true }); P(379, 234, 16, 16, '#ffffff'); const q = rng(3); for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (q() < .55) P(380 + i * 2, 235 + j * 2, 2, 2, '#14141c'); for (const [qx, qy] of [[380, 235], [390, 235], [380, 245]]) { P(qx, qy, 4, 4, '#14141c'); P(qx + 1, qy + 1, 2, 2, '#fff'); }
  // gas cylinder under counter at left; sack
  bx(108, 224, 22, 36, '#a82a22'); P(112, 220, 14, 5, '#7a1c18'); P(114, 216, 10, 4, '#5a1612'); P(108, 238, 22, 3, '#d8d0c0');
  bx(136, 240, 26, 20, '#c8b890'); for (let i = 0; i < 4; i++) P(138, 243 + i * 4, 22, 1, '#a89870');
}
function drawCaseShells(x) {
  ctx = x; const cs = [[112, 66], [180, 66], [248, 52]];
  for (const [cx, w] of cs) { P(cx, 202, w, 6, '#9aa2aa'); P(cx, 202, w, 1, '#d0d6dc'); P(cx, 206, w, 2, '#5a626a'); }
}
function drawCaseGlass(x) { // glass fronts over the snacks (drawn after items)
  ctx = x; const cs = [[112, 66], [180, 66], [248, 52]]; ctx.globalAlpha = 0.16; for (const [cx, w] of cs) { E(cx, 176, w, 28, '#cfe8f0'); } ctx.globalAlpha = 1;
  for (const [cx, w] of cs) { E(cx, 176, w, 1, 'rgba(255,255,255,.55)'); E(cx, 176, 1, 28, 'rgba(255,255,255,.4)'); E(cx + w - 1, 176, 1, 28, 'rgba(160,190,200,.5)'); E(cx + 6, 178, 1, 20, 'rgba(255,255,255,.35)'); E(cx + w - 9, 180, 1, 14, 'rgba(255,255,255,.25)'); P(cx, 203, w, 1, '#6a727a'); }
  P(110, 175, 70, 2, '#7a828a'); P(178, 175, 70, 2, '#7a828a'); P(246, 175, 56, 2, '#7a828a');
}
function drawStove(x) {
  ctx = x; bx(300, 198, 56, 10, '#222226'); P(302, 199, 52, 1, '#3a3a40'); P(310, 196, 14, 2, '#18181c'); P(338, 196, 14, 2, '#18181c');
  bx(358, 192, 18, 16, '#a8afb6'); for (let i = 0; i < 4; i++) { P(360 + i * 4, 186, 3, 6, 'rgba' && '#c8e0ea'); }
  // soundbox
  bx(380, 196, 14, 12, '#1a4fb4'); P(382, 198, 10, 3, '#f2f2f4'); P(383, 203, 8, 2, '#0a2a70');
}
function drawCarton(x) {
  ctx = x; bx(98, 190, 26, 18, '#b88a52'); P(98, 190, 26, 2, '#d8aa6a'); P(100, 184, 8, 7, '#a07840'); P(114, 183, 10, 8, '#a07840'); P(102, 193, 18, 2, '#8a6a3a'); for (let i = 0; i < 3; i++) P(104 + i * 7, 186, 5, 6, ['#d8a02a', '#c43a2a', '#2a6ab0'][i]);
}

/* ---------- foreground (drawn after everything, with sway) ---------- */
function drawCanopy(c) { // trunk + branches (static). The leaves are separate sprites so they can sway in the wind.
  ctx = c.x; ctx.clearRect(0, 0, LW, LH); const r = rng(808), bark = '#4a3426', barkL = '#7a5a40', barkD = '#2a1c12';
  const branch = (x0, y0, x1, y1, w0, w1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * 3.1) * 2, w = w0 + (w1 - w0) * t; P(x - w / 2, y - w / 2, w, w, bark); P(x - w / 2, y - w / 2, Math.max(1, w * .3), w, barkL); P(x + w / 2 - Math.max(1, w * .3), y - w / 2, Math.max(1, w * .3), w, barkD); } };
  // trunk with flared roots and bark ridges
  for (let y = 40; y < 306; y++) { const t = (y - 40) / 266, wdt = 38 + t * 14 + (y > 280 ? (y - 280) * 1.4 : 0); P(0, y, wdt, 1, bark); P(0, y, 7, 1, barkL); P(wdt - 11, y, 11, 1, barkD); }
  speckle(0, 40, 52, 266, [barkD, '#5a4030', barkL], 0.08, r); for (let i = 0; i < 26; i++) { const x = 3 + (r() * 36 | 0), y = 50 + (r() * 240 | 0); P(x, y, 1 + (r() * 2 | 0), 6 + (r() * 16 | 0), barkD); } for (let i = 0; i < 9; i++) P(8 + r() * 24 | 0, 70 + r() * 200 | 0, 4, 3, '#3a5a2a');
  P(40, 292, 20, 14, barkD); P(34, 300, 28, 6, bark);
  branch(30, 90, 74, 40, 14, 8); branch(60, 46, 112, 18, 9, 4); branch(34, 70, 56, 16, 10, 5); branch(40, 100, 96, 70, 7, 3); branch(70, 40, 128, 8, 5, 2);
}
const FOLIAGE = [ // centre x, centre y, radius x, radius y — the canopy hangs over the roof edge and thins out to the right
  [14, 22, 34, 30], [46, 12, 36, 24], [86, 8, 36, 22], [124, 16, 34, 24], [160, 10, 30, 18], [196, 14, 30, 20], [232, 8, 26, 16], [270, 12, 24, 16], [310, 8, 22, 14],
  [18, 64, 30, 26], [52, 52, 30, 22], [92, 36, 28, 18], [132, 40, 26, 18], [170, 34, 22, 14], [210, 30, 20, 12], [250, 26, 18, 10], [8, 98, 22, 20], [40, 92, 20, 16], [70, 74, 22, 14]
];
function makeFoliage() {
  const r = rng(515), greens = ['#244a20', '#2f6028', '#3f7a32', '#58963e', '#7ab852'], out = [];
  FOLIAGE.forEach(([cx, cy, rx, ry], k) => {
    const pad = 8, w = rx * 2 + pad * 2, h = ry * 2 + pad * 2, c = mk(w, h); ctx = c.x; const tufts = [];
    for (let i = 0; i < rx * ry / 5.5; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 1.02, u = Math.cos(a) * d, v = Math.sin(a) * d; tufts.push({ x: rx + pad + u * rx, y: ry + pad + v * ry, u, v, s: 3 + (r() * 3 | 0) }); }
    tufts.sort((p, q) => p.y - q.y);
    for (const t of tufts) { const lit = clamp(0.55 - t.v * 0.5 - t.u * 0.3 + (r() - 0.5) * 0.35, 0, 0.999), col = greens[Math.floor(lit * greens.length)]; const x = Math.round(t.x - t.s / 2), y = Math.round(t.y - t.s / 2);
      P(x, y + 1, t.s, t.s - 1, shade(col, -0.25)); P(x, y, t.s, t.s - 1, col); P(x, y, Math.max(1, t.s - 2), 1, shade(col, 0.28)); if (r() < 0.12) P(x + 1, y + 1, 1, 1, shade(col, 0.4)); }
    out.push({ c: c.c, x: cx - rx - pad, y: cy - ry - pad, amp: 1.1 + r() * 0.9, sp: 0.5 + r() * 0.5, ph: r() * 6.28 });
  });
  // loose leaves that flutter faster than the clumps
  const fl = mk(8, 6); ctx = fl.x; P(1, 1, 5, 3, '#6aa84a'); P(1, 1, 3, 1, '#98d070'); P(2, 4, 3, 1, '#2f6028');
  for (let i = 0; i < 26; i++) { const k = FOLIAGE[(r() * FOLIAGE.length) | 0]; out.push({ c: fl.c, x: k[0] + (r() * 2 - 1) * k[2], y: k[1] + (r() * 2 - 1) * k[3] * 0.8, amp: 1.6 + r() * 1.4, sp: 1.6 + r() * 1.4, ph: r() * 6.28, loose: true }); }
  return out;
}
/* ---------- emissive pass: things that give off light (added on top with additive blending) ---------- */
function drawEmit(c) {
  ctx = c.x; const l = Math.max(T.lamps, tname === 'day' ? 0.12 : 0.2);
  const rect = (x, y, w, h, col, a) => { ctx.fillStyle = 'rgba(' + col + ',' + a + ')'; ctx.fillRect(x, y, w, h); };
  rect(368, 124, 22, 82, '170,215,255', 0.32 * l + 0.06); rect(370, 126, 18, 3, '230,245,255', 0.4 * l);
  for (const [cx, w] of [[112, 66], [180, 66], [248, 52]]) { rect(cx + 1, 178, w - 2, 26, '255,196,100', 0.22 * l + 0.04); rect(cx + 1, 178, w - 2, 3, '255,230,170', 0.3 * l); }
  if (T.lamps > 0.1) { rect(108, 58, 280, 40, '255,200,130', 0.1 * T.lamps); for (const b of L.lamps.slice(0, 3)) { rect(b.x - 2, b.y - 3, 5, 4, '255,240,190', 0.9); rect(b.x - 1, b.y - 2, 3, 2, '255,255,235', 1); } rect(404, 26, 8, 4, '255,240,190', 0.9); }
   rect(380, 198, 14, 3, '120,170,255', 0.25);
}
/* ---------- building the cached layers ---------- */
const layers = { far: null, foliage: null, emit: null, sky: null, back: null, front: null, furnBack: null, tables: null, canopy: null, light: null };
const glows = {};
function glowSprite(r, rgb) { const k = r + rgb; if (glows[k]) return glows[k]; const c = mk(r * 2, r * 2); const g = c.x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, `rgba(${rgb},0.38)`); g.addColorStop(0.35, `rgba(${rgb},0.12)`); g.addColorStop(1, `rgba(${rgb},0)`); c.x.fillStyle = g; c.x.fillRect(0, 0, r * 2, r * 2); return glows[k] = c.c; }
/* ---------- environments & themes (see docs/THEME_API.md) ---------- */
const ENVS = {}, THEMES = {};
const DEFAULT_LAYERS = {
  sky: c => drawSky({ x: c }), far: c => { drawFarBuildings(c); drawPole(c); drawShedAndTree(c); }, roof: c => drawRoof(c), backWall: c => drawBackWall(c), backWallItems: c => drawBackWall(c, false), sign: c => drawSign(c), board: c => drawBoard(c), ground: c => drawGround(c),
  furnBack: c => drawFurnitureBack(c), tables: c => drawTables(c), counter: c => { drawCounter(c); drawCaseShells(c); drawCarton(c); drawStove(c); }, glass: c => drawCaseGlass(c),
  canopy: c => drawCanopy({ x: c }), foliage: () => makeFoliage(), emit: c => drawEmit({ x: c })
};
const api = { K, RW, RH, get T() { return T; }, get name() { return tname; }, L, tone, shade, P, E, bx, disc, line, speckle, pixelText, rng, mk, glowSprite, clamp };
function registerEnv(id, spec) { ENVS[id] = Object.assign({ id, label: id, icon: '🏘', layers: {}, dynamic: [], mix: {}, people: null }, spec); }
function registerTheme(id, spec) { THEMES[id] = Object.assign({ id, label: id, icon: '🎨', grade: null, post: null, outlineW: 1, outlineColor: '#150c08', actors: {}, css: id }, spec); }
registerEnv('city', { label: 'Old City', icon: '🏙️' }); registerTheme('retro', { label: 'Retro', icon: '📻' });
function runLayer(name, c2d) { const f = (curEnv.layers && curEnv.layers[name]) || DEFAULT_LAYERS[name]; ctx = c2d; return f(c2d, api); }
function build(name, env, theme) {
  tname = name; T = TIMES[name]; envId = ENVS[env] ? env : envId; themeId = THEMES[theme] ? theme : themeId; curEnv = ENVS[envId]; curTheme = THEMES[themeId]; toneMemo.clear();
  const sky = mk(), far = mk(), back = mk(), front = mk(), fb = mk(), tb = mk(), can = mk(), em = mk();
  runLayer('sky', sky.x); runLayer('far', far.x);
  for (const l of ['roof', 'backWall', 'sign', 'board', 'ground']) runLayer(l, back.x);
  runLayer('furnBack', fb.x); runLayer('tables', tb.x); runLayer('counter', front.x); runLayer('canopy', can.x); const foliage = runLayer('foliage', can.x) || []; runLayer('emit', em.x);
  Object.assign(layers, { foliage, emit: em.c, sky: sky.c, far: far.c, back: back.c, front: front.c, furnBack: fb.c, tables: tb.c, canopy: can.c });
  return layers;
}
function runDynamic(z, c2d, t, dt) { if (!curEnv || !curEnv.dynamic) return; ctx = c2d; for (const d of curEnv.dynamic) if (d.z === z) { try { d.draw(c2d, t, dt, api, curEnv); } catch (e) { if (!d._err) { d._err = 1; console.log('ENV_DYNAMIC_ERR ' + curEnv.id + ' ' + e.message); } } } }
// foreground glass drawn each frame cheaply (static canvas)
function glassLayer() { const g = mk(); runLayer('glass', g.x); return g.c; }

window.Art = { LW, LH, K, RW, RH, L, TIMES, build, layers, registerEnv, registerTheme, runDynamic, defaults: DEFAULT_LAYERS, ENVS, THEMES, api, get env() { return curEnv; }, get theme() { return curTheme; }, get envId() { return envId; }, get themeId() { return themeId; }, tone, shade, glowSprite, glassLayer, pixelText, get T() { return T; }, get name() { return tname; }, rng, mk, setCtx(c) { ctx = c; }, P, E, bx, disc, line, speckle };
})();
