/* ENV: Seaside — a stall on the beach road. The sea glitters and rolls in, fishing boats chug past, gulls wheel overhead,
   palms stand either side. Fisher folk in lungis and caps. */
(() => {
'use strict';
const K = TapriEnv, base = K.layers('coast');
function boat(a, x, y, s, hull, sail, t) {
  const { P, line } = a, bob = Math.round(Math.sin(t * 1.6 + x * .01) * 2 * s); y += bob;
  K.poly(a, [[x, y - 5 * s], [x + 70 * s, y - 5 * s], [x + 58 * s, y + 8 * s], [x + 11 * s, y + 8 * s]], hull); P(x, y - 5 * s, 70 * s, 2 * s, '#e0d6b4'); P(x + 14 * s, y + 4 * s, 44 * s, 1 * s, '#2e3d44');
  P(x + 34 * s, y - 52 * s, 2 * s, 47 * s, '#5a4634'); K.poly(a, [[x + 37 * s, y - 50 * s], [x + 37 * s, y - 9 * s], [x + 68 * s, y - 9 * s]], sail); K.poly(a, [[x + 32 * s, y - 46 * s], [x + 32 * s, y - 10 * s], [x + 10 * s, y - 10 * s]], '#d9cfae');
  P(x + 47 * s, y - 14 * s, 4 * s, 9 * s, '#8a5a44'); P(x + 46 * s, y - 18 * s, 6 * s, 5 * s, '#b58052');
}
Art.registerEnv('coast', {
  label: 'Seaside', icon: '\u{1F30A}', mix: { traffic: .35, birds: 1.4, crickets: .7, crowd: .95 },
  people: { age: { young: 3, mid: 4, old: 2 }, outfits: ['lungi', 'fisher', 'tee', 'shirt', 'fisher'], female: .3 },
  layers: base,
  dynamic: [
    { z: 'sky', draw: K.clouds },
    { z: 'far', draw(c, t, dt, a) { // rolling swell, foam and sun glitter on the water
      const night = a.name === 'night';
      for (let r = 0; r < 14; r++) { const y = 240 + r * 14, sp = 7 + (r % 4) * 4, x0 = ((t * sp + r * 97) % 1100) - 140, w = 30 + (r % 3) * 24 + r * 2; c.fillStyle = night ? 'rgba(170,196,214,.14)' : 'rgba(236,246,242,.32)'; c.fillRect(Math.round(x0), y, w, 2); c.fillRect(Math.round(x0 + w + 80), y + 4, w - 10, 1); }
      if (!night) for (let i = 0; i < 60; i++) { const f = Math.sin(t * 3 + i * 1.7); if (f > .55) a.E(((i * 53) % 940) + 8, 232 + ((i * 29) % 200), 2, 1, '#f3f1d2'); }
      c.fillStyle = night ? 'rgba(170,200,216,.2)' : 'rgba(250,252,246,.5)'; const shore = 459 + Math.round(Math.sin(t * .9) * 3); c.fillRect(0, shore, 960, 2); c.fillRect(0, shore + 3, 960, 1);
    } },
    { z: 'far', draw(c, t, dt, a) { boat(a, 1130 - (t * 8) % 1400, 318, .62, '#6d5b4a', '#c9b98e', t); boat(a, ((t * 12) % 1400) - 200, 372, 1.05, '#8d4f42', '#e2d7b2', t); } },
    { z: 'far', draw(c, t, dt, a) { // gulls
      if (a.name === 'night') return; const { stroke } = K; for (let i = 0; i < 6; i++) { const x = (t * (20 + i * 3) + i * 170) % 1200 - 120, y = 90 + i * 24 + Math.sin(t * .6 + i) * 18, f = Math.round(Math.sin(t * 5 + i * 2) * 4); stroke(a, [[x - 8, y + f], [x, y], [x + 8, y + f]], 2, '#f1f1ea'); }
    } }
  ]
});
})();
