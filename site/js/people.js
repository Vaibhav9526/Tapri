/* Human sprites: one rig (proportions of a real adult, ~7 heads tall) drawn in code, used for the chaiwala,
   the helper and every customer. All colours go through Art.tone so people share the scene's lighting. */
(() => {
'use strict';
const { tone, shade: SH } = Art, K = Art.K || 1, Z = K / 2;
let g, OX = 0, OY = 0, LD = -1, lastG, lastC;
const px = (x, y, w, h, c) => { if (g !== lastG || c !== lastC) { g.fillStyle = tone(c); lastG = g; lastC = c; } g.fillRect(Math.round(OX + x), Math.round(OY + y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
const pe = (x, y, w, h, c) => { lastC = null; g.fillStyle = c; g.fillRect(Math.round(OX + x), Math.round(OY + y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);
const INK = '#2b343a';
function shape(pts, c) {
  const y0 = Math.ceil(Math.min(...pts.map(p => p[1]))), y1 = Math.floor(Math.max(...pts.map(p => p[1])));
  for (let y = y0; y <= y1; y++) { const xs = []; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const p = pts[i], q = pts[j]; if ((p[1] > y) !== (q[1] > y)) xs.push(p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); } xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) px(Math.ceil(xs[i]), y, Math.max(1, Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1), 1, c); }
}
function oval(x, y, rx, ry, c) { for (let j = -Math.ceil(ry); j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - j * j / (ry * ry)))); px(x - w, y + j, w * 2 + 1, 1, c); } }
function limb(x0, y0, x1, y1, w, c) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, comic = Art.themeId === 'comic';
  const band = (a, b, col) => shape([[x0 + nx * a, y0 + ny * a], [x1 + nx * a * .82, y1 + ny * a * .82], [x1 + nx * b * .82, y1 + ny * b * .82], [x0 + nx * b, y0 + ny * b]], col);
  const edge = comic ? Z : .5 * Z;
  band(-w / 2 - edge, w / 2 + edge, SH(c, -.45)); oval(x0, y0, w / 2, w / 2, SH(c, -.35)); oval(x1, y1, w * .42, w * .42, SH(c, -.35));
  band(-w / 2, w / 2, c); band(w * .19, w / 2, SH(c, -.25));
  if (!comic) band(-w * .4, -w * .19, SH(c, .18));
}
function ik(sx, sy, tx, ty, a, b, sg) { // sg: +1 = left arm, -1 = right arm. Picks the elbow a real arm would use.
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.01; const m = a + b - 0.1; if (d > m) { dx *= m / d; dy *= m / d; d = m; } const mn = Math.abs(a - b) + 0.5; if (d < mn) { dx *= mn / d; dy *= mn / d; d = mn; }
  const ac = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)), base = Math.atan2(dy, dx), side = -sg;
  const e1 = { x: sx + Math.cos(base + ac) * a, y: sy + Math.sin(base + ac) * a }, e2 = { x: sx + Math.cos(base - ac) * a, y: sy + Math.sin(base - ac) * a };
  const px0 = sx + side * 30 * K, py0 = sy + 26 * K;                            // pole: out to the side and down, like a relaxed elbow
  const e = Math.hypot(e1.x - px0, e1.y - py0) <= Math.hypot(e2.x - px0, e2.y - py0) ? e1 : e2;
  return { ex: e.x, ey: e.y, hx: sx + dx, hy: sy + dy };
}
// smooth the hand targets over time so changing activity never snaps an arm
function sm(pose, key, t) {
  const h = pose.holder; if (!h) return t; const m = h._sm || (h._sm = {}), dt = pose.dt || .016;
  if (pose.noSmooth || !m[key]) { m[key] = [t[0], t[1]]; return t; }
  const k = 1 - Math.exp(-dt * (pose.rate || 13)); m[key][0] += (t[0] - m[key][0]) * k; m[key][1] += (t[1] - m[key][1]) * k; return [m[key][0], m[key][1]];
}
const hooks = {}; // themes may set hooks.head / hooks.torso / hooks.arm (same signatures as the built-ins) and hooks.style(style, opts)
const HK = name => hooks[name] || ({ head, torso, arm })[name];
let envPeople = null; // environment hint: { age: {young,mid,old weights}, outfits: ['shirt','tee',...], female: 0..1 }
/* ---------- people factory ---------- */
const SKIN = ['#c99770', '#b58359', '#a76f48', '#925e3d', '#d5a57e', '#805239'];
const SHIRTS = ['#bab39d', '#637a83', '#8f5649', '#667b62', '#ac915d', '#6c6778', '#a9aaa1', '#3b4851', '#a47850', '#778c8d', '#886475'];
const PANTS = ['#35424c', '#485969', '#6c604a', '#a39c81', '#4b5d53', '#5f5145'];
function makeStyle(o = {}) {
  const ep = envPeople || {}, weighted = w => { let n = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(w)) { n -= v; if (n <= 0) return k; } return 'mid'; };
  const female = o.female ?? Math.random() < (ep.female ?? .35), age = o.age || weighted(ep.age || { young: 3, mid: 4, old: 2 }), local = ep.outfits || ['shirt', 'kurta', 'tee', 'hoodie'];
  let outfit = pick(local); if (female) outfit = local.includes('sweater') ? pick(['sweater', 'shawl']) : local.includes('dhoti') || local.includes('lungi') ? pick(['saree', 'kurta']) : pick(['kurta', 'kurta', 'shirt']);
  const seed = rnd(1, 1000), n = Math.floor(seed);
  const s = { female, age, skin: o.skin || pick(SKIN), hc: age === 'old' ? pick(['#9d9e90', '#c0ba9e', '#7b847e']) : pick(['#252a28', '#302d27', '#34352d']), hair: female ? 'long' : age === 'old' ? pick(['bald', 'parted', 'short']) : pick(['short', 'parted', 'curly', 'short']), outfit,
    shirt: pick(SHIRTS), pants: pick(PANTS), shoe: pick(['#3d3b33', '#584c3c', '#4a5150']), sandals: Math.random() < .35, dupatta: female ? pick(['#b09865', '#a66c54', '#759397', null]) : null,
    cap: !female && age === 'young' && n % 7 === 0 ? '#657e7c' : null, glasses: n % (age === 'old' ? 2 : 8) === 0, must: !female && n % 3 !== 0 && age !== 'young', beard: !female && n % 7 === 0, stubble: !female && age === 'young' && n % 3 === 0,
    check: outfit === 'shirt' && n % 3 === 0, bindi: female && n % 2 === 0, graphic: pick(['#bda06a', '#925943', '#6d8d80']), h: rnd(female ? .94 : .97, female ? .99 : 1.05), seed, mass: [ .91, 1, 1.12, 1.02 ][n % 4], posture: (n % 5 - 2) * .3, cheek: n % 3, wrist: n % 2 ? 1 : -1 };
  if (['dhoti', 'turban'].includes(outfit)) { s.pants = '#c6bea2'; s.sandals = true; s.wrap = 'dhoti'; }
  if (['lungi', 'fisher'].includes(outfit)) { s.pants = pick(['#6f8a89', '#b3a278', '#7d8b9b']); s.wrap = 'lungi'; s.sandals = true; }
  if (outfit === 'turban') s.turban = pick(['#b7844c', '#b46748', '#c0a16a']);
  if (outfit === 'fisher') s.fisherCap = '#c3b58f';
  if (outfit === 'shawl') s.shawl = pick(['#8d8572', '#8e7268', '#7a8982']);
  if (outfit === 'waistcoat') s.vest = pick(['#56645e', '#6b5c4b', '#5d6770']);
  if (outfit === 'office') s.lanyard = '#718e92';
  if (local.includes('traveler') || outfit === 'traveler') s.bag = pick(['#8e7052', '#617877', '#876653']);
  if (o.override) Object.assign(s, o.override); if (hooks.style) hooks.style(s, o); return s;
}
function cachedPart(s, part, key, cx, top, w, h, dx, dy, paint) {
  const store = s._artCache || (s._artCache = {}), cache = store[part] || (store[part] = new Map()); let b = cache.get(key);
  if (!b) {
    b = Art.mk(w, h); const prev = [g, OX, OY]; g = b.x; OX = dx; OY = dy; lastC = null; paint(); [g, OX, OY] = prev; lastC = null;
    if (cache.size >= (part === 'head' ? 24 : 8)) cache.delete(cache.keys().next().value); cache.set(key, b);
  }
  g.drawImage(b.c, Math.round(OX + cx - dx), Math.round(OY + top - dy));
}
/* ---------- head ---------- */
function head(s, cx, top, o = {}) {
  const key = [Art.themeId, Art.name, LD, Math.round(o.fx || 0), Math.round(o.fy || 0), Math.round(o.lx || 0), o.expr, !!o.blink, !!o.glow, Math.sin((o.t || 0) * 12 + s.seed) > .1, Math.sin((o.t || 0) * 9) > 0].join(':');
  cachedPart(s, 'head', key, cx, top, 90 * Z, 83 * Z, 45 * Z, 19 * Z, () => paintHead(s, 0, 0, o));
}
function paintHead(s, cx, top, o = {}) {
  const comic = Art.themeId === 'comic', z = Z, sk = s.skin, dk = SH(sk, -.25), deep = SH(sk, -.4), hi = SH(sk, .17), hc = s.hc, w = (comic ? 16 : 13) + (s.mass > 1.05 ? 1 : 0), turn = clamp(o.fx || 0, -2, 2), fx = Math.round(turn * 1.3), ey = 15 + Math.round(o.fy || 0), look = clamp(Math.round(o.lx || 0), -1, 1);
  const p = (x, y, ww, h, c) => px(cx + x * z, top + y * z, ww * z, h * z, c), ov = (x, y, rx, ry, c) => oval(cx + x * z, top + y * z, rx * z, ry * z, c), sh = (pts, c) => shape(pts.map(q => [cx + q[0] * z, top + q[1] * z]), c);
  if (s.hair === 'long') { sh([[-w - 1, 7], [-w + 3, -2], [w - 3, -2], [w + 2, 9], [w + 2, 43], [w - 5, 48], [w - 7, 24], [-w + 4, 30], [-w - 2, 38]], SH(hc, -.12)); }
  const face = [[-w + 4, 0], [w - 5, 0], [w, 6], [w - 1, 21], [w - 5, 30], [4 + fx, 34], [-6 + fx, 33], [-w + 1, 24], [-w - 1, 9]];
  sh(face, INK); sh(face.map(([x, y]) => [x * .94, y < 4 ? y + 1 : y - 1]), sk);
  sh([[w - 5, 6], [w - 1, 11], [w - 2, 25], [5 + fx, 32], [1 + fx, 32], [w - 7, 23]], dk); sh([[-w + 1, 9], [-w + 5, 5], [-w + 5, 24], [-w + 2, 21]], hi);
  ov(-w - 1, 18, 2, 4, sk); ov(w, 18, 2, 4, dk); p(-w - 1, 17, 1, 3, dk); p(w, 17, 1, 3, deep);
  // hair on top
  if (s.hair !== 'bald' && s.hair !== 'topi') {
    sh([[-w - 1, 10], [-w - 2, 2], [-w + 3, -5], [-3, -7], [w - 2, -4], [w + 1, 2], [w + 1, 13], [w - 3, 9], [w - 5, 4], [fx + 2, 5], [-w + 4, 2], [-w + 3, 13]], hc);
    const rr = Art.rng(Math.floor(s.seed * 71)); for (let i = 0; i < 17; i++) { const x = -w + 2 + rr() * (w * 2 - 4), y = -4 + rr() * 7; if (s.hair === 'curly') ov(x, y, 2, 2, i % 3 ? hc : SH(hc, .18)); else p(x, y, 1, 2 + (rr() * 4 | 0), i % 4 ? SH(hc, .09) : SH(hc, .24)); }
    if (s.hair === 'parted') sh([[-w + 2, 0], [4, -3], [7, 0], [0, 5], [-w + 3, 7]], SH(hc, .12));
  } else if (s.hair === 'bald') { p(-w, 5, 3, 9, hc); p(w - 3, 5, 3, 10, hc); p(-7, 2, 6, 1, hi); }
  else { sh([[-w - 2, 1], [-w + 4, -4], [w - 4, -4], [w + 1, 2], [w, 8], [-w - 2, 7]], '#d0c6a6'); p(-w - 1, 6, w * 2, 2, '#9e9f8a'); }
  if (s.cap) { sh([[-w - 2, 4], [-w, -5], [w - 3, -7], [w + 1, 3]], s.cap); sh([[-w - 1, 3], [w + 1, 2], [w + 7 + fx, 7], [-w, 7]], SH(s.cap, -.25)); p(-w + 4, -4, 7, 1, SH(s.cap, .24)); }
  // face
  const laugh = o.expr === 'laugh', eyeW = comic ? 7 : 5, eyeH = comic ? 4 : 2;
  for (const ex0 of [-9, 4]) { const ex = ex0 + fx, ew = turn > 1 && ex0 < 0 || turn < -1 && ex0 > 0 ? eyeW - 1 : eyeW;
    p(ex, ey - 3 - (laugh ? 1 : 0), ew, 1 + (comic ? 1 : 0), hc);
    if (o.blink || laugh) { p(ex, ey + 1, ew, 1, deep); if (laugh) p(ex + 1, ey, ew - 2, 1, deep); }
    else { p(ex, ey, ew, 1, deep); p(ex + 1, ey + 1, ew - 1, eyeH, '#cec9ad'); p(ex + 2 + look, ey + 1, 2, eyeH, '#34392e'); if (comic) p(ex + 2 + look, ey + 1, 1, 1, '#f1e6bf'); }
    if (s.glasses) { p(ex - 1, ey - 1, ew + 3, 1, '#48514b'); p(ex - 1, ey + eyeH + 2, ew + 3, 1, '#48514b'); p(ex - 1, ey, 1, eyeH + 2, '#48514b'); p(ex + ew + 1, ey, 1, eyeH + 2, '#48514b'); p(ex, ey + 1, 1, 2, '#aebca9'); }
  }
  if (s.glasses) p(-1 + fx, ey + 1, 5, 1, '#48514b');
  sh([[fx, 18], [fx + 2, 17], [fx + 4, 24], [fx, 25], [fx - 1, 23]], dk); p(fx + (LD < 0 ? 0 : 2), 20, 1, 3, hi); p(fx + 2, 24, 2, 1, deep);
  p(-8 + fx, 24, 3, 1, s.age === 'old' ? dk : SH(sk, -.09));
  const my = 28, lip = s.female ? '#9a5b4d' : '#825743', opened = laugh || o.expr === 'talk' && Math.sin((o.t || 0) * 12 + s.seed) > .1 || o.expr === 'eat' && Math.sin((o.t || 0) * 9) > 0;
  if (opened) { sh([[-4 + fx, my - 1], [5 + fx, my - 1], [3 + fx, my + 3], [-2 + fx, my + 3]], '#5c4033'); p(-3 + fx, my - 1, 7, 1, '#d8c7a6'); }
  else if (o.expr === 'sip') { p(fx + 1, my - 1, 3, 2, lip); p(fx + 3, my, 1, 1, deep); }
  else { p(-3 + fx, my, 7, 1, lip); if (o.expr === 'smile') { p(-4 + fx, my - 1, 1, 1, lip); p(4 + fx, my - 1, 1, 1, lip); } p(-1 + fx, my + 2, 3, 1, hi); }
  if (s.must) { sh([[-1 + fx, 25], [-6 + fx, 26], [-7 + fx, 29], [-3 + fx, 28], [fx, 27], [4 + fx, 28], [7 + fx, 29], [5 + fx, 26]], hc); }
  if (s.stubble || s.beard) { for (let i = 0; i < 10; i++) { const xx = -8 + i * 1.7, yy = 28 + Math.round(Math.sin(i / 9 * Math.PI) * 4); p(xx, yy, 1, s.beard ? 3 : 1, s.beard ? hc : dk); } }
  if (s.age === 'old') { p(-5, 7, 9, 1, dk); p(-w + 2, ey + 5, 3, 1, dk); p(w - 5, ey + 5, 3, 1, dk); p(-6 + fx, 25, 1, 3, dk); p(7 + fx, 25, 1, 3, dk); }
  if (s.bindi) p(fx, 10, 2, 2, '#a34f43');
  headwear(s, cx, top, comic);
  if (o.glow) { p(-7, 23, 5, 1, '#9aa994'); p(4, 23, 3, 1, '#92a899'); }
}
function headwear(s, cx, top, wide = false) {
  const z = Z, w = wide ? 35 : 29, p = (x, y, ww, h, col) => px(cx + x * z, top + y * z, ww * z, h * z, col);
  if (s.turban) { oval(cx, top + z, w / 2 * z, 9 * z, SH(s.turban, -.14)); p(-w / 2, -5, w, 10, s.turban); for (let i = 0; i < 6; i++) limb(cx + (-w / 2 + i * 5) * z, top - 5 * z, cx + (-w / 2 + i * 5 + 9) * z, top + 5 * z, z, SH(s.turban, .24)); p(w / 2 - 2, 7, 4, 20, SH(s.turban, -.1)); }
  if (s.fisherCap) { p(-w / 2, -4, w, 8, s.fisherCap); p(-w / 2 - 5, 3, w + 10, 3, SH(s.fisherCap, -.25)); p(-w / 2 + 3, -5, w - 6, 1, SH(s.fisherCap, .18)); }
}
/* ---------- torso & clothes ---------- */
function torso(s, cx, top, rows, narrow, extra) {
  const key = [Art.themeId, Art.name, LD, rows, !!narrow, !!extra].join(':');
  cachedPart(s, 'torso', key, cx, top, 112 * Z, Math.max(100 * Z, rows + 18 * Z), 52 * Z, 10 * Z, () => paintTorso(s, 0, 0, rows, narrow, extra));
}
function paintTorso(s, cx, top, rows, narrow, extra) {
  const z = Z, mass = s.mass || 1, hw = (narrow ? 17 : 22) * mass * z, waist = (s.female ? 15 : 17) * mass * z, c = s.shirt, dk = SH(c, -.26), hi = SH(c, .19), y = rows;
  const points = [[cx - 7 * z, top - 2 * z], [cx - hw + 4 * z, top + z], [cx - hw - 2 * z, top + 10 * z], [cx - hw + 3 * z, top + rows * .45], [cx - waist, top + rows - 7 * z], [cx - waist - 2 * z, top + rows], [cx + waist + 3 * z, top + rows], [cx + waist, top + rows * .71], [cx + hw - 2 * z, top + rows * .28], [cx + hw, top + 9 * z], [cx + 8 * z, top - 2 * z]];
  shape(points, INK); shape(points.map(([x, yy]) => [x + (x < cx ? z : -z), yy + (yy < top + 5 * z ? z : -z)]), c);
  shape([[cx + hw - 5 * z, top + 7 * z], [cx + waist - z, top + y - 3 * z], [cx + 5 * z, top + y - z], [cx + hw - 12 * z, top + y * .4]], dk);
  if (Art.themeId !== 'comic') shape([[cx - hw + 2 * z, top + 10 * z], [cx - hw + 5 * z, top + 8 * z], [cx - waist + 4 * z, top + y - 5 * z], [cx - waist + z, top + y - 4 * z]], hi);
  const p = (x, yy, w, h, col) => px(cx + x * z, top + yy * z, w * z, h * z, col), sh = (pts, col) => shape(pts.map(q => [cx + q[0] * z, top + q[1] * z]), col);
  const shirt = ['shirt', 'office', 'traveler', 'fisher', 'waistcoat', 'turban', 'dhoti', 'lungi'].includes(s.outfit);
  sh([[-6, -2], [6, -2], [4, 6], [0, 9], [-4, 5]], SH(s.skin, -.16));
  if (shirt) { sh([[-9, 0], [-4, 0], [0, 8], [-5, 11]], hi); sh([[5, 0], [9, 1], [6, 11], [1, 8]], dk); p(0, 9, 1, rows / z - 12, dk); for (let j = 0; j < 5; j++) p(1, 14 + j * 9, 1, 1, '#c3b69a'); p(7, 19, 9, 1, hi); p(7, 20, 9, 10, SH(c, -.09)); p(8, 21, 2, 5, '#9b9b83'); }
  else if (s.outfit === 'kurta') { p(-3, 1, 6, 3, hi); p(0, 5, 1, 21, dk); for (let j = 0; j < 4; j++) p(0, 8 + j * 5, 2, 1, '#c9b282'); }
  else { p(-6, 1, 12, 2, dk); p(-4, 4, 8, 2, SH(c, -.15)); if (s.outfit === 'hoodie') { sh([[-13, 0], [-9, -7], [9, -7], [14, 2], [7, 7], [4, 1], [-4, 1], [-7, 7]], dk); p(-3, 7, 1, 12, '#b7ad8c'); p(4, 7, 1, 11, '#b7ad8c'); p(-12, 38, 24, 12, SH(c, -.11)); p(-11, 38, 22, 1, dk); } }
  if (s.check) { for (let j = 12; j < rows / z - 3; j += 9) p(-18, j, 36, 1, dk); for (let x = -15; x < 18; x += 8) p(x, 12, 1, Math.max(1, rows / z - 17), SH(c, -.14)); }
  if (s.outfit === 'tee' && Math.floor(s.seed) % 2) { p(-9, 19, 18, 12, s.graphic); p(-6, 22, 12, 1, dk); p(-4, 26, 8, 1, dk); }
  if (s.outfit === 'sweater') { for (let i = 0; i < 8; i++) p(-17 + i * 4, rows / z - 6, 1, 4, dk); for (let i = 0; i < 7; i++) { p(-15 + i * 5, 24 + i % 2 * 3, 3, 1, s.graphic); p(-14 + i * 5, 23 + i % 2 * 3, 1, 3, s.graphic); } }
  for (const [x, yy, w] of [[-12, 27, 7], [-8, 45, 9], [6, 39, 6], [-11, 57, 11]]) { if (yy * z < rows - 3 * z) { p(x, yy, w, 1, dk); p(x + 1, yy + 1, Math.max(1, w - 3), 1, Art.themeId === 'comic' ? c : hi); } }
  if (s.vest) { sh([[-19, 2], [-8, -1], [-1, 15], [-2, rows / z - 2], [-18, rows / z - 1]], s.vest); sh([[8, -1], [19, 3], [17, rows / z], [3, rows / z - 2], [2, 15]], SH(s.vest, -.12)); p(-16, 35, 11, 2, SH(s.vest, -.3)); p(7, 35, 9, 2, SH(s.vest, -.3)); }
  if (s.shawl) { sh([[-22, 0], [-12, -4], [16, 28], [11, 43], [-5, 22]], s.shawl); p(10, 29, 10, Math.max(1, rows / z - 28), SH(s.shawl, -.08)); p(11, rows / z - 5, 8, 2, SH(s.shawl, .22)); }
  if (s.dupatta || s.outfit === 'saree') { const col = s.dupatta || s.graphic; sh([[-17, -1], [-10, -2], [15, 36], [12, 45], [-6, 18]], col); p(12, 33, 5, Math.max(8, rows / z - 32), col); p(13, 35, 1, Math.max(8, rows / z - 35), SH(col, .22)); }
  if (s.lanyard) { limb(cx - 8 * z, top + 2 * z, cx, top + 30 * z, z, s.lanyard); limb(cx + 8 * z, top + 2 * z, cx, top + 30 * z, z, s.lanyard); p(-4, 29, 9, 12, '#c8c5a7'); p(-2, 31, 5, 4, s.lanyard); }
  if (s.bag) { limb(cx - 15 * z, top, cx + 15 * z, top + 54 * z, 4 * z, SH(s.bag, -.2)); p(12, 48, 19, 20, s.bag); p(13, 49, 17, 4, SH(s.bag, .15)); p(20, 56, 3, 2, '#b0a478'); }
  if (extra) extra(cx, top, rows);
}
/* ---------- arms ---------- */
function hand(s, x, y, sg, angle, far) {
  const z = Z, c = far ? SH(s.skin, -.12) : s.skin, dk = SH(c, -.28), d = sg > 0 ? 1 : -1;
  oval(x, y, 5 * z, 5 * z, dk); oval(x - z, y - z, 4 * z, 4 * z, c);
  for (let i = 0; i < 3; i++) { const xx = x + (-3 + i * 2) * z, yy = y + 2 * z; px(xx, yy, z, 3 * z, i === 2 ? dk : c); }
  oval(x + d * 4 * z, y - 2 * z, 2 * z, 3 * z, c); px(x - 2 * z, y + 2 * z, 5 * z, z, dk); px(x + d * 4 * z, y - 3 * z, z, 2 * z, SH(c, .2));
}
function arm(s, sx, sy, tx, ty, sg, far, sleeve) {
  const r = ik(sx, sy, tx, ty, 17 * K, 15 * K, sg), z = Z, skin = far ? SH(s.skin, -.12) : s.skin, sh = far ? SH(s.shirt, -.14) : s.shirt, short = (sleeve || (['tee', 'fisher', 'lungi'].includes(s.outfit) ? 'short' : 'long')) === 'short', mass = s.mass || 1;
  limb(sx, sy, r.ex, r.ey, 11 * mass * z, skin); limb(r.ex, r.ey, r.hx, r.hy, 8 * mass * z, skin);
  if (short) { limb(sx, sy, lerp(sx, r.ex, .56), lerp(sy, r.ey, .56), 14 * mass * z, sh); limb(lerp(sx, r.ex, .5), lerp(sy, r.ey, .5), lerp(sx, r.ex, .6), lerp(sy, r.ey, .6), 14 * mass * z, SH(sh, -.15)); }
  else { limb(sx, sy, r.ex, r.ey, 13 * mass * z, sh); limb(r.ex, r.ey, lerp(r.ex, r.hx, .82), lerp(r.ey, r.hy, .82), 11 * mass * z, sh); limb(lerp(r.ex, r.hx, .75), lerp(r.ey, r.hy, .75), lerp(r.ex, r.hx, .84), lerp(r.ey, r.hy, .84), 12 * z, SH(sh, .12)); }
  oval(sx, sy, 6 * mass * z, 6 * mass * z, sh); // shoulder cap hides the joint
  px(r.ex - 3 * z, r.ey + z, 5 * z, z, SH(sh, -.22)); hand(s, r.hx, r.hy, sg, Math.atan2(r.hy - r.ey, r.hx - r.ex), far);
  return r;
}
function armRest(s, sx, sy, side, far, lift) { // upper arm hangs, forearm points at the viewer so only a short stub shows
  return arm(s, sx, sy, sx + side * 2 * K, sy + 24 * K - (lift || 0), -side, far);
}
/* ---------- props (all drawn at their own coordinates inside the actor) ---------- */
const props = {
  glass(x, y, lvl = 0) { const z = Z; shape([[x - 5 * z, y - 16 * z], [x + 6 * z, y - 16 * z], [x + 4 * z, y], [x - 3 * z, y]], '#a6b6ae'); shape([[x - 4 * z, y - 14 * z], [x + 5 * z, y - 14 * z], [x + 3 * z, y - z], [x - 2 * z, y - z]], '#687d7b'); if (lvl > 0) { const h = Math.max(1, Math.round(12 * lvl)); shape([[x - 3 * z, y - h * z], [x + 4 * z, y - h * z], [x + 3 * z, y - z], [x - 2 * z, y - z]], '#9f663c'); px(x - 3 * z, y - h * z, 7 * z, z, '#c5a16c'); } px(x - 4 * z, y - 15 * z, z, 13 * z, '#d9d7b6'); px(x - 4 * z, y - 16 * z, 10 * z, z, '#c5d0bd'); px(x - 3 * z, y, 7 * z, z, '#788f8b'); },
  steel(x, y) { const z = Z; shape([[x - 5 * z, y - 14 * z], [x + 5 * z, y - 14 * z], [x + 4 * z, y], [x - 4 * z, y]], '#9faeaa'); px(x - 3 * z, y - 13 * z, 2 * z, 12 * z, '#d3d0af'); px(x + 2 * z, y - 12 * z, 2 * z, 11 * z, '#627b7d'); },
  phone(x, y, t) { const z = Z; shape([[x - 6 * z, y - 11 * z], [x + 5 * z, y - 12 * z], [x + 6 * z, y + 8 * z], [x - 5 * z, y + 9 * z]], '#253c47'); px(x - 4 * z, y - 9 * z, 8 * z, 15 * z, '#8caaa8'); pe(x - 3 * z, y - 8 * z, 6 * z, 2 * z, '#c1cdb7'); for (let i = 0; i < 4; i++) pe(x - 3 * z, y + (-4 + i * 3) * z, (5 - i % 2) * z, z, i % 2 ? '#607e82' : '#acc2b3'); px(x - z, y + 7 * z, 3 * z, z, '#8ea6a0'); },
  phoneEar(x, y) { px(x - 2 * Z, y - 10 * Z, 6 * Z, 18 * Z, '#283e48'); px(x - Z, y - 9 * Z, 2 * Z, 15 * Z, '#819893'); },
  samosa(x, y, bites = 0) { const z = Z; shape([[x - 7 * z, y], [x - 5 * z, y - 5 * z], [x + z, y - 16 * z], [x + 4 * z, y - 13 * z], [x + 10 * z, y], [x + 3 * z, y + 2 * z]], '#b98545'); shape([[x - 5 * z, y - z], [x + z, y - 14 * z], [x + 3 * z, y - 8 * z], [x + z, y]], '#d4a85c'); px(x - 3 * z, y - 2 * z, 11 * z, z, '#9b6c3b'); for (let i = 0; i < 6; i++) px(x + (i % 3 * 3 - 2) * z, y + (-3 - i * 2) * z, z, z, '#a3703b'); if (bites) px(x + 5 * z, y - 5 * z, 3 * z, 3 * z, '#d8bd7c'); },
  chips(x, y, open, col = '#b58b46') { const z = Z; shape([[x - 8 * z, y - 18 * z], [x + 7 * z, y - 19 * z], [x + 9 * z, y + 3 * z], [x - 8 * z, y + 3 * z]], SH(col, -.18)); px(x - 7 * z, y - 16 * z, 13 * z, 17 * z, col); px(x - 6 * z, y - 16 * z, 2 * z, 16 * z, SH(col, .2)); px(x - 5 * z, y - 10 * z, 10 * z, 6 * z, '#cfbf92'); px(x - 3 * z, y - 8 * z, 6 * z, 2 * z, SH(col, -.25)); if (open) { px(x - 5 * z, y - 21 * z, 4 * z, 5 * z, '#d5b56e'); px(x + 2 * z, y - 24 * z, 3 * z, 7 * z, '#bfa160'); } },
  bottle(x, y, col = '#9e5a40') { const z = Z; shape([[x - 2 * z, y - 29 * z], [x + 2 * z, y - 29 * z], [x + 2 * z, y - 21 * z], [x + 5 * z, y - 17 * z], [x + 5 * z, y], [x - 5 * z, y], [x - 5 * z, y - 17 * z], [x - 2 * z, y - 21 * z]], col); px(x - 2 * z, y - 30 * z, 5 * z, 3 * z, '#a0aaa0'); px(x - 4 * z, y - 12 * z, 9 * z, 5 * z, '#c7b78e'); px(x - 3 * z, y - 19 * z, z, 18 * z, SH(col, .3)); },
  paper(x, y, w, h, t) { const off = Math.round(Math.sin(t * 1.6) * Z); shape([[x - w / 2, y + off], [x - Z, y + 2 * Z], [x + w / 2, y - Z + off], [x + w / 2 - Z, y + h], [x, y + h - 2 * Z], [x - w / 2 + Z, y + h]], '#c8c3a7'); px(x, y + 2 * Z, Z, h - 3 * Z, '#aaa48b'); px(x - w / 2 + 4 * Z, y + 4 * Z, w - 8 * Z, 3 * Z, '#6b7269'); for (let j = 0; j < 6; j++) for (const xx of [-w / 2 + 4 * Z, 4 * Z]) px(x + xx, y + (10 + j * 4) * Z, Math.max(1, w / 2 - 7 * Z), Z, j % 3 ? '#8f9681' : '#65766c'); px(x - w / 2 + 4 * Z, y + 11 * Z, 13 * Z, 10 * Z, '#7f9083'); },
  cash(x, y) { px(x - 7 * Z, y - 4 * Z, 14 * Z, 8 * Z, '#80906c'); px(x - 6 * Z, y - 3 * Z, 12 * Z, Z, '#b0b58b'); oval(x, y, 3 * Z, 2 * Z, '#5e7862'); },
  coin(x, y) { oval(x, y, 2 * Z, 2 * Z, '#bdb388'); px(x, y - Z, Z, Z, '#e0d0a1'); },
  tray(x, y) { oval(x, y, 23 * Z, 4 * Z, '#6d8586'); oval(x, y - Z, 23 * Z, 3 * Z, '#b5bca7'); oval(x, y - Z, 19 * Z, Z, '#879d97'); },
  kettle(x, y, ang = 0) { // (x,y) = the grip on the handle; the kettle hangs below it. returns the spout tip
    const rot = (a, b) => [x + (a * Math.cos(ang) - b * Math.sin(ang)) * Z, y + (a * Math.sin(ang) + b * Math.cos(ang)) * Z], sh = (pts, c) => shape(pts.map(p => rot(...p)), c), ln = (a, b, w, c) => { const p = rot(...a), q = rot(...b); limb(...p, ...q, w * Z, c); };
    sh([[-11, 11], [-8, 6], [7, 6], [12, 12], [13, 25], [8, 30], [-7, 30], [-13, 24]], '#93a09a'); sh([[-9, 11], [-4, 8], [-2, 26], [-8, 25]], '#c3c6ae'); sh([[7, 9], [12, 13], [12, 25], [7, 28], [5, 14]], '#5e777c'); sh([[-11, 25], [10, 26], [8, 30], [-7, 30]], '#4d5654'); sh([[9, 14], [15, 13], [22, 4], [25, 5], [18, 19], [10, 22]], '#a6b0a3'); ln([-9, 8], [-8, 0], 2, '#5e6c69'); ln([-8, 0], [7, -1], 2, '#5e6c69'); ln([7, -1], [9, 8], 2, '#5e6c69'); ln([-8, 0], [6, -1], 2, '#c3c8b4'); ln([-8, 7], [8, 7], 2, '#b5b8a1'); ln([-2, 4], [2, 4], 3, '#5c675f'); return rot(25, 5);
  },
  strainer(x, y) { oval(x, y, 8 * Z, 3 * Z, '#b0b9a8'); oval(x, y, 5 * Z, Z, '#677c77'); limb(x + 7 * Z, y, x + 20 * Z, y - 9 * Z, 2 * Z, '#9cae9f'); },
  plate(x, y, n, col = '#c69b57') { oval(x, y, 17 * Z, 4 * Z, '#8c9b95'); oval(x, y - Z, 16 * Z, 3 * Z, '#c4c5ac'); for (let i = 0; i < n; i++) { const xx = x + (i * 10 - 8) * Z; shape([[xx - 5 * Z, y - 2 * Z], [xx, y - 12 * Z], [xx + 7 * Z, y - Z]], col); px(xx, y - 8 * Z, 2 * Z, 3 * Z, SH(col, .2)); } },
  jhara(x0, y0, x1, y1) { limb(x0, y0, x1, y1, 2 * Z, '#8da49d'); oval(x0, y0, 7 * Z, 3 * Z, '#a8b4a1'); for (let i = 0; i < 5; i++) px(x0 + (i * 3 - 6) * Z, y0 - Z, Z, 2 * Z, '#576d68'); },
  ladle(x0, y0, x1, y1) { limb(x0, y0, x1, y1, 2 * Z, '#a1b3a6'); oval(x1, y1, 5 * Z, 3 * Z, '#93a49a'); },
  cloth(x, y) { shape([[x - 10 * Z, y - 3 * Z], [x + 5 * Z, y - 5 * Z], [x + 10 * Z, y + 3 * Z], [x - 7 * Z, y + 5 * Z]], '#a3664f'); px(x - 6 * Z, y - 2 * Z, 12 * Z, Z, '#c1966c'); px(x - 3 * Z, y, Z, 4 * Z, '#7f5945'); },
  agarbatti(x0, y0, x1, y1, lit) { limb(x0, y0, x1, y1, Z, '#a9986b'); if (lit) pe(x1, y1, Z, 2 * Z, '#dc9560'); },
  match(x, y, flame, t) { px(x, y, Z, 8 * Z, '#b5a06d'); if (flame) { oval(x, y - 3 * Z, 2 * Z, (4 + Math.sin(t * 20)) * Z, '#c8924c'); pe(x, y - 5 * Z, Z, 5 * Z, '#f3d394'); } }
};
/* ---------- figures ---------- */
const BW = 170 * K, BH = 150 * K, ORIGX = 85 * K, ORIGY = 126 * K;
function begin(gctx, light) { g = gctx; OX = ORIGX; OY = ORIGY; LD = light; lastC = null; }
function measure(s, pose = {}, seated = false) {
  const owner = !!pose.extra, h = (s.h || 1) * (owner ? 1.08 : 1), d = pose.dir || 1, ph = pose.phase || 0, moving = pose.moving ? 1 : 0, cr = pose.crouch || 0, thick = s.mass || 1;
  let amp = moving; const hd = pose.holder; if (hd && !seated) { hd._amp = hd._amp === undefined ? moving : hd._amp + (moving - hd._amp) * (1 - Math.exp(-(pose.dt || .016) * 9)); amp = hd._amp; }
  const leg = i => { const p = ph + i * Math.PI, th = amp * .36 * Math.sin(p) + (1 - amp) * (i ? -.055 : .06) + cr * .7, kn = amp * (.13 + .66 * Math.max(0, Math.cos(p))) + (1 - amp) * .06 + cr * 1.45, kx = 24 * h * Math.sin(th) * d, ky = 24 * h * Math.cos(th), ax = kx + 23 * h * Math.sin(th - kn) * d, ay = ky + 23 * h * Math.cos(th - kn); return { kx, ky, ax, ay, phase: p }; };
  const legs = [leg(0), leg(1)], hipY = seated ? -28 : -3 - Math.max(...legs.map(l => l.ay)), bob = moving && !seated ? Math.abs(Math.sin(ph)) * .7 : 0, lean = pose.lean || 0, sx = (pose.sway || 0) + lean * .35 * d + (seated ? (s.posture || 0) : 0), shY = hipY - 33 * h + (pose.dip || 0) + (seated ? (pose.dy || 0) + lean : bob), headTop = shY - 19 + (pose.headDy || 0), headX = sx + (moving ? d * 1.3 : 0) + (pose.hdx || 0), hw = (moving ? 6 : 10.5) * thick;
  return { shY, headTop, mouth: [headX + 1.5 + (pose.fx || 0) * .65, headTop + 14 + (pose.fy || 0) * .3], ear: [headX + 7.3, headTop + 9], chest: [sx, shY + 14], restL: [sx - 11, shY + 34.8], restR: [sx + 11, shY + 34.4], hip: [pose.sway || 0, hipY], height: -headTop + 3, halfWidth: hw, legs, h, sx, headX, moving, ph, d, amp };
}
const metrics = (s, pose, seated = false) => measure(s, pose, seated);
function shoes(s, x, y, dir, far = false) { const c = far ? SH(s.shoe, -.15) : s.shoe; shape([[x - 6 * Z, y - 4 * Z], [x + 5 * Z, y - 4 * Z], [x + (dir > 0 ? 11 : 7) * Z, y + Z], [x + 10 * Z, y + 4 * Z], [x - 7 * Z, y + 3 * Z]], s.sandals ? '#665944' : c); px(x - 6 * Z, y + 3 * Z, 16 * Z, 2 * Z, '#303b3c'); if (s.sandals) { px(x - 3 * Z, y - 5 * Z, 8 * Z, 5 * Z, s.skin); px(x - 3 * Z, y - 2 * Z, 8 * Z, 2 * Z, '#9b825b'); } else px(x - Z, y - 3 * Z, 7 * Z, Z, SH(c, .2)); }
function facePose(s, pose, m) { return { fx: pose.fx ?? (m.moving ? m.d * 1.5 : 0), fy: pose.fy || 0, lx: pose.look?.x || 0, expr: pose.expr || 'n', blink: pose.blink, t: pose.t || 0, glow: pose.glow }; }
// walking / standing figure. pose: {dir, phase, moving, lean, dip, look, fx, fy, expr, blink, t, crouch, arms:{L:[x,y]|null, R:[x,y]|null}, extra, glow, headDy, sway}
// Standing still = facing the viewer (wide shoulders); moving = three-quarter side view.
function stand(gctx, s, pose = {}, light) {
  begin(gctx, light); const m = measure(s, pose), { legs, shY, sx, h, moving, d, ph, amp } = m, hipY = m.hip[1], wide = m.halfWidth;
  const farX = sx - (moving ? d * 5.5 : wide), nearX = sx + (moving ? d * 6.5 : wide);
  const targets = ['L', 'R'].map((side, i) => { const swing = ph + (i ? 0 : Math.PI), ang = Math.sin(swing) * .5, shx = i ? nearX : farX, len = 29.4 - Math.max(0, Math.sin(ang)) * 3.2, rest = i ? m.restR : m.restL, walk = [shx + d * Math.sin(ang) * len, shY + 3 + Math.cos(ang) * len], fallback = [rest[0] + (walk[0] - rest[0]) * amp, rest[1] + (walk[1] - rest[1]) * amp]; return sm(pose, side, pose.arms?.[side] || fallback).map(v => v * K); });
  const far = HK('arm')(s, farX * K, (shY + 3) * K, ...targets[0], moving ? d : 1, true);
  const legDraw = (l, i) => { const col = i ? s.pants : SH(s.pants, -.15), offset = (moving ? 1.8 : 4.5) * (i ? 1 : -1), xx = m.hip[0] + offset, width = s.wrap ? 20 : (s.mass || 1) * 15;
    limb(xx * K, hipY * K, (xx + l.kx) * K, (hipY + l.ky) * K, width * Z, col); limb((xx + l.kx) * K, (hipY + l.ky) * K, (xx + l.ax) * K, (hipY + l.ay) * K, (s.wrap ? 13 : 11) * Z, col); px((xx + l.kx - 2) * K, (hipY + l.ky) * K, 5 * K, Z, SH(col, -.2)); shoes(s, (xx + l.ax) * K, (hipY + l.ay) * K, d, !i); };
  legDraw(legs[0], 0); const long = ['kurta', 'dhoti', 'turban'].includes(s.outfit); HK('torso')(s, sx * K, shY * K, (long ? 41 : 33) * h * K, !!moving, pose.extra); legDraw(legs[1], 1);
  if (s.wrap || s.outfit === 'saree') { const bottom = s.outfit === 'saree' ? -5 : hipY + 24 * h, col = s.outfit === 'saree' ? s.shirt : s.pants, start = hipY - 2; shape([[(sx - 9) * K, start * K], [(sx + 10) * K, start * K], [(sx + 9 + Math.sin(ph) * moving) * K, bottom * K], [(sx - 9 + Math.sin(ph) * moving) * K, bottom * K]], col); for (let j = 0; j < 4; j++) px((sx - 6 + j * 4) * K, (start + 4) * K, Z, Math.max(2, (bottom - start - 7) * K), SH(col, j % 2 ? -.2 : .15)); px((sx - 9) * K, (bottom - 2) * K, 18 * K, 2 * K, s.dupatta || SH(col, -.18)); }
  px((sx - 3) * K, (shY - 4) * K, 6 * K, 5 * K, SH(s.skin, -.13)); HK('head')(s, m.headX * K, m.headTop * K, facePose(s, pose, m));
  const near = HK('arm')(s, nearX * K, (shY + 3) * K, ...targets[1], moving ? -d : -1, false);
  return { hx: m.hip[0] * K, hipY: hipY * K, shY: shY * K, hand: near, lhand: far, headTop: m.headTop * K, sx0: sx * K, mouth: m.mouth.map(v => v * K) };
}
// seated figure. origin = ground under the stool; seat top is 26px up. pose: {sx (sway), lean, look, expr, arms:{L,R}, legPose, tap, jig, headDy, fx, fy}
function sit(gctx, s, pose = {}, light) {
  begin(gctx, light); const m = measure(s, pose, true), { shY, sx, h } = m, seat = -26, pants = s.pants, spread = pose.legPose === 2 ? 2 : 0, lk = [sx - 7, seat + 2], rk = [sx + 7, seat + 2], la = [sx - 8 - spread, -3], ra = pose.legPose === 1 ? [sx - 3, -8] : [sx + 8 + spread + (pose.jig || 0), -3 - (pose.tap || 0)];
  // legs (front view): thighs are short wedges, shins hang to the shoes
  shape([[(sx - 12) * K, (seat - 6) * K], [(sx + 12) * K, (seat - 6) * K], [rk[0] * K + 7 * Z, rk[1] * K], [lk[0] * K - 6 * Z, lk[1] * K]], SH(pants, -.08));
  for (const [k, foot, far] of [[lk, la, true], [rk, ra, false]]) { limb(k[0] * K, k[1] * K, foot[0] * K, foot[1] * K, (s.wrap ? 17 : 13) * Z, far ? SH(pants, -.12) : pants); px(k[0] * K - 4 * Z, k[1] * K, 8 * Z, Z, SH(pants, -.27)); shoes(s, foot[0] * K, foot[1] * K, foot === la ? -1 : 1, far); }
  if (s.outfit === 'saree') { shape([[(sx - 12) * K, (seat - 6) * K], [(sx + 13) * K, (seat - 6) * K], [(sx + 11) * K, -7 * K], [(sx - 12) * K, -7 * K]], s.shirt); for (let j = 0; j < 4; j++) px((sx - 8 + j * 5) * K, -24 * K, Z, 15 * K, SH(s.shirt, -.18)); px((sx - 12) * K, -9 * K, 23 * K, 2 * K, s.dupatta || s.graphic); }
  HK('torso')(s, sx * K, shY * K, (s.outfit === 'kurta' ? 36 : 33) * h * K, false, pose.extra); px((sx - 3) * K, (shY - 4) * K, 6 * K, 5 * K, SH(s.skin, -.17)); HK('head')(s, m.headX * K, m.headTop * K, facePose(s, pose, m));
  const tl = sm(pose, 'L', pose.arms?.L || m.restL).map(v => v * K), tr = sm(pose, 'R', pose.arms?.R || m.restR).map(v => v * K), left = HK('arm')(s, (sx - m.halfWidth) * K, (shY + 3) * K, ...tl, 1, false), right = HK('arm')(s, (sx + m.halfWidth) * K, (shY + 3) * K, ...tr, -1, false);
  return { shY: shY * K, head: { x: m.headX * K, top: m.headTop * K }, handL: left, handR: right, sh: sx * K, mouth: m.mouth.map(v => v * K) };
}
window.Sprites = { hooks, set envPeople(v) { envPeople = v; }, get envPeople() { return envPeople; }, armRest, makeStyle, metrics, stand, sit, props, BW, BH, ORIGX, ORIGY, shape, oval, limb, ik, px, pe, arm, head, headwear, torso, begin, setG(c, o) { g = c; lastC = null; if (o) { OX = o.x; OY = o.y; } }, rnd, pick };
})();
