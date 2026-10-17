/* Street life in front of the stall: vendors calling out (sabzi, chana, gubbare, kulfi, raddi), a child asking the
   customers for a few rupees, kids playing gully cricket, people passing by and the odd cow. Everyone walks the front lane,
   is drawn with the same rig as the customers and speaks with the ElevenLabs lines in dialogues.js (D.street). */
(() => {
'use strict';
const { L, D, clamp, rnd, pick } = Tapri;
const LANE = 314, KID_LANE = 311, ASK_Y = 302;   // front lane (in front of the tables); a child asking stands just in front of the seat
const S = D.street, pan = x => clamp((x / L.W) * 2 - 1, -1, 1);
const actors = [];
let nextSpawn = 8, lastKind = '';

// rig props are painted straight onto the actor buffer (same outline + lighting as the people), in scene px around the feet
const K = () => Sprites.BW / 170, OX = () => Sprites.ORIGX, OY = () => Sprites.ORIGY;
function rect(g, x, y, w, h, c) { const k = K(); g.fillStyle = c; g.fillRect(Math.round(OX() + x * k), Math.round(OY() + y * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))); }
function disc(g, x, y, r, c) { const k = K(); g.fillStyle = c; g.beginPath(); g.arc(OX() + x * k, OY() + y * k, r * k, 0, Math.PI * 2); g.fill(); }
function line(g, x0, y0, x1, y1, w, c) { const k = K(); g.strokeStyle = c; g.lineWidth = w * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(OX() + x0 * k, OY() + y0 * k); g.lineTo(OX() + x1 * k, OY() + y1 * k); g.stroke(); }
function wheel(g, x, y, r, t) { disc(g, x, y, r, '#2b2622'); disc(g, x, y, r - 1.5, '#6b5a44'); const a = t; line(g, x - Math.cos(a) * (r - 1), y - Math.sin(a) * (r - 1), x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1), 1, '#2b2622'); }

/* ---------- props: smooth vector, ink outline + flat colour + one shade (same look as envs/mohalla.js and themes/chitra-props.js) ---------- */
const INK = '#20140e';
function V(g, fn, d = 1) { const k = K(); g.save(); g.translate(OX(), OY()); g.scale(k * d, k); g.lineJoin = 'round'; g.lineCap = 'round'; g.imageSmoothingEnabled = true; try { fn(g); } finally { g.restore(); } }
const tn = c => Art.tone(c), sh = (c, v) => Art.shade(c, v);
function poly(g, pts, fill, lw = .8) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = tn(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } }
function blob(g, pts, fill, lw = .8) { const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s = m(pts[n - 1], pts[0]); g.beginPath(); g.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const e = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); } g.closePath(); if (fill) { g.fillStyle = tn(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } }
function ell(g, x, y, rx, ry, fill, lw = .8, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.05, rx), Math.max(.05, ry), rot, 0, 6.2832); if (fill) { g.fillStyle = tn(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } }
function ln(g, x0, y0, x1, y1, w, c) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = c === INK ? INK : c[0] === '#' ? tn(c) : c; g.stroke(); }
function rod(g, x0, y0, x1, y1, w, c) { ln(g, x0, y0, x1, y1, w + 1.2, INK); ln(g, x0, y0, x1, y1, w, c); }
function rrect(g, x, y, w, h, fill, r = 1.5, lw = .8) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = tn(fill); g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); } }
function wheel2(g, x, y, r, a) { ell(g, x, y, r, r, '#3a2f26', .9); ell(g, x, y, r - 1.6, r - 1.6, '#a88a5a', .5); for (let i = 0; i < 4; i++) { const t = a + i * Math.PI / 4; ln(g, x - Math.cos(t) * (r - 1.6), y - Math.sin(t) * (r - 1.6), x + Math.cos(t) * (r - 1.6), y + Math.sin(t) * (r - 1.6), .7, '#3a2f26'); } ell(g, x, y, 1.1, 1.1, '#d9b23a', .5); }

const PROPS = {
  sabzi(g, d, t) { // hand cart (thela) with heaps of vegetables, pushed ahead
    V(g, g => {
      const x0 = d > 0 ? 10 : -60;
      rod(g, d > 0 ? x0 : x0 + 50, -29, d > 0 ? x0 - 12 : x0 + 62, -40, 2, '#6b4a2a');
      rrect(g, x0, -30, 50, 5, '#9a6a3a', 1, .9); rrect(g, x0 + 1, -25.4, 48, 2.6, '#6b4a2a', .8, .7);
      for (let i = 0; i < 6; i++) ln(g, x0 + 4 + i * 8.4, -29.4, x0 + 4 + i * 8.4, -25.8, .6, 'rgba(32,20,14,.5)');
      rod(g, x0 + 10, -23, x0 + 10, -15, 1.6, '#6b4a2a'); rod(g, x0 + 40, -23, x0 + 40, -15, 1.6, '#6b4a2a');
      const cols = ['#d4372c', '#4d9a3e', '#d9a33a', '#7a4fa0', '#e8782a'];
      for (let i = 0; i < 5; i++) { const c = cols[i], cx = x0 + 6 + i * 9.4; for (const [dx, dy] of [[-2.6, 0], [2.6, 0], [0, -3.2]]) { ell(g, cx + dx, -33.4 + dy, 3, 2.7, c, .7); ell(g, cx + dx - .8, -34.4 + dy, .9, .7, sh(c, .45), 0); } }
      wheel2(g, x0 + 10, -15, 8, t * 3 * d); wheel2(g, x0 + 40, -15, 8, t * 3 * d);
    });
  },
  kulfi(g, d, t) { // red kulfi box on wheels with a bell
    V(g, g => {
      const x0 = d > 0 ? 10 : -42;
      rod(g, d > 0 ? x0 : x0 + 32, -40, d > 0 ? x0 - 10 : x0 + 42, -46, 2, '#4a4a4a');
      rrect(g, x0, -44, 32, 24, '#c0392c', 2, .9); rrect(g, x0 + 24, -44, 8, 24, '#8e241c', 2, 0); rrect(g, x0, -44, 32, 24, null, 2, .9);
      rrect(g, x0, -44, 32, 4, '#efe0bd', 1.5, .8); rrect(g, x0 + 4, -38, 24, 12, '#f6efd8', 1.5, .8);
      g.font = '800 7px "Noto Sans Devanagari","Nirmala UI","Mangal",sans-serif'; g.textAlign = 'center'; g.fillStyle = tn('#2f5d8a'); g.fillText('कुल्फी', x0 + 16, -29.4);
      ell(g, x0 + 16, -47.6, 2.6, 2.6, '#d9b23a', .8); ln(g, x0 + 16, -45, x0 + 16, -44, .8, INK);
      wheel2(g, x0 + 7, -11, 7, t * 3 * d); wheel2(g, x0 + 25, -11, 7, t * 3 * d);
    });
  },
  chana(g, d) { // flat basket on the head, paper cones of chana on the rim
    V(g, g => {
      ell(g, 0, -108, 9, 2.6, '#efe0bd', .8); // cloth ring pad
      blob(g, [[-17, -112], [0, -114], [17, -112], [14, -106], [-14, -106]], '#b98a46', .9); poly(g, [[8, -113.6], [17, -112], [14, -106], [6, -106]], '#8c6428', 0);
      for (let i = 0; i < 6; i++) ln(g, -13 + i * 5.4, -112, -12 + i * 5, -106.4, .5, 'rgba(32,20,14,.5)');
      ell(g, 0, -113, 17, 3, '#cfa55a', .9); ell(g, 0, -113, 14, 1.8, '#a67c36', 0);
      for (let i = 0; i < 5; i++) { const cx = -10 + i * 5; poly(g, [[cx - 2.4, -113], [cx + 2.4, -113], [cx, -119]], i % 2 ? '#e8d2a0' : '#d9bd7a', .6); }
    });
  },
  gubbare(g, d, t) { // balloons on a stick
    V(g, g => {
      const hx = d > 0 ? 12 : -12; rod(g, hx, -40, hx, -112, 1.2, '#d8c9a0');
      const cols = ['#e2453a', '#3a8fe2', '#f2c23a', '#4fbf6a', '#d65ab8', '#f28a3a', '#9a6ae2'];
      cols.forEach((c, i) => { const a = i / cols.length * Math.PI * 2, bx = hx + Math.cos(a) * 9 + Math.sin(t * 2 + i) * 1.2, by = -121 + Math.sin(a) * 6; ln(g, hx, -110, bx, by + 6, .5, 'rgba(32,20,14,.75)'); ell(g, bx, by, 4.6, 5.6, c, .8); poly(g, [[bx - 1, by + 5.4], [bx + 1, by + 5.4], [bx, by + 7]], c, .5); ell(g, bx - 1.5, by - 2, 1.1, 1.7, 'rgba(255,255,255,.75)', 0, -.5); });
    });
  },
  raddi(g, d) { // jute sack over the shoulder
    V(g, g => {
      const sx = d > 0 ? -9 : 9;
      blob(g, [[sx - d * 1, -101], [sx + d * 8, -96], [sx + d * 10, -84], [sx + d * 3, -77], [sx - d * 8, -79], [sx - d * 10, -90]], '#cdb27a', .9);
      poly(g, [[sx + d * 3, -94], [sx + d * 10, -84], [sx + d * 3, -77], [sx - d * 1, -80]], '#a98d56', 0);
      for (let i = 0; i < 4; i++) ln(g, sx - 6 + i * 4, -94 + i, sx - 4 + i * 4, -80, .4, 'rgba(32,20,14,.35)');
      ln(g, sx - 3, -97, sx + 3, -96, 1.1, '#6b4a2a'); ell(g, sx, -101.4, 2.4, 1.2, '#a98d56', .6);
      ln(g, sx + d * 4, -94, sx + d * 9, -84, 1.2, '#8a7448');
    });
  },
  bat(g, d, t) { // cricket bat
    V(g, g => {
      const hx = d > 0 ? 8 : -8, sw = Math.sin(t * 6) * 4, x1 = hx + d * (10 + sw), y0 = -38, y1 = -14, dx = x1 - hx, dy = y1 - y0, n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, nx = -uy, ny = ux;
      const p = (s, o) => [hx + ux * s + nx * o, y0 + uy * s + ny * o];
      poly(g, [p(0, -1), p(11, -1), p(11, 1), p(0, 1)], '#4a3a2a', .7); poly(g, [p(11, -1), p(13, -3.2), p(n, -3.2), p(n, 3.2), p(13, 3.2), p(11, 1)], '#d9b57a', .8);
      ln(g, ...p(14, 0), ...p(n - 1.4, 0), .6, 'rgba(32,20,14,.45)'); ln(g, ...p(0, 0), ...p(6, 0), 1.1, '#c8452c');
    });
  },
  bag(g, d) { // cloth jhola with a leek and a bottle poking out
    V(g, g => {
      const hx = d > 0 ? -10 : 10;
      for (const sx of [-3, 3]) ln(g, hx + sx, -43, hx, -53, .9, INK);
      poly(g, [[hx - 3, -50], [hx - 2, -56], [hx - .5, -50]], '#5da04a', .6); poly(g, [[hx + 2, -49], [hx + 3.4, -57], [hx + 4, -48]], '#6fb858', .6);
      blob(g, [[hx - 6, -44], [hx + 6, -44], [hx + 6.6, -34], [hx + 3, -31], [hx - 3, -31], [hx - 6.6, -34]], '#d9993a', .9); poly(g, [[hx + 2, -44], [hx + 6, -44], [hx + 6.6, -34], [hx + 3, -31], [hx + 1.6, -31]], '#b4742a', 0);
      rrect(g, hx - 5, -41, 10, 1.8, '#c8452c', .6, 0); ell(g, hx - 1, -37, 1.6, 1.6, '#efe0bd', .5);
    });
  },
  stick(g, d) { // walking stick with a crook
    V(g, g => {
      const hx = d > 0 ? 12 : -12, ex = hx + d * 4;
      rod(g, hx, -50, ex, -2, 1.6, '#8a6038'); g.beginPath(); g.arc(hx - d * 2, -50, 2, d > 0 ? 0 : Math.PI, d > 0 ? Math.PI * 1.1 : Math.PI * 2.1, d < 0); g.lineWidth = 2.8; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = tn('#8a6038'); g.stroke();
      ell(g, ex, -1, 1.5, .9, '#2a2018', .5);
    });
  }
};

/* ---------- a walking person ---------- */
class Walker {
  constructor(o) {
    Object.assign(this, { x: 0, gy: LANE, dir: 1, speed: 26, walk: rnd(0, 6), state: 'walk', talkUntil: 0, blinkAt: rnd(1, 4), blinkUntil: 0, look: { x: 0, y: 0 }, prop: null, calls: [], t0: Tapri.T }, o);
    this.from = this.dir > 0 ? -40 : L.W + 40; this.x = this.from; this.to = this.dir > 0 ? L.W + 40 : -40;
  }
  headX() { return this.x; }
  anchor() { const M = Sprites.metrics ? Sprites.metrics(this.style, {}, false) : null; return { x: this.x, y: this.gy - (M ? M.height : 96) - 6 }; }
  say(voice, text) { Tapri.say(this, voice, text, { kind: 'say' }); }
  update(dt) {
    const T = Tapri.T; if (T > this.blinkAt) { this.blinkUntil = T + 0.14; this.blinkAt = T + rnd(2, 6); }
    if (this.state === 'walk') {
      this.x += this.dir * this.speed * dt; this.walk += dt * this.speed / 7.6;
      const prog = (this.x - this.from) / (this.to - this.from);
      for (const c of this.calls) if (!c.done && prog > c.at) { c.done = true; this.say(c.v, c.text); }
      if (this.target && Math.abs(this.x - this.target.x) < 2) this.arrive && this.arrive();
      if (prog >= 1) this.dead = true;
    }
    if (this.tick) this.tick(dt);
  }
  draw(g, light) {
    const T = Tapri.T, moving = this.state === 'walk', s = this.style;
    const pose = { dir: this.dir, phase: this.walk, moving, look: this.look, blink: T < this.blinkUntil, t: T, expr: T < this.talkUntil ? 'talk' : this.smile ? 'smile' : 'n', arms: {}, holder: this, dt: Tapri.dt };
    if (this.armPose) this.armPose(pose);
    const info = Sprites.stand(g, s, pose, light);
    if (this.prop && PROPS[this.prop]) PROPS[this.prop](g, this.dir, T, this);
    return info;
  }
}
// people of the neighbourhood: a few looks that read as "Indian street" at a glance
function style(kind) {
  const s = Sprites.makeStyle(kind === 'woman' ? { female: true } : kind === 'kid' ? { age: 'young' } : kind === 'old' ? { age: 'old', female: false } : { female: false, age: 'mid' });
  if (kind === 'kid' || kind === 'beggar') { s.h = 0.62; s.mass = 0.82; s.must = s.beard = s.stubble = false; s.glasses = false; s.cap = null; s.hc = pick(['#16191a', '#252a28', '#302d27']); if (!s.female) s.hair = pick(['short', 'curly']); s.age = 'young'; }
  if (kind === 'beggar') { s.shirt = pick(['#8a7a62', '#7a6a58', '#6e6250']); s.pants = '#5a5040'; s.sandals = true; s.hair = 'curly'; s.outfit = 'tee'; s.wrap = null; }
  if (kind === 'vendor') { s.outfit = pick(['kurta', 'shirt', 'tee']); s.sandals = true; s.cap = Math.random() < 0.3 ? '#c8c0a8' : null; s.wrap = null; }
  return s;
}

/* ---------- who comes by ---------- */
const VENDORS = {
  sabzi: { v: 'v1', prop: 'sabzi', speed: 18 }, chana: { v: 'v2', prop: 'chana', speed: 24 }, gubbare: { v: 'v3', prop: 'gubbare', speed: 22 },
  kulfi: { v: 'v4', prop: 'kulfi', speed: 20 }, raddi: { v: 'v5', prop: 'raddi', speed: 24 }
};
function vendor(type) {
  const V = VENDORS[type], dir = Math.random() < 0.5 ? 1 : -1, text = S.vendors[type];
  actors.push(new Walker({ kind: 'vendor', style: style('vendor'), dir, speed: V.speed, prop: V.prop, calls: [{ at: 0.28, v: V.v, text }, { at: 0.7, v: V.v, text }] }));
}
function passer() {
  const k = pick(['man', 'woman', 'woman', 'old', 'man']), dir = Math.random() < 0.5 ? 1 : -1;
  actors.push(new Walker({ kind: 'passer', style: style(k), dir, speed: k === 'old' ? 15 : rnd(24, 32), prop: k === 'woman' ? 'bag' : k === 'old' ? 'stick' : null, gy: LANE - rnd(0, 3) }));
}
function kids() {
  const dir = Math.random() < 0.5 ? 1 : -1, a = new Walker({ kind: 'kid', style: style('kid'), dir, speed: 52, prop: 'bat', gy: KID_LANE }), b = new Walker({ kind: 'kid', style: style('kid'), dir, speed: 52, gy: KID_LANE + 2 });
  b.from = a.from - dir * 26; b.x = b.from; b.to = a.to - dir * 26;
  a.calls = [{ at: 0.18, v: 'k2', text: S.kids[0] }, { at: 0.5, v: 'k2', text: S.kids[1] }]; b.calls = [{ at: 0.66, v: 'k', text: S.kids[2] }];
  a.ball = { x: a.x + dir * 14, y: 0, vy: 0 };
  a.tick = function (dt) { const bl = this.ball; bl.x = this.x + this.dir * (14 + Math.sin(Tapri.T * 3) * 6); bl.vy += 320 * dt; bl.y += bl.vy * dt; if (bl.y > 0) { bl.y = 0; bl.vy = -rnd(70, 110); } };
  actors.push(a, b); ballOwner = a;
}
let ballOwner = null;
function beggar() {
  const seated = Tapri.people.filter(p => p.state === 'seated' && !p.player && !p.dead && !(Tapri.convoWith && Tapri.convoWith(p)) && !p.wants);
  if (!seated.length) return false;
  const target = pick(seated), dir = target.x < L.W / 2 ? 1 : -1;
  const k = new Walker({ kind: 'beggar', style: style('beggar'), dir, speed: 30, gy: ASK_Y });
  k.target = { x: target.x + (dir > 0 ? -2 : 2) };
  k.arrive = function () {
    this.state = 'ask'; this.target = null; this.dir = 1; const T0 = Tapri.T, give = Math.random() < 0.6, female = target.female;
    const ask = female ? S.beg.askF : S.beg.askM, d1 = Tapri.say(this, 'k', ask, { kind: 'say' });
    this.armPose = pose => { pose.arms.R = [8, -46]; pose.fx = 0; pose.fy = -1; };
    target.lookAt = this; target.lookUntil = T0 + d1 + 4;
    Tapri.after(d1 + 0.4, () => {
      if (target.dead || target.state !== 'seated' || this.dead) return this.leave();
      const reply = give ? (female ? S.beg.giveF : S.beg.giveM) : (female ? S.beg.noF : S.beg.noM), d2 = Tapri.say(target, female ? 'f' : 'm', reply, { kind: 'say' });
      if (give) { target.takeUntil = Tapri.T + 1.2; target.takeSide = this.x > target.x ? 1 : -1; Tapri.after(0.6, () => TA.sfx('coins', { vol: 0.5, pan: pan(this.x) })); }
      Tapri.after(d2 + 0.3, () => { if (this.dead) return; if (give) { this.smile = true; const d3 = Tapri.say(this, 'k', S.beg.thanks, { kind: 'say' }); Tapri.after(d3 + 0.2, () => this.leave()); } else this.leave(); });
    });
  };
  k.leave = function () { this.armPose = null; this.state = 'walk'; this.dir = this.x < L.W / 2 ? -1 : 1; this.from = this.x; this.to = this.dir > 0 ? L.W + 40 : -40; this.gy = LANE - 1; };
  actors.push(k); return true;
}

/* ---------- a cow, ambling across and stopping to look around ---------- */
class Cow {
  constructor() { this.dir = Math.random() < 0.5 ? 1 : -1; this.x = this.dir > 0 ? -50 : L.W + 50; this.gy = LANE + 1; this.walk = 0; this.stopUntil = 0; this.nextStop = Tapri.T + rnd(4, 9); this.col = pick(['#e8e2d4', '#d9cdb6', '#c9b89a']); }
  headX() { return this.x + this.dir * 24; }
  anchor() { return { x: this.headX(), y: this.gy - 40 }; }
  update(dt) {
    const T = Tapri.T; if (T > this.nextStop && T > this.stopUntil) { this.stopUntil = T + rnd(2.5, 5); this.nextStop = T + rnd(8, 14); }
    if (T > this.stopUntil) { this.x += this.dir * 11 * dt; this.walk += dt * 3.2; }
    if ((this.dir > 0 && this.x > L.W + 60) || (this.dir < 0 && this.x < -60)) this.dead = true;
  }
  draw(g) { // Indian street cow (zebu): hump, long face, curved horns, dewlap, thin jointed legs with hooves, swishing tail
    const d = this.dir, w = this.walk, c = this.col, dk = sh(c, -.22), mk = sh(c, -.1), T = Tapri.T, stop = T < this.stopUntil, tint = '#a98a62';
    V(g, g => {
      const sw = (ph, amp) => stop ? 0 : Math.sin(w + ph) * amp, tube = (x0, y0, x1, y1, wd, col) => { ln(g, x0, y0, x1, y1, wd + 1.4, INK); ln(g, x0, y0, x1, y1, wd, col); };
      const leg = (x, ph, col, rear) => { const s = sw(ph, 3.4), kx = x + s * .5 + (rear ? -1.6 : 1.2), hx = x + s; tube(x, -18, kx, -9, 3.4, col); tube(kx, -9, hx, -2.6, 2.2, col); poly(g, [[hx - 1.8, -3], [hx + 1.8, -3], [hx + 2.2, -.2], [hx - 2.2, -.2]], '#2e2620', .6); };
      leg(-10, Math.PI, dk, true); leg(12, 0, dk, false); // far legs
      // tail with tuft, swishing
      const sx = Math.sin(T * (stop ? 2.4 : 3.6)) * (stop ? 4 : 2.4), tx = -22 + sx, ty = -13; g.beginPath(); g.moveTo(-18, -34); g.quadraticCurveTo(-23 + sx * .4, -26, tx, ty); g.lineWidth = 2.4; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.2; g.strokeStyle = tn(dk); g.stroke(); blob(g, [[tx - 1.6, ty], [tx + 1.6, ty], [tx + 2.2 + sx * .1, ty + 7], [tx - .4, ty + 9], [tx - 2.2, ty + 6]], '#3a2f26', .6);
      // body barrel, rump, hump, belly shade, patch
      blob(g, [[-19, -35], [-8, -39], [6, -39.5], [18, -34], [19, -24], [8, -15.6], [-8, -15.6], [-19, -22]], c, .9);
      poly(g, [[-8, -15.6], [8, -15.6], [19, -24], [12, -19.6]], mk, 0); blob(g, [[-19, -35], [-8, -39], [6, -39.5], [18, -34], [19, -24], [8, -15.6], [-8, -15.6], [-19, -22]], null, .9);
      blob(g, [[3, -38], [8, -45], [14, -42], [15, -36]], c, .9); ell(g, 9, -39.6, 5, 2.4, c, 0); // hump over the shoulder
      blob(g, [[-14, -32], [-6, -35], [-2, -30], [-8, -25], [-14, -27]], tint, 0); // mottled patch
      ln(g, -5, -22, 4, -22.6, .6, 'rgba(32,20,14,.25)');
      leg(-15, 0, c, true); leg(16, Math.PI, c, false); // near legs
      // neck + head (nods a little while standing)
      const nod = stop ? Math.sin(T * 1.6) * 1.4 : 0; g.save(); g.translate(0, nod);
      blob(g, [[12, -38], [20, -37], [27, -28], [26, -19], [17, -18], [11, -26]], c, .9); // neck
      blob(g, [[27, -17], [20, -13], [13, -13], [15, -20], [22, -22]], dk, .8); // dewlap
      blob(g, [[21, -38], [27, -39], [32, -33], [37, -24], [36, -19], [31, -18], [26, -23], [22, -29]], c, .9); // long face
      ell(g, 35.2, -20.6, 3.2, 2.6, '#8a6a64', .8); ell(g, 36.4, -21.2, .7, .5, '#2a1c14', 0); // muzzle + nostril
      ln(g, 32, -18.4, 36.6, -17.8, .6, INK);
      blob(g, [[22, -36], [15, -39], [13, -36], [21, -33]], dk, .8); // ear
      g.beginPath(); g.moveTo(26, -39); g.quadraticCurveTo(25, -44, 29, -46); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = tn('#efe6cc'); g.stroke(); // horn
      g.beginPath(); g.moveTo(23.6, -38.6); g.quadraticCurveTo(21, -43, 23.4, -45.6); g.lineWidth = 2.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.2; g.strokeStyle = tn('#d8ccae'); g.stroke();
      ell(g, 28.4, -31, 1.5, 1.2, '#ffffff', .5); ell(g, 28.7, -30.8, .8, .8, '#1c1814', 0); // eye
      ln(g, 19, -33, 18, -26, 1.8, '#c8452c'); ell(g, 17.6, -24, 1.6, 1.8, '#d9b23a', .6); // red thread + brass bell
      g.restore();
    }, d);
  }
}

/* ---------- director ---------- */
function spawn() {
  const sc = Tapri.sceneName, night = sc === 'night', busy = actors.filter(a => !a.dead).length;
  if (busy >= 4) return;
  const bag = night ? ['passer', 'passer', 'vendor', 'beggar'] : ['passer', 'passer', 'vendor', 'vendor', 'beggar', 'kids', 'cow'];
  let k = pick(bag); if (k === lastKind && Math.random() < 0.7) k = pick(bag);
  if (k === 'kids' && actors.some(a => a.kind === 'kid')) k = 'passer';
  if (k === 'beggar' && actors.some(a => a.kind === 'beggar')) k = 'passer';
  if (k === 'cow' && actors.some(a => a instanceof Cow)) k = 'passer';
  if (k === 'vendor') { const types = night ? ['chana', 'kulfi'] : Object.keys(VENDORS), used = actors.map(a => a.prop); vendor(pick(types.filter(t => !used.includes(VENDORS[t].prop))) || 'chana'); }
  else if (k === 'kids') kids(); else if (k === 'cow') actors.push(new Cow()); else if (k === 'beggar') { if (!beggar()) passer(); } else passer();
  lastKind = k;
}
// a world / time-of-day switch rebuilds the crowd: clear the lane too
const resetCrowd0 = Tapri.resetCrowd;
Tapri.resetCrowd = function () { resetCrowd0.apply(this, arguments); Tapri.street.reset(); };
Tapri.street = {
  actors,
  update(dt) {
    const T = Tapri.T; if (T > nextSpawn) { nextSpawn = T + rnd(9, 20); spawn(); }
    for (const a of actors) a.update(dt);
    for (let i = actors.length - 1; i >= 0; i--) if (actors[i].dead) actors.splice(i, 1);
  },
  // the ball of the gully-cricket kids (drawn after the actors so it is never hidden behind them)
  drawExtras(c) { const a = ballOwner; if (!a || a.dead) return; const K0 = Art.K || 1; c.fillStyle = Art.tone('#f1ead6'); c.beginPath(); c.arc(a.ball.x * K0, (a.gy - 2.5 + a.ball.y) * K0, 1.7 * K0, 0, Math.PI * 2); c.fill(); c.lineWidth = .5 * K0; c.strokeStyle = '#20140e'; c.stroke(); },
  reset() { actors.length = 0; nextSpawn = Tapri.T + 6; ballOwner = null; },
  spawn(kind) { if (kind === 'vendor') vendor(pick(Object.keys(VENDORS))); else if (kind === 'kids') kids(); else if (kind === 'cow') actors.push(new Cow()); else if (kind === 'beggar') beggar(); else passer(); }
};
})();
