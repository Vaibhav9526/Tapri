/* "Chitra" — Indian-comics look (in the spirit of Amar Chitra Katha): people drawn from scratch as smooth inked vector
   figures with real proportions (~7.5 heads for an adult, ~5 for a child), flat colours with one cel shade on the side away
   from the light, a strong nose-bridge line, almond eyes and thick brows. The skeleton (Sprites.measure: legs, hips,
   shoulders, head, mouth) and the arm IK/smoothing are the shared ones, so every behaviour, held prop and anchor keeps
   working; only the drawing is new. See docs/CHITRA_STYLE.md. */
(() => {
'use strict';
const INK = '#20140e', K = Sprites.K || Art.K || 2, SH = Art.shade;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const HEAD = 13.6;          // crown to chin, scene px (adult total height ~100)
const FACE = { headLen: 17.2, mouthY: 11, earY: 7.4 };
let g = null, LIT = 1;      // current context (origin at the feet, scene units) and the side the light comes from

/* ---------- drawing primitives (scene units) ---------- */
const tone = c => Art.tone(c);
function poly(pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function blob(pts) { // smooth closed curve through the midpoints (keeps shapes organic)
  const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const s = m(pts[n - 1], pts[0]); g.beginPath(); g.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], e = m(p, pts[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], e[0], e[1]); } g.closePath();
}
function capsule(x0, y0, r0, x1, y1, r1) {
  const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.arc(x0, y0, r0, a + Math.PI / 2, a + Math.PI * 1.5); g.arc(x1, y1, r1, a - Math.PI / 2, a + Math.PI / 2); g.closePath();
}
// one continuous limb (shoulder→elbow→wrist or hip→knee→ankle): no ball joints, rounded ends
function tube(pts, rs) {
  const n = pts.length, Lp = [], Rp = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i]; let nx = 0, ny = 0;
    const add = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-3; nx += -dy / d; ny += dx / d; };
    if (i > 0) add(pts[i - 1], p); if (i < n - 1) add(p, pts[i + 1]); const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
    Lp.push([p[0] + nx * rs[i], p[1] + ny * rs[i]]); Rp.push([p[0] - nx * rs[i], p[1] - ny * rs[i]]);
  }
  const dir = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-3; return [dx / d, dy / d]; };
  const fe = dir(pts[n - 2], pts[n - 1]), fs = dir(pts[1], pts[0]), e = pts[n - 1], s0 = pts[0];
  g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i < n; i++) g.lineTo(Lp[i][0], Lp[i][1]);
  g.bezierCurveTo(Lp[n - 1][0] + fe[0] * rs[n - 1] * 1.3, Lp[n - 1][1] + fe[1] * rs[n - 1] * 1.3, Rp[n - 1][0] + fe[0] * rs[n - 1] * 1.3, Rp[n - 1][1] + fe[1] * rs[n - 1] * 1.3, Rp[n - 1][0], Rp[n - 1][1]);
  for (let i = n - 2; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]);
  g.bezierCurveTo(Rp[0][0] + fs[0] * rs[0] * 1.3, Rp[0][1] + fs[1] * rs[0] * 1.3, Lp[0][0] + fs[0] * rs[0] * 1.3, Lp[0][1] + fs[1] * rs[0] * 1.3, Lp[0][0], Lp[0][1]);
  g.closePath(); void e; void s0;
}
function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.05, rx), Math.max(.05, ry), rot, 0, Math.PI * 2); }
function ink(w = .75) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function fill(c) { g.fillStyle = tone(c); g.fill(); }
// fill the current path, add a cel shadow on the side away from the light (clipped), then ink the outline
function solid(make, col, o = {}) {
  make(); fill(col);
  if (o.shade !== false) { g.save(); make(); g.clip(); g.fillStyle = tone(SH(col, o.dark || -.24)); const cx = o.cx || 0, w = o.w || 10, side = -LIT; g.beginPath();
    const x0 = cx + side * w * (o.cut || .25), x1 = cx + side * w * 3; g.moveTo(x0 + side * (o.skew || 0), -200); g.lineTo(x1, -200); g.lineTo(x1, 50); g.lineTo(x0 - side * (o.skew || 0), 50); g.closePath(); g.fill(); g.restore(); }
  if (o.ink !== false) { make(); ink(o.lw || .8); }
}
function line(pts, w = .45, c = INK) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineWidth = w; g.strokeStyle = c === INK ? INK : tone(c); g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function curve(x0, y0, cx, cy, x1, y1, w = .45, c = INK) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.lineWidth = w; g.strokeStyle = c === INK ? INK : tone(c); g.lineCap = 'round'; g.stroke(); }
function dot(x, y, r, c) { ell(x, y, r, r); fill(c); }

/* ---------- clothes knowledge ---------- */
const LONG_SLEEVE = ['shirt', 'kurta', 'office', 'traveler', 'hoodie', 'sweater', 'shawl', 'waistcoat', 'turban', 'dhoti'];
const sleeveOf = s => s.outfit === 'saree' ? 'short' : (['tee', 'fisher', 'lungi'].includes(s.outfit) ? 'short' : 'long');
const hemOf = (s, hipY) => s.outfit === 'kurta' || s.outfit === 'turban' ? hipY + 17 : s.outfit === 'saree' ? hipY - 2 : s.outfit === 'hoodie' || s.outfit === 'sweater' ? hipY + 2.5 : hipY + 4.5;
const kid = s => (s.h || 1) < .8;

/* ---------- head ---------- */
function headShape(s, cx, top) {
  const w = (s.female ? 4.7 : 5.15) * (s.mass > 1.05 ? 1.05 : 1), old = s.age === 'old', jaw = s.female || kid(s) ? .55 : .66;
  return () => blob([[cx, top - .2], [cx + w * .82, top + .7], [cx + w, top + 3.6], [cx + w * 1.02, top + 6.6], [cx + w * .93, top + 9.3], [cx + w * jaw, top + 11.9 - (old ? .3 : 0)], [cx + w * .22, top + 13.4], [cx, top + 13.7], [cx - w * .22, top + 13.4], [cx - w * jaw, top + 11.9 - (old ? .3 : 0)], [cx - w * .93, top + 9.3], [cx - w * 1.02, top + 6.6], [cx - w, top + 3.6], [cx - w * .82, top + .7]]);
}
function backHair(s, cx, top, shY) {
  const hc = s.hc;
  if (s.hair === 'long') { // plait / bun behind the head, hair falling to the shoulders
    blob([[cx - 5.6, top + 2], [cx - 6.2, top + 9], [cx - 5.4, shY + 2], [cx + 5.4, shY + 2], [cx + 6.2, top + 9], [cx + 5.6, top + 2], [cx, top - 1.4]]); fill(SH(hc, -.08)); ink(.6);
    if (Math.floor(s.seed) % 2) { ell(cx + 4.6 * LIT, top + 3, 3, 2.6); fill(hc); ink(.6); dot(cx + 5.6 * LIT, top + 1.6, .9, '#f2efe2'); dot(cx + 6.3 * LIT, top + 2.6, .8, '#f2efe2'); } // bun with a gajra
  }
}
function hairTop(s, cx, top, fx) {
  const hc = s.hc, w = (s.female ? 4.7 : 5.15) + .45, hi = SH(hc, .35);
  if (s.hair === 'bald') { blob([[cx - w, top + 3.8], [cx - w + .4, top + 6.8], [cx - w + 1.2, top + 5.2]]); fill(hc); blob([[cx + w, top + 3.8], [cx + w - .4, top + 6.8], [cx + w - 1.2, top + 5.2]]); fill(hc); curve(cx - 2.6, top + 1.4, cx - 1, top + .3, cx + .8, top + .6, .55, SH('#ffffff', 0)); return; }
  if (s.hair === 'long') { // centre parting, hair framing the face, over the ears
    blob([[cx, top - .9], [cx + w * .9, top + .2], [cx + w + .3, top + 4], [cx + w + .2, top + 9.5], [cx + w - .9, top + 9.6], [cx + w - 1.2, top + 4.6], [cx + 1.4, top + 1.4], [cx, top + 1.1], [cx - 1.4, top + 1.4], [cx - w + 1.2, top + 4.6], [cx - w + .9, top + 9.6], [cx - w - .2, top + 9.5], [cx - w - .3, top + 4], [cx - w * .9, top + .2]]);
    fill(hc); ink(.65); line([[cx, top - .6], [cx, top + 1.2]], .4, SH(hc, .4)); curve(cx + 1.5, top + .2, cx + 3.6, top + .4, cx + 4.6, top + 3.4, .35, hi); return;
  }
  // short men's hair (oiled side part / curly), with sideburns
  const curly = s.hair === 'curly';
  const pts = [[cx - w - .1, top + 6.8], [cx - w - .3, top + 2.8], [cx - w * .6, top - .6], [cx - 1, top - 1.4], [cx + w * .6, top - .9], [cx + w + .3, top + 2.6], [cx + w + .1, top + 6.8], [cx + w - .9, top + 6.6], [cx + w - .9, top + 3.4], [cx + 2 + fx * .3, top + 2], [cx - 1 + fx * .3, top + 2.6], [cx - w + .9, top + 3.4], [cx - w + .9, top + 6.6]];
  if (curly) { blob(pts); fill(hc); ink(.65); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i / 7.2), x = cx + Math.cos(a) * w * .9, y = top + 3 + Math.sin(a) * 3.9; ell(x, y, 1.15, 1); fill(hc); ink(.45); } }
  else { blob(pts); fill(hc); ink(.65); }
  if (s.hair === 'parted' || !curly) { curve(cx - w * .5 + fx * .3, top + .2, cx - 1.6, top - .8, cx + w * .7, top + .6, .45, hi); line([[cx - 1.8 + fx * .3, top - .9], [cx - 2.2 + fx * .3, top + 1.6]], .35, SH(hc, -.3)); }
}
function headwear(s, cx, top) {
  const w = (s.female ? 4.7 : 5.15);
  if (s.turban) { solid(() => blob([[cx - w - 1.6, top + 3.4], [cx - w - 1.2, top - 1.6], [cx - 2, top - 4.2], [cx + 2.6, top - 4], [cx + w + 1.4, top - 1.4], [cx + w + 1.6, top + 3.4], [cx, top + 4.4]]), s.turban, { cx, w: w + 2 }); for (let i = 0; i < 4; i++) curve(cx - w - 1 + i * 1.4, top + 3 - i * .2, cx - 1 + i * 1.6, top - 2 - i * .7, cx + w + 1, top - .4 - i * .9, .4, SH(s.turban, -.35)); return; }
  if (s.fisherCap) { solid(() => blob([[cx - w - .4, top + 2.4], [cx - w, top - 1.4], [cx, top - 2.4], [cx + w, top - 1.4], [cx + w + .4, top + 2.4]]), s.fisherCap, { cx, w }); return; }
  if (s.cap) { // a Gandhi topi when light, else a cricket cap
    const light = parseInt(s.cap.slice(1, 3), 16) > 170;
    if (light) solid(() => poly([[cx - w - .3, top + 2.2], [cx - w + .6, top - 1.6], [cx + w - .4, top - 2.4], [cx + w + .5, top + 1.4]]), s.cap, { cx, w });
    else { solid(() => blob([[cx - w - .3, top + 2.6], [cx - w, top - 1], [cx, top - 2.3], [cx + w, top - 1], [cx + w + .3, top + 2.6]]), s.cap, { cx, w }); solid(() => blob([[cx - w + 1, top + 2.6], [cx + w + 4 * LIT, top + 2.2], [cx + w + 4.4 * LIT, top + 3.4], [cx - w + 1, top + 3.4]]), SH(s.cap, -.2), { shade: false }); }
  }
}
function face(s, cx, top, o) {
  const sk = s.skin, dk = SH(sk, -.3), fx = clamp(o.fx || 0, -2, 2) * .55, ey = top + 6.6 + clamp(o.fy || 0, -1, 2) * .25, look = clamp(o.lx || 0, -1, 1) * .45, old = s.age === 'old';
  const laugh = o.expr === 'laugh', smile = o.expr === 'smile' || laugh, talk = o.expr === 'talk' && Math.sin((o.t || 0) * 12 + s.seed) > -.1, eat = o.expr === 'eat' && Math.sin((o.t || 0) * 9) > 0, sip = o.expr === 'sip';
  // brows (thick, a little arched)
  for (const sd of [-1, 1]) { const ex = cx + sd * 2.2 + fx; const lift = laugh ? -.35 : talk ? -.15 : 0;
    g.beginPath(); g.moveTo(ex - sd * 1.6, ey - 1.5 + lift); g.quadraticCurveTo(ex, ey - 2.4 + lift, ex + sd * 1.8, ey - 1.6 + lift); g.lineWidth = s.female ? .48 : .72; g.strokeStyle = tone(old ? SH(s.hc, -.1) : SH(s.hc, -.2)); g.lineCap = 'round'; g.stroke(); }
  // eyes: almond, dark iris with a catch-light, heavy upper lid
  for (const sd of [-1, 1]) { const ex = cx + sd * 2.2 + fx;
    if (o.blink || laugh) { curve(ex - 1.5, ey + .1, ex, laugh ? ey - .9 : ey + .55, ex + 1.5, ey + .1, .5); continue; }
    g.beginPath(); g.moveTo(ex - 1.5, ey + .1); g.quadraticCurveTo(ex, ey - 1, ex + 1.55, ey); g.quadraticCurveTo(ex, ey + .85, ex - 1.5, ey + .1); g.closePath(); fill('#f1e8d2');
    dot(ex + look, ey + .02, .62, '#2c1a12'); ell(ex + look + .2, ey - .22, .17, .17); g.fillStyle = '#fffaf0'; g.fill();
    curve(ex - 1.65, ey + .15, ex, ey - 1.12, ex + 1.65, ey - .05, .55); if (s.female) line([[ex + sd * 1.55, ey - .05], [ex + sd * 2.05, ey - .55]], .4);
    curve(ex - 1.1, ey + .7, ex, ey + 1, ex + 1.1, ey + .65, .22, dk);
    if (old) curve(ex - 1.2, ey + 1.4, ex, ey + 1.8, ex + 1.3, ey + 1.3, .25, dk);
  }
  // nose: the strong bridge line on the shadow side, nostril wing
  const nx = cx + fx * 1.25, side = -LIT;
  curve(nx + side * .5, ey - .9, nx + side * .9, ey + 1.6, nx + side * .1, top + 9.4, .42);
  curve(nx - 1, top + 9.3, nx, top + 10, nx + 1.05, top + 9.3, .42); dot(nx + LIT * .5, top + 8.6, .22, SH(sk, .25));
  // mouth
  const my = top + 11 + (o.fy > 0 ? .1 : 0), mx = cx + fx * 1.1, lip = s.female ? '#a2483c' : SH(sk, -.42);
  if (laugh) { g.beginPath(); g.moveTo(mx - 1.9, my - .3); g.quadraticCurveTo(mx, my - .5, mx + 1.9, my - .3); g.quadraticCurveTo(mx, my + 2.1, mx - 1.9, my - .3); g.closePath(); fill('#5a1f16'); ink(.4); g.beginPath(); g.rect(mx - 1.4, my - .35, 2.8, .5); g.fillStyle = '#f6efe0'; g.fill(); }
  else if (talk || eat) { ell(mx, my + .2, talk ? 1.05 : .8, talk ? .62 : .42); fill('#5a1f16'); ink(.38); }
  else if (sip) { ell(mx + .2, my + .1, .5, .42); fill('#5a1f16'); ink(.35); }
  else { curve(mx - 1.35, my - (smile ? .35 : 0), mx, my + (smile ? .55 : .15), mx + 1.35, my - (smile ? .35 : 0), .5, s.female ? lip : INK); if (s.female) curve(mx - .9, my + .45, mx, my + .9, mx + .9, my + .45, .4, SH(lip, .15)); }
  // facial hair
  if (s.must) { blob([[mx - .2, top + 9.85], [mx + 1.6, top + 9.9], [mx + 2.7, top + 10.9], [mx + 1.5, top + 10.55], [mx, top + 10.45], [mx - 1.5, top + 10.55], [mx - 2.7, top + 10.9], [mx - 1.6, top + 9.9]]); fill(s.hc); ink(.35); }
  if (s.beard) { const w = s.female ? 4.7 : 5.15; blob([[cx - w * .96, top + 8.2], [cx - w * .8, top + 11.6], [cx - 1.6, top + 14.4], [cx, top + 14.8], [cx + 1.6, top + 14.4], [cx + w * .8, top + 11.6], [cx + w * .96, top + 8.2], [cx + w * .6, top + 10.6], [mx + 1.8, my + 1.2], [mx - 1.8, my + 1.2], [cx - w * .6, top + 10.6]]); fill(s.hc); ink(.45); }
  else if (s.stubble) { g.save(); headShape(s, cx, top)(); g.clip(); g.globalAlpha = .28; blob([[cx - 6, top + 9], [cx - 3, top + 14.5], [cx + 3, top + 14.5], [cx + 6, top + 9], [mx + 1.7, my + .9], [mx - 1.7, my + .9]]); fill(SH(sk, -.45)); g.restore(); }
  if (old) { curve(mx - 2.4, top + 9, mx - 2.9, top + 10.4, mx - 2.3, top + 11.6, .3, dk); curve(mx + 2.4, top + 9, mx + 2.9, top + 10.4, mx + 2.3, top + 11.6, .3, dk); line([[cx - 2.2, top + 3], [cx + 2.2, top + 2.8]], .25, dk); line([[cx - 1.6, top + 3.8], [cx + 1.8, top + 3.7]], .22, dk); }
  if (s.bindi) dot(cx + fx * .9, top + 4.7, s.female ? .46 : .3, '#c0262b');
  if (s.glasses) { g.lineWidth = .4; g.strokeStyle = INK; for (const sd of [-1, 1]) { ell(cx + sd * 2.25 + fx, ey + .1, 1.7, 1.4); g.stroke(); } line([[cx - .55 + fx, ey], [cx + .55 + fx, ey]], .4); }
  if (o.glow) { g.save(); g.globalAlpha = .18; ell(cx, top + 9, 6, 6); g.fillStyle = '#bfe4ff'; g.fill(); g.restore(); }
}
function drawHead(s, cx, top, shY, o) {
  const sk = s.skin, w = (s.female ? 4.7 : 5.15), chin = top + HEAD;
  g.save(); g.translate(cx, chin); g.scale(1.1, 1.1); g.translate(-cx, -chin);
  try { drawHead0(s, cx, top, shY, o, sk, w); } finally { g.restore(); }
}
function drawHead0(s, cx, top, shY, o, sk, w) {
  backHair(s, cx, top, shY);
  // neck
  solid(() => poly([[cx - 2.2, top + 10.5], [cx + 2.2, top + 10.5], [cx + 2.5, shY + .6], [cx - 2.5, shY + .6]]), sk, { cx, w: 2.4, cut: .1 });
  g.save(); poly([[cx - 2.2, top + 10.5], [cx + 2.2, top + 10.5], [cx + 2.5, shY + .6], [cx - 2.5, shY + .6]]); g.clip(); ell(cx, top + 12.6, 3.6, 1.8); fill(SH(sk, -.32)); g.restore();
  // ears
  for (const sd of [-1, 1]) { ell(cx + sd * (w + .15), top + 7.6, .95, 1.7); fill(sd === -LIT ? SH(sk, -.18) : sk); ink(.45); curve(cx + sd * (w + .1), top + 6.8, cx + sd * (w + .6), top + 7.6, cx + sd * (w + .2), top + 8.6, .28, SH(sk, -.4)); }
  solid(headShape(s, cx, top), sk, { cx, w, cut: .32, skew: 1.2 });
  face(s, cx, top, o);
  hairTop(s, cx, top, clamp(o.fx || 0, -2, 2));
  headwear(s, cx, top);
}

/* ---------- body pieces ---------- */
function foot(s, x, y, dir, far) { // chappal or shoe; dir = which way the toes point (0 = at the viewer)
  const sk = far ? SH(s.skin, -.12) : s.skin, len = 3.4, f = dir || 0;
  if (s.sandals) { blob([[x - 2.7 + Math.min(0, f) * len, y + .3], [x - 2.1, y - 2], [x + 2.1, y - 2], [x + 2.7 + Math.max(0, f) * len, y + .3]]); fill(sk); ink(.5); line([[x - 2.9 + Math.min(0, f) * len, y + .7], [x + 2.9 + Math.max(0, f) * len, y + .7]], 1.1, '#5b3a22'); line([[x - 1.5, y - 1.3], [x + 1.4, y - .5]], .6, '#7b4a2a'); }
  else { solid(() => blob([[x - 2.8 + Math.min(0, f) * len, y + .6], [x - 2.4, y - 2.3], [x + 2.4, y - 2.3], [x + 2.9 + Math.max(0, f) * len, y + .6]]), far ? SH(s.shoe, -.15) : s.shoe, { cx: x, w: 2.8 }); }
}
function leg(s, hip, knee, ankle, far, covered) { // thigh + shin, skin under (if not covered) then trouser leg on top
  const mass = s.mass || 1, sk = far ? SH(s.skin, -.12) : s.skin;
  if (!covered) { solid(() => tube([knee, ankle], [2.5, 1.6]), sk, { cx: knee[0], w: 2.5, lw: .55 }); return; }
  const c = far ? SH(s.pants, -.14) : s.pants, top = hip || [knee[0], knee[1] - 4];
  solid(() => tube([top, knee, [ankle[0], ankle[1] - .4]], [4.4 * mass * (s.female ? 1.05 : 1), 3.0 * mass, 2.2]), c, { cx: top[0], w: 4.4, lw: .6 });
  curve(knee[0] - 1.5, knee[1] - .2, knee[0] + .2, knee[1] + .5, knee[0] + 1.4, knee[1] - .3, .28, SH(c, -.35));
}
function wrapSkirt(s, sx, waistY, hemY, half, flare, t = 0) { // dhoti / lungi / saree drape below the waist
  const c = s.outfit === 'saree' ? s.shirt : s.pants, sw = Math.sin(t) * .8;
  solid(() => blob([[sx - half, waistY], [sx + half, waistY], [sx + half + flare * .6, (waistY + hemY) / 2], [sx + half + flare + sw, hemY], [sx, hemY + .6], [sx - half - flare + sw, hemY], [sx - half - flare * .6, (waistY + hemY) / 2]]), c, { cx: sx, w: half + flare });
  if (s.wrap === 'lungi' || s.outfit === 'fisher') { g.save(); blob([[sx - half, waistY], [sx + half, waistY], [sx + half + flare, hemY], [sx - half - flare, hemY]]); g.clip(); for (let y = waistY + 3; y < hemY; y += 3.2) line([[sx - 20, y], [sx + 20, y]], .35, SH(c, -.3)); for (let x = sx - 14; x < sx + 14; x += 3.4) line([[x, waistY], [x, hemY]], .3, SH(c, -.2)); g.restore(); }
  if (s.outfit === 'saree') { for (let i = -1; i <= 1; i++) line([[sx + i * 1.1 + 1, waistY + 3], [sx + i * 1.4 + 1 + sw, hemY - .5]], .3, SH(c, -.35)); line([[sx - half - flare + sw, hemY - .9], [sx + half + flare + sw, hemY - .9]], 1.1, s.dupatta || s.graphic); }
  else { curve(sx - 1, waistY + 2, sx + 1.5, (waistY + hemY) / 2, sx + .5 + sw, hemY - .5, .35, SH(c, -.3)); if (s.wrap === 'dhoti') curve(sx - half + 1, waistY + 4, sx - 2, waistY + 10, sx - 1, hemY - 2, .3, SH(c, -.25)); }
}
function torso(s, sx, shY, hipY, fac, o) {
  const mass = s.mass || 1, sw = (s.female ? 9.4 : 11.2) * mass * fac, waist = (s.female ? 6.8 : 8.2) * mass * fac, hipH = (s.female ? 9.2 : 8.6) * mass * fac, c = s.shirt;
  const hem = hemOf(s, hipY), flare = s.outfit === 'kurta' || s.outfit === 'turban' ? 2.4 : 0, waistY = lerp(shY, hipY, .62);
  const body = () => blob([[sx - 2.6, shY - .9], [sx - sw + 1.6, shY + .2], [sx - sw - .2, shY + 3], [sx - sw + .9, shY + 10], [sx - waist, waistY], [sx - hipH - .6, hipY - 1], [sx - hipH - .6 - flare, hem], [sx + hipH + .6 + flare, hem], [sx + hipH + .6, hipY - 1], [sx + waist, waistY], [sx + sw - .9, shY + 10], [sx + sw + .2, shY + 3], [sx + sw - 1.6, shY + .2], [sx + 2.6, shY - .9]]);
  solid(body, c, { cx: sx, w: sw, cut: .3, skew: 2 });
  g.save(); body(); g.clip();
  if (s.check) { g.globalAlpha = .55; for (let y = shY + 2; y < hem; y += 3.1) line([[sx - 20, y], [sx + 20, y]], .32, SH(c, -.3)); for (let x = sx - 18; x < sx + 18; x += 3.1) line([[x, shY], [x, hem]], .32, SH(c, -.22)); g.globalAlpha = 1; }
  if (s.outfit === 'tee' && Math.floor(s.seed) % 2) { blob([[sx - 4, shY + 7], [sx + 4, shY + 7], [sx + 4.4, shY + 13], [sx - 4.4, shY + 13]]); fill(s.graphic); }
  if (s.outfit === 'sweater') for (let x = sx - 14; x < sx + 14; x += 1.4) line([[x, hem - 2.4], [x, hem]], .25, SH(c, -.35));
  if (s.outfit === 'hoodie') { blob([[sx - 5, hipY - 7], [sx + 5, hipY - 7], [sx + 5.6, hipY - 1], [sx - 5.6, hipY - 1]]); fill(SH(c, -.1)); ink(.4); }
  // folds
  curve(sx - sw * .5, shY + 9, sx - sw * .35, shY + 12, sx - waist * .6, waistY - 1, .3, SH(c, -.35)); curve(sx + waist * .7, waistY + 1, sx + waist * .5, waistY + 4, sx + hipH * .5, hipY - 1.5, .3, SH(c, -.35));
  if (o.extra) { // the chaiwala: apron + checked gamchha over the shoulder
    solid(() => blob([[sx - 7.5, waistY - 3], [sx + 7.5, waistY - 3], [sx + 8.6, hem], [sx - 8.6, hem]]), '#d9cdb0', { cx: sx, w: 8 }); line([[sx - 7, waistY - 3], [sx - 3, shY + 1]], .6, '#b9ab8c'); line([[sx + 7, waistY - 3], [sx + 3, shY + 1]], .6, '#b9ab8c');
  }
  g.restore(); body(); ink(.8);
  // collars / openings
  const ny = shY - .6;
  if (['shirt', 'office', 'traveler', 'fisher', 'turban', 'dhoti', 'lungi'].includes(s.outfit)) {
    solid(() => poly([[sx - 2.9, ny - .2], [sx - .1, ny + 4.2], [sx - 4.2, ny + 2.6]]), SH(c, .12), { shade: false, lw: .45 }); solid(() => poly([[sx + 2.9, ny - .2], [sx + .1, ny + 4.2], [sx + 4.2, ny + 2.6]]), SH(c, .06), { shade: false, lw: .45 });
    line([[sx + .2, ny + 4.2], [sx + .2, Math.min(hem, hipY + 4) - .5]], .35, SH(c, -.4)); for (let y = ny + 6; y < hipY; y += 4.4) dot(sx + .8, y, .32, '#efe6cf');
    if (!o.extra) { poly([[sx + 3.2, shY + 5.8], [sx + 6.6, shY + 5.8], [sx + 6.4, shY + 9.4], [sx + 3.4, shY + 9.4]]); ink(.35); }
  } else if (s.outfit === 'kurta') { line([[sx - 2.7, ny + .2], [sx + 2.7, ny + .2]], 1, SH(c, -.15)); line([[sx, ny + .7], [sx, ny + 9]], .38, SH(c, -.4)); for (let i = 0; i < 3; i++) dot(sx + .7, ny + 2.4 + i * 2.4, .35, '#d9b75a'); line([[sx - hipH - 1.6, hem - 5.5], [sx - hipH - 2.2, hem]], .35); line([[sx + hipH + 1.6, hem - 5.5], [sx + hipH + 2.2, hem]], .35); }
  else if (s.outfit === 'saree') { const col = s.dupatta || s.graphic; g.save(); body(); g.clip(); blob([[sx - sw - 1, shY - .4], [sx - sw + 3.4, shY - 1], [sx + waist + 1.4, hipY + 2], [sx + waist - 3, hipY + 3], [sx - sw - .6, shY + 7]]); fill(col); line([[sx - sw + 3.6, shY - .6], [sx + waist + 1.2, hipY + 1.6]], .8, SH(col, -.35)); g.restore(); }
  else { curve(sx - 2.9, ny, sx, ny + (s.outfit === 'sweater' ? 4 : 2.3), sx + 2.9, ny, .5); if (s.outfit === 'hoodie') { blob([[sx - 5.2, ny + .6], [sx - 3.6, ny - 2.4], [sx + 3.6, ny - 2.4], [sx + 5.2, ny + .6], [sx, ny + 1.6]]); fill(SH(c, -.12)); ink(.45); line([[sx - 1, ny + 1.4], [sx - 1.2, ny + 6]], .3, '#e8e0cc'); line([[sx + 1, ny + 1.4], [sx + 1.2, ny + 6]], .3, '#e8e0cc'); } }
  if (s.vest) { for (const sd of [-1, 1]) solid(() => blob([[sx + sd * 2.4, ny], [sx + sd * (sw - 2.2), shY + 1.4], [sx + sd * (sw - 1.8), shY + 9], [sx + sd * (waist + .4), hipY + 1], [sx + sd * .5, hipY + 1.6], [sx + sd * .5, ny + 5]]), sd === -LIT ? SH(s.vest, -.15) : s.vest, { shade: false, lw: .55 }); for (let i = 0; i < 4; i++) dot(sx - .2, ny + 6 + i * 2.8, .3, '#d9c27a'); }
  if (s.shawl) { solid(() => blob([[sx - sw - .8, shY + 1], [sx - 3, shY - 1.5], [sx + 3, shY - 1.5], [sx + sw + .8, shY + 1], [sx + sw + 1.4, shY + 13], [sx + sw - 2, shY + 15], [sx + 2, shY + 6], [sx - 2, shY + 6], [sx - sw + 2, shY + 15], [sx - sw - 1.4, shY + 13]]), s.shawl, { cx: sx, w: sw }); }
  if (s.dupatta && s.outfit !== 'saree') { solid(() => blob([[sx - sw + .4, shY + .2], [sx - sw + 3, shY - .6], [sx + 1, shY + 7.5], [sx + sw - 3, shY - .6], [sx + sw - .4, shY + .2], [sx + 1, shY + 10.2]]), s.dupatta, { shade: false, lw: .5 }); }
  if (s.lanyard) { line([[sx - 2.4, ny], [sx, ny + 10]], .45, s.lanyard); line([[sx + 2.4, ny], [sx, ny + 10]], .45, s.lanyard); poly([[sx - 1.6, ny + 10], [sx + 1.6, ny + 10], [sx + 1.6, ny + 13.6], [sx - 1.6, ny + 13.6]]); fill('#eeeadc'); ink(.35); }
  if (s.bag) { line([[sx - sw + 2, shY + .5], [sx + hipH + 1, hipY - 1]], .9, SH(s.bag, -.25)); solid(() => blob([[sx + hipH - 2.5, hipY - 5], [sx + hipH + 4, hipY - 5], [sx + hipH + 4.3, hipY + 2], [sx + hipH - 2.8, hipY + 2]]), s.bag, { cx: sx + hipH, w: 3 }); }
  if (o.extra) { solid(() => blob([[sx - sw - .8, shY + .4], [sx - sw + 3.4, shY - 1.2], [sx - sw + 4.6, shY + 13], [sx - sw + .6, shY + 14]]), '#b5432e', { shade: false, lw: .55 }); for (let y = shY + 1.5; y < shY + 13; y += 2.2) line([[sx - sw - .4, y], [sx - sw + 4, y + .4]], .3, '#e8c9a0'); }
  return { sw, waist, hipH, hem };
}
function hand(s, x, y, ang, far) {
  const sk = far ? SH(s.skin, -.12) : s.skin, c = Math.cos(ang), sn = Math.sin(ang);
  const P = (a, b) => [x + a * c - b * sn, y + a * sn + b * c];
  blob([P(-1.2, -1.45), P(1.4, -1.7), P(2.9, -.8), P(3.1, .9), P(1.4, 1.75), P(-1.2, 1.5)]); fill(sk); ink(.5);
  const t0 = P(.2, 1.4), t1 = P(1.9, 2.3); line([t0, t1], 1.05, sk); g.beginPath(); g.moveTo(t0[0], t0[1]); g.lineTo(t1[0], t1[1]); g.lineWidth = .4; g.strokeStyle = INK; g.stroke();
  line([P(1.6, -.5), P(2.8, -.5)], .25, SH(sk, -.35)); line([P(1.6, .5), P(2.8, .4)], .25, SH(sk, -.35));
}
function arm(s, shx, shy, tx, ty, sg, far) {
  const r = Sprites.ik(shx * K, shy * K, tx * K, ty * K, 17.5 * K, 15 * K, sg), ex = r.ex / K, ey = r.ey / K, hx = r.hx / K, hy = r.hy / K, mass = s.mass || 1;
  const sk = far ? SH(s.skin, -.12) : s.skin, cl = far ? SH(s.shirt, -.14) : s.shirt, sleeve = sleeveOf(s), ang = Math.atan2(hy - ey, hx - ex);
  // skin (one tube shoulder→elbow→wrist), then the sleeve over it as one piece
  solid(() => tube([[shx, shy], [ex, ey], [hx, hy]], [2.35 * mass, 1.95 * mass, 1.4 * mass]), sk, { cx: shx, w: 2.4, lw: .55 });
  if (sleeve === 'long') { const cf = [lerp(ex, hx, .82), lerp(ey, hy, .82)]; solid(() => tube([[shx, shy], [ex, ey], cf], [2.75 * mass, 2.45 * mass, 2.05 * mass]), cl, { cx: shx, w: 2.8, lw: .6 }); curve(ex - 1.3, ey - .5, ex, ey + .7, ex + 1.3, ey - .4, .28, SH(cl, -.4)); line([[cf[0] - (cf[1] - ey) * .12, cf[1] - .3], [cf[0] + .1, cf[1] + .2]], .25, SH(cl, -.4)); }
  else { const mp = [lerp(shx, ex, .46), lerp(shy, ey, .46)]; solid(() => tube([[shx, shy], mp], [2.9 * mass, 2.65 * mass]), cl, { cx: shx, w: 3, lw: .6 }); }
  hand(s, hx, hy, ang, far);
  return r;
}

/* ---------- full figures ---------- */
function begin(gctx, light) { g = gctx; LIT = light >= 0 ? 1 : -1; g.save(); g.translate(Sprites.ORIGX, Sprites.ORIGY); g.scale(K, K); g.imageSmoothingEnabled = true; }
function end() { g.restore(); }
function facePose(pose, m) { return { fx: pose.fx ?? (m.moving ? m.d * 1.5 : 0), fy: pose.fy || 0, lx: pose.look?.x || 0, expr: pose.expr || 'n', blink: pose.blink, t: pose.t || 0, glow: pose.glow }; }

function stand(gctx, s, pose = {}, light) {
  begin(gctx, light);
  try {
    const m = Sprites.measure(s, pose), { legs, shY, sx, moving, d, ph, amp } = m, hipY = m.hip[1], fac = moving ? .78 : 1;
    const sw = (s.female ? 9.4 : 11.2) * (s.mass || 1) * fac, farX = sx - (moving ? d * 5.5 : sw - 2.3), nearX = sx + (moving ? d * 6.5 : sw - 2.3);
    const targets = ['L', 'R'].map((side, i) => { const swing = ph + (i ? 0 : Math.PI), an = Math.sin(swing) * .5, shx = i ? nearX : farX, len = 31.2 - Math.max(0, Math.sin(an)) * 3.4, rest = i ? m.restR : m.restL, walk = [shx + d * Math.sin(an) * len, shY + 3 + Math.cos(an) * len], fb = [rest[0] + (walk[0] - rest[0]) * amp, rest[1] + (walk[1] - rest[1]) * amp]; return Sprites.smooth(pose, side, pose.arms?.[side] || fb); });
    const far = arm(s, farX, shY + 2.4, targets[0][0], targets[0][1], moving ? d : 1, true);
    const wrap = s.wrap || s.outfit === 'saree', hips = [];
    for (const i of [0, 1]) { const l = legs[i], off = (moving ? 1.8 : 4.4) * (i ? 1 : -1), hx = m.hip[0] + off, knee = [hx + l.kx, hipY + l.ky], ank = [hx + l.ax, hipY + l.ay]; hips.push({ hx, knee, ank }); }
    const order = moving ? [0, 1] : [0, 1];
    for (const i of order) { const L = hips[i]; leg(s, [L.hx, hipY], L.knee, L.ank, !i, !wrap); foot(s, L.ank[0], L.ank[1] + 2.2, moving ? d : (i ? .25 : -.25), !i); }
    if (wrap) { const hem = s.outfit === 'saree' || s.wrap === 'lungi' ? -2.5 : hipY + 34; wrapSkirt(s, sx, hipY - 5, hem, (s.female ? 8.4 : 8) * (s.mass || 1) * fac, s.outfit === 'saree' ? 2.8 : 1.6, moving ? ph : 0); }
    torso(s, sx, shY, hipY, fac, pose);
    drawHead(s, m.headX, m.headTop, shY, facePose(pose, m));
    const near = arm(s, nearX, shY + 2.4, targets[1][0], targets[1][1], moving ? d : -1, false);
    return { hx: m.hip[0] * K, hipY: hipY * K, shY: shY * K, hand: near, lhand: far, headTop: m.headTop * K, sx0: sx * K, mouth: m.mouth.map(v => v * K) };
  } finally { end(); }
}
function sit(gctx, s, pose = {}, light) {
  begin(gctx, light);
  try {
    const m = Sprites.measure(s, pose, true), { shY, sx } = m, hipY = -28, seat = -26, spread = pose.legPose === 2 ? 2 : 0, mass = s.mass || 1;
    const lk = [sx - 6.4, seat + 1.8], rk = [sx + 6.4, seat + 1.8], la = [sx - 7.4 - spread, -3], ra = pose.legPose === 1 ? [sx - 2.6, -7.5] : [sx + 7.4 + spread + (pose.jig || 0), -3 - (pose.tap || 0)];
    const wrap = s.wrap || s.outfit === 'saree';
    // shins + feet, then the lap (thighs seen end-on), then the body
    for (const [k, a, far] of [[lk, la, true], [rk, ra, false]]) { if (wrap) leg(s, null, k, a, far, false); else { const c = far ? SH(s.pants, -.12) : s.pants; solid(() => tube([k, [a[0], a[1] - .5]], [3.1 * mass, 2.2]), c, { cx: k[0], w: 3 }); } foot(s, a[0], a[1] + 2.2, far ? -.2 : .2, far); }
    if (wrap) { const hem = s.outfit === 'saree' || s.wrap === 'lungi' ? -2.2 : -8; solid(() => blob([[sx - 9.6 * mass, hipY - 1.5], [sx + 9.6 * mass, hipY - 1.5], [sx + 10.4 * mass, seat + 3], [sx + 9.4 * mass, hem], [sx, hem + .8], [sx - 9.4 * mass, hem], [sx - 10.4 * mass, seat + 3]]), s.outfit === 'saree' ? s.shirt : s.pants, { cx: sx, w: 10 }); if (s.outfit === 'saree') line([[sx - 9.2 * mass, hem - .9], [sx + 9.2 * mass, hem - .9]], 1.1, s.dupatta || s.graphic); }
    else solid(() => blob([[sx - 9.4 * mass, hipY - 1.5], [sx + 9.4 * mass, hipY - 1.5], [rk[0] + 3.6, rk[1] - .2], [rk[0] + 2.6, rk[1] + 2.6], [sx, seat + 3.6], [lk[0] - 2.6, lk[1] + 2.6], [lk[0] - 3.6, lk[1] - .2]]), s.pants, { cx: sx, w: 9 });
    if (!wrap) { curve(sx - .4, hipY + .5, sx - .2, seat + 1.5, sx, seat + 3.2, .35, SH(s.pants, -.35)); }
    const t = torso(s, sx, shY, hipY, 1, pose);
    if (s.outfit === 'kurta' || s.outfit === 'turban') { solid(() => blob([[sx - t.hipH - 1.5, hipY - 2], [sx + t.hipH + 1.5, hipY - 2], [rk[0] + 3.4, rk[1] + .6], [sx, seat + 3.4], [lk[0] - 3.4, lk[1] + .6]]), s.shirt, { cx: sx, w: 9 }); }
    drawHead(s, m.headX, m.headTop, shY, facePose(pose, m));
    const sw = t.sw, tl = Sprites.smooth(pose, 'L', pose.arms?.L || m.restL), tr = Sprites.smooth(pose, 'R', pose.arms?.R || m.restR);
    const left = arm(s, sx - sw + 2.3, shY + 2.4, tl[0], tl[1], 1, false), right = arm(s, sx + sw - 2.3, shY + 2.4, tr[0], tr[1], -1, false);
    return { shY: shY * K, head: { x: m.headX * K, top: m.headTop * K }, handL: left, handR: right, sh: sx * K, mouth: m.mouth.map(v => v * K) };
  } finally { end(); }
}

/* ---------- people: Indian-comics palette and wardrobe ---------- */
const SKIN = ['#d8a77c', '#c98f62', '#b77a4e', '#a5683f', '#8f5734', '#7a4a2c'];
const CLOTH = ['#e8dcc0', '#d9472f', '#e0a530', '#2f6f8f', '#3d7a52', '#8e3b5f', '#f0ead8', '#5a6fa8', '#c75b2a', '#7a5a9a', '#2e4a6a', '#e6c87a'];
function style(s) {
  if (s.chitraDone) return; s.chitraDone = true;
  const r = Art.rng(Math.floor((s.seed || 1) * 977)), pick = a => a[Math.floor(r() * a.length)];
  if (!s.keepLook) { s.skin = pick(SKIN); s.shirt = s.outfit === 'kurta' ? pick(['#f0ead8', '#e8dcc0', '#e6c87a', '#c9d6c4', '#d9472f', '#3d7a52']) : pick(CLOTH); if (s.outfit === 'saree') s.shirt = pick(['#d9472f', '#e0a530', '#8e3b5f', '#2f6f8f', '#3d7a52']); }
  if (s.age === 'old' && !s.keepLook) s.hc = pick(['#d8d4c6', '#bdb8a8', '#9a958a']);
  else if (!s.keepLook) s.hc = pick(['#17110d', '#1f1712', '#2a1d14']);
  if (s.female && s.outfit === 'kurta' && !s.dupatta) s.dupatta = pick(['#e0a530', '#d9472f', '#f0ead8', '#3d7a52']);
}
Art.registerTheme('chitra', {
  label: 'Chitra', icon: 'C', outlineW: 1, outlineColor: '#20140e',
  grade(v) { // warm, slightly richer colours (screen-print feel); keeps night readable
    const n = parseInt(v.slice(1), 16), rgb = [n >> 16, n >> 8 & 255, n & 255], l = rgb[0] * .3 + rgb[1] * .59 + rgb[2] * .11, h2 = x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
    return '#' + h2(l + (rgb[0] - l) * 1.12 + 4) + h2(l + (rgb[1] - l) * 1.1) + h2(l + (rgb[2] - l) * 1.05 - 3);
  },
  actors: { stand, sit, face: FACE, style }
});
})();
