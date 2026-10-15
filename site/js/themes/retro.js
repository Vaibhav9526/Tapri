/* THEME: Retro — an old-film, 1970s-village look. Warm faded colours, grain, scanlines, a flickering projector light.
   Characters keep the pixel rig but skew older: grey hair, spectacles, moustaches, kurtas. */
(() => {
  const hex2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  let grain;
  Art.registerTheme('retro', {
    label: 'Retro', icon: '\u{1F4FB}', outlineW: 1, outlineColor: '#303b36',
    // faded, slightly sepia colour: pull saturation down, warm the mids, lift the blacks, round colours to a limited palette
    grade(v) {
      const n = parseInt(v.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, l = .3 * r + .59 * g + .11 * b;
      return '#' + hex2((l + (r - l) * .86) * 1.02 + 3) + hex2(l + (g - l) * .86 + 2) + hex2((l + (b - l) * .86) * .94 + 2);
    },
    // film grain, scanlines, dust and a faint projector flicker over the finished frame
    post(c, t, a) {
      if (!grain) { const b = document.createElement('canvas'); b.width = 96; b.height = 96; const g = b.getContext('2d'), r = a.rng(620); for (let i = 0; i < 1900; i++) { g.fillStyle = i % 2 ? 'rgba(230,218,181,.055)' : 'rgba(28,39,37,.045)'; g.fillRect(r() * 96 | 0, r() * 96 | 0, 1, 1); } grain = c.createPattern(b, 'repeat'); }
      const w = a.RW || 960, h = a.RH || 640; c.fillStyle = grain; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(48,44,30,.018)'; for (let y = 0; y < h; y += 5) c.fillRect(0, y, w, 1);
      if (Math.floor(t * 3) % 97 === 0) { c.fillStyle = 'rgba(217,208,170,.035)'; c.fillRect(671, 0, 1, h); } // film scratch
      c.fillStyle = 'rgba(221,184,127,.012)'; c.fillRect(0, 0, w, h); // sepia wash
    },
    actors: {
      style(s, o) { // an older village crowd
        if (o.override) return;
        const n = Math.floor(s.seed), rural = !['urban', 'railway'].includes(Art.envId);
        if (n % 5 < 3) s.age = 'old';
        if (s.age === 'old') { s.hc = ['#a5a294', '#c6c0a5', '#879087'][n % 3]; s.glasses = n % 3 !== 0; s.stubble = false; s.hair = s.female ? 'long' : n % 3 ? 'parted' : 'bald'; if (!s.female) { s.must = n % 4 !== 0; if (rural && !['sweater', 'shawl', 'fisher', 'lungi', 'turban'].includes(s.outfit)) s.outfit = n % 2 ? 'kurta' : 'dhoti'; } else s.dupatta = s.dupatta || '#b9ae8c'; }
        if (s.outfit === 'dhoti') { s.wrap = 'dhoti'; s.pants = '#c8bea0'; s.sandals = true; }
        if (rural && !s.female && !s.turban && !s.fisherCap && n % 4 === 0) { s.hair = 'topi'; s.cap = null; }
        if (rural && !s.female && !s.shawl && n % 4 === 1) s.dupatta = '#ad8f65';
        s.shirt = ['#bcb39a', '#7b8c7e', '#a0846b', '#8f9792', '#ab996f'][n % 5];
      }
    }
  });
})();
