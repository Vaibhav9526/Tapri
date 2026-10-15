/* Customers, the helper boy and the conversations. Seated customers drink chai, eat samosas, use their phones, read the paper
   and chat with whoever shares their table; buyers walk up to the counter, buy something, pay and eat/drink it on the spot. */
(() => {
'use strict';
const { L, D, clamp, lerp, rnd, pick, ease, W, owner } = Tapri;
const people = Tapri.people = [];
const LANE = L.walkY, GROUND = L.ground, STAND = L.standY, TABLE_TOP = L.tableTop;
// relaxed idle hand targets come from the rig (Sprites.metrics), so the art session controls how a resting arm hangs
// a phone held at chest height / a phone at the ear, from the rig's own measurements
function chestHand(s) { const M = Sprites.metrics ? Sprites.metrics(s, {}, false) : null; return M && M.chest ? [M.chest[0] + 3, M.chest[1]] : [6, -50]; }
function restHands(s) { const M = Sprites.metrics ? Sprites.metrics(s, {}, false) : null; return M && M.restL && M.restR ? { L: M.restL, R: M.restR } : { L: [-12, -35], R: [10, -35] }; }
const seatItems = L.seats.map(() => ({ glass: null, plate: null }));
Tapri.seatItems = seatItems;
const pan = x => clamp((x / L.W) * 2 - 1, -1, 1);
const T_ = () => Tapri.T;

/* ---------- a customer ---------- */
class Person {
  constructor(kind, slot, instant) {
    this.kind = kind; this.slot = slot; this.style = Sprites.makeStyle(); this.female = this.style.female; this.dead = false;
    this.glass = 0; this.plate = 0; this.talkUntil = 0; this.laughUntil = 0; this.smileUntil = 0; this.blinkUntil = 0; this.blinkAt = rnd(1, 4); this.lookAt = null; this.lookUntil = 0; this.look = { x: 0, y: 0 };
    this.seed = rnd(0, 100); this.walk = rnd(0, 6); this.crouch = 0; this.act = 'idle'; this.actT0 = 0; this.actUntil = 0; this.nextAct = Tapri.T + rnd(3, 10); this.hold = null; this.offer = null; this.waveUntil = 0;
    this.legPose = pick([0, 0, 1, 2]); this.jig = Math.random() < 0.4; this.tapper = Math.random() < 0.5; this.groover = Math.random() < 0.5;
    this.phoneMode = this.style.age === 'old' ? null : pick(['phone', 'phone', 'text', 'call', null]); this.paper = this.style.age === 'old' && Math.random() < 0.6;
    this.walkPhone = !!this.phoneMode && Math.random() < 0.25; this.life = Tapri.T + rnd(110, 210); this.ordered = 0; this.wants = false; this.sipAt = 0; this.sipT0 = -9; this.eatT0 = -9; this.bites = 0;
    if (kind === 'sitter') {
      this.seat = slot; slot.p = this; this.gy = LANE;
      if (instant) { this.state = 'seated'; this.x = slot.x; this.gy = GROUND; this.seated(); this.glass = Math.random() < 0.6 ? rnd(0.3, 1) : 0; if (this.glass) seatItems[L.seats.indexOf(slot)].glass = { lvl: this.glass }; this.glass = 0; }
      else { const left = slot.x < L.W / 2 ? Math.random() < 0.7 : Math.random() < 0.3; this.dir = left ? 1 : -1; this.x = left ? -24 : L.W + 24; this.gy = LANE; this.state = 'walkin'; }
    } else { // buyer
      this.spot = slot; slot.p = this; const left = slot.x < L.W / 2 ? Math.random() < 0.7 : Math.random() < 0.3; this.dir = left ? 1 : -1; this.x = left ? -24 : L.W + 24; this.gy = LANE; this.state = 'walkin';
      this.item = pick(slot.x > 300 ? ['cola', 'cola', 'parcel'] : ['chips', 'chips', 'biscuit', 'samosa']); this.pay = slot.x > 300 && Math.random() < 0.6 ? 'upi' : 'cash';
    }
  }
  seated() { this.nextOrder = Tapri.T + rnd(1.5, 5); this.nextAct = Tapri.T + rnd(3, 9); }
  get idx() { return L.seats.indexOf(this.seat); }
  headX() { return this.x; }
  anchor() { const sit = this.state === 'seated' || this.state === 'sitdown' || this.state === 'standup'; return { x: this.x, y: this.gy - (sit ? 76 : 100) - 4 }; }
  partner() { if (this.kind !== 'sitter') return null; const o = L.seats[this.idx ^ 1]; return o && o.p && o.p.state === 'seated' ? o.p : null; }
  canChat() { return this.state === 'seated' && (this.act === 'idle' || this.act === 'sip') && !this.wants; }

  /* ----- state machine ----- */
  update(dt) {
    const T = Tapri.T, st = this.state;
    if (T > this.blinkAt) { this.blinkUntil = T + 0.14; this.blinkAt = T + rnd(2, 6); }
    if (st === 'walkin' || st === 'leave') {
      const tx = this.kind === 'sitter' ? this.seat.x : this.spot.x; this.walk += dt * 5.0;
      if (st === 'walkin') { const dx = tx - this.x; if (Math.abs(dx) > 0.6 && !this.stepping) { this.dir = Math.sign(dx); this.x += this.dir * Math.min(Math.abs(dx), 38 * dt); } else { this.stepping = true; this.dir = 1; const ty = this.kind === 'sitter' ? GROUND : STAND, dy = ty - this.gy; if (Math.abs(dy) > 0.2) { this.gy += Math.sign(dy) * Math.min(Math.abs(dy), 24 * dt); this.faceUp = true; } else { this.gy = ty; this.stepping = false; this.faceUp = false; if (this.kind === 'sitter') { this.state = 'sitdown'; this.t0 = T; TA.sfx('stool_scrape', { vol: 0.5, pan: pan(this.x) }); } else { this.state = 'wait'; this.t0 = T; this.waitUntil = T + rnd(1.0, 2.2); } } } }
      else { // leaving: step out to the lane, then walk off the nearest edge
        if (this.gy < LANE - 0.2) { this.gy = Math.min(LANE, this.gy + 24 * dt); this.dir = 1; } else { if (!this.exitDir) this.exitDir = this.x < L.W / 2 ? -1 : 1; this.dir = this.exitDir; this.x += this.dir * 38 * dt; if (this.x < -30 || this.x > L.W + 30) this.dead = true; }
      }
    } else if (st === 'sitdown') { const k = clamp((T - this.t0) / 0.55, 0, 1); this.crouch = Math.sin(k * Math.PI / 2); if (k >= 1) { this.state = 'seated'; this.crouch = 0; this.seated(); } }
    else if (st === 'standup') { const k = clamp((T - this.t0) / 0.55, 0, 1); this.crouch = Math.cos(k * Math.PI / 2); if (k >= 1) { this.crouch = 0; this.state = 'leave'; this.seat.p = null; const items = seatItems[this.idx]; this.leftover(); } }
    else if (st === 'seated') this.updateSeated(dt);
    else if (st === 'wait') { if (T > this.waitUntil && !this.queued) { this.queued = true; owner.enqueue({ type: 'sell', item: this.item, buyer: this, pay: this.pay }); } }
    else if (st === 'enjoy') { if (T - this.t0 > 5.2) { this.state = 'leave'; this.spot.p = null; this.hold = null; } }
    this.updateGaze();
  }
  leftover() { const it = seatItems[this.idx]; if (!it.glass && this.hadGlass) it.glass = { lvl: 0 }; if (this.hadGlass) { it.glass = { lvl: 0 }; Tapri.helper.dirty.push(this.idx); } }

  updateSeated(dt) {
    const T = Tapri.T, it = seatItems[this.idx];
    // order chai
    if (!this.wants && !this.ordered && T > this.nextOrder && !owner.jobs.length) this.order();
    if (this.glass > 0.02 && this.act === 'idle' && T > this.sipAt) { this.act = 'sip'; this.actT0 = T; this.sipAt = T + rnd(7, 14); this.sipDone = false; }
    if (this.act === 'sip') { const t = T - this.actT0; if (t > 1.1 && !this.sipDone) { this.sipDone = true; this.glass = Math.max(0, this.glass - 0.18); TA.sfx('sip', { vol: 0.8, pan: pan(this.x) }); } if (t > 2.8) { this.act = 'idle'; if (this.glass < 0.03) { this.glass = 0; this.putGlass(); } } }
    if (this.plate > 0 && this.act === 'idle' && T > this.nextAct && Math.random() < 0.02) { this.act = 'eat'; this.actT0 = T; this.biteDone = false; }
    if (this.act === 'eat') { const t = T - this.actT0; if (t > 1.5 && !this.biteDone) { this.biteDone = true; this.bites++; TA.sfx('chips_tear', { vol: 0.12, pan: pan(this.x) }); if (this.bites >= 3) { this.bites = 0; this.plate--; if (this.plate <= 0) { it.plate = null; } } } if (t > 3.4) { this.act = 'idle'; } }
    // phone / paper / call
    if (this.act === 'idle' && T > this.nextAct && !this.glass && !this.wants && !this.plate) { const opts = []; if (this.phoneMode) opts.push(this.phoneMode, this.phoneMode); if (this.paper) opts.push('paper', 'paper'); if (opts.length && !(this.partner() && Tapri.convoWith(this))) { this.act = pick(opts); this.actT0 = T; this.actUntil = T + rnd(10, 26); if (this.act === 'call') this.callIdx = 0, this.callAt = T + 0.8; } else this.nextAct = T + rnd(6, 16); }
    if ((this.act === 'phone' || this.act === 'text' || this.act === 'paper' || this.act === 'call') && (T > this.actUntil || this.glass > 0 || this.plate > 0)) { if (this.act === 'call') { /* goodbye */ } this.act = 'idle'; this.nextAct = T + rnd(8, 20); }
    if (this.act === 'call' && T > this.callAt) { const lines = D.calls; if (this.callIdx < lines.length) { Tapri.say(this, this.female ? 'f' : 'm', lines[this.callIdx][0], { kind: 'call' }); this.callAt = T + rnd(3.4, 5.2); this.callIdx++; } else { this.callAt = T + 99; this.actUntil = Math.min(this.actUntil, T + 1.2); } }
    if ((this.act === 'phone' || this.act === 'text') && Math.random() < dt * 0.09) { TA.sfx('phone_notify', { vol: 0.5, pan: pan(this.x) }); this.smileUntil = T + rnd(1.5, 3); if (Math.random() < 0.25) this.laughUntil = T + 0.9; }
    // groups and leaving
    if (T > this.life && !Tapri.convoWith(this) && !this.glass && !this.plate && this.act === 'idle' && !this.wants) { this.state = 'standup'; this.t0 = T; Tapri.convoAbort(this); }
    // body language: sometimes lean on table, look around
    if (T > this.nextAct && this.act === 'idle' && !this.glass) this.nextAct = T + rnd(6, 14);
  }
  order() {
    const T = Tapri.T, o = pick(D.orders), partner = this.partner(); this.wants = true; this.ordered = 1; this.hadGlass = true; const two = partner && partner.wants === false && !partner.ordered && Math.random() < 0.4;
    const vd = Tapri.say(this, this.female ? 'f' : 'm', o[0][1], { kind: 'order' }); Tapri.after(Math.min(2.2, vd * 0.9), () => { if (this.dead) return; owner.look = { who: this }; Tapri.say(owner, 'o', o[1][1], {}); });
    this.act = 'idle'; const targets = [this]; if (two) { partner.wants = true; partner.ordered = 1; partner.hadGlass = true; targets.push(partner); }
    Tapri.after(1.9, () => owner.enqueue({ type: 'chai', n: targets.length, targets }));
    if (Math.random() < 0.35) { this.snackAt = T + rnd(20, 50); }
  }
  receiveGlass() { this.glass = 1; this.wants = false; this.sipAt = Tapri.T + 1.2; this.smileUntil = Tapri.T + 2; this.act = 'idle'; seatItems[this.idx].glass = null; this.glassOnTable = true; this.putGlassBack = true; if (Math.random() < 0.6) Tapri.say(this, this.female ? 'f' : 'm', pick(D.thanks), { kind: 'say' }); this.nextOrder = Infinity; }
  putGlass() { seatItems[this.idx].glass = { lvl: 0 }; }
  receivePlate() { this.plate = 2; this.bites = 0; seatItems[this.idx].plate = { n: 2 }; this.smileUntil = Tapri.T + 2; }
  glassOnTableLvl() { return this.glass; }

  /* ----- buyers ----- */
  beginSession() {
    const lines = D.buys[this.item], v = this.female ? 'f' : 'm'; let t = 0.2; this.sessionOn = true;
    lines.forEach(([s, text]) => { const dur = Tapri.lineDur(null, text); Tapri.after(t, () => { if (this.dead) return; const ent = s ? owner : this; if (s) owner.look = { who: this }; Tapri.say(ent, s ? 'o' : v, text, {}); }); t += dur + 0.35; });
    if (this.pay === 'upi') { const up = D.pay.upi; Tapri.after(t + 0.8, () => { if (!this.dead) Tapri.say(this, v, up[0][1], {}); }); Tapri.after(t + 2.6, () => { if (!this.dead) Tapri.say(owner, 'o', up[1][1], {}); }); }
  }
  receive(item) { this.hold = item === 'parcel' ? 'cups' : item; this.takeUntil = Tapri.T + 0.8; if (item === 'samosa') this.holdN = 2; }
  afterReceive() { this.takeUntil = 0; }
  payNow(pay) {
    const T = Tapri.T; if (pay === 'upi') { this.offer = 'phone'; this.offerUntil = T + 1.6; Tapri.after(0.7, () => { if (this.dead) return; TA.say('o', D.sound.upi, 392, L.W); Tapri.soundboxUntil = Tapri.T + 3.2; if (Tapri.hooks.bubble) Tapri.hooks.bubble({ x: 388, headX: () => 388, anchor: () => ({ x: 388, y: 188 }), talkUntil: 0 }, D.sound.upi, 3000, 'say'); }); }
    else { this.offer = 'cash'; this.offerUntil = T + 1.2; }
  }
  saleDone() { this.offer = null; this.state = 'enjoy'; this.t0 = Tapri.T; this.enjoyItem = this.hold; if (this.hold === 'chips' || this.hold === 'biscuit') TA.sfx('chips_tear', { vol: 0.9, pan: pan(this.x), delay: 0.3 }); }

  updateGaze() {
    const T = Tapri.T; let tx, ty; const hx = this.x, hy = this.gy - 80;
    if (this.act === 'phone' || this.act === 'text' || this.act === 'paper') { tx = hx; ty = hy + 40; }
    else if (T - (Tapri.mouse.t) < 4 && Tapri.mouse.on) { tx = Tapri.mouse.x; ty = Tapri.mouse.y; }
    else if (this.lookAt && T < this.lookUntil && !this.lookAt.dead) { tx = this.lookAt.x; ty = this.lookAt.gy ? this.lookAt.gy - 80 : hy; }
    else if (this.kind === 'buyer' && (this.state === 'wait' || this.state === 'enjoy')) { tx = owner.x; ty = 170; }
    else { tx = hx + Math.sin(T * 0.4 + this.seed) * 90; ty = hy + Math.sin(T * 0.3 + this.seed * 2) * 14; }
    this.look.x = lerp(this.look.x, clamp((tx - hx) / 30, -1, 1), 0.15); this.look.y = lerp(this.look.y, clamp((ty - hy) / 25, -1, 1), 0.15);
  }

  /* ----- drawing ----- */
  draw(g, light) {
    const T = Tapri.T, s = this.style, beat = Tapri.beat || 0, playing = TA.isPlaying();
    if (this.state === 'seated' || this.state === 'sitdown' && false) return this.drawSeated(g, light, T, s, beat, playing);
    return this.drawStanding(g, light, T, s, beat, playing);
  }
  drawSeated(g, light, T, s, beat, playing) {
    const act = this.act, talk = T < this.talkUntil, lg = T < this.laughUntil, k = s.h, ax = Math.round(this.x), ay = GROUND;
    const down = act === 'phone' || act === 'text' || act === 'paper', lean = down ? 2 : talk ? 1 : 0, shake = lg ? (Math.sin(T * 30) > 0 ? 1 : 0) : 0;
    const sway = playing && this.groover ? Math.round(Math.sin(T * 3 + this.seed)) : 0, hb = playing && beat > 0.45 && this.groover ? 1 : 0, tap = playing && this.tapper ? Math.max(0, Math.sin(T * Math.PI * 3.8 + this.seed)) * 1.8 : 0;
    const breath = Math.sin(T * 1.5 + this.seed) > 0.2 ? 1 : 0, dyAdj = -breath + (act === 'idle' && this.idleMode === 'chin' ? 2 : 0);
    // geometry comes from the rig itself (Sprites.metrics, in sim units) so cups and phones always meet the face; fallback = the original rig's numbers
    const M = Sprites.metrics ? Sprites.metrics(s, { lean: lean + shake, dy: dyAdj }, true) : null, sc = M ? M.height / 96 : 1;
    const shY = M ? M.shY : (-28 - 30 * k) + lean + shake + dyAdj, headTop = (M ? M.headTop : shY - 17 * sc) + hb + (down ? 1 : 0), mouth = M ? [M.mouth[0] + sway, M.mouth[1] + hb + (down ? 2 : 0)] : [4 + sway, headTop + 11 + (down ? 2 : 0)];
    const tL = [-12, -33], tR = [12, -33], pose = { sway, lean: lean + shake, dy: dyAdj, legPose: this.legPose, tap, jig: this.jig && !playing ? Math.sin(T * 9 + this.seed) * 0.8 : 0, look: this.look, fx: Math.round(this.look.x * 2), fy: down ? 1 : 0, headDy: hb, t: T, blink: T < this.blinkUntil, arms: {}, holder: this, dt: Tapri.dt, rate: 7 };
    let rprop = null, lprop = null; const sit = Tapri.seatItems[this.idx], glassPos = [14, -33], platePos = [-14, -33];
    const sp = T - this.actT0;
    pose.expr = lg ? 'laugh' : T < this.smileUntil ? 'smile' : (talk || act === 'call') && T < this.talkUntil ? 'talk' : 'n';
    if (T > (this.idleAt || 0)) { this.idleMode = pick([null, null, 'chin']); this.idleAt = T + rnd(6, 14); }
    if (act === 'idle' && this.idleMode === 'chin' && !(T < this.takeUntil) && !(T < this.waveUntil) && !this.speaking) pose.arms.R = [8, mouth[1] + 6];
    if (T < this.takeUntil) { const k2 = ease(clamp((T - (this.takeUntil - 1)) / 0.4, 0, 1)); pose.arms.R = [lerp(12, 22 * (this.takeSide || 1), k2), lerp(-33, -37, k2)]; }
    else if (act === 'sip') { const kk = sp < 0.6 ? ease(sp / 0.6) : sp < 1.9 ? 1 : sp < 2.5 ? ease(1 - (sp - 1.9) / 0.6) : 0; pose.arms.R = [lerp(glassPos[0], mouth[0] + 1, kk), lerp(glassPos[1], mouth[1] + 3, kk)]; rprop = 'glass'; if (kk > 0.9) pose.expr = lg ? 'laugh' : 'sip'; if (kk > 0.9 && Math.random() < 0.15) Tapri.steam(ax + mouth[0] + 1 + 0, ay + mouth[1] - 4, 1); pose.headDy += kk > 0.9 ? -0 : 0; }
    else if (act === 'eat') { const kk = sp < 0.6 ? ease(sp / 0.6) : sp < 2.6 ? 1 : ease(1 - (sp - 2.6) / 0.6); pose.arms.R = [lerp(platePos[0], mouth[0] - 1, kk), lerp(platePos[1], mouth[1] + 3, kk)]; rprop = 'samosa'; if (kk > 0.9) pose.expr = lg ? 'laugh' : 'eat'; }
    else if (act === 'phone') { pose.arms.R = [5, shY + 22 * sc + Math.round(Math.sin(T * 1.3 + this.seed))]; rprop = 'phone'; pose.glow = true; }
    else if (act === 'text') { pose.arms.L = [-3, shY + 23 * sc]; pose.arms.R = [5, shY + 23 * sc]; rprop = 'phone2'; pose.glow = true; }
    else if (act === 'call') { pose.arms.R = M && M.ear ? [M.ear[0] + 2, M.ear[1] + hb] : [10, headTop + 9 * sc]; rprop = 'phoneEar'; if (talk) pose.arms.L = [-16, shY + 14 * sc - Math.abs(Math.sin(T * 5)) * 6]; }
    else if (act === 'paper') { pose.arms.L = [-14, shY + 15 * sc]; pose.arms.R = [14, shY + 15 * sc]; lprop = 'paper'; }
    if (T < (this.shooUntil || 0)) { pose.arms.R = [20 + Math.sin(T * 17) * 7, shY + 24 * sc + Math.sin(T * 17) * 2]; pose.lean = (pose.lean || 0) + 2; pose.expr = 'talk'; }
    if (T < this.waveUntil) pose.arms.L = [-20, shY - 4 * sc + Math.sin(T * 14) * 3];
    else if (talk && act === 'idle' && this.speaking && Math.sin(T * 0.7 + this.seed) > -0.35) { const w = Math.sin(T * 2.3 + this.seed); pose.arms.L = [-15 - 1.5 * w, shY + 18 * sc - 3.5 * (0.5 + 0.5 * Math.sin(T * 3.1 + this.seed))]; } // slow, intermittent talking gesture
    const info = Sprites.sit(g, s, pose, light);
    const hp = { glass: this.glass, bites: this.bites, T, seed: this.seed, skin: s.skin };
    if (rprop) Tapri.stage.heldProp(rprop, info, hp); if (lprop) Tapri.stage.heldProp(lprop, info, hp);
    return info;
  }
  drawStanding(g, light, T, s, beat, playing) {
    const moving = this.state === 'walkin' || this.state === 'leave' || this.state === 'sitdown' || this.state === 'standup';
    const walking = (this.state === 'walkin' || this.state === 'leave');
    const pose = { dir: this.dir || 1, phase: this.walk, moving: walking ? true : (this.state === 'sitdown' || this.state === 'standup'), crouch: this.crouch, look: this.look, blink: T < this.blinkUntil, t: T, expr: T < this.laughUntil ? 'laugh' : T < this.talkUntil ? 'talk' : T < this.smileUntil ? 'smile' : 'n', arms: {}, holder: this, dt: Tapri.dt };
    if (this.kind === 'buyer' && !walking && this.state !== 'sitdown') { pose.moving = false; pose.fx = clamp(Math.round((owner.x - this.x) / 40), -2, 2); }
    let prop = null; const base = 204;
    const ax = Math.round(this.x), toL = (wx, wy) => [wx - ax, wy - this.gy];
    if (this.kind === 'buyer') {
      if (this.state === 'wait') { const rh = restHands(s); pose.arms.R = rh.R; pose.arms.L = rh.L; if (this.walkPhone) { pose.arms.R = chestHand(s); prop = 'phone'; pose.fy = 1; pose.glow = true; } }
      if (T < this.takeUntil) { pose.arms.R = toL(this.x + 10, 204); pose.arms.L = this.item === 'samosa' ? toL(this.x - 6, 204) : pose.arms.L; }
      if (this.offer && T < this.offerUntil) { if (this.offer === 'cash') { pose.arms.R = toL(this.x + 10, 204); prop = 'note'; } else { pose.arms.R = toL(388, 228); prop = 'phone'; pose.fy = 1; } }
      else if (this.hold && this.state === 'wait') { pose.arms.R = restHands(s).R; }
      if (this.state === 'enjoy') this.enjoyPose(pose, T);
    } else if (walking && this.walkPhone) { pose.arms.R = chestHand(s); prop = 'phone'; pose.fy = 1; pose.glow = true; }
    const info = Sprites.stand(g, s, pose, light);
    if (prop) Tapri.stage.heldProp(prop, info, { T, skin: s.skin });
    this.drawHeldItem(info, T);
    return info;
  }
  enjoyPose(pose, T) {
    const t = T - this.t0, it = this.enjoyItem, MM = Sprites.metrics ? Sprites.metrics(this.style, {}, false) : null, mouthY = MM ? MM.mouth[1] : -73; this.enjoy = { t };
    if (it === 'chips' || it === 'biscuit') { if (t < 1.2) { pose.arms.L = [-6, -50]; pose.arms.R = [6 + t * 5, -50]; } else { const k = Math.sin(t * 3) > 0 ? 1 : 0; pose.arms.R = [lerp(8, 2, k), lerp(-50, mouthY + 4, k)]; pose.arms.L = [-10, -36]; pose.expr = k ? 'eat' : pose.expr; } }
    else if (it === 'cola') { const k = t > 0.6 ? clamp(Math.sin((t - 0.6) * 1.6), 0, 1) : 0; pose.arms.R = [lerp(10, 3, k), lerp(-38, mouthY + 4, k)]; pose.arms.L = restHands(this.style).L; if (k > 0.7) pose.expr = 'sip'; }
    else if (it === 'samosa') { const k = Math.sin(t * 2.2) > 0.2 ? 1 : 0; pose.arms.L = [-8, -40]; pose.arms.R = [lerp(8, 2, k), lerp(-42, mouthY + 4, k)]; if (k) pose.expr = 'eat'; }
    else { const rh = restHands(this.style); pose.arms.R = rh.R; pose.arms.L = rh.L; }
  }
  drawHeldItem(info, T) {
    if (!this.hold) return; Tapri.stage.heldProp('hold:' + this.hold, info, { T, open: this.state === 'enjoy' && T - this.t0 > 1.0 });
  }
}

/* ---------- the helper boy ---------- */
const helper = Tapri.helper = {
  style: Sprites.makeStyle({ female: false, age: 'young', override: { skin: '#b58052', hc: '#17110d', hair: 'short', outfit: 'tee', shirt: '#6a8aa0', pants: '#4a3a30', shoe: '#4a3a2a', sandals: true, h: 0.9, cap: null, glasses: false, must: false, beard: false, stubble: false, seed: 7.7 } }),
  x: L.helper.x, gy: STAND + 6, dir: -1, walk: 0, state: 'idle', t0: 0, act: 'wash', actUntil: 0, tray: [], jobs: [], dirty: [], cur: null, give: 0, talkUntil: 0, blinkUntil: 0, blinkAt: 2, look: { x: 0, y: 0 }, moving: false, carrying: false, dead: false,
  headX() { return this.x; }, anchor() { return { x: this.x, y: this.gy - 90 }; },
  home() { return { x: L.helper.x, y: STAND + 6 }; }
};
helper.update = function (dt) {
  const T = Tapri.T, h = helper; h.moving = false;
  if (T > h.blinkAt) { h.blinkUntil = T + 0.14; h.blinkAt = T + rnd(2, 5); }
  const walkTo = (tx, ty, sp = 46) => { const dx = tx - h.x, dy = ty - h.gy, d = Math.hypot(dx, dy); if (d < 0.8) { h.x = tx; h.gy = ty; return true; } h.moving = true; h.walk += dt * 5.4; const st = Math.min(d, sp * dt); h.x += dx / d * st; h.gy += dy / d * st; if (Math.abs(dx) > 1) h.dir = Math.sign(dx); return false; };
  const tray = W.tray;
  if (h.state === 'idle') {
    if (tray.length) { h.cur = { items: tray.splice(0, tray.length) }; h.state = 'toTray'; h.t0 = T; TA.setLoop('glass_wash', false); }
    else if (h.dirty.length && !h.cur && (h.dirty.length >= 2 || T - (h.idleSince || 0) > 28)) { h.cur = { collect: h.dirty.shift() }; h.state = 'toTable'; }
    else if (T > h.actUntil) { h.act = pick(['wash', 'wash', 'wash', 'wipe', 'phone', 'yawn', 'look', 'wash']); h.actUntil = T + rnd(6, 14); TA.setLoop('glass_wash', h.act === 'wash', 1); }
    if (h.state === 'idle') { const hm = h.home(); walkTo(hm.x, hm.gy || hm.y, 40); h.dir = -1; }
  } else if (h.state === 'toTray') { if (walkTo(376, STAND + 4)) { h.state = 'pickup'; h.t0 = T; h.dir = 1; } }
  else if (h.state === 'pickup') { const t = T - h.t0; if (t > 1.3) { h.carrying = true; h.state = 'toLane'; for (const it of h.cur.items) { it.removed = true; } W.tray.length = 0; TA.sfx('glass_clink', { vol: 0.5, pan: 0.6 }); h.queue = h.cur.items.slice(); h.nextStop(); } }
  else if (h.state === 'toLane') { if (walkTo(h.stopX, LANE, 52)) h.state = 'toStop'; else if (Math.abs(h.x - h.stopX) < 10 && h.gy >= LANE - 1) h.state = 'toStop'; }
  else if (h.state === 'toStop') { if (walkTo(h.stopX, LANE, 52)) { h.state = 'give'; h.t0 = T; h.dir = h.faceDir; Tapri.say(h, 'h', pick(D.serve), {}); } }
  else if (h.state === 'give') { const t = T - h.t0; h.give = t < 0.6 ? ease(t / 0.6) : t < 1.4 ? 1 : Math.max(0, 1 - (t - 1.4) / 0.5); if (t > 0.9 && !h.gave) { h.gave = true; const c = h.cur.target; if (c && !c.dead && c.state === 'seated') { if (h.curKind === 'plate') c.receivePlate(); else c.receiveGlass(); TA.sfx('table_set', { vol: 0.8, pan: pan(c.x) }); } h.items--; } if (t > 1.9) { h.give = 0; h.gave = false; if (h.queue.length) h.nextStop(); else { h.carrying = false; h.state = 'back'; } } }
  else if (h.state === 'back') { const hm = h.home(); if (h.gy < LANE - 1 || Math.abs(h.y) < 0) {} const stage = h.gy >= LANE - 1 || Math.abs(h.x - hm.x) < 8; if (!h.backLane) { if (walkTo(hm.x, LANE, 52)) h.backLane = true; } else if (walkTo(hm.x, hm.y, 40)) { h.state = 'idle'; h.idleSince = T; h.backLane = false; h.cur = null; h.actUntil = T + 1; } }
  else if (h.state === 'toTable') { const idx = h.cur.collect, seat = L.seats[idx]; if (!h.lane2) { if (walkTo(h.x, LANE, 40)) h.lane2 = true; } else if (walkTo(seat.x + 26, LANE, 52)) { h.state = 'collect'; h.t0 = T; h.dir = -1; } }
  else if (h.state === 'collect') { if (T - h.t0 > 1.4 && !h.took) { h.took = true; seatItems[h.cur.collect].glass = null; seatItems[h.cur.collect].plate = null; h.hasEmpty = true; TA.sfx('table_set', { vol: 0.6, pan: pan(h.x) }); } if (T - h.t0 > 2.2) { h.took = false; h.lane2 = false; h.state = 'back'; h.carrying = false; h.cur = null; } }
  // gaze
  let tx = h.x + h.dir * 60, ty = h.gy - 70; if (Tapri.mouse.on && T - Tapri.mouse.t < 4) { tx = Tapri.mouse.x; ty = Tapri.mouse.y; }
  h.look.x = lerp(h.look.x, clamp((tx - h.x) / 30, -1, 1), 0.12); h.look.y = lerp(h.look.y, clamp((ty - (h.gy - 70)) / 25, -1, 1), 0.12);
};
helper.nextStop = function () {
  const h = helper, it = h.queue.shift(), c = it.for && !it.for.dead && it.for.state === 'seated' ? it.for : null; h.cur.target = c; h.curKind = it.kind || 'glass';
  if (!c) { h.stopX = h.x; h.faceDir = 1; h.state = 'toStop'; h.gave = true; h.items = 0; h.cur.target = null; return; }
  const fromRight = h.x > c.x; h.stopX = c.x + (fromRight ? 28 : -28); h.faceDir = fromRight ? -1 : 1; h.state = 'toLane'; h.gave = false;
};
helper.draw = function (g, light) {
  const T = Tapri.T, h = helper, s = h.style, pose = { dir: h.dir, phase: h.walk, moving: h.moving, look: h.look, blink: T < h.blinkUntil, t: T, expr: T < h.talkUntil ? 'talk' : 'n', arms: {}, holder: h, dt: Tapri.dt };
  let prop = null, carry = h.carrying && (h.state === 'toLane' || h.state === 'toStop' || h.state === 'give' || h.state === 'back' && false || h.state === 'pickup' && T - h.t0 > 0.9);
  const d = h.dir;
  if (h.state === 'idle') {
    const a = h.act, tt = T * 3; if (!h.moving) {
      if (a === 'wash') { pose.arms.R = [-14 + Math.sin(tt) * 3, -26 + Math.sin(tt * 1.3)]; pose.arms.L = [-20 + Math.sin(tt + 1) * 3, -24]; pose.dip = 6; pose.moving = false; pose.fx = -2; pose.fy = 1; }
      else if (a === 'wipe') { pose.arms.R = [-8, -48 + Math.sin(tt * 2) * 2]; pose.arms.L = [-14, -50]; prop = 'wipe'; pose.fy = 1; }
      else if (a === 'phone') { pose.arms.R = chestHand(s); pose.arms.L = restHands(s).L; prop = 'phone'; pose.fy = 1; pose.glow = true; }
      else if (a === 'yawn') { pose.arms.L = [-14, -70]; pose.arms.R = [14, -70]; pose.expr = 'laugh'; }
    }
  }
  if (carry) { const armT = (x, y) => [x, y]; pose.arms.L = [d * 4, -52]; pose.arms.R = h.give > 0.05 ? [d * lerp(12, 26, h.give), lerp(-52, -42, h.give)] : [d * 14, -52]; pose.extra = null; }
  if (h.state === 'pickup') { const t = T - h.t0; pose.moving = false; pose.fx = 2; pose.arms.R = [14, -62 + Math.min(0, -(1 - Math.abs(Math.sin(t * 2)) * 0))]; pose.arms.L = [4, -58]; }
  const info = Sprites.stand(g, s, pose, light);
  if (prop) Tapri.stage.heldProp(prop, info, { T });
  if (carry) Tapri.stage.helperTray(info, h, d);
  return info;
};

/* ---------- conversations (pairs sharing a table) ---------- */
const convo = { cur: null, next: 8, last: -1 };
Tapri.convoWith = p => convo.cur && (convo.cur.a === p || convo.cur.b === p);
Tapri.convoAbort = p => { if (Tapri.convoWith(p)) convo.cur = null; };
function startConvo() {
  const T = Tapri.T, pairs = [[0, 1], [2, 3], [4, 5]].map(([i, j]) => [L.seats[i].p, L.seats[j].p]).filter(([a, b]) => a && b && a.canChat() && b.canChat() && Math.abs(a.x - b.x) < 80);
  if (!pairs.length) { convo.next = T + 4; return; }
  const [a, b] = pick(pairs); const g = a.female && b.female ? 'ff' : (!a.female && !b.female ? 'mm' : 'mf'); const opts = D.chats.map((c, i) => [c, i]).filter(([c, i]) => c.g === g && i !== convo.last); if (!opts.length) { convo.next = T + 6; return; }
  const longs = opts.filter(([c]) => c.long), [chat, ci] = (longs.length && Math.random() < 0.7) ? pick(longs) : pick(opts); convo.last = ci; const male = g === 'mf' ? (a.female ? b : a) : a, female = g === 'mf' ? (a.female ? a : b) : b;
  convo.cur = { a: g === 'mf' ? male : a, b: g === 'mf' ? female : b, chat, i: 0, tNext: T + 0.4 };
}
function updateConvo() {
  const T = Tapri.T, c = convo.cur; if (!c) { if (T > convo.next) startConvo(); return; }
  if (c.a.dead || c.b.dead || c.a.state !== 'seated' || c.b.state !== 'seated') { convo.cur = null; convo.next = T + 6; return; }
  if (T < c.tNext) return;
  if (c.i >= c.chat.lines.length) { if (Math.random() < 0.7) { c.a.laughUntil = T + 1.6; c.b.laughUntil = T + 1.4; TA.sfx('laugh', { vol: 0.7, pan: pan((c.a.x + c.b.x) / 2) }); } convo.cur = null; convo.next = T + rnd(12, 26); return; }
  const [s, text, mood] = c.chat.lines[c.i], sp = s === 0 ? c.a : c.b, li = s === 0 ? c.b : c.a, v = D.voiceFor(c.chat.g, s);
  const dur = Tapri.say(sp, v, text, { kind: 'say' }); sp.speaking = true; Tapri.after(dur * 0.8, () => { sp.speaking = false; }); li.lookAt = sp; li.lookUntil = T + dur + 0.6; sp.lookAt = li; sp.lookUntil = T + dur;
  if (Math.random() < 0.4) li.smileUntil = T + dur;
  if (mood === 'laugh') { sp.laughUntil = T + Math.min(dur, 1.8); li.laughUntil = T + 1.4; TA.sfx('laugh', { vol: 0.5, pan: pan((c.a.x + c.b.x) / 2) }); } else if (mood === 'smile') { sp.smileUntil = T + dur; li.smileUntil = T + dur + 0.6; }
  c.i++; c.tNext = T + dur + rnd(0.4, 1.0);
}

/* ---------- arrivals ---------- */
let nextArrive = 3;
function freeSeats() { return L.seats.filter(s => !s.p && !L.seats.some(o => o.p && o.p.state !== 'leave' && false)); }
Tapri.updateCrowd = function (dt) {
  const T = Tapri.T;
  if (T > nextArrive) {
    nextArrive = T + rnd(12, 24); const active = people.filter(p => p.state !== 'leave' && !p.dead).length;
    if (active < 5) {
      const buyerSlots = L.buy.filter(b => !b.p), seatSlots = L.seats.filter(s => !s.p);
      if (Math.random() < 0.3 && buyerSlots.length && people.filter(p => p.kind === 'buyer').length < 1) people.push(new Person('buyer', pick(buyerSlots), false));
      else if (seatSlots.length) { const mates = seatSlots.filter(s => L.seats[s.tab * 2 + (L.seats.indexOf(s) % 2 ? -1 : 1) + 0] ? false : false); const withMate = seatSlots.filter(s => { const o = L.seats[L.seats.indexOf(s) ^ 1]; return o && o.p; }); people.push(new Person('sitter', Math.random() < 0.6 && withMate.length ? pick(withMate) : pick(seatSlots), false)); }
    }
  }
  for (const p of people) p.update(dt);
  for (let i = people.length - 1; i >= 0; i--) if (people[i].dead) { const p = people[i]; if (p.kind === 'sitter' && p.seat.p === p) p.seat.p = null; if (p.kind === 'buyer' && p.spot.p === p) p.spot.p = null; people.splice(i, 1); }
  helper.update(dt); updateConvo();
};
Tapri.resetCrowd = function () { people.length = 0; L.seats.forEach(s => s.p = null); L.buy.forEach(b => b.p = null); seatItems.forEach(s => { s.glass = null; s.plate = null; }); convo.cur = null; convo.next = Tapri.T + 8; W.tray.length = 0; helper.state = 'idle'; helper.x = L.helper.x; helper.gy = STAND + 6; helper.cur = null; helper.carrying = false; helper.dirty.length = 0; helper.actUntil = 0;
  const free = L.seats.slice(); for (let i = 0; i < 3; i++) { const ok = free.filter(s => !s.p); if (!ok.length) break; const withMate = ok.filter(s => { const o = L.seats[L.seats.indexOf(s) ^ 1]; return o && o.p; }); people.push(new Person('sitter', (i === 1 && withMate.length) ? pick(withMate) : pick(ok), true)); } };
Tapri.Person = Person;
})();
