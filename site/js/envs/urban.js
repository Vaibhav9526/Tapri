(() => {
'use strict';
const K = TapriEnv, base = K.layers('urban');
Art.registerEnv('urban', {
  label: 'Metro City', icon: 'U', mix: { traffic: 1.4, birds: .4, crickets: .25, crowd: 1.3 },
  people: { age: { young: 5, mid: 4, old: 1 }, outfits: ['tee', 'shirt', 'office', 'hoodie', 'traveler'], female: .48 },
  layers: { ...base, far(c, a) { base.far(c, a); const night = a.T.lamps > .5; for (const [x, col] of [[8, '#8fa7ad'], [908, '#93b5aa']]) { (night ? a.E : a.P)(x, 181, 35, 3, col); (night ? a.E : a.P)(x, 182, 2, 74, col); a.P(x + 5, 270, 34, 4, '#72858b'); } a.P(817, 445, 55, 8, '#748584'); a.pixelText('BUS STOP', 843, 451, 6, '#d1cfb3', { align: 'center', bold: true }); a.P(842, 453, 4, 47, '#6e7d79'); } },
  dynamic: [ { z: 'sky', draw: K.clouds }, { z: 'far', draw(c, t, dt, a) {
    const start = 1080 - (t * 35 + 1400) % 1700, y = 318, { P } = a;
    for (let i = 0; i < 5; i++) { const x = start + i * 104; K.poly(a, [[x + 5, y - 43], [x + 97, y - 43], [x + 102, y - 37], [x + 102, y - 5], [x + 2, y - 5], [x + 2, y - 34]], '#a7b6af'); P(x + 5, y - 41, 93, 2, '#cad0b9'); P(x + 3, y - 14, 98, 5, '#558a8b'); for (let j = 0; j < 6; j++) { P(x + 8 + j * 15, y - 34, 10, 15, '#3e6372'); P(x + 9 + j * 15, y - 33, 8, 1, '#a1bab5'); if (a.T.lamps > .5) a.E(x + 10 + j * 15, y - 31, 5, 10, '#a7bbab'); } P(x + 44, y - 37, 1, 28, '#6f8c8e'); P(x + 47, y - 17, 2, 4, '#56787a'); for (const xx of [x + 19, x + 84]) K.oval(a, xx, y, 5, 4, '#354b54'); P(x + 102, y - 14, 2, 6, '#4f6971'); }
  } }, { z: 'far', draw(c, t, dt, a) { K.vehicle(a, (t * 31 + 430) % 1280 - 150, 482, '#9e6b64'); K.vehicle(a, 1100 - t * 27 % 1250, 455, '#b4ae8c'); } }, { z: 'far', draw(c, t, dt, a) { const light = a.T.lamps > .5; for (const x of [98, 815]) for (let j = 0; j < 4; j++) (light ? a.E : a.P)(x, 250 + j * 4, 39 - (Math.floor(t) + j) % 3 * 6, 1, light ? '#c0b185' : '#a4ae9a'); } } ]
});
})();
