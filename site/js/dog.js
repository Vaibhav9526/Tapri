/* The street dog. He naps by the tables, wanders, sniffs table legs, sometimes pees on one, barks at newcomers,
   gets shooed away by the customers (and yelps), then sneaks back later. */
(() => {
'use strict';
const { L, D, clamp, lerp, rnd, pick } = Tapri;
const LANE_Y = [298, 302, 306], HOME = { x: 190, y: 302 };
const dog = Tapri.dog = { x: HOME.x, y: HOME.y, face: -1, state: 'sleep', t0: 0, next: 18, ph: 0, speed: 0, goal: null, shooed: false, barksLeft: 0, nextBark: 0, cool: 0, returnAt: 0, z: 0, peeLeg: false, puddles: [], blinkUntil: 0, lastBarkAt: -99 };
dog.anchor = () => ({ x: dog.x + (dog.face < 0 ? -10 : 10), y: dog.y - 26 }); dog.headX = () => dog.x; Object.defineProperty(dog, 'gy', { get() { return dog.y; } });
const seatedNear = (x, r) => Tapri.people.find(p => p.kind === 'sitter' && p.state === 'seated' && Math.abs(p.x - x) < r);
const set = (st) => { dog.state = st; dog.t0 = Tapri.T; };
function pickGoal() { // table legs and stools are the interesting places
  const t = pick(L.tables), x = pick([t.x0 + 8, t.x1 - 10, (t.x0 + t.x1) / 2, pick(L.seats).x]); return { x: clamp(x, 30, 450), y: pick(LANE_Y), sniff: true };
}
function startWalk(goal, speed) { dog.goal = goal; dog.speed = speed; set(speed > 60 ? 'run' : 'walk'); }
dog.bark = function (n = 3, towards) {
  if (dog.state === 'gone') return; if (towards !== undefined) dog.face = towards < dog.x ? -1 : 1; set('bark'); dog.barksLeft = n; dog.nextBark = Tapri.T; dog.shooed = false;
};
dog.shoo = function (by) { // someone told him to get lost
  if (dog.state === 'gone' || dog.state === 'run' && dog.fleeing) return; const T = Tapri.T;
  if (by && by.say !== undefined) { /* owner */ } else if (by) { by.shooUntil = T + 1.5; by.waveUntil = 0; by.talkUntil = T + 1.4; Tapri.say(by, by.female ? 'f' : 'm', pick(D.shoo), { kind: 'say' }); }
  Tapri.after(0.8, () => { if (dog.state === 'gone') return; if (!TA.sfx('dog_yelp', { vol: 0.9, pan: clamp(dog.x / 240 - 1, -1, 1) })) TA.sfx('dog_bark', { vol: 0.8, pan: clamp(dog.x / 240 - 1, -1, 1), rate: 1.45 }); dog.face = dog.x < 240 ? -1 : 1; dog.fleeing = true; dog.goal = { x: dog.x < 240 ? -50 : L.W + 50, y: dog.y, exit: true }; dog.speed = 96; set('run'); Tapri.hooks.bubble && Tapri.hooks.bubble(dog, 'कूँ कूँ!', 1300, 'say'); });
};
dog.update = function (dt) {
  const T = Tapri.T, el = T - dog.t0, st = dog.state; dog.ph += dt * (st === 'run' ? 16 : 9);
  if (T > (dog.blinkAt || 0)) { dog.blinkUntil = T + 0.15; dog.blinkAt = T + rnd(2, 6); }
  // reacting to people
  if (st !== 'gone' && T > dog.cool) {
    const newcomer = Tapri.people.find(p => (p.state === 'walkin') && Math.abs(p.x - dog.x) < 110 && p.gy > 290 && !p.dogBarked);
    if (newcomer && (st === 'sleep' || st === 'walk' || st === 'sniff' || st === 'idle') && Math.random() < 0.7) { newcomer.dogBarked = true; dog.cool = T + 14; dog.bark(2 + (Math.random() * 3 | 0), newcomer.x); return; }
  }
  if (st === 'sleep') { if (T > dog.next) { const r = Math.random(); if (r < 0.55) startWalk(pickGoal(), 30); else if (r < 0.8) set('scratch'); else set('wake'); } }
  else if (st === 'scratch') { if (el > 3) { set('sleep'); dog.next = T + rnd(12, 30); } }
  else if (st === 'wake') { if (el > 2.6) { set('sleep'); dog.next = T + rnd(12, 30); } }
  else if (st === 'walk' || st === 'run') {
    const g = dog.goal; if (!g) { set('sleep'); return; } const dx = g.x - dog.x, dy = g.y - dog.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { dog.x = g.x; dog.y = g.y; if (g.exit) { set('gone'); dog.fleeing = false; dog.returnAt = T + rnd(45, 90); } else if (g.home) { set('sleep'); dog.next = T + rnd(14, 30); } else if (g.sniff) { set('sniff'); dog.shooed = false; } else set('sleep'); }
    else { const step = Math.min(d, dog.speed * dt); dog.x += dx / d * step; dog.y += dy / d * step; if (Math.abs(dx) > 1) dog.face = dx < 0 ? -1 : 1; }
  }
  else if (st === 'sniff') {
    const near = seatedNear(dog.x, 40);
    if (near && el > 1.1 && !dog.shooed && Math.random() < dt * 0.9) { dog.shooed = true; dog.shoo(near); return; }
    if (el > 2.6) { const r = Math.random(); if (r < 0.5) { set('pee'); dog.peeDone = false; } else if (r < 0.8) startWalk(pickGoal(), 30); else startWalk({ x: HOME.x, y: HOME.y, home: true }, 32); }
  }
  else if (st === 'pee') {
    if (el > 0.7 && !dog.peeDone) { dog.peeDone = true; dog.puddles.push({ x: dog.x + (dog.face < 0 ? 12 : -12), y: dog.y + 1, t0: T }); if (!TA.sfx('trickle', { vol: 0.5, pan: clamp(dog.x / 240 - 1, -1, 1) })) TA.sfx('chai_pour', { vol: 0.28, pan: clamp(dog.x / 240 - 1, -1, 1), rate: 0.7 }); const p = seatedNear(dog.x, 46); if (p && Math.random() < 0.85) { Tapri.after(1.6, () => { if (!p.dead && p.state === 'seated') { Tapri.say(p, p.female ? 'f' : 'm', pick(D.pee), { kind: 'say' }); dog.shoo(p); } }); } }
    if (el > 3.1) { startWalk(pickGoal(), 32); }
  }
  else if (st === 'bark') {
    if (dog.barksLeft > 0 && T >= dog.nextBark) { dog.barksLeft--; dog.nextBark = T + 0.55; dog.lastBarkAt = T; TA.sfx('dog_bark', { vol: 0.9, pan: clamp(dog.x / 240 - 1, -1, 1) }); const near = Tapri.people.filter(p => p.state === 'seated' && Math.abs(p.x - dog.x) < 160); near.forEach(p => { p.lookAt = dog; p.lookUntil = T + 2; if (Math.random() < 0.25) p.smileUntil = T + 1.6; }); }
    if (dog.barksLeft <= 0 && T > dog.nextBark + 0.4) { dog.barksLeft = 0; set('sleep'); dog.next = T + rnd(6, 16); }
  }
  else if (st === 'gone') { if (T > dog.returnAt) { const left = Math.random() < 0.5; dog.x = left ? -30 : L.W + 30; dog.y = pick(LANE_Y); dog.face = left ? 1 : -1; startWalk({ x: HOME.x, y: HOME.y, home: true }, 34); } }
  dog.puddles = dog.puddles.filter(p => T - p.t0 < 50);
};
dog.hit = function (x, y) { return dog.state !== 'gone' && Math.abs(dog.x - x) < 22 && y > dog.y - 24 && y < dog.y + 4; };
dog.reset = function () { dog.x = HOME.x; dog.y = HOME.y; dog.face = -1; dog.state = 'sleep'; dog.t0 = Tapri.T; dog.next = Tapri.T + rnd(8, 18); dog.puddles.length = 0; dog.fleeing = false; dog.goal = null; };
})();
