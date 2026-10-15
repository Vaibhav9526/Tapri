(() => {
'use strict';
const K = TapriEnv, base = K.layers('rural');
Art.registerEnv('rural', {
  label: 'Farmland', icon: 'F', mix: { traffic: .15, birds: 1.5, crickets: 1.45, crowd: .7 },
  people: { age: { young: 1, mid: 4, old: 3 }, outfits: ['dhoti', 'kurta', 'waistcoat', 'shirt'], female: .38 },
  layers: { ...base, furnBack(c, a) { base.furnBack(c, a); for (const x of [796, 940]) { a.P(x, 497, 6, 25, '#7d6346'); a.P(x + 1, 498, 2, 20, '#b59a68'); } a.P(794, 494, 154, 6, '#8d724c'); for (let i = 0; i < 24; i++) a.line(799 + i * 6, 486, 802 + i * 6, 495, i % 2 ? '#bfb087' : '#8e8e67'); a.P(794, 484, 152, 3, '#af9361'); } },
  dynamic: [ { z: 'sky', draw: K.clouds }, { z: 'far', draw: K.birds }, { z: 'far', draw(c, t, dt, a) {
    const x = (t * 12 + 666) % 1190 - 130, y = 433, { P, line } = a;
    K.oval(a, x + 34, y + 3, 51, 4, '#7b7955'); K.poly(a, [[x + 11, y - 34], [x + 41, y - 34], [x + 41, y - 22], [x + 72, y - 20], [x + 75, y - 6], [x + 7, y - 7]], '#a16044'); P(x + 43, y - 20, 27, 2, '#c89764'); P(x + 53, y - 45, 4, 24, '#535c4e'); P(x + 50, y - 48, 9, 3, '#6c6f55');
    for (const [xx, yy, rad] of [[x + 19, y - 1, 17], [x + 65, y + 4, 10]]) { K.oval(a, xx, yy, rad, rad, '#35423c'); K.oval(a, xx, yy, rad * .53, rad * .53, '#b6aa7d'); K.oval(a, xx, yy, rad * .27, rad * .27, '#7e7754'); for (let j = 0; j < 5; j++) { const an = t * 3 + j * Math.PI / 2.5; line(xx + Math.cos(an) * rad * .62, yy + Math.sin(an) * rad * .62, xx + Math.cos(an) * rad * .9, yy + Math.sin(an) * rad * .9, '#657054'); } }
    P(x + 19, y - 63, 3, 27, '#5c634c'); P(x + 44, y - 63, 3, 34, '#5c634c'); P(x + 13, y - 66, 40, 5, '#b39c6a'); P(x + 27, y - 51, 9, 20, '#c1b28c'); K.oval(a, x + 31, y - 56, 4, 5, '#a4865b'); P(x + 25, y - 61, 12, 3, '#a66c49'); line(x + 32, y - 38, x + 45, y - 33, '#a0865d');
    for (let j = 0; j < 5; j++) line(x + 7, y - 6, x - 15 - j * 7, y + 13, '#81714e');
    for (let j = 0; j < 8; j++) { const an = t * .7 + j * Math.PI / 4; const p = [845 + Math.cos(an) * 12, 220 + Math.sin(an) * 12], q = [845 + Math.cos(an + .2) * 29, 220 + Math.sin(an + .2) * 29], r = [845 + Math.cos(an + .48) * 27, 220 + Math.sin(an + .48) * 27]; K.poly(a, [p, q, r], j % 2 ? '#ada88a' : '#8e957d'); line(845, 220, ...q, '#7d8974'); } K.oval(a, 845, 220, 3, 3, '#5f715d');
  } }, { z: 'far', draw(c, t, dt, a) { for (let i = 0; i < 42; i++) { const x = i < 21 ? i * 8 : 795 + (i - 21) * 8, y = 459 + i % 4 * 14, dx = Math.sin(t * 1.7 + i * .5) * 2; a.line(x, y + 12, x + dx, y, '#a5a063'); for (let j = 0; j < 4; j++) a.P(x + dx + j % 2 * 2 - 1, y + j * 2, 2, 2, '#c7b679'); } const y = 389 + t * 20 % 29; a.E(39, y, 1, 4, a.name === 'night' ? '#647f85' : '#b6c5a9'); } } ]
});
})();
