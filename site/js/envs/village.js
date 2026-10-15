/* ENV: Village — an open-air stall with a thatched roof. Nothing stands behind the shelves except the countryside:
   rolling hills, crop fields, mud huts with smoking chimneys, a little temple, palms, a haystack and a bullock cart on the far track. */
(() => {
'use strict';
const K = TapriEnv, base = K.layers('village');
const layers = { ...base,
  far(c, a) {
    // crop fields in perspective
    base.far(c, a);
    // a dirt track across the middle of the fields
    for (let x = 0; x < 960; x++) a.P(x, 426 + Math.sin(x * .006) * 3, 1, 8, '#ac956f');
    // the posts that hold up the shelves (the back is open to the fields)
    const x = 662, y = 273; K.poly(a, [[x - 17, y + 8], [x - 13, y - 7], [x, y - 39], [x + 13, y - 7], [x + 17, y + 8]], '#bfae86'); a.P(x - 18, y + 7, 36, 43, '#c0b08b'); a.P(x - 6, y + 25, 13, 25, '#71644d'); a.P(x - 19, y + 10, 38, 3, '#ac7950'); a.P(x, y - 68, 1, 30, '#7c7357');
  },
  roof(c, a) { base.roof(c, a); a.P(95, 120, 802, 3, '#8e7950'); } // bamboo ridge pole
};
Art.registerEnv('village', {
  label: 'Village', icon: 'V', mix: { traffic: .15, birds: 1.35, crickets: 1.4, crowd: .85 },
  people: { age: { young: 1, mid: 3, old: 5 }, outfits: ['kurta', 'dhoti', 'waistcoat', 'shawl'], female: .38 }, layers,
  dynamic: [
    { z: 'sky', draw(c, t, dt, a) { // drifting clouds
      K.clouds(c, t, dt, a);
    } },
    { z: 'far', draw: K.birds },
    { z: 'far', draw(c, t, dt, a) { // bullock cart on the far track
      const x = 1040 - (t * 8 + 285) % 1230, y = 425, phase = t * 4, { P, line } = a;
      for (let i = 0; i < 2; i++) { const ox = x + i * 34, yy = y - i % 2 * 3; K.oval(a, ox + 14, yy - 19, 18, 9, i ? '#b3a887' : '#a99a76'); K.poly(a, [[ox + 24, yy - 20], [ox + 27, yy - 38], [ox + 33, yy - 36], [ox + 37, yy - 20]], '#c0b596'); K.oval(a, ox + 32, yy - 36, 7, 4, '#b8ac8b'); line(ox + 29, yy - 39, ox + 28, yy - 45, '#d0c1a0'); line(ox + 35, yy - 39, ox + 39, yy - 43, '#d0c1a0'); for (let j = 0; j < 4; j++) { const xx = ox + 3 + j * 7, swing = Math.sin(phase + j * Math.PI / 2) * 3; K.stroke(a, [[xx, yy - 12], [xx + swing, yy + 3]], 2, '#766c50'); } P(ox + 35, yy - 37, 1, 1, '#3d493c'); }
      K.poly(a, [[x - 62, y - 31], [x - 7, y - 29], [x - 5, y - 9], [x - 59, y - 10]], '#9f8354'); line(x - 57, y - 21, x - 8, y - 20, '#c4ab73'); line(x - 57, y - 15, x - 6, y - 14, '#705f42'); line(x - 9, y - 15, x + 28, y - 14, '#857149');
      for (const wx of [x - 49, x - 13]) { K.oval(a, wx, y - 4, 10, 10, '#655c45'); K.oval(a, wx, y - 4, 7, 7, '#a68e60'); for (let j = 0; j < 4; j++) { const an = phase + j * Math.PI / 2; line(wx - Math.cos(an) * 7, y - 4 - Math.sin(an) * 7, wx + Math.cos(an) * 7, y - 4 + Math.sin(an) * 7, '#5b5b40'); } }
      P(x - 24, y - 50, 8, 21, '#b6ab8a'); K.oval(a, x - 20, y - 56, 4, 5, '#a4845c'); P(x - 26, y - 61, 12, 3, '#b69760');
    } },
    { z: 'far', draw(c, t, dt, a) { // chimney smoke from the huts + the temple flag
      for (const x of [49, 135, 844, 923]) for (let i = 0; i < 5; i++) { const life = (t * .13 + i * .19) % 1, xx = x + life * 13 + Math.sin(life * 5 + x) * 3, y = 331 - life * 46; c.fillStyle = `rgba(184,188,166,${(1 - life) * .23})`; c.fillRect(Math.round(xx), Math.round(y), 3 + Math.round(life * 5), 2); }
      for (let j = 0; j < 13; j++) a.P(662 + j, 205 + Math.sin(t * 4 + j * .35) * 2 + j / 5, 1, Math.max(1, 7 - Math.floor(j / 2)), '#bc8951');
    } }
  ]
});
})();
