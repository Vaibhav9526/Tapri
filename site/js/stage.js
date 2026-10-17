/* STAGE — everything on screen that is not a person: the radio, wall clock, counter props (kettle, kadhai, glasses, snacks, incense, flames),
   particles (steam, smoke, rain, leaves, birds, flies, moths), table items, the helper's tub, sparrows, foliage sway, the street dog's art and puddles,
   and the owner's costume and held tools. This file is owned by the art session. The gameplay code owns the *state* these read
   (Tapri.W, Tapri.parts, Tapri.radio, Tapri.sparrows, Tapri.dog, Tapri.owner...) and calls them every frame; positions are in "sim units"
   (Art.L, 480x320). If the renderer runs at a higher resolution, scale by Art.K here. */
(() => {
'use strict';
// themes may redraw stage pieces: actors.stage = { caseTrays, pakoda, kachori, flames, kadhai, fryItems, oilBubbles, tub, sparrows, puddles, dog } — each gets (ctx in render px, data)
// an environment can override too (env.stage wins over the theme), e.g. a painted stall that already shows its own snacks
const SH = name => (Art.env && Art.env.stage && Art.env.stage[name]) || (Sprites.hooks.stage && Sprites.hooks.stage[name]);
const { L, clamp, W } = Tapri, S = Tapri.stage = {}, dog = Tapri.dog, owner = Tapri.owner, K = Art.K || 1, Z = K / 2;
const setup = c => { Art.setCtx(c); return Art.api; };
S.drawRadio = function(c) {
  const a = setup(c), { P, E } = a, R = Tapri.radio, t = Tapri.T, x = (R.x - 13) * K, y = (R.y - 14) * K, pl = TA.isPlaying();
  TapriEnv.texture(a, x, y, 52 * Z, 28 * Z, '#8b674b', 801, .13); P(x + Z, y + Z, 50 * Z, Z, '#bb9770'); P(x + Z, y + 25 * Z, 50 * Z, 3 * Z, '#574a3c');
  P(x + 4 * Z, y + 4 * Z, 20 * Z, 19 * Z, '#3e4035'); for (let i = 0; i < 7; i++) { P(x + 5 * Z, y + (5 + i * 2) * Z, 18 * Z, Z, '#77694c'); for (let j = 0; j < 5; j++) P(x + (6 + j * 4) * Z, y + (5 + i * 2) * Z, Z, Z, '#343c32'); }
  P(x + 28 * Z, y + 4 * Z, 19 * Z, 9 * Z, '#b8ad7a'); P(x + 30 * Z, y + 6 * Z, 15 * Z, Z, '#696e53'); for (let i = 0; i < 6; i++) P(x + (30 + i * 3) * Z, y + 9 * Z, Z, 2 * Z, '#646b51'); P(x + (30 + Math.round((TA.dialPos || .3) * 14)) * Z, y + 5 * Z, Z, 6 * Z, '#b35d42');
  for (const xx of [32, 43]) { TapriEnv.oval(a, x + xx * Z, y + 20 * Z, 4 * Z, 4 * Z, '#b7aa80'); P(x + xx * Z, y + 17 * Z, Z, 4 * Z, '#5f6250'); }
  a.line(x + 45 * Z, y, x + (52 + Math.sin(t) * .4) * Z, y - 30 * Z, '#a6b6ae');
  if (Tapri.radioOn()) E(x + 48 * Z, y + 2 * Z, Z, Z, '#e4a568');
  if (R.hover) { c.strokeStyle = 'rgba(233,207,151,.8)'; c.lineWidth = Z; c.strokeRect(x - 2 * Z, y - 2 * Z, 56 * Z, 32 * Z); }
  if (Tapri.radioOn() && pl && t > R.nextNote) { R.nextNote = t + 1.5; Tapri.hooks.bubble?.({ x: R.x, anchor: () => ({ x: R.x, y: R.y - 21 }) }, '♪', 2200, 'note'); }
};
S.drawClock = function(c) { const a = setup(c), d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = d.getHours() % 12 + m / 60, x = 318 * K, y = 108 * K; for (const [len, an] of [[5 * K, h / 12 * 6.28], [7 * K, m / 60 * 6.28]]) TapriEnv.stroke(a, [[x, y], [x + Math.sin(an) * len, y - Math.cos(an) * len]], Z, '#3e514f'); a.P(x - Z, y - Z, 2 * Z, 2 * Z, '#826a4b'); };
S.drawFoliage = function(c, layers, t) { const wind = .55 + .45 * Math.sin(t * .23) + .25 * Math.sin(t * .9); for (const f of layers.foliage) c.drawImage(f.c, Math.round(f.x + Math.sin(t * f.sp + f.ph) * f.amp * wind), Math.round(f.y + Math.sin(t * f.sp * 1.3 + f.ph * 2) * f.amp * .45 * wind)); };
S.drawTub = function(c) { if (SH('tub')) return SH('tub')(c, { t: Tapri.T, x: L.helper.tubX, y: 284 }); const a = setup(c), x = L.helper.tubX * K, y = 284 * K; TapriEnv.poly(a, [[x - 19 * Z, y - 19 * Z], [x + 19 * Z, y - 19 * Z], [x + 15 * Z, y + 8 * Z], [x - 15 * Z, y + 8 * Z]], '#456f81'); a.P(x - 14 * Z, y - 14 * Z, 3 * Z, 19 * Z, '#749696'); a.P(x + 12 * Z, y - 14 * Z, 3 * Z, 20 * Z, '#304e60'); TapriEnv.oval(a, x, y - 19 * Z, 20 * Z, 5 * Z, '#a4b6ab'); TapriEnv.oval(a, x, y - 19 * Z, 16 * Z, 3 * Z, '#7b9e9d'); for (let i = 0; i < 5; i++) { const xx = x + (i * 6 - 12) * Z; a.E(xx, y - (19 + i % 2) * Z, 3 * Z, Z, '#bac8b3'); } };
S.drawTableItems = function(c) { const t = Tapri.T; Sprites.setG(c, { x: 0, y: 0 }); L.seats.forEach((seat, i) => { const p = seat.p, it = Tapri.seatItems[i], sipping = p?.act === 'sip' && t - p.actT0 > .5 && t - p.actT0 < 2.55, eating = p?.act === 'eat' && t - p.actT0 > .5 && t - p.actT0 < 3.1; if (p?.state === 'seated' && p.glass > 0 && !sipping) Sprites.props.glass((seat.x + 14) * K, 264 * K, p.glass); else if (it.glass && !(p?.glass > 0)) Sprites.props.glass((seat.x + 14) * K, 264 * K, 0); if (p?.plate > 0 && !eating) Sprites.props.plate((seat.x - 14) * K, 263 * K, p.plate); else if (it.plate && !(p?.plate > 0)) Sprites.props.plate((seat.x - 14) * K, 263 * K, 0); }); };
Tapri.drawCounterProps = function(c) {
  const a = setup(c), { P, E } = a, { oval, poly } = TapriEnv, t = Tapri.T; Sprites.setG(c, { x: 0, y: 0 });
  // snacks in the display cases: pakoda, kachori, samosa stock
  if (SH('caseTrays')) SH('caseTrays')(c, { t, W }); else { for (const [x, w] of [[226, 128], [362, 128], [498, 100]]) { oval(a, (x + w / 2) * Z, 402 * Z, w / 2 * Z, 3 * Z, '#8e9f99'); P(x * Z, 400 * Z, w * Z, Z, '#bdc4ae'); } }
  if (SH('pakoda')) SH('pakoda')(c, { t, W, n: W.stock.pakoda }); else { for (let i = 0; i < W.stock.pakoda; i++) { const x = (236 + i % 5 * 19 + (i > 4 ? 7 : 0)) * Z, y = (395 - Math.floor(i / 5) * 10 - i % 2 * 2) * Z, r = Art.rng(91 + i); oval(a, x + 7 * Z, y, 9 * Z, 5 * Z, '#b17d3f'); for (let j = 0; j < 11; j++) P(x + r() * 15 * Z, y - 4 * Z + r() * 8 * Z, 2 * Z, Z, j % 3 ? '#c79e57' : '#8e6938'); } }
  if (SH('kachori')) SH('kachori')(c, { t, W, n: W.stock.kachori }); else { for (let i = 0; i < W.stock.kachori; i++) { const x = (377 + i % 4 * 27 + (i > 3 ? 9 : 0)) * Z, y = (392 - Math.floor(i / 4) * 12) * Z; oval(a, x, y, 11 * Z, 7 * Z, '#bd9456'); oval(a, x - 2 * Z, y - 2 * Z, 7 * Z, 4 * Z, '#cfae6b'); for (let j = 0; j < 5; j++) P(x + (j * 3 - 6) * Z, y + (j % 2) * Z, Z, Z, '#a07844'); } }
  if (SH('samosaStock')) SH('samosaStock')(c, { t, W, n: W.stock.samosa }); else { for (let i = 0; i < W.stock.samosa; i++) { const x = (511 + i % 4 * 22 + (i > 3 ? 8 : 0)) * Z, y = (399 - Math.floor(i / 4) * 15) * Z; Sprites.props.samosa(x, y, 0); } }
  // stove flames
  if (SH('flames')) SH('flames')(c, { t, W }); else { for (const x of [612, 669]) for (let i = 0; i < 7; i++) { const h = 2 + Math.round((1 + Math.sin(t * 20 + i)) * 2); E((x + i * 3) * Z, (393 - h) * Z, Z, h * Z, i % 2 ? '#719cbb' : '#3f72a1'); } }
  // kettle on the left burner
  if (!W.kettle.held) Sprites.props.kettle(312 * K, 185 * K, 0);
  // kadhai with oil + samosas on the right burner
  if (SH('kadhai')) SH('kadhai')(c, { t, W, on: W.fry.on }); else { oval(a, 676 * Z, 385 * Z, 28 * Z, 10 * Z, '#344448'); oval(a, 676 * Z, 379 * Z, 29 * Z, 7 * Z, '#5c6964'); oval(a, 676 * Z, 379 * Z, 25 * Z, 5 * Z, W.fry.on ? '#b58a43' : '#806b3e'); P(647 * Z, 377 * Z, 9 * Z, 2 * Z, '#a1ada0'); P(698 * Z, 377 * Z, 9 * Z, 2 * Z, '#a1ada0'); }
  if (SH('fryItems')) SH('fryItems')(c, { t, W, items: W.fry.items }); else { if (W.fry.on) for (const it of W.fry.items) { const x = (662 + it.i * 12 + Math.sin(t * 2 + it.i) * 2) * Z, y = (376 + Math.sin(t * 3 + it.i)) * Z; poly(a, [[x - 4 * Z, y], [x + Z, y - 9 * Z], [x + 7 * Z, y + Z]], t - it.t0 < 3 ? '#c3a163' : '#b3894c'); } }
  if (SH('oilBubbles')) SH('oilBubbles')(c, { t, W, bubbles: Tapri.parts.bubbles }); else { for (const b of Tapri.parts.bubbles) E(b.x * K, b.y * K, Z, Z, '#d6bd83'); }
  if (!W.jhara.held) Sprites.props.jhara(345 * K, 190 * K, 358 * K, 177 * K);
  // glasses on the counter (pour spots) + tray for ready glasses
  for (const g of W.glasses) if (g.show) Sprites.props.glass(g.x * K, 207 * K, g.pour ? clamp((t - g.t0) / 1.6, 0, 1) : g.lvl);
  Sprites.props.tray(384 * K, 206 * K); for (const g of W.tray) Sprites.props.glass((378 + g.slot * 7) * K, 205 * K, 1);
  if (W.plateDrain.show) Sprites.props.plate(319 * K, 206 * K, W.plateDrain.n);
  // incense stick + holder
  if (t < W.incense.until + 30) { a.line((W.incense.x + 1) * K, W.incense.y * K, (W.incense.x + 4) * K, (W.incense.y - 12) * K, '#a28e63'); if (t < W.incense.until) E((W.incense.x + 4) * K, (W.incense.y - 12) * K, Z, Z, '#ce9254'); }
  // soundbox light blink when it has just spoken
  E(383 * K, 203 * K, 8 * K, Z, t < (Tapri.soundboxUntil || 0) ? (t % .3 < .15 ? '#a4bd86' : '#648d75') : '#5c8790');
  // smoke / steam are drawn by the particle pass
};
Tapri.drawParticles = function(c) {
  const a = setup(c), p = Tapri.parts, t = Tapri.T;
  for (const s of p.steam) { c.fillStyle = `rgba(222,219,194,${Math.max(0, s.a * .28)})`; c.fillRect(Math.round(s.x * K), Math.round(s.y * K), 2 * Z, 2 * Z); c.fillRect(Math.round(s.x * K + 2 * Z), Math.round(s.y * K - Z), 2 * Z, Z); }
  for (const s of p.smoke) { const x = (s.x + Math.sin(s.t * 1.6 + s.ph) * (1 + s.t)) * K; c.fillStyle = `rgba(177,188,183,${Math.max(0, s.a * .24)})`; c.fillRect(Math.round(x), Math.round(s.y * K), (2 + Math.floor(s.t)) * Z, Z); }
  for (const l of p.leaves) { a.P(l.x * K, l.y * K, 3 * Z, Z, l.c); a.P(l.x * K + Z, l.y * K - Z, 2 * Z, Z, l.c); }
  for (const b of p.birds) { const x = b.x * K, y = b.y * K, up = Math.sin(b.ph) > 0; a.line(x, y + (up ? -2 : 2) * Z, x + 4 * Z, y, '#455b5d'); a.line(x + 4 * Z, y, x + 8 * Z, y + (up ? -2 : 2) * Z, '#455b5d'); }
  for (const f of Tapri.flies.list) a.P(f.x * K, f.y * K, Z, Z, '#38423b');
  for (const m of p.moths) { const an = m.a + t * m.sp, x = (m.cx + Math.cos(an) * m.r) * K, y = (m.cy + Math.sin(an * 1.3) * m.r * .6) * K; a.E(x, y, Math.sin(t * 9 + m.a) > 0 ? 2 * Z : Z, Z, 'rgba(223,207,154,.6)'); }
};
Tapri.drawRain = function(c) { const p = Tapri.parts; c.fillStyle = 'rgba(153,181,197,.34)'; for (const r of p.rain) c.fillRect(Math.round(r.x * K), Math.round(r.y * K), Z, Math.round(r.l * K)); c.fillStyle = 'rgba(175,199,200,.38)'; for (const r of p.ripples) { const w = (2 + Math.round(r.t * 10)) * K; c.fillRect(Math.round(r.x * K - w / 2), Math.round(r.y * K), w, Z); } };
S.drawSparrows = function(c) { if (SH('sparrows')) return SH('sparrows')(c, { t: Tapri.T, list: Tapri.sparrows }); const a = setup(c); for (const s of Tapri.sparrows) { const x = s.x * K, y = s.y * K, d = s.dir, hop = s.mode === 'hop' ? -Math.abs(Math.sin(Tapri.T * 20) * 3) * Z : 0; TapriEnv.oval(a, x, y - 5 * Z + hop, 6 * Z, 3 * Z, '#827854'); TapriEnv.oval(a, x + d * 5 * Z, y - 9 * Z + hop, 3 * Z, 3 * Z, '#7e7052'); a.P(x + d * 7 * Z, y - 8 * Z + hop, 2 * Z, Z, '#bfaa76'); a.P(x + d * 5 * Z, y - 10 * Z + hop, Z, Z, '#35463f'); a.line(x - d * 4 * Z, y - 5 * Z + hop, x - d * 11 * Z, y - 4 * Z + hop, '#4b5d4e'); if (s.mode === 'fly') a.line(x, y - 5 * Z, x + 3 * Z, y - (Math.sin(s.fly) > 0 ? 12 : 1) * Z, '#535f4d'); } };
dog.drawPuddles = function(c) { if (SH('puddles')) return SH('puddles')(c, { t: Tapri.T, list: dog.puddles }); const a = setup(c); for (const p of dog.puddles) { const age = Tapri.T - p.t0, grow = Math.min(1, age / 2.2), fade = age > 34 ? Math.max(0, 1 - (age - 34) / 16) : 1; c.globalAlpha = .35 * fade; TapriEnv.oval(a, p.x * K, p.y * K, 13 * grow * Z, 3 * Z, '#555e50'); c.globalAlpha = 1; } };
dog.draw = function(c, light) { if (SH('dog')) return SH('dog')(c, { t: Tapri.T, light, dog, ox: Sprites.ORIGX, oy: Sprites.ORIGY });
  if (dog.state === 'gone') return; Sprites.begin(c, light); const t = Tapri.T, st = dog.state, el = t - dog.t0, f = dog.face, z = Z, fur = '#aa8a5d', dk = '#796b4e', hi = '#c5ad7c', belly = '#c8bea0';
  const p = (x, y, w, h, col) => Sprites.px((f > 0 ? -x - w : x) * z, y * z, w * z, h * z, col), ov = (x, y, rx, ry, col) => Sprites.oval(-f * x * z, y * z, rx * z, ry * z, col), ln = (x0, y0, x1, y1, w, col) => Sprites.limb(-f * x0 * z, y0 * z, -f * x1 * z, y1 * z, w * z, col);
  const lying = ['sleep', 'scratch', 'wake'].includes(st), moving = st === 'walk' || st === 'run', run = st === 'run', bob = moving ? Math.abs(Math.cos(dog.ph)) * (run ? 2.5 : 1.2) : 0;
  if (lying) { // curled up on the ground
    ov(0, -12, 25, 11, fur); ov(8, -10, 13, 9, dk); ov(-9, -7, 15, 5, belly); ln(10, -4, -9, -3, 5, fur); ov(-27, -9, 10, 7, hi); ln(-29, -6, -40, -4, 6, hi); p(-44, -6, 4, 3, '#33403b'); p(-30, -13, 6, 1, '#4b503d'); ov(-21, -13, 4, 7, dk); ln(18, -8, 30, -4, 4, fur); if (st === 'scratch') ln(13, -4, 3 + Math.sin(el * 25) * 5, -18, 4, fur); if (st === 'sleep' && Math.sin(t * .8) > .5 && !dog.z) { dog.z = t; Tapri.hooks.bubble?.(dog, 'z z Z', 2400, 'note'); } if (dog.z && t - dog.z > 6) dog.z = 0; return;
  }
  // standing dog (walk / run / sniff / pee / bark)
  const hipY = -22 - bob, legs = [[-23, 0], [-17, Math.PI], [17, Math.PI * .5], [24, Math.PI * 1.5]]; // front pair, hind pair
  legs.forEach(([x, ph], i) => { if (st === 'pee' && i === 3) return; const sw = moving ? Math.sin(dog.ph + ph) * (run ? 10 : 6) : 0, lift = moving ? Math.max(0, Math.cos(dog.ph + ph)) * (run ? 7 : 4) : 0; ln(x, hipY + 3, x + sw, -lift - 2, 5, i % 2 ? dk : fur); p(x + sw - 3, -lift - 3, 8, 3, dk); });
  ov(0, hipY - 2, 28, 12, fur); ov(-13, hipY - 4, 14, 12, hi); ln(-6, hipY + 7, 16, hipY + 6, 4, belly); const ta = .7 + Math.sin(t * (moving ? 10 : 4)) * .5; ln(24, hipY - 5, 27 + Math.cos(ta) * 13, hipY - 10 - Math.sin(ta) * 14, 4, fur); ln(27 + Math.cos(ta) * 13, hipY - 10 - Math.sin(ta) * 14, 27 + Math.cos(ta) * 13 - 5, hipY - 16 - Math.sin(ta) * 14, 3, belly);
  const hcx = -33, hcy = hipY - 12 + (st === 'sniff' ? 11 + Math.sin(t * 7) : st === 'bark' ? -4 : 0); // head
  ln(-19, hipY - 3, hcx + 5, hcy + 4, 9, hi); ov(hcx, hcy, 10, 9, hi); ln(hcx - 5, hcy + 4, hcx - 17, hcy + 5, 6, hi); p(hcx - 22, hcy + 3, 5, 4, '#35413b'); ov(hcx + 6, hcy - 1, 4, 9, dk); p(hcx - 7, hcy - 3, 3, 2, '#37453b'); if (t < dog.blinkUntil) p(hcx - 7, hcy - 2, 3, 1, dk); else p(hcx - 7, hcy - 3, 1, 1, '#d5ccb0');
  if (st === 'bark' && t - dog.lastBarkAt < .18) { p(hcx - 18, hcy + 7, 9, 4, '#544b38'); p(hcx - 15, hcy + 9, 5, 2, '#ac7a68'); }
  if (st === 'pee') { ln(15, hipY + 1, 30, hipY - 8, 5, fur); p(28, hipY - 10, 6, 3, dk); if (el > .6 && el < 2.9) for (let i = 0; i < 18; i += 4) p(33 + (i > 8 ? 2 : 0), hipY - 4 + i, 1, 2, '#b3a16a'); }
};
S.ownerExtra = function(cx, top, rows) {
  const px = Sprites.px, sh = Sprites.shape, z = Z, bottom = top + rows;
  sh([[cx - 17 * z, top + 18 * z], [cx + 17 * z, top + 18 * z], [cx + 16 * z, bottom], [cx - 18 * z, bottom]], '#c5b99b'); px(cx - 15 * z, top + 19 * z, 2 * z, rows - 20 * z, '#d8c9a5'); px(cx + 10 * z, top + 19 * z, 6 * z, rows - 20 * z, '#a49c81'); px(cx - 9 * z, top + 38 * z, 18 * z, 13 * z, '#b6ad90'); px(cx - 9 * z, top + 38 * z, 18 * z, z, '#e0ceaa'); // apron
  sh([[cx - 25 * z, top - 3 * z], [cx - 14 * z, top - 4 * z], [cx - 12 * z, top + 31 * z], [cx - 22 * z, top + 33 * z]], '#a36e55'); for (let j = 0; j < 8; j++) px(cx - 23 * z, top + j * 4 * z, 9 * z, z, '#c9a277'); px(cx - 20 * z, top, z, 31 * z, '#7c5a48'); // gamchha on the shoulder
};
S.drawHeld = function(h, hand, side, pose, t) {
  if (!h) return; const p = Sprites.props, x = hand.hx, y = hand.hy;
  if (h === 'kettle') return p.kettle(x, y, pose.tilt || 0);
  if (h === 'strainer') return p.strainer(x, y + Z);
  if (h === 'glass') return p.glass(x, y + 7 * Z, 1);
  if (h === 'jhara') return p.jhara(x - 10 * Z, y + 16 * Z, x + 14 * Z, y - 16 * Z);
  if (h.startsWith('plate')) return p.plate(x, y + 6 * Z, h === 'plate0' ? Math.max(0, owner.runner?.ctx.plateN || 0) : 3, h === 'plate_raw' ? '#c7b16e' : '#bd9756');
  if (h === 'cloth') return p.cloth(x, y + Z);
  if (h === 'agar') return p.agarbatti(x, y, x + 6 * Z, y - 26 * Z, owner.runner?.i >= 5);
  if (h === 'match') return p.match(x, y - 6 * Z, t < W.match.until, t);
  if (h === 'chips' || h === 'biscuit') return p.chips(x, y + 8 * Z, false, h === 'chips' ? '#b59146' : '#6a8792');
  if (h === 'bottle') return p.bottle(x, y + 10 * Z);
  if (h === 'cash') return p.cash(x, y + 2 * Z);
  if (h === 'phone') return p.phone(x, y - 4 * Z, t);
  if (h === 'cups') { p.glass(x, y + 8 * Z, 1); p.glass(x + 12 * Z, y + 8 * Z, 1); }
};
/* Held props: where a cup, phone, plate... sits relative to the hand the rig returned (info.* are in render px). kind = 'glass' | 'samosa' | 'phone' | 'phone2' | 'phoneEar' | 'paper' | 'note' | 'wipe' | 'hold:chips|biscuit|cola|samosa|cups' */
S.heldProp = function(kind, info, o = {}) {
  const p = Sprites.props, r = info.handR || info.hand, l = info.handL || info.lhand, x = Math.round(r.hx), y = Math.round(r.hy), t = o.T || Tapri.T;
  if (kind === 'glass') return p.glass(x, y + 6 * Z, o.glass);
  if (kind === 'samosa') return p.samosa(x - 4 * Z, y + 2 * Z, o.bites);
  if (kind === 'phone') return p.phone(x, y - 4 * Z, t);
  if (kind === 'phone2') return p.phone(Math.round((l.hx + r.hx) / 2), y - 6 * Z, t);
  if (kind === 'phoneEar') return p.phoneEar(x, y - 2 * Z);
  if (kind === 'paper') { const yy = info.shY + 2 * Z; p.paper(0, yy, 56 * Z, 44 * Z, t); Sprites.px(-32 * Z, yy + 26 * Z, 7 * Z, 7 * Z, o.skin); Sprites.px(24 * Z, yy + 26 * Z, 7 * Z, 7 * Z, o.skin); return; }
  if (kind === 'note') return p.cash(x, y);
  if (kind === 'wipe') return p.cloth(x, y);
  if (kind === 'hold:chips' || kind === 'hold:biscuit') return p.chips(x, y + 8 * Z, o.open, kind.endsWith('chips') ? '#b59146' : '#6a8792');
  if (kind === 'hold:cola') return p.bottle(x, y + 10 * Z);
  if (kind === 'hold:samosa') return p.plate(l.hx, l.hy + 6 * Z, 2);
  if (kind === 'hold:cups') return p.glass(x, y + 8 * Z, 1);
};
/* The helper's tray of glasses (and the glass he is handing over). h = helper state, d = facing direction. */
S.helperTray = function(info, h, d) { const p = Sprites.props, x = info.sx0 + d * 16 * Z, y = info.shY + 44 * Z; p.tray(x, y); const count = Math.min(3, (h.queue?.length || 0) + (h.gave ? 0 : 1)); for (let i = 0; i < count; i++) p.glass(x - 12 * Z + i * 12 * Z, y, 1); if (h.give > .3 && !h.gave) p.glass(info.hand.hx, info.hand.hy + 6 * Z, 1); };
})();
