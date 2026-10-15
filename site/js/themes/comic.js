(() => {
'use strict';
const h = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
let dots;
Art.registerTheme('comic', {
  label: 'Comic', icon: 'C', outlineW: 2, outlineColor: '#29343c',
  grade(v) { const n = parseInt(v.slice(1), 16), rgb = [n >> 16, n >> 8 & 255, n & 255], l = rgb[0] * .3 + rgb[1] * .59 + rgb[2] * .11; return '#' + rgb.map(x => h(Math.round((l + (x - l) * 1.12) / 7) * 7)).join(''); },
  post(c, t, a) {
    if (!dots) { const b = document.createElement('canvas'); b.width = 7; b.height = 7; const g = b.getContext('2d'); g.fillStyle = 'rgba(35,45,53,.11)'; g.fillRect(1, 1, 1, 1); g.fillRect(5, 4, 1, 1); dots = c.createPattern(b, 'repeat'); }
    c.fillStyle = dots; c.fillRect(0, 340, a.RW || 960, (a.RH || 640) - 340);
  },
  actors: { head: (...args) => Sprites.head(...args), torso: (...args) => Sprites.torso(...args), arm: (...args) => Sprites.arm(...args), style(s) { s.check = s.check && Math.floor(s.seed) % 3 === 0; } }
});
})();
