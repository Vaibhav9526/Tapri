/* ENV: Desert highway — a dhaba-style stall on a lonely highway. Heat haze shimmers over the dunes, a camel caravan plods across,
   a dust devil wanders, a truck thunders by, a kite circles. Turbans and waistcoats. */
(() => {
'use strict';
const groups = (list, idx) => idx.map(g => ({ z: list[g[0]].z, draw(c, t, dt, a, e) { for (const i of g) list[i].draw(c, t, dt, a, e); } }));
const K = TapriEnv, base = K.layers('desert');
function camel(a, x, y, t, ph, rider) {
  const { P, line } = a, st = Math.sin(t * 3 + ph), st2 = Math.sin(t * 3 + ph + Math.PI), body = '#b89257', dk = '#8e6b3d', hl = '#cfae72';
  K.oval(a, x + 26, y + 38, 38, 4, '#80704a');
  for (const [lx, s] of [[x + 6, st], [x + 14, st2], [x + 40, st2], [x + 48, st]]) { line(lx, y + 14, lx + s * 5, y + 36, dk); line(lx + 1, y + 14, lx + 1 + s * 5, y + 36, body); P(lx + s * 5 - 1, y + 36, 5, 2, '#5e4a30'); }
  K.poly(a, [[x, y - 2], [x + 16, y - 8], [x + 30, y - 6], [x + 52, y - 2], [x + 56, y + 12], [x + 6, y + 14]], body); K.oval(a, x + 20, y - 10, 9, 9, body); K.oval(a, x + 41, y - 7, 8, 8, body); P(x + 12, y - 8, 8, 2, hl);
  line(x + 3, y + 1, x - 8, y - 22, body); line(x + 4, y + 1, x - 7, y - 22, dk); line(x - 8, y - 22, x - 18, y - 28, body); K.oval(a, x - 22, y - 28, 6, 4, body); P(x - 26, y - 28, 3, 2, '#4a3a28'); P(x - 20, y - 33, 2, 3, dk);
  line(x + 54, y + 1, x + 60, y + 24, dk); P(x + 58, y + 24, 3, 4, dk);
  P(x + 18, y - 4, 26, 4, '#a64f3c'); P(x + 18, y, 26, 2, '#d1b36a');
  if (rider) { P(x + 28, y - 28, 8, 20, '#e6dcc2'); P(x + 29, y - 36, 7, 8, '#b58052'); P(x + 27, y - 40, 11, 5, '#c8553a'); P(x + 26, y - 35, 3, 5, '#c8553a'); line(x + 36, y - 20, x + 47, y - 13, '#e6dcc2'); }
}
Art.registerEnv('desert', {
  label: 'Desert Highway', icon: '\u{1F3DC}️', mix: { traffic: .55, birds: .35, crickets: 1.2, crowd: .7 },
  people: { age: { young: 2, mid: 4, old: 3 }, outfits: ['turban', 'kurta', 'waistcoat', 'dhoti', 'turban'], female: .28 },
  layers: base,
  dynamic: groups([
    { z: 'sky', draw(c, t, dt, a) { if (a.name === 'night') return; for (let i = 0; i < 2; i++) { const x = (t * (1.1 + i * .3) + i * 520) % 1240 - 160, y = 54 + i * 40; c.fillStyle = 'rgba(255,248,226,.5)'; for (let k = 0; k < 7; k++) c.fillRect(Math.round(x + k * 14), y + (k % 2), 16 + (k % 3) * 8, 3); } } },
    { z: 'far', draw(c, t, dt, a) { // heat haze over the dunes (daytime)
      if (a.name === 'night' || a.name === 'dusk') return; c.fillStyle = a.name === 'morning' ? 'rgba(255,230,190,.10)' : 'rgba(255,244,214,.14)'; for (let x = 0; x < 960; x += 4) { const y = 358 + Math.round(Math.sin(x * .045 + t * 2.2) * 4 + Math.sin(x * .013 - t) * 3); c.fillRect(x, y, 4, 2); c.fillRect(x, y + 22 + Math.round(Math.sin(x * .06 + t * 2) * 3), 4, 1); }
    } },
    { z: 'far', draw(c, t, dt, a) { const x = (t * 11) % 1500 - 340; for (let i = 0; i < 3; i++) camel(a, x + i * 92, 400 + (i % 2) * 3, t, i * 1.3, i !== 1); } },
    { z: 'far', draw(c, t, dt, a) { // dust devil
      const cx = ((t * 13 + 250) % 1300) - 150, base = 392; for (let i = 0; i < 70; i++) { const k = i / 70, h = k * 120, ang = t * 4 + i * .9, rad = 3 + k * 20; c.fillStyle = `rgba(214,188,140,${.55 - k * .4})`; c.fillRect(Math.round(cx + Math.cos(ang) * rad + Math.sin(t + k * 3) * 6), Math.round(base - h), 3, 2); }
    } },
    { z: 'far', draw(c, t, dt, a) { K.vehicle(a, 1100 - (t * 52 + 300) % 1500, 474, '#c9824a'); K.vehicle(a, ((t * 38) % 1500) - 150, 462, '#6f8f9a'); } },
    { z: 'far', draw(c, t, dt, a) { if (a.name === 'night') return; const x = 640 + Math.cos(t * .4) * 120, y = 130 + Math.sin(t * .4) * 28, f = Math.round(Math.sin(t * 3) * 2); K.stroke(a, [[x - 10, y + f], [x - 3, y - 1], [x + 3, y - 1], [x + 10, y + f]], 2, '#403730'); a.P(x - 1, y - 1, 3, 5, '#403730'); } }
  ], [[0], [1, 3, 5], [2], [4]])
});
})();
