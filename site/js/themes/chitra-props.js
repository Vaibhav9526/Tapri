/* Held / counter props for the "chitra" theme: smooth vector, ink outline #20140e, flat colour + one shade (matches envs/mohalla.js and the chitra people).
   Same signatures and coordinates as the built-in Sprites.props (render px relative to the actor origin; one built-in "unit" = Z render px),
   called as props.<name>(ctx, ox, oy, ...args) by the hook in people.js. */
(() => {
'use strict';
const INK = '#20140e', Z = (Art.K || 2) / 2, tone = c => Art.tone(c), SH = Art.shade;
const at = (g, ox, oy, x, y, fn, rot = 0, sc = Z) => { g.save(); g.translate(ox + x, oy + y); if (rot) g.rotate(rot); g.scale(sc, sc); g.lineJoin = 'round'; g.lineCap = 'round'; g.imageSmoothingEnabled = true; fn(g); g.restore(); };
const poly = (g, pts, fill, lw = 1.1, alpha = 1) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.globalAlpha = alpha; g.fillStyle = tone(fill); g.fill(); g.globalAlpha = 1; } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } };
const blob = (g, pts, fill, lw = 1.1) => { const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s = m(pts[n - 1], pts[0]); g.beginPath(); g.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const e = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); } g.closePath(); if (fill) { g.fillStyle = tone(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } };
const ell = (g, x, y, rx, ry, fill, lw = 1.1, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.2832); if (fill) { g.fillStyle = tone(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } };
const ln = (g, x0, y0, x1, y1, col, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col === INK ? INK : tone(col); g.stroke(); };
const rawLn = (g, x0, y0, x1, y1, col, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col; g.stroke(); };
const rod = (g, x0, y0, x1, y1, w, col) => { ln(g, x0, y0, x1, y1, INK, w + 1.6); ln(g, x0, y0, x1, y1, col, w); }; // inked stick

const props = {
  glass(g, ox, oy, x, y, lvl = 0) { // cutting-chai glass with a visible chai level
    at(g, ox, oy, x, y, g => {
      const body = [[-5, -16], [6, -16], [4, 0], [-3, 0]];
      poly(g, body, '#dcece6', 0, .5);
      if (lvl > 0) {
        const h = Math.max(1.5, 12 * lvl), w0 = 5 + (16 - h) * .07, w1 = 4;
        const lq = [[-4.9 + (h) * .05, -h], [5.9 - h * .12, -h], [4, -.6], [-3, -.6]];
        poly(g, lq, '#b5703a', 0); poly(g, [[1.6, -h], [5.9 - h * .12, -h], [4, -.6], [1, -.6]], '#8a4d28', 0); // chai + shade side
        ln(g, lq[0][0] + .2, -h + .2, lq[1][0] - .2, -h + .2, '#ecd29c', 1.1); void w0; void w1; // froth line
      }
      poly(g, body, null, 1.2);
      rawLn(g, -3.6, -14.6, -2.6, -2.6, 'rgba(255,255,255,.75)', 1.1);
      rawLn(g, -5, -16, 6, -16, 'rgba(255,255,255,.7)', .8);
    });
  },
  steel(g, ox, oy, x, y) { // steel tumbler
    at(g, ox, oy, x, y, g => {
      poly(g, [[-5, -14], [5, -14], [4, 0], [-4, 0]], '#c3c8c1'); poly(g, [[2, -13.4], [5, -14], [4, 0], [1.6, 0]], '#8e968f', 0);
      poly(g, [[-5, -14], [5, -14], [4, 0], [-4, 0]], null, 1.2); rawLn(g, -3.2, -12, -2.6, -2, 'rgba(255,255,255,.85)', 1.2); ln(g, -5, -11.5, 5, -11.5, '#8e968f', .8);
    });
  },
  phone(g, ox, oy, x, y, t) {
    at(g, ox, oy, x, y, g => {
      poly(g, [[-6, -11], [5, -12], [6, 8], [-5, 9]], '#2b3340'); poly(g, [[-4.2, -9.4], [4.2, -10.2], [4.8, 6.2], [-3.8, 7]], '#94d2d8', .6);
      for (let i = 0; i < 4; i++) rawLn(g, -3, -5 + i * 3, i % 2 ? 1.2 : 2.6, -5.2 + i * 3, 'rgba(32,60,70,.7)', .9);
      rawLn(g, -3.4, -8.4, 3, -9, 'rgba(255,255,255,.55)', 1);
    });
  },
  phoneEar(g, ox, oy, x, y) { at(g, ox, oy, x, y, g => { poly(g, [[-2, -10], [4, -10.4], [4.4, 8], [-1.6, 8.4]], '#2b3340'); rawLn(g, -.8, -8.4, -.4, 6, 'rgba(160,200,205,.6)', 1); }); },
  samosa(g, ox, oy, x, y, bites = 0) {
    at(g, ox, oy, x, y, g => {
      const b = [[-7, 0], [-5, -5], [1, -16], [4, -13], [10, 0], [3, 2]];
      blob(g, b, '#d9a043', 0); poly(g, [[1, -16], [4, -13], [10, 0], [3, 2], [2, -6]], '#b97c2c', 0); blob(g, b, null, 1.2);
      rawLn(g, -3.4, -2, 1, -11.5, 'rgba(255,230,160,.75)', 1.2); for (let i = 0; i < 5; i++) { ell(g, -1 + (i % 3) * 3, -3 - i * 2.2, .6, .5, '#a36a22', 0); }
      if (bites) { ell(g, 6.4, -5.6, 2.6, 2.6, '#f0d596', .9); }
    });
  },
  chips(g, ox, oy, x, y, open, col = '#b58b46') {
    at(g, ox, oy, x, y, g => {
      const b = [[-8, -18], [7, -19], [9, 3], [-8, 3]];
      poly(g, b, col); poly(g, [[3, -18.6], [7, -19], [9, 3], [3, 3]], SH(col, -.25), 0); poly(g, [[-8, -18], [7, -19], [7, -16.6], [-8, -15.8]], SH(col, -.15), 0);
      for (let i = -7; i < 8; i += 2.2) { rawLn(g, i, -18.8, i + .2, -16, 'rgba(32,20,14,.45)', .6); rawLn(g, i, 3, i + .2, .6, 'rgba(32,20,14,.45)', .6); }
      ell(g, -.4, -8, 5, 3.6, '#f2e4c0', .9); ell(g, -.4, -8, 2.2, 1.5, SH(col, -.2), 0); poly(g, b, null, 1.2);
      if (open) { poly(g, [[-5, -18], [-4, -22.4], [-1.4, -17.6]], '#e0c27a', .9); poly(g, [[2, -19], [4, -25], [5.6, -18.6]], '#c9a85e', .9); }
    });
  },
  bottle(g, ox, oy, x, y, col = '#9e5a40') {
    at(g, ox, oy, x, y, g => {
      const b = [[-2, -29], [2, -29], [2, -21], [5, -17], [5, 0], [-5, 0], [-5, -17], [-2, -21]];
      poly(g, b, col); poly(g, [[2, -21], [5, -17], [5, 0], [1.6, 0]], SH(col, -.25), 0); poly(g, b, null, 1.2);
      rect(g, -2.4, -31, 4.8, 2.4, '#b8bcb2'); rect(g, -4.6, -12.4, 9.2, 5.6, '#efe0bd', .9); rawLn(g, -3.4, -10, 3.4, -10, '#c8452c', 1);
      rawLn(g, -3.6, -17, -3.6, -2, 'rgba(255,255,255,.55)', 1.1);
    });
  },
  paper(g, ox, oy, x, y, w, h, t) { // newspaper (w,h in render px)
    const off = Math.sin(t * 1.6) * Z;
    at(g, ox, oy, x, y, g => {
      poly(g, [[-w / 2, off], [-Z, 2 * Z], [w / 2, -Z + off], [w / 2 - Z, h], [0, h - 2 * Z], [-w / 2 + Z, h]], '#ece3c8', 1.1 * Z);
      rawLn(g, 0, 2 * Z, 0, h - 3 * Z, 'rgba(60,45,30,.45)', Z);
      g.fillStyle = tone('#2a211a'); g.fillRect(-w / 2 + 4 * Z, 4 * Z, w - 8 * Z, 3 * Z);
      for (let j = 0; j < 6; j++) for (const xx of [-w / 2 + 4 * Z, 4 * Z]) rawLn(g, xx, (10 + j * 4) * Z, xx + Math.max(1, w / 2 - 7 * Z), (10 + j * 4) * Z, 'rgba(40,30,22,.55)', Z * .8);
      g.fillStyle = tone('#a9b3a4'); g.fillRect(-w / 2 + 4 * Z, 11 * Z, 13 * Z, 10 * Z); g.lineWidth = .8 * Z; g.strokeStyle = INK; g.strokeRect(-w / 2 + 4 * Z, 11 * Z, 13 * Z, 10 * Z);
    }, 0, 1);
  },
  cash(g, ox, oy, x, y) {
    at(g, ox, oy, x, y, g => {
      poly(g, [[-7, -4], [7, -4.4], [7, 3.6], [-7, 4]], '#93a56c'); rect(g, -2.4, -4.2, 4.8, 8, '#c8b46a', 0); ell(g, 0, 0, 2.6, 1.9, '#b8c88a', .7); poly(g, [[-7, -4], [7, -4.4], [7, 3.6], [-7, 4]], null, 1.1);
    });
  },
  coin(g, ox, oy, x, y) { at(g, ox, oy, x, y, g => { ell(g, 0, 0, 2.3, 2.1, '#d8b24a', .9); rawLn(g, -1, -1, .4, -1.2, 'rgba(255,245,200,.9)', .8); }); },
  tray(g, ox, oy, x, y) {
    at(g, ox, oy, x, y, g => { ell(g, 0, 0, 23, 4, '#7e8a88', 1.1); ell(g, 0, -1, 23, 3, '#c4c9c0', 1.1); ell(g, 0, -1, 19, 1.3, '#98a29c', 0); rawLn(g, -14, -2.4, 4, -2.6, 'rgba(255,255,255,.6)', .9); });
  },
  kettle(g, ox, oy, x, y, ang = 0) { // (x,y) = the grip; returns the spout tip in render px (relative to the actor origin)
    at(g, ox, oy, x, y, g => {
      const body = [[-11, 11], [-8, 6], [7, 6], [12, 12], [13, 25], [8, 30], [-7, 30], [-13, 24]];
      // spout + handle behind the body
      poly(g, [[9, 14], [15, 13], [22, 4], [25, 5], [18, 19], [10, 22]], '#b9c0b6');
      g.beginPath(); g.moveTo(-9, 8); g.bezierCurveTo(-10, -4, 9, -4, 9, 8); g.lineWidth = 3.4; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.8; g.strokeStyle = tone('#6b4a2a'); g.stroke();
      blob(g, body, '#b9c0b6'); poly(g, [[7, 8], [12, 12], [13, 25], [8, 30], [5, 30], [6, 14]], '#7d8b88', 0); poly(g, [[-13, 24], [-11, 25], [10, 26], [8, 30], [-7, 30]], '#403a36', 0); // shade side + soot
      blob(g, body, null, 1.3); poly(g, [[-5, 5.4], [5, 5.4], [3, 8.2], [-3, 8.2]], '#a2aaa0', 1); ell(g, 0, 4.4, 2, 1.4, '#403a36', .9);
      rawLn(g, -8.4, 11, -7.4, 24, 'rgba(255,255,255,.7)', 1.6); ln(g, -11.4, 20, 12, 20.4, '#8c948c', .7);
    }, ang);
    const c = Math.cos(ang), s = Math.sin(ang); return [x + (25 * c - 5 * s) * Z, y + (25 * s + 5 * c) * Z];
  },
  strainer(g, ox, oy, x, y) {
    at(g, ox, oy, x, y, g => { rod(g, 7, 0, 20, -9, 1.6, '#6b4a2a'); ell(g, 0, 0, 8, 3, '#c4cac0', 1.1); ell(g, 0, .2, 5.4, 1.5, '#6a7471', .6); for (let i = -3; i <= 3; i++) rawLn(g, i * 1.4, -.8, i * 1.4, 1.2, 'rgba(230,240,235,.5)', .4); });
  },
  plate(g, ox, oy, x, y, n, col = '#c69b57') {
    at(g, ox, oy, x, y, g => {
      ell(g, 0, 0, 17, 4, '#848f8c', 1.1); ell(g, 0, -1, 16, 3, '#cfd2c6', 1.1); ell(g, 0, -1, 12, 1.4, '#a8b0a8', 0);
      for (let i = 0; i < n; i++) { const xx = (i * 10 - 8), pts = [[xx - 5, -2], [xx, -12], [xx + 7, -1]]; blob(g, pts, col, 1.1); poly(g, [[xx, -12], [xx + 7, -1], [xx + 2, -1]], SH(col, -.22), 0); blob(g, pts, null, 1.1); rawLn(g, xx - 2.6, -3.4, xx - .4, -8.4, 'rgba(255,235,180,.7)', 1); }
    });
  },
  jhara(g, ox, oy, x0, y0, x1, y1) { // perforated skimmer
    at(g, ox, oy, x0, y0, g => { const dx = x1 - x0, dy = y1 - y0; rod(g, 0, 0, dx / Z, dy / Z, 1.8, '#b4bcb2'); ell(g, 0, 0, 7, 3, '#c4cac0', 1.1); for (let i = -2; i <= 2; i++) ell(g, i * 2.4, 0, .5, .45, '#2a2420', 0); });
  },
  ladle(g, ox, oy, x0, y0, x1, y1) {
    at(g, ox, oy, x0, y0, g => { const dx = (x1 - x0) / Z, dy = (y1 - y0) / Z; rod(g, 0, 0, dx, dy, 1.8, '#b4bcb2'); ell(g, dx, dy, 5, 3, '#a8b0a8', 1.1); ell(g, dx, dy - .4, 3.4, 1.7, '#566260', 0); });
  },
  cloth(g, ox, oy, x, y) { // checked rag
    at(g, ox, oy, x, y, g => { const p = [[-10, -3], [5, -5], [10, 3], [-7, 5]]; poly(g, p, '#c8452c'); rawLn(g, -9, 0, 8, -1, 'rgba(239,224,189,.9)', 1.2); rawLn(g, -3, -4.4, -1, 4.6, 'rgba(239,224,189,.9)', 1.2); poly(g, p, null, 1.1); });
  },
  agarbatti(g, ox, oy, x0, y0, x1, y1, lit) {
    g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(ox + x0, oy + y0); g.lineTo(ox + x1, oy + y1); g.lineWidth = 1.6 * Z; g.strokeStyle = INK; g.stroke(); g.lineWidth = .9 * Z; g.strokeStyle = tone('#a9803a'); g.stroke();
    if (lit) { g.fillStyle = '#ff9a4a'; g.beginPath(); g.arc(ox + x1, oy + y1, 1.1 * Z, 0, 6.2832); g.fill(); } g.restore();
  },
  match(g, ox, oy, x, y, flame, t) {
    at(g, ox, oy, x, y, g => {
      rod(g, 0, 0, 0, 8, 1, '#c4a45a'); ell(g, 0, -.4, 1.3, 1.5, '#c8452c', .7);
      if (flame) { const h = 5 + Math.sin(t * 20); g.beginPath(); g.moveTo(0, -1.4); g.bezierCurveTo(-3, -3, -1.4, -h, 0, -h - 2); g.bezierCurveTo(1.4, -h, 3, -3, 0, -1.4); g.fillStyle = '#ff9a2a'; g.fill(); g.lineWidth = .8; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.ellipse(0, -3, .9, 1.7, 0, 0, 6.2832); g.fillStyle = '#ffe58a'; g.fill(); }
    });
  }
};
function rect(g, x, y, w, h, fill, lw = 1) { g.beginPath(); g.rect(x, y, w, h); if (fill) { g.fillStyle = tone(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } }

/* ---------- stage pieces (stage.js / dog.js hooks): ctx = main canvas in render px; original coordinates are in Z units ---------- */
const flat = (c, fn, sc = Z) => { c.save(); c.scale(sc, sc); c.lineJoin = 'round'; c.lineCap = 'round'; c.imageSmoothingEnabled = true; fn(c); c.restore(); };
const stage = {
  caseTrays() { /* the mohalla counter layer already paints the steel trays */ },
  pakoda(c, { n }) {
    flat(c, g => { for (let i = 0; i < n; i++) {
      const x = 236 + i % 5 * 19 + (i > 4 ? 7 : 0), y = 395 - Math.floor(i / 5) * 10 - i % 2 * 2, r = Art.rng(91 + i);
      const pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832, rr = 1 + (r() - .5) * .3; pts.push([x + 7 + Math.cos(a) * 9 * rr, y + Math.sin(a) * 5 * rr]); }
      blob(g, pts, '#bf8438', 1.1);
      for (let j = 0; j < 6; j++) ell(g, x + 2 + r() * 10, y - 3 + r() * 5, 1.5, 1, j % 2 ? '#dfae5a' : '#8c5a22', 0);
      rawLn(g, x + 1, y - 2, x + 6, y - 3.6, 'rgba(255,230,160,.6)', 1);
    } });
  },
  kachori(c, { n }) {
    flat(c, g => { for (let i = 0; i < n; i++) {
      const x = 377 + i % 4 * 27 + (i > 3 ? 9 : 0), y = 392 - Math.floor(i / 4) * 12;
      ell(g, x, y, 11, 7, '#c4944a', 1.2); ell(g, x + 2.4, y + 2, 8, 4, '#a8742e', 0); ell(g, x - 2, y - 2, 7.4, 4, '#dcb264', 0);
      for (let j = 0; j < 3; j++) rawLn(g, x - 5 + j * 3.6, y - 3.4 + j * .6, x - 3.4 + j * 3.6, y + 1.4, 'rgba(90,50,16,.55)', .8);
      ell(g, x, y, 11, 7, null, 1.2);
    } });
  },
  flames(c, { t }) {
    flat(c, g => { for (const x of [612, 669]) for (let i = 0; i < 7; i++) {
      const h = 3 + (1 + Math.sin(t * 20 + i)) * 2.4, fx = x + i * 3 + 1.5;
      g.beginPath(); g.moveTo(fx - 1.5, 393); g.quadraticCurveTo(fx - 1.2, 393 - h * .6, fx, 393 - h); g.quadraticCurveTo(fx + 1.2, 393 - h * .6, fx + 1.5, 393); g.closePath(); g.fillStyle = i % 2 ? '#7ab0e6' : '#3f78c8'; g.fill();
      g.beginPath(); g.ellipse(fx, 392.4, .6, h * .3, 0, 0, 6.2832); g.fillStyle = '#e8f4ff'; g.fill();
    } });
  },
  kadhai(c, { on }) {
    flat(c, g => {
      for (const sd of [-1, 1]) { rod(g, 676 + sd * 24, 379, 676 + sd * 31, 376.4, 2.4, '#3a4440'); ell(g, 676 + sd * 31.6, 376.2, 1.6, 1.6, '#3a4440', 1); }
      const bowl = [[647, 380], [676, 384], [705, 380], [698, 389], [676, 394], [654, 389]];
      blob(g, bowl, '#3a4846', 1.3); poly(g, [[676, 384], [705, 380], [698, 389], [676, 394]], '#26302f', 0); blob(g, bowl, null, 1.3);
      ell(g, 676, 379, 29, 7, '#5a6864', 1.3); ell(g, 676, 379.4, 25.4, 5.2, on ? '#c2902e' : '#8a6e34', 1); ell(g, 670, 378, 11, 1.6, on ? '#f0cc6a' : '#a4884c', 0);
      rawLn(g, 652, 378, 666, 375.6, 'rgba(255,255,255,.35)', 1);
    });
  },
  fryItems(c, { t, W, items }) {
    if (!W.fry.on) return;
    flat(c, g => { for (const it of items) {
      const x = 662 + it.i * 12 + Math.sin(t * 2 + it.i) * 2, y = 376 + Math.sin(t * 3 + it.i), done = t - it.t0 >= 3, col = done ? '#b5792a' : '#d9a64a';
      blob(g, [[x - 4, y], [x + 1, y - 9], [x + 7, y + 1]], col, 1.1); poly(g, [[x + 1, y - 9], [x + 7, y + 1], [x + 2, y + 1]], done ? '#8c5a1c' : '#b98030', 0); rawLn(g, x - 1.6, y - 1.2, x + .8, y - 6, 'rgba(255,240,190,.6)', .9);
    } });
  },
  oilBubbles(c, { bubbles }) {
    for (const b of bubbles) { c.beginPath(); c.arc(b.x * Art.K, b.y * Art.K, 1.1 * Z, 0, 6.2832); c.fillStyle = 'rgba(255,236,170,.9)'; c.fill(); c.lineWidth = .5 * Z; c.strokeStyle = 'rgba(80,50,15,.7)'; c.stroke(); }
  },
  tub(c, { x, y }) {
    c.save(); c.translate(x * Art.K, y * Art.K); flat(c, g => {
      const body = [[-19, -19], [19, -19], [15, 8], [-15, 8]];
      poly(g, body, '#3d8793'); poly(g, [[12, -19], [19, -19], [15, 8], [10.4, 8]], '#2a5f6a', 0); poly(g, body, null, 1.3); rect(g, -17, -3, 34, 2.4, '#efe0bd', 0); rawLn(g, -14, -15, -11.4, 4, 'rgba(255,255,255,.5)', 2);
      ell(g, 0, -19, 20, 5, '#c8cec6', 1.3); ell(g, 0, -19, 16.4, 3.2, '#79b6bf', 1); for (let i = 0; i < 5; i++) ell(g, -12 + i * 6, -19.8 - i % 2, 2.4, 1.6, '#f4f6ee', .8);
    }); c.restore();
  },
  sparrows(c, { t, list }) {
    for (const s of list) {
      const hop = s.mode === 'hop' ? -Math.abs(Math.sin(t * 20) * 3) : 0, d = s.dir, up = Math.sin(s.fly) > 0;
      c.save(); c.translate(s.x * Art.K, s.y * Art.K); flat(c, g => {
        g.scale(d, 1);
        if (s.mode !== 'fly') { rawLn(g, -1, -3 + hop, -1, 0, INK, .8); rawLn(g, 2, -3 + hop, 2, 0, INK, .8); }
        poly(g, [[-4, -5 + hop], [-11, -3.4 + hop], [-10, -6 + hop]], '#5a4a34', .9); ell(g, 0, -5 + hop, 6, 3.2, '#8a6a42', 1); ell(g, -1.6, -5.6 + hop, 3.4, 1.7, '#5e4528', .6); ell(g, 1.4, -3.6 + hop, 3.2, 1.4, '#d9cba4', 0);
        ell(g, 5, -9 + hop, 3, 3, '#7a5c38', 1); poly(g, [[7.6, -9.4 + hop], [10, -8.4 + hop], [7.6, -7.6 + hop]], '#d8a838', .8); ell(g, 5.6, -9.4 + hop, .6, .6, INK, 0);
        if (s.mode === 'fly') poly(g, [[0, -6], [2, up ? -14 : -1], [-3, -5]], '#6e5232', .9);
      }); c.restore();
    }
  },
  puddles(c, { t, list }) {
    for (const p of list) {
      const age = t - p.t0, grow = Math.min(1, age / 2.2), fade = age > 34 ? Math.max(0, 1 - (age - 34) / 16) : 1;
      c.save(); c.translate(p.x * Art.K, p.y * Art.K); c.globalAlpha = .55 * fade; flat(c, g => { const r = 13 * grow, pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; pts.push([Math.cos(a) * r * (1 + .12 * Math.sin(k * 2.3)), Math.sin(a) * 3.2 * grow]); } blob(g, pts, '#5a4a38', .8); ell(g, -r * .2, -.6 * grow, r * .45, .9 * grow, '#9a8a70', 0); }); c.restore();
    }
  },
  dog(c, { t, dog, ox, oy }) {
    const st = dog.state; if (st === 'gone') return; const el = t - dog.t0, f = dog.face, fur = '#b08a56', dk = '#7a5c3a', hi = '#cfae78', belly = '#d8c8a0', nose = '#2a201a';
    c.save(); c.translate(ox, oy); flat(c, g => {
      g.scale(-f, 1);
      const ov = (x, y, rx, ry, col, lw = 1.1) => ell(g, x, y, rx, ry, col, lw), tube = (x0, y0, x1, y1, w, col) => { ln(g, x0, y0, x1, y1, INK, w + 1.8); ln(g, x0, y0, x1, y1, col, w); };
      if (['sleep', 'scratch', 'wake'].includes(st)) {
        ov(0, -12, 25, 11, fur); ov(8, -10, 13, 9, dk); ov(-9, -7, 15, 5, belly); tube(10, -4, -9, -3, 5, fur); ov(-27, -9, 10, 7, hi); tube(-29, -6, -40, -4, 6, hi); ov(-43, -5.4, 2.4, 1.9, nose, .8);
        if (st === 'scratch') ov(-30, -11.4, 1.1, .9, INK, 0); else { g.beginPath(); g.moveTo(-32, -11); g.quadraticCurveTo(-30, -9.6, -28, -11); g.lineWidth = .9; g.strokeStyle = INK; g.stroke(); }
        ov(-21, -13, 4, 7, dk); tube(18, -8, 30, -4, 4, fur); if (st === 'scratch') tube(13, -4, 3 + Math.sin(el * 25) * 5, -18, 4, fur);
        if (st === 'sleep' && Math.sin(t * .8) > .5 && !dog.z) { dog.z = t; Tapri.hooks.bubble?.(dog, 'z z Z', 2400, 'note'); } if (dog.z && t - dog.z > 6) dog.z = 0; return;
      }
      const moving = st === 'walk' || st === 'run', run = st === 'run', bob = moving ? Math.abs(Math.cos(dog.ph)) * (run ? 2.5 : 1.2) : 0, hipY = -22 - bob;
      [[-23, 0], [-17, Math.PI], [17, Math.PI * .5], [24, Math.PI * 1.5]].forEach(([x, ph], i) => { if (st === 'pee' && i === 3) return; const sw = moving ? Math.sin(dog.ph + ph) * (run ? 10 : 6) : 0, lift = moving ? Math.max(0, Math.cos(dog.ph + ph)) * (run ? 7 : 4) : 0; tube(x, hipY + 3, x + sw, -lift - 2, 5, i % 2 ? dk : fur); ell(g, x + sw + 1, -lift - 1.6, 4.4, 1.9, dk, .9); });
      ov(0, hipY - 2, 28, 12, fur); ov(-13, hipY - 4, 14, 12, hi); tube(-6, hipY + 7, 16, hipY + 6, 4, belly);
      const ta = .7 + Math.sin(t * (moving ? 10 : 4)) * .5, tx = 27 + Math.cos(ta) * 13, ty = hipY - 10 - Math.sin(ta) * 14; tube(24, hipY - 5, tx, ty, 4, fur); tube(tx, ty, tx - 5, hipY - 16 - Math.sin(ta) * 14, 3, belly);
      const hcx = -33, hcy = hipY - 12 + (st === 'sniff' ? 11 + Math.sin(t * 7) : st === 'bark' ? -4 : 0);
      tube(-19, hipY - 3, hcx + 5, hcy + 4, 9, hi); ov(hcx, hcy, 10, 9, hi); tube(hcx - 5, hcy + 4, hcx - 17, hcy + 5, 6, hi);
      if (st === 'bark' && t - dog.lastBarkAt < .18) { ov(hcx - 14, hcy + 8, 5, 2.4, '#5a2a22', .9); ov(hcx - 12, hcy + 9.4, 2.6, 1.2, '#d68a80', 0); }
      ov(hcx - 20, hcy + 4.6, 2.6, 2, nose, .8); ov(hcx + 6, hcy - 1, 4, 9, dk);
      if (t < dog.blinkUntil) { g.beginPath(); g.moveTo(hcx - 8, hcy - 2); g.lineTo(hcx - 4.6, hcy - 2); g.lineWidth = .9; g.strokeStyle = INK; g.stroke(); } else { ov(hcx - 6, hcy - 2.4, 1.7, 1.5, '#2a1c12', .5); ell(g, hcx - 6.5, hcy - 3, .5, .5, '#f2efe2', 0); }
      if (st === 'pee') { tube(15, hipY + 1, 30, hipY - 8, 5, fur); ell(g, 31, hipY - 8.6, 3.6, 1.8, dk, .9); if (el > .6 && el < 2.9) for (let i = 0; i < 18; i += 3) rawLn(g, 33 + (i > 8 ? 2 : 0), hipY - 4 + i, 33 + (i > 8 ? 2 : 0), hipY - 2 + i, '#d8b84a', 1.1); }
    }); c.restore();
  }
};

const TH = Art.THEMES && Art.THEMES.chitra;
if (TH) { TH.actors = TH.actors || {}; TH.actors.props = props; TH.actors.stage = stage; } else console.log('WORLD_FILE_FAIL chitra-props: theme chitra not registered yet');
})();
