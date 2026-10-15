/* Shared state, helpers, particles and the counter props (kettle, kadhai, glasses, incense, snacks) for the live shop. */
(() => {
'use strict';
const L = Art.L, D = window.TAPRI_DIALOGUES;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const Tapri = window.Tapri = { L, D, clamp, lerp, rnd, pick, ease, T: 0, ctx: null, sceneName: 'day', hooks: {} };
const W = Tapri.W = {
  kettle: { held: false }, jhara: { held: false }, strainer: { held: false },
  glasses: [{ x: 360, lvl: 0, show: false, pour: false, t0: 0 }, { x: 369, lvl: 0, show: false, pour: false, t0: 0 }],
  tray: [],                       // glasses waiting on the tray at the end of the counter: {lvl, for: customer|null}
  fry: { on: false, items: [], t0: 0 },
  stock: { samosa: 4, pakoda: 9, kachori: 7 },
  incense: { until: 0, x: 241, y: 153 }, match: { until: 0 },
  plateDrain: { n: 0, show: false },
  tub: { wash: 0 }, paper: { show: false }
};

/* ---------- speech: one place that shows the bubble and plays the matching ElevenLabs line ---------- */
// timers that run on simulation time (so fast-forward and tab-throttling can never desync the story)
Tapri.timers = [];
Tapri.after = (sec, fn) => { Tapri.timers.push({ t: Tapri.T + sec, fn }); };
Tapri.runTimers = () => { const due = Tapri.timers.filter(x => x.t <= Tapri.T); if (!due.length) return; Tapri.timers = Tapri.timers.filter(x => x.t > Tapri.T); due.sort((a, b) => a.t - b.t).forEach(x => x.fn()); };
Tapri.say = (ent, voice, text, o = {}) => { // ent = object with .headX(), .headY()  (or a plain {x,y})
  const x = ent.headX ? ent.headX() : ent.x; let dur = 0.07 * text.length + 1.4;
  TA.say(voice, text, x, L.W).then(d => { if (d) { ent.talkUntil = Math.max(ent.talkUntil || 0, Tapri.T + d); } });
  if (Tapri.hooks.bubble) Tapri.hooks.bubble(ent, text, o.ms || dur * 1000, o.kind || 'say');
  ent.talkUntil = Math.max(ent.talkUntil || 0, Tapri.T + Math.min(dur, 3.4));
  return dur;
};
Tapri.lineDur = (voice, text) => 0.07 * text.length + 1.4;

/* ---------- particles ---------- */
const parts = Tapri.parts = { steam: [], smoke: [], leaves: [], birds: [], flies: [], fire: [], rain: [], ripples: [], moths: [], sparrows: [], bubbles: [] };
Tapri.steam = (x, y, n = 1) => { for (let i = 0; i < n; i++) if (parts.steam.length < 80) parts.steam.push({ x: x + rnd(-1.5, 1.5), y, vx: rnd(-2, 2), vy: rnd(-9, -6), a: 0.55, ph: rnd(0, 6) }); };
Tapri.smoke = (x, y) => { if (parts.smoke.length < 160) parts.smoke.push({ x, y, vy: rnd(-7, -5), a: 0.55, ph: rnd(0, 6), t: 0 }); };

// houseflies: hang around the snacks, scatter when shooed
Tapri.flies = { n: 4, list: [], scatterUntil: 0 };
Tapri.scatterFlies = () => { Tapri.flies.scatterUntil = Tapri.T + 2.6; for (const f of Tapri.flies.list) { f.vx = rnd(-120, 120); f.vy = rnd(-100, -30); } TA.sfx('fly', { vol: 0.8, pan: (L.flyHome.x / L.W) * 2 - 1 }); };
Tapri.fliesNear = () => Tapri.flies.list.filter(f => Math.hypot(f.x - L.flyHome.x, f.y - L.flyHome.y) < 50).length;

Tapri.updateFX = (dt, scene, rain) => {
  const T = Tapri.T, S = Tapri.scene || {};
  // flies
  const fl = Tapri.flies.list; while (fl.length < Tapri.flies.n) fl.push({ x: L.flyHome.x + rnd(-40, 40), y: L.flyHome.y + rnd(-14, 10), vx: rnd(-20, 20), vy: rnd(-20, 20) });
  const away = T < Tapri.flies.scatterUntil;
  for (const f of fl) { f.vx += rnd(-260, 260) * dt; f.vy += rnd(-260, 260) * dt; if (!away) { f.vx += (L.flyHome.x - f.x) * 1.1 * dt; f.vy += (L.flyHome.y - f.y) * 1.6 * dt; } const sp = Math.hypot(f.vx, f.vy), mx = away ? 140 : 52; if (sp > mx) { f.vx *= mx / sp; f.vy *= mx / sp; } f.x += f.vx * dt; f.y += f.vy * dt; }
  if (Math.random() < dt * 0.04 && !away) TA.sfx('fly', { vol: 0.5, pan: (L.flyHome.x / L.W) * 2 - 1 });
  // leaves (day) & birds
  if ((scene === 'day' || scene === 'morning' || scene === 'dusk') && Math.random() < dt * 0.5) parts.leaves.push({ x: rnd(0, 150), y: rnd(30, 70), vy: rnd(5, 9), ph: rnd(0, 6), c: pick(['#d9a02a', '#b8741f', '#8fa83a']) });
  if ((scene === 'day' || scene === 'morning') && Math.random() < dt * 0.07 && parts.birds.length < 3) { const d = Math.random() < 0.5 ? 1 : -1; parts.birds.push({ x: d > 0 ? -10 : L.W + 10, y: rnd(14, 70), vx: d * rnd(30, 52), ph: 0 }); if (Math.random() < 0.7) TA.sfx('sparrow', { vol: 0.7, pan: -d * 0.5 }); }
  if (scene === 'dusk' || scene === 'night') { while (parts.moths.length < 7) { const l = pick(L.lamps.slice(0, 4)); parts.moths.push({ cx: l.x, cy: l.y, r: rnd(5, 16), a: rnd(0, 6), sp: rnd(2, 5), life: rnd(8, 18) }); } }
  const want = Math.round(rain * 90); while (parts.rain.length < want) parts.rain.push({ x: rnd(0, L.W + 60), y: rnd(-L.H, 0), v: rnd(210, 290), l: rnd(2, 4) }); if (parts.rain.length > want) parts.rain.length = want;
  for (const r of parts.rain) { r.x -= r.v * 0.17 * dt; r.y += r.v * dt; if (r.y > rnd(262, 316)) { if (parts.ripples.length < 30 && r.y < 318 && r.y > 262) parts.ripples.push({ x: r.x, y: r.y, t: 0 }); r.y = rnd(-40, -4); r.x = rnd(0, L.W + 60); } }
  parts.ripples = parts.ripples.filter(r => (r.t += dt) < 0.5);
  parts.steam = parts.steam.filter(s => { s.y += s.vy * dt; s.x += Math.sin(T * 2 + s.ph) * 3 * dt + s.vx * dt * 0.4; s.a -= dt * 0.38; return s.a > 0; });
  parts.smoke = parts.smoke.filter(s => { s.t += dt; s.y += s.vy * dt; s.a -= dt * 0.1; return s.a > 0 && s.y > 100; });
  parts.leaves = parts.leaves.filter(l => { l.y += l.vy * dt; l.x += Math.sin(T * 1.5 + l.ph) * 8 * dt + 3 * dt; return l.y < 300; });
  parts.birds = parts.birds.filter(b => { b.x += b.vx * dt; b.ph += dt * 9; return b.x > -20 && b.x < L.W + 20; });
  parts.moths = parts.moths.filter(m => (m.life -= dt) > 0);
  parts.bubbles = parts.bubbles.filter(b => (b.t += dt) < b.life);
  if (W.fry.autoEnd && T > W.fry.autoEnd) { W.fry.autoEnd = 0; W.fry.items = []; W.fry.on = false; W.stock.samosa = Math.min(8, W.stock.samosa + 3); W.plateDrain.show = false; TA.setLoop('samosa_fry', false); if (Tapri.owner) Tapri.owner.lastFry = T; }
  // incense smoke
  if (T < W.incense.until && Math.random() < dt * 14) Tapri.smoke(W.incense.x + 2 + Math.sin(T * 3) * 0.6, W.incense.y - 4);
  // kadhai
  if (W.fry.on) { if (Math.random() < dt * 20) parts.bubbles.push({ x: 331 + Math.random() * 14, y: 192 + Math.random() * 2, t: 0, life: rnd(0.2, 0.5) }); if (Math.random() < dt * 5) Tapri.steam(338 + rnd(-8, 8), 188); }
  if (!W.kettle.held && Math.random() < dt * 3.2) Tapri.steam(312 + 6, 182);
  for (const g of W.glasses) if (g.show && g.lvl > 0.1 && Math.random() < dt * 2.5) Tapri.steam(g.x, 198);
  for (const t of W.tray) if (Math.random() < dt * 2) Tapri.steam(378 + t.slot * 7, 197);
};

/* ---------- counter props (drawn after the counter, before customers) ---------- */
})();
