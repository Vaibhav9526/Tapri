/* ENV: Hill station — tiled-roof stall under pine slopes. Mist rolls through the valley, a paraglider drifts over the ridge,
   prayer flags flutter, chimney smoke curls up from the cottages. Everyone is in sweaters and shawls. */
(() => {
'use strict';
const groups = (list, idx) => idx.map(g => ({ z: list[g[0]].z, draw(c, t, dt, a, e) { for (const i of g) list[i].draw(c, t, dt, a, e); } }));
const K = TapriEnv, base = K.layers('hill');
Art.registerEnv('hill', {
  label: 'Hill Station', icon: '⛰️', mix: { traffic: .22, birds: 1.25, crickets: 1.1, crowd: .65 },
  people: { age: { young: 2, mid: 3, old: 3 }, outfits: ['sweater', 'shawl', 'hoodie', 'sweater'], female: .42 },
  layers: base,
  dynamic: groups([
    { z: 'sky', draw: K.clouds },
    { z: 'sky', draw(c, t, dt, a) { // paraglider
      if (a.name === 'night') return; const x = (t * 9) % 1400 - 220, y = 118 + Math.sin(t * .3) * 22, sway = Math.sin(t * .8) * 3, { P, line } = a;
      const col = ['#b3563f', '#4c7f93', '#c3a14e'][Math.floor(t / 50) % 3];
      for (let i = -36; i <= 36; i += 2) { const h = Math.round(Math.sqrt(Math.max(0, 1 - (i / 38) ** 2)) * 13); P(x + i, y - h + sway * i / 40, 3, h, i % 12 < 6 ? col : '#e2dcc4'); }
      line(x - 32, y + 2, x + sway, y + 40, '#3b4146'); line(x + 32, y + 2, x + sway, y + 40, '#3b4146'); line(x, y, x + sway, y + 40, '#3b4146');
      P(x - 3 + sway, y + 40, 7, 9, '#a85d44'); P(x - 2 + sway, y + 36, 5, 5, '#c79a73'); P(x - 4 + sway, y + 48, 3, 8, '#38414a'); P(x + 2 + sway, y + 48 + Math.round(Math.sin(t * 5)), 3, 8, '#38414a');
    } },
    { z: 'far', draw(c, t, dt, a) { // valley mist
      const night = a.name === 'night'; for (let i = 0; i < 7; i++) { const x = ((i * 233 + t * (4 + i * .9)) % 1500) - 340, y = 296 + i * 21, w = 280 + i * 34; c.fillStyle = night ? `rgba(150,176,200,${.06 + (i % 3) * .015})` : `rgba(234,238,226,${.13 + (i % 3) * .035})`; c.fillRect(Math.round(x), y, w, 7); c.fillRect(Math.round(x + 30), y - 5, w - 60, 5); c.fillRect(Math.round(x + 70), y + 7, w - 140, 4); }
    } },
    { z: 'far', draw: K.birds },
    { z: 'far', draw(c, t, dt, a) { // prayer flags + chimney smoke
      const poly = K.poly, cols = ['#4a78a6', '#e4e0d0', '#b8483c', '#4f8d5c', '#d8b24a'];
      for (let i = 0; i < 15; i++) { const x = 676 + i * 18, y = 40 + Math.round(Math.sin(i / 14 * Math.PI) * 26), w = Math.sin(t * 3 + i * .8) * 2; poly(a, [[x, y], [x + 12, y + 1 + w], [x + 12, y + 14 + w], [x, y + 14]], cols[i % 5]); }
      for (const hx of [136, 880]) for (let k = 0; k < 7; k++) { const age = (t * .35 + k * .15 + hx * .01) % 1; c.fillStyle = `rgba(220,222,226,${.45 * (1 - age)})`; c.fillRect(Math.round(hx + Math.sin(age * 5 + k) * 5 + age * 10), Math.round(404 - age * 62), 4 + (age * 7 | 0), 3); }
    } }
  ], [[0, 1], [2, 3], [4]])
});
})();
