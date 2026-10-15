(() => {
'use strict';
const K = TapriEnv, layers = K.layers('city');
Object.assign(Art.defaults, layers);
Art.registerEnv('city', {
  label: 'Old City', icon: 'C', mix: { traffic: 1.1, birds: .75, crickets: .6, crowd: 1.25 },
  people: { age: { young: 3, mid: 4, old: 3 }, outfits: ['shirt', 'kurta', 'waistcoat', 'tee', 'hoodie'], female: .36 }, layers,
  dynamic: [ { z: 'sky', draw: K.clouds }, { z: 'far', draw(c, t, dt, a) { K.vehicle(a, (t * 19 + 251) % 1170 - 100, 466, '#ae985f', 'rickshaw'); K.vehicle(a, 1080 - t * 14 % 1250, 450, '#8d6964'); } }, { z: 'sky', draw: K.pennants }, { z: 'far', draw(c, t, dt, a) { for (const x of [8, 910]) { const y = 236 + Math.sin(t * 2 + x) * 2; a.P(x, y, 24, 13, '#b29c74'); for (let i = 0; i < 5; i++) a.P(x + i * 5, y, 2, 13, '#7e6d55'); } } } ]
});
})();
