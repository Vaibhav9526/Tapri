/* ENV: Railway station — the stall stands on the platform of a small junction. Every little while a long train thunders through
   on the tracks behind (windows lit at night), the signal changes, pigeons strut. People with bags and flasks. */
(() => {
'use strict';
const K = TapriEnv; K.profiles.railway.open = true;           // open back: the tracks and the passing train are visible behind the shelves
const base = K.layers('railway'), TRAIN_LEN = 6, CYCLE = 52;
function coach(a, x, y, col, stripe, t, lit) {
  const { P } = a, w = 150, h = 62; K.poly(a, [[x + 4, y - h], [x + w - 4, y - h], [x + w, y - h + 6], [x + w, y - 6], [x, y - 6], [x, y - h + 6]], col); P(x, y - 22, w, 6, stripe); P(x + 3, y - h + 1, w - 6, 3, '#c9cdbf'); P(x, y - 6, w, 4, '#2a3236');
  for (let i = 0; i < 7; i++) { const wx = x + 10 + i * 20; P(wx, y - h + 14, 13, 17, '#2f4552'); if (lit) a.E(wx + 1, y - h + 15, 11, 15, i % 2 ? '#d9c68e' : '#bfae78'); else P(wx + 1, y - h + 15, 11, 3, '#86a0a8'); P(wx + 12, y - h + 14, 1, 17, '#a6aaa0'); }
  for (const bx of [x + 22, x + w - 44]) { P(bx, y - 4, 24, 5, '#1e2528'); for (const o of [4, 18]) K.oval(a, bx + o, y + 2, 5, 5, '#262f33'); }
  P(x + w - 3, y - 36, 6, 3, '#6a7274'); P(x - 3, y - 36, 6, 3, '#6a7274');
}
function engine(a, x, y, t, night) {
  const { P } = a, w = 130; K.poly(a, [[x + 8, y - 58], [x + w - 28, y - 58], [x + w, y - 34], [x + w, y - 6], [x, y - 6], [x, y - 48]], '#3f6d86'); P(x + 6, y - 28, w - 6, 8, '#d4b24e'); P(x + 24, y - 54, 36, 22, '#27404e'); P(x + 25, y - 53, 34, 3, '#a3c2cc'); P(x + w - 40, y - 52, 22, 20, '#27404e'); P(x, y - 6, w, 4, '#222a2e');
  for (let i = 0; i < 5; i++) P(x + 72 + i * 7, y - 58, 4, 4, '#c9cdbf');
  for (const bx of [x + 14, x + w - 56]) { P(bx, y - 4, 40, 5, '#1e2528'); for (const o of [5, 20, 35]) K.oval(a, bx + o, y + 2, 5, 5, '#262f33'); }
  (night ? a.E : a.P)(x + w - 2, y - 30, 6, 6, '#fff3b8'); if (night) { a.E(x + w + 3, y - 29, 14, 4, 'rgba(255,243,184,.5)'); }
}
Art.registerEnv('railway', {
  label: 'Railway Station', icon: '\u{1F686}', mix: { traffic: 1.0, birds: .6, crickets: .6, crowd: 1.35 },
  people: { age: { young: 4, mid: 4, old: 2 }, outfits: ['traveler', 'shirt', 'tee', 'office', 'kurta'], female: .4 },
  layers: base,
  dynamic: [
    { z: 'sky', draw: K.clouds },
    { z: 'far', draw(c, t, dt, a) { // the train: engine + six coaches, crossing the whole screen every ~52 s, with a faint rattle
      const ph = (t % CYCLE) / CYCLE, span = 960 + 130 + TRAIN_LEN * 154 + 120; if (ph > .46) return; const k = ph / .46, x0 = 960 + 60 - k * span, y = 398 + Math.round(Math.sin(t * 38) * .8), night = a.T.lamps > .5;
      engine(a, x0 + TRAIN_LEN * 154 + 4, y, t, night); for (let i = 0; i < TRAIN_LEN; i++) coach(a, x0 + i * 154, y, i % 3 === 0 ? '#9c4f43' : '#4f7b8a', i % 3 === 0 ? '#d4b24e' : '#d9d6c4', t, night);
      for (let i = 0; i < 18; i++) { const sx = x0 + TRAIN_LEN * 154 + 80 + i * 9 + (t * 30 % 9), sy = y - 62 - i * 2.4 - (i % 3); c.fillStyle = `rgba(210,210,214,${.5 - i * .027})`; c.fillRect(Math.round(sx), Math.round(sy), 6 + i * .5, 4 + i * .3); }
    } },
    { z: 'far', draw(c, t, dt, a) { // signal: red while the train is near, green otherwise
      const ph = (t % CYCLE) / CYCLE, red = ph > .35 && ph < .55; a.P(878, 232, 5, 130, '#566568'); a.P(870, 226, 21, 40, '#2c3a3d'); (a.T.lamps > .5 || true ? a.E : a.P)(874, 230, 12, 12, red ? '#e0503e' : '#3a1e1a'); a.E(874, 248, 12, 12, red ? '#1a3a24' : '#58d27a');
    } },
    { z: 'far', draw(c, t, dt, a) { // pigeons on the platform edge
      for (let i = 0; i < 4; i++) { const x = ((t * 6 + i * 230) % 1000) - 20, y = 428 + (i % 2) * 6, st = Math.round(Math.sin(t * 7 + i) * 1), { P } = a; P(x, y, 10, 6, '#7d858d'); P(x + 8, y - 3, 5, 5, '#6a727a'); P(x + 13, y - 1, 3, 1, '#d1a45a'); P(x + 1, y + 6 + st, 2, 3, '#b0675a'); P(x + 6, y + 6 - st, 2, 3, '#b0675a'); P(x + 9, y - 2, 1, 1, '#2a2e32'); }
    } }
  ]
});
})();
