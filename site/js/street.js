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

/* ---------- props ---------- */
const PROPS = {
  sabzi(g, d, t) { // hand cart (thela) with heaps of vegetables, pushed ahead
    const x0 = d > 0 ? 10 : -60; rect(g, x0, -30, 50, 4, '#8a5a32'); rect(g, x0, -26, 50, 2, '#5e3c20'); line(g, d > 0 ? x0 : x0 + 50, -29, d > 0 ? x0 - 12 : x0 + 62, -40, 2, '#5e3c20');
    for (let i = 0; i < 5; i++) { const c = ['#c8352a', '#3f8a3a', '#d9a33a', '#7a4fa0', '#e0702a'][i]; for (let j = 0; j < 4; j++) disc(g, x0 + 5 + i * 10 + (j % 2) * 3, -33 - (j > 1 ? 3 : 0), 2.6, c); }
    wheel(g, x0 + 10, -18, 7, t * 3 * d); wheel(g, x0 + 40, -18, 7, t * 3 * d);
  },
  kulfi(g, d, t) { // red kulfi box on wheels with a bell
    const x0 = d > 0 ? 10 : -42; rect(g, x0, -44, 32, 24, '#b8322a'); rect(g, x0, -44, 32, 3, '#e8d2a0'); rect(g, x0 + 4, -38, 24, 10, '#f2ead6'); rect(g, x0 + 6, -36, 20, 6, '#3f6fa8');
    line(g, d > 0 ? x0 : x0 + 32, -40, d > 0 ? x0 - 10 : x0 + 42, -46, 2, '#4a4a4a'); disc(g, x0 + 16, -48, 2.5, '#d9b23a'); wheel(g, x0 + 7, -14, 6, t * 3 * d); wheel(g, x0 + 25, -14, 6, t * 3 * d);
  },
  chana(g, d) { // flat basket on the head, cones of paper on the rim
    rect(g, -15, -112, 30, 5, '#a8793a'); rect(g, -13, -116, 26, 4, '#c79a4a'); for (let i = 0; i < 6; i++) disc(g, -10 + i * 4, -117, 1.6, '#d8b46a'); rect(g, -16, -108, 32, 2, '#6b4a22');
  },
  gubbare(g, d, t) { // balloons on a stick
    const hx = d > 0 ? 12 : -12; line(g, hx, -40, hx, -112, 1.5, '#d8c9a0');
    const cols = ['#e2453a', '#3a8fe2', '#f2c23a', '#4fbf6a', '#d65ab8', '#f28a3a', '#9a6ae2'];
    cols.forEach((c, i) => { const a = i / cols.length * Math.PI * 2, bx = hx + Math.cos(a) * 9 + Math.sin(t * 2 + i) * 1.2, by = -120 + Math.sin(a) * 6; line(g, hx, -110, bx, by + 5, 0.6, '#d8c9a0'); disc(g, bx, by, 5, c); disc(g, bx - 1.5, by - 2, 1.2, '#ffffffaa'); });
  },
  raddi(g, d) { // sack over the shoulder
    const sx = d > 0 ? -9 : 9; disc(g, sx, -92, 7, '#cdb88a'); disc(g, sx - d * 5, -86, 7, '#bfa874'); rect(g, sx - 1, -100, 3, 3, '#8a7448'); line(g, sx + d * 4, -94, sx + d * 9, -84, 1.5, '#8a7448');
  },
  bat(g, d, t) { const hx = d > 0 ? 8 : -8, sw = Math.sin(t * 6) * 4; line(g, hx, -38, hx + d * (10 + sw), -14, 3, '#c8a26a'); },
  bag(g, d) { const hx = d > 0 ? -10 : 10; rect(g, hx - 5, -44, 10, 12, '#4f7a5a'); line(g, hx - 3, -44, hx, -52, 1, '#2e4a36'); line(g, hx + 3, -44, hx, -52, 1, '#2e4a36'); },
  stick(g, d) { const hx = d > 0 ? 12 : -12; line(g, hx, -50, hx + d * 4, 0, 1.6, '#7a5a3a'); }
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
  draw(g) {
    const d = this.dir, w = this.walk, c = this.col, dk = '#8a7a64', stop = Tapri.T < this.stopUntil;
    for (const [lx, ph] of [[-14, 0], [-9, Math.PI], [10, Math.PI], [15, 0]]) { const sw = stop ? 0 : Math.sin(w + ph) * 3; line(g, d * lx, -16, d * (lx + sw), -1, 3.2, lx > 0 ? c : dk); rect(g, d * (lx + sw) - 1.5, -2, 3, 2, '#3a3028'); }
    // body, hump, belly patch
    disc(g, d * -6, -24, 11, c); disc(g, d * 7, -24, 11, c); rect(g, d > 0 ? -16 : -16, -34, 32, 18, c); disc(g, d * 9, -34, 5, c); disc(g, d * -2, -22, 5, '#b8a888');
    line(g, d * -18, -30, d * -22, -12, 1.4, dk); disc(g, d * -22, -11, 1.8, '#3a3028'); // tail
    // head, ears, horns, eye, muzzle (nods a little while standing)
    const nod = stop ? Math.sin(Tapri.T * 1.6) * 1.5 : 0, hx = d * 24, hy = -30 + nod;
    disc(g, hx, hy, 6.5, c); rect(g, hx + (d > 0 ? 2 : -8), hy + 1, 6, 6, '#e6b8a2'); line(g, hx - d * 2, hy - 5, hx - d * 6, hy - 11, 1.6, '#cbb48a'); line(g, hx + d * 2, hy - 5, hx + d * 5, hy - 11, 1.6, '#cbb48a');
    rect(g, hx - d * 9 - 2, hy - 3, 5, 2, dk); disc(g, hx + d * 1, hy - 1, 1, '#1c1814');
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
  drawExtras(c) { const a = ballOwner; if (!a || a.dead) return; const K0 = Art.K || 1; c.fillStyle = '#f4efe2'; c.fillRect(Math.round((a.ball.x - 1.5) * K0), Math.round((a.gy - 3 + a.ball.y) * K0), Math.round(3 * K0), Math.round(3 * K0)); },
  reset() { actors.length = 0; nextSpawn = Tapri.T + 6; ballOwner = null; },
  spawn(kind) { if (kind === 'vendor') vendor(pick(Object.keys(VENDORS))); else if (kind === 'kids') kids(); else if (kind === 'cow') actors.push(new Cow()); else if (kind === 'beggar') beggar(); else passer(); }
};
})();
