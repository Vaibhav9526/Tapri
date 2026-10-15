/* The shop owner: a real day behind the counter. He makes chai, fries samosas, lights agarbatti, shoos flies,
   tears chips off the strip, digs biscuits out of the carton, opens cold drinks, takes cash, wipes the counter...
   Every action is a keyframed routine (hand targets in world coordinates) so the arms/IK do the real moving. */
(() => {
'use strict';
const { L, D, clamp, lerp, rnd, pick, ease, W } = Tapri;
const G = L.counterTop + 49;               // ground line behind the counter (only the upper body is visible)
const X0 = L.owner.x0, X1 = L.owner.x1;
const style = Sprites.makeStyle({ female: false, age: 'mid', override: { skin: '#a8703f', hc: '#17110d', hair: 'curly', outfit: 'shirt', shirt: '#5d6e90', check: true, must: true, stubble: true, glasses: false, cap: null, beard: false, h: 1.0, seed: 3.3 } });
const restL = x => [x - 12, 205], restR = x => [x + 12, 205];

/* ---------- keyframe runner ---------- */
class Runner {
  constructor(kfs, ctx) { kfs = kfs.map(k => Array.isArray(k) ? Object.assign({ t: k[0] }, k[1]) : k); this.kf = kfs; this.t = 0; this.i = 0; this.ctx = ctx || {}; this.hold = { L: null, R: null }; this.done = false; this.dur = kfs[kfs.length - 1].t; this.tilt = 0; this.dip = 0; this.fired = new Set(); this.apply(0); }
  apply(i) { const k = this.kf[i]; if ('hL' in k) this.hold.L = k.hL; if ('hR' in k) this.hold.R = k.hR; if (k.ev && !this.fired.has(i)) { this.fired.add(i); owner.event(k.ev, this); } }
  step(dt) { this.t += dt; while (this.i + 1 < this.kf.length && this.kf[this.i + 1].t <= this.t) { this.i++; this.apply(this.i); } if (this.t >= this.dur) this.done = true; }
  sample() {
    const a = this.kf[this.i], b = this.kf[Math.min(this.i + 1, this.kf.length - 1)], span = Math.max(1e-4, b.t - a.t), e = this.i + 1 >= this.kf.length ? 1 : ease(clamp((this.t - a.t) / span, 0, 1));
    const ga = (k, f, def) => { const v = this.field(k, f); return v === undefined ? def : v; };
    const xa = this.field(this.i, 'x', owner.x), xb = this.field(Math.min(this.i + 1, this.kf.length - 1), 'x', xa), x = lerp(xa, xb, e);
    const hand = (side) => { const ka = this.kf[this.i][side], kb = this.kf[Math.min(this.i + 1, this.kf.length - 1)][side], rf = side === 'L' ? restL : restR; const A = ka === undefined ? undefined : ka, B = kb === undefined ? A : kb;
      const pa = (A === undefined || A === null) ? rf(x) : A, pb = (B === undefined || B === null) ? rf(x) : B; return [lerp(pa[0], pb[0], e), lerp(pa[1], pb[1], e)]; };
    return { x, L: hand('L'), R: hand('R'), tilt: lerp(this.num(this.i, 'tilt', 0), this.num(Math.min(this.i + 1, this.kf.length - 1), 'tilt', 0), e), dip: lerp(this.num(this.i, 'dip', 0), this.num(Math.min(this.i + 1, this.kf.length - 1), 'dip', 0), e), look: this.num(this.i, 'look', null), expr: this.kf[this.i].expr };
  }
  field(i, f, def) { for (let j = i; j >= 0; j--) if (f in this.kf[j]) return this.kf[j][f]; return def; }
  num(i, f, def) { const v = this.field(i, f, def); return v; }
}

/* ---------- the owner ---------- */
const owner = Tapri.owner = {
  x: 336, runner: null, idleUntil: 6, sway: 0, look: { x: 0, y: 0 }, blinkAt: 2, blinkUntil: 0, talkUntil: 0, smileUntil: 0, jobs: [], lastFry: -99, lastShoo: -99, lastAgar: -999, sold: 0, pose: null,
  headX() { return this.x; }, headY() { return G - 100; },
  say(voice, text, kind) { return Tapri.say(this, voice, text, { kind }); },
  enqueue(job) { this.jobs.push(job); }
};
function startAction(kfs, ctx) { try { const bad = kfs.filter(k => ('x' in k[1] && !isFinite(k[1].x))); if (bad.length) console.log('BADKF ' + JSON.stringify(kfs.slice(0, 3))); } catch (e) {} owner.runner = new Runner(kfs, ctx); }
const lead = (x) => [0, { x: owner.x }];   // actions begin from where he is standing
const clampX = x => clamp(x, X0, X1);

/* ---------- action builders ---------- */
function chaiKF(n, ctxOut) {
  const k = [lead(), [0.6, { x: 326, R: [312, 187] }], [0.95, { R: [312, 186], hR: 'kettle', ev: 'grab_kettle' }], [1.5, { x: 340, R: [332, 176], L: [352, 190], hL: 'strainer', tilt: 0 }]];
  let t = 1.5; for (let i = 0; i < n; i++) { const gx = 360 + i * 9; t += 0.55; k.push([t, { x: 346 + i * 4, R: [gx - 2, 178], L: [gx - 1, 196], tilt: 0.15 }]); t += 0.35; k.push([t, { R: [gx - 2, 176], tilt: 0.95, ev: 'pour_start:' + i }]); t += 1.7; k.push([t, { R: [gx - 2, 176], tilt: 1.0, ev: 'pour_end:' + i }]); t += 0.4; k.push([t, { R: [gx - 6, 181], tilt: 0.1 }]); }
  t += 0.7; k.push([t, { x: 332, R: [314, 187], tilt: 0, L: [352, 200] }]); t += 0.45; k.push([t, { R: [312, 186], hR: null, ev: 'kettle_down', L: [350, 203] }]); t += 0.4; k.push([t, { hL: null, L: [352, 204], ev: 'strainer_down' }]);
  for (let i = 0; i < n; i++) { const gx = 360 + i * 9; t += 0.6; k.push([t, { x: 352 + i * 3, L: [gx, 205] }]); t += 0.35; k.push([t, { L: [gx, 203], hL: 'glass', ev: 'glass_take:' + i }]); t += 0.65; k.push([t, { L: [379 + i * 7, 204] }]); t += 0.35; k.push([t, { L: [379 + i * 7, 206], hL: null, ev: 'glass_ready:' + i }]); }
  t += 0.7; k.push([t, { x: 344 }]); return k;
}
function fryKF() {
  return [lead(), [0.5, { x: 330, dip: 0 }], [1.1, { dip: 12, L: [322, 214], R: [338, 214] }], [1.8, { dip: 12, hL: 'plate_raw', ev: 'sfx:box_rustle' }], [2.5, { dip: 0, L: [326, 192], R: [336, 200] }], [3.0, { R: [346, 189] }], [3.35, { R: [346, 188], hR: 'jhara', ev: 'jhara_grab' }],
    [3.9, { L: [336, 184] }], [4.3, { L: [336, 183], ev: 'drop:0' }], [4.9, { L: [338, 183], ev: 'drop:1' }], [5.5, { L: [340, 183], ev: 'drop:2' }], [6.1, { L: [322, 197] }], [6.4, { hL: null, L: [320, 199], ev: 'plate_down' }],
    [7.0, { R: [338, 191], ev: 'fry_on' }], [8.0, { R: [342, 192] }], [9.0, { R: [335, 192] }], [10.0, { R: [341, 191], ev: 'flip' }], [11.0, { R: [336, 192] }], [12.0, { R: [341, 191] }], [13.2, { R: [337, 192] }], [14.2, { R: [338, 184], ev: 'fry_lift' }], [14.9, { R: [326, 192] }],
    [15.4, { R: [321, 197], ev: 'fry_drain' }], [15.9, { R: [346, 190], hR: null, ev: 'jhara_down' }], [16.6, { x: 280, R: null }], [17.4, { x: 264, L: [262, 198], hL: 'plate_done' }], [18.2, { R: [270, 190] }], [18.9, { L: [268, 190], hL: null, ev: 'stock+:3' }], [19.8, { x: 280 }]];
}
function agarKF() {
  return [lead(), [0.8, { x: 246, dip: -3, R: [252, 158] }], [1.3, { hR: 'agar', R: [252, 156], ev: 'agar_take' }], [1.9, { R: [246, 164], L: [236, 166], hL: 'match' }], [2.5, { L: [236, 168], R: [240, 166], ev: 'match_strike' }], [3.1, { R: [240, 166], ev: 'agar_lit' }],
    [3.6, { L: [250, 172], hL: null }], [4.0, { dip: -3, R: [232, 150] }], [4.5, { R: [248, 143] }], [5.0, { R: [250, 150] }], [5.5, { R: [236, 152] }], [6.0, { R: [244, 143] }], [6.5, { R: [248, 152] }], [7.1, { R: [241, 156], ev: 'agar_place' }], [7.5, { hR: null, R: [241, 156] }],
    [8.3, { dip: 0, L: [237, 172], R: [245, 172], expr: 'smile' }], [9.8, { L: null, R: null, expr: null }], [10.4, { x: 250 }]];
}
function shooKF() {
  const x = clampX(L.flyHome.x + 4); return [lead(), [0.7, { x, R: [x - 24, 180] }], [1.1, { R: [x - 22, 178], hR: 'cloth' }], [1.7, { R: [x + 22, 174], ev: 'swish' }], [2.2, { R: [x - 26, 175], ev: 'swish' }], [2.7, { R: [x + 26, 174], ev: 'swish' }], [3.3, { R: [x - 8, 176] }], [3.9, { hR: null, R: null, ev: 'flies_back' }]];
}
function wipeKF() {
  const x = clampX(pick([170, 230, 290])); return [lead(), [0.7, { x, R: [x - 18, 206] }], [1.0, { hR: 'cloth' }], [1.5, { R: [x + 20, 206] }], [2.0, { R: [x - 20, 207] }], [2.5, { R: [x + 20, 206] }], [3.0, { R: [x - 12, 206] }], [3.6, { hR: null, R: null }]];
}
function countKF() { const x = clampX(pick([300, 340, 360])); return [lead(), [0.6, { x, dip: 2, L: [x - 3, 190], R: [x + 4, 189], hL: 'cash', hR: 'cash' }], [1.3, { R: [x + 6, 193] }], [1.9, { R: [x + 2, 190], ev: 'sfx:note_rustle' }], [2.6, { R: [x + 6, 193] }], [3.2, { R: [x + 2, 190] }], [4.0, { dip: 0, hL: null, hR: null, L: null, R: null }]]; }
function sipKF() { return [lead(), [0.7, { x: 362, R: [379, 205] }], [1.1, { R: [379, 203], hR: 'glass', ev: 'sfx:table_set' }], [1.7, { x: 366, R: [367, 178] }], [2.2, { R: [366, 173], expr: 'smile' }], [3.6, { R: [366, 173] }], [4.1, { R: [370, 192] }], [4.6, { R: [379, 204] }], [5.0, { R: [379, 206], hR: null, expr: null }], [5.4, { R: null }]]; }
function radioKF() { return [lead(), [0.8, { x: 272, dip: -4, R: [281, 151] }], [1.3, { R: [282, 148] }], [1.6, { R: [282, 150], ev: 'radio_knob' }], [2.1, { R: [282, 148] }], [2.4, { R: [282, 150] }], [3.2, { dip: 0, R: null }]]; }
function fanKF() { return [lead(), [0.6, { x: 330, R: [340, 190] }], [1.0, { hR: 'cloth' }], [1.4, { R: [x2(330), 168] }], [1.9, { R: [338 + 4, 171] }], [2.4, { R: [x2(330), 168] }], [2.9, { R: [338 + 4, 171] }], [3.6, { hR: null, R: null }]]; function x2(v) { return v + 8; } }
function stretchKF() { return [lead(), [0.9, { dip: -4, L: [owner.x - 16, 148], R: [owner.x + 16, 148], expr: 'laugh' }], [2.4, { dip: -4 }], [3.2, { dip: 0, L: null, R: null, expr: null }]]; }
function phoneKF() { return [lead(), [0.6, { x: clampX(owner.x), dip: 2, R: [owner.x + 6, 186], hR: 'phone', ev: 'phone_on' }], [4.8, { R: [owner.x + 6, 187], expr: 'smile' }], [5.6, { dip: 0, hR: null, R: null, expr: null, ev: 'phone_off' }]]; }
function leanKF() { return [lead(), [0.8, { dip: 7, L: [owner.x - 14, 207], R: [owner.x + 14, 207] }], [4.5, { dip: 7 }], [5.3, { dip: 0, L: null, R: null }]]; }
function pakodaKF() { return [lead(), [0.8, { x: 150, R: [140, 192] }], [1.5, { R: [146, 196] }], [2.2, { R: [138, 194], ev: 'sfx:table_set' }], [3.0, { R: null }]]; }

/* selling: owner side. `b` = the buyer standing at the counter */
function sellKF(item, b, ctxOut) {
  const bx = b.x, ox = clampX(bx - 8), k = [lead()];
  if (item === 'chips') { k.push([0.7, { x: 140, R: [127, 152] }], [1.1, { R: [127, 144], hR: 'chips', ev: 'chips_pull' }], [1.5, { R: [128, 156] }]); }
  else if (item === 'biscuit') { k.push([0.7, { x: 128 }], [1.2, { dip: 9, R: [112, 201] }], [1.7, { R: [112, 205], ev: 'sfx:box_rustle' }], [2.4, { hR: 'biscuit', R: [116, 199], dip: 7 }], [3.0, { dip: 0, R: [124, 190] }]); }
  else if (item === 'samosa') { k.push([0.8, { x: 262, L: [248, 199], hL: 'plate0' }], [1.5, { R: [276, 190] }], [1.9, { R: [276, 192], ev: 'pick_samosa' }], [2.5, { R: [270, 189] }], [2.9, { R: [276, 192], ev: 'pick_samosa' }], [3.5, { R: null }]); }
  else if (item === 'cola') { k.push([0.7, { x: 362, R: [384, 192] }], [1.3, { R: [386, 190], hR: 'bottle', ev: 'fridge' }], [1.9, { R: [375, 204] }], [2.4, { R: [372, 207], ev: 'cola_open' }], [3.0, { R: [372, 202] }]); }
  // the hand-over happens when the owner says his last line ("ye lo, dus rupaye"), not before
  let tt = 0.2, lastAt = 0.2; for (const [sp, text] of D.buys[item]) { if (sp) lastAt = tt; tt += Tapri.lineDur(null, text) + 0.35; }
  const t0 = k[k.length - 1][0], hand = item === 'samosa' ? 'L' : 'R', hh = hand === 'L' ? 'hL' : 'hR', pad = Math.max(0, lastAt + 0.5 - (t0 + 1.45)), h0 = t0 + pad;
  k.push([t0 + 0.8, { x: ox, [hand]: [bx, 204] }]); if (pad > 0.3) k.push([t0 + 0.8 + pad * 0.5, { [hand]: [bx - 2, 205] }]);
  k.push([h0 + 1.45, { [hand]: [bx, 206], ev: 'handover' }]); k.push([h0 + 1.9, { [hh]: null, [hand]: [bx - 4, 205], ev: 'after_handover' }]);
  k.push([h0 + 2.6, { R: [bx + 8, 205], ev: 'take_pay' }]); k.push([h0 + 3.2, { R: [bx + 8, 205], hR: 'cash', ev: 'cash_in' }]); k.push([h0 + 3.9, { R: [ox + 6, 211], hR: null }]); k.push([h0 + 4.6, { L: null, R: null, ev: 'sale_done' }]);
  return k;
}
function parcelKF(b) { const k = chaiKF(2); const t = k[k.length - 1][0]; k.push([t + 0.6, { x: clampX(b.x - 6), L: [b.x, 204], hL: 'cups' }], [t + 1.2, { L: [b.x, 206], ev: 'handover' }], [t + 1.6, { hL: null, ev: 'after_handover' }], [t + 2.3, { R: [b.x + 8, 205], ev: 'take_pay' }], [t + 3.0, { hR: 'cash', ev: 'cash_in' }], [t + 3.6, { hR: null, R: null, L: null, ev: 'sale_done' }]); return k; }

/* ---------- events ---------- */
owner.event = function (ev, r) {
  const [name, arg] = ev.split(':'), T = Tapri.T, pan = (x) => clamp((x / L.W) * 2 - 1, -1, 1);
  switch (name) {
    case 'grab_kettle': W.kettle.held = true; TA.sfx('kettle_lid', { vol: 0.8, pan: 0.4 }); break;
    case 'pour_start': { const g = W.glasses[+arg]; g.show = true; g.pour = true; g.t0 = T; g.lvl = 0; TA.sfx('chai_pour', { vol: 1, pan: 0.5 }); break; }
    case 'pour_end': { const g = W.glasses[+arg]; g.pour = false; g.lvl = 1; break; }
    case 'kettle_down': W.kettle.held = false; TA.sfx('kettle_lid', { vol: 0.5, pan: 0.4 }); break;
    case 'strainer_down': break;
    case 'glass_take': { const g = W.glasses[+arg]; g.show = false; break; }
    case 'glass_ready': { TA.sfx('glass_clink', { vol: 0.9, pan: 0.5 }); if (r.ctx.mode !== 'parcel') { W.tray.push({ slot: W.tray.length, for: r.ctx.targets ? r.ctx.targets[+arg] || null : null }); } else { /* cups go straight to the buyer */ } break; }
    case 'sfx': TA.sfx(arg, { vol: 0.9, pan: pan(owner.x) }); break;
    case 'jhara_grab': W.jhara.held = true; TA.sfx('kettle', { vol: 0.5, pan: 0.5 }); break;
    case 'jhara_down': W.jhara.held = false; break;
    case 'plate_down': W.plateDrain.show = true; W.plateDrain.n = 0; break;
    case 'drop': { W.fry.items.push({ i: +arg, t0: T }); W.fry.on = true; TA.sfx('sizzle_drop', { vol: 0.9, pan: 0.55 }); TA.setLoop('samosa_fry', true, 1); break; }
    case 'fry_on': break;
    case 'flip': TA.sfx('sizzle_drop', { vol: 0.4, pan: 0.55 }); break;
    case 'fry_lift': W.fry.items = []; W.fry.on = false; TA.setLoop('samosa_fry', false); break;
    case 'fry_drain': W.plateDrain.n = 3; break;
    case 'stock+': W.stock.samosa = Math.min(8, W.stock.samosa + (+arg)); W.plateDrain.show = false; W.plateDrain.n = 0; owner.lastFry = T; break;
    case 'agar_take': TA.sfx('box_rustle', { vol: 0.5, pan: -0.1 }); break;
    case 'match_strike': TA.sfx('match_strike', { vol: 0.9, pan: -0.1 }); W.match.until = T + 1.4; break;
    case 'agar_lit': break;
    case 'agar_place': W.incense.until = T + 100; owner.lastAgar = T; break;
    case 'swish': TA.sfx('cloth_swish', { vol: 0.9, pan: pan(owner.x) }); Tapri.scatterFlies(); break;
    case 'flies_back': owner.lastShoo = T; break;
    case 'radio_knob': TA.sfx('pop', {}); TA.pop(); Tapri.hooks.radioKnob && Tapri.hooks.radioKnob(); break;
    case 'phone_on': break; case 'phone_off': break;
    case 'chips_pull': TA.sfx('chips_tear', { vol: 0.5, pan: -0.4 }); break;
    case 'pick_samosa': W.stock.samosa = Math.max(0, W.stock.samosa - 1); r.ctx.plateN = (r.ctx.plateN || 0) + 1; TA.sfx('table_set', { vol: 0.5, pan: 0 }); break;
    case 'fridge': TA.sfx('kettle_lid', { vol: 0.3, pan: 0.6 }); break;
    case 'cola_open': TA.sfx('cola_open', { vol: 1, pan: 0.6 }); break;
    case 'handover': r.ctx.buyer && r.ctx.buyer.receive(r.ctx.item); break;
    case 'after_handover': r.ctx.buyer && r.ctx.buyer.afterReceive(); break;
    case 'take_pay': r.ctx.buyer && r.ctx.buyer.payNow(r.ctx.pay); break;
    case 'cash_in': TA.sfx(Math.random() < 0.5 ? 'coins' : 'note_rustle', { vol: 0.8, pan: pan(owner.x) }); owner.sold++; break;
    case 'sale_done': r.ctx.buyer && r.ctx.buyer.saleDone(); break;
  }
};

/* ---------- what he does next ---------- */
function routine() {
  const T = Tapri.T, scene = Tapri.sceneName;
  if (T - owner.lastShoo > 22 && Tapri.fliesNear() >= 2) return ['shoo', shooKF()];
  if (W.stock.samosa <= 2 && T - owner.lastFry > 45) return ['fry', fryKF()];
  if (T > W.incense.until + 20 && (scene === 'morning' || scene === 'dusk' || Math.random() < 0.25) && T - owner.lastAgar > 60) return ['agar', agarKF()];
  if (T - owner.lastShoo > 55 && Math.random() < 0.35) return ['shoo', shooKF()];
  if (T - owner.lastFry > 80 && W.stock.samosa < 6 && Math.random() < 0.4) return ['fry', fryKF()];
  const o = [['wipe', wipeKF, 2], ['count', countKF, 1], ['sip', sipKF, 1], ['radio', radioKF, 1], ['phone', phoneKF, 1], ['stretch', stretchKF, 0.6], ['lean', leanKF, 2], ['pakoda', pakodaKF, 1], ['fan', fanKF, scene === 'day' || scene === 'morning' ? 1.2 : 0.2], ['idle', null, 3]];
  let tot = o.reduce((a, b) => a + b[2], 0), r = Math.random() * tot; for (const it of o) { r -= it[2]; if (r <= 0) return it[1] ? [it[0], it[1]()] : ['idle', null]; }
  return ['idle', null];
}
function startJob(job) {
  if (job.type === 'chai') { const ctx = { mode: 'tray', targets: job.targets }; startAction(chaiKF(job.n, ctx), ctx); owner.look = { who: job.targets && job.targets[0] }; }
  else if (job.type === 'sell') { const b = job.buyer, ctx = { buyer: b, item: job.item, pay: job.pay, mode: job.item === 'parcel' ? 'parcel' : 'sell' }; startAction(job.item === 'parcel' ? parcelKF(b) : sellKF(job.item, b, ctx), ctx); owner.look = { who: b }; b.beginSession(); }
}
owner.abort = function () { const r = owner.runner; if (!r) return; W.kettle.held = false; W.jhara.held = false; if (W.fry.on) W.fry.autoEnd = Tapri.T + 6; owner.runner = null; owner.pose = null; owner.idleUntil = Tapri.T + 2; };
owner.start = function () { owner.x = 336; owner.runner = null; owner.jobs.length = 0; owner.idleUntil = Tapri.T + 3; owner.lastFry = Tapri.T - 30; };

owner.update = function (dt) {
  const T = Tapri.T;
  if (T > owner.blinkAt) { owner.blinkUntil = T + 0.14; owner.blinkAt = T + rnd(2, 5.5); }
  owner.sway = Math.sin(T * 1.3) * 0.5;
  if (owner.runner && owner.runner.ctx.routine && owner.jobs.length) owner.abort();
  if (!owner.runner) {
    if (owner.jobs.length) startJob(owner.jobs.shift());
    else if (T > owner.idleUntil) { const [name, kfs] = routine(); if (kfs) { startAction(kfs, { routine: true }); } owner.idleUntil = T + rnd(3, 8); }
  }
  let mx = 0;
  if (owner.runner) { const r = owner.runner; r.step(dt); const s = r.sample(); mx = s.x - owner.x; owner.x = s.x; owner.pose = s; if (r.done) { owner.runner = null; owner.pose = null; if (r.hold.R === 'kettle' || r.hold.R === 'jhara') { /* safety: never leave tools in his hand */ W.kettle.held = false; W.jhara.held = false; } } }
  owner.moving = Math.abs(mx) > 0.02;
  // gaze
  const lk = owner.look; let tx = owner.x + Math.sin(T * 0.4) * 60, ty = G - 90;
  if (lk && lk.who && !lk.who.dead) { tx = lk.who.x; ty = lk.who.y - 70; } else if (Tapri.mouse && Tapri.mouse.on && T - Tapri.mouse.t < 5) { tx = Tapri.mouse.x; ty = Tapri.mouse.y; }
  owner.look.x = lerp(owner.look.x || 0, clamp((tx - owner.x) / 40, -1, 1), 0.15); owner.look.y = lerp(owner.look.y || 0, clamp((ty - (G - 100)) / 50, -1, 1), 0.15);
};

/* ---------- drawing ---------- */
owner.draw = function (g, light) {
  const T = Tapri.T, ax = Math.round(owner.x), p = owner.pose || {}; const dip = (p.dip || 0), run = owner.runner;
  const toL = (a) => a ? [a[0] - ax, a[1] - G] : null;
  const arms = p.L ? { L: toL(p.L), R: toL(p.R) } : { L: toL(restL(owner.x)), R: toL(restR(owner.x)) };
  const talking = T < owner.talkUntil, lg = T < owner.smileUntil;
  const info = Sprites.stand(g, style, { holder: owner, dt: Tapri.dt, dir: 1, moving: false, arms, dip, sway: Math.round(owner.sway), extra: Tapri.stage.ownerExtra, fx: Math.round(owner.look.x * 2), fy: owner.look.y > 0.4 ? 1 : 0, look: { x: owner.look.x }, expr: p.expr || (talking ? 'talk' : lg ? 'smile' : 'n'), blink: T < owner.blinkUntil, t: T, lean: owner.moving ? 1 : 0, headDy: dip > 3 ? 1 : 0 }, light);
  if (run) {
    const hl = run.hold.L, hr = run.hold.R;
    // pour stream from the spout to the glass
    if (hr === 'kettle') { /* drawn in drawHeld; stream below */ }
    Tapri.stage.drawHeld(hl, info.lhand, 'L', p, T); const sp = Tapri.stage.drawHeld(hr, info.hand, 'R', p, T);
    if (hr === 'kettle' && sp) for (let i = 0; i < W.glasses.length; i++) { const gl = W.glasses[i]; if (gl.pour) { const topY = (200 - G), x = Math.round(sp[0]), y0 = Math.round(sp[1]); for (let y = y0; y < topY; y += 2) Sprites.px(x + Math.round(Math.sin(T * 25 + y) * 0.5), y, 1, 2, y % 4 ? '#b5651d' : '#8f4a12'); break; } }
  }
  return info;
};
owner.groundY = G;
// dev/test hook: force a routine by name
owner.force = function (name) { const m = { fry: fryKF, agar: agarKF, shoo: shooKF, wipe: wipeKF, count: countKF, sip: sipKF, radio: radioKF, fan: fanKF, stretch: stretchKF, phone: phoneKF, lean: leanKF, pakoda: pakodaKF }; if (name === 'chai') { const c = { mode: 'tray', targets: null }; startAction(chaiKF(1, c), c); } else if (m[name]) startAction(m[name](), {}); };
})();
