(() => {
'use strict';
const INK = '#253039', W = 960, H = 640;
const profiles = {
  city: { roof: '#65747a', wall: '#9d8265', metal: '#416576', wood: '#80583e', floor: '#817b70', tree: 'banyan', accent: '#b65f3e' },
  village: { roof: '#9d8354', wall: '#b49971', metal: '#597473', wood: '#8a6443', floor: '#a08b67', tree: 'banyan', accent: '#a75e43', thatch: true, open: true },
  rural: { roof: '#867954', wall: '#aa9672', metal: '#60756b', wood: '#92714b', floor: '#a08a61', tree: 'neem', accent: '#aa7041', tarp: true, open: true },
  urban: { roof: '#657b83', wall: '#7d9293', metal: '#376775', wood: '#725b48', floor: '#7d8b8c', tree: 'neem', accent: '#b86e53' },
  hill: { roof: '#956551', wall: '#a29379', metal: '#51727a', wood: '#805f45', floor: '#8c8b7b', tree: 'pine', accent: '#9e614b', tile: true, open: true },
  coast: { roof: '#a36e54', wall: '#b3b39a', metal: '#3f7f85', wood: '#92764f', floor: '#b4aa89', tree: 'palm', accent: '#ae654b', tile: true, open: true },
  desert: { roof: '#aa7851', wall: '#b59c78', metal: '#597a79', wood: '#8f6a46', floor: '#ad9875', tree: 'post', accent: '#bc734c', tarp: true, open: true },
  railway: { roof: '#68797c', wall: '#a99b7d', metal: '#477080', wood: '#806044', floor: '#929388', tree: 'post', accent: '#ac6744' }
};
function poly(a, pts, col, emit = false) {
  const lo = Math.ceil(Math.min(...pts.map(p => p[1]))), hi = Math.floor(Math.max(...pts.map(p => p[1]))), f = emit ? a.E : a.P;
  for (let y = lo; y <= hi; y++) {
    const xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const p = pts[i], q = pts[j]; if ((p[1] > y) !== (q[1] > y)) xs.push(p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); }
    xs.sort((p, q) => p - q); for (let i = 0; i + 1 < xs.length; i += 2) f(Math.ceil(xs[i]), y, Math.max(1, Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1), 1, col);
  }
}
function oval(a, x, y, rx, ry, col, emit = false) {
  const f = emit ? a.E : a.P; for (let j = -Math.ceil(ry); j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - j * j / (ry * ry)))); f(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1, col); }
}
function stroke(a, pts, width, col) { for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], n = Math.max(1, Math.hypot(q[0] - p[0], q[1] - p[1])); for (let j = 0; j <= n; j++) oval(a, p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n, width / 2, width / 2, col); } }
function texture(a, x, y, w, h, base, seed, density = .12) {
  a.P(x, y, w, h, base); const r = a.rng(seed), cols = [-.24, -.12, .09, .18].map(v => a.shade(base, v));
  for (let i = 0; i < w * h * density; i++) { const xx = x + (r() * w | 0), yy = y + (r() * h | 0); a.P(xx, yy, r() < .12 ? 3 : 1, 1, cols[r() * 4 | 0]); }
}
function ridge(a, points, bottom, col) { for (let i = 1; i < points.length; i++) { const p = points[i - 1], q = points[i]; for (let x = p[0]; x < q[0]; x++) { const y = Math.round(p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])); a.P(x, y, 1, Math.max(1, bottom - y), col); } } }
function mix(x, y, t) { const a = parseInt(x.slice(1), 16), b = parseInt(y.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t).toString(16).padStart(2, '0')).join(''); }
function sky(c, a) {
  const r = a.rng(2048), bands = a.T.sky;
  for (let y = 0; y < H; y++) { const k = Math.min(1, y / 420), f = k < .5 ? k * 2 : (k - .5) * 2, i = k < .5 ? 0 : 1; a.E(0, y, W, 1, mix(bands[i], bands[i + 1], f)); if (y % 3 === 0) for (let x = 0; x < W; x += 7) if (r() < .35) a.E(x, y, 1, 1, mix(bands[i], bands[i + 1], Math.min(1, f + .025))); }
  if (a.name === 'morning' || a.name === 'dusk') { const x = a.name === 'morning' ? 135 : 852, y = a.name === 'morning' ? 204 : 211; oval(a, x, y, 24, 24, a.name === 'morning' ? '#efd2a1' : '#ebad83', true); }
  if (a.T.stars) for (let i = 0; i < 125 * a.T.stars; i++) a.E(r() * W, r() * 215, 1 + (i % 17 === 0), 1, i % 3 ? '#91a6bf' : '#d0d4c9');
  if (a.T.moon) { oval(a, 827, 79, 15, 15, '#d4d2b2', true); oval(a, 834, 74, 13, 14, a.T.sky[0], true); }
}
function building(a, x, y, w, h, col, seed = 30, modern = false) {
  const r = a.rng(seed), { P, E, shade } = a;
  texture(a, x, y, w, h, col, seed, .055); P(x + w - 6, y, 6, h, shade(col, -.3)); P(x - 2, y - 4, w + 4, 5, shade(col, -.2)); P(x - 2, y - 4, w + 4, 1, shade(col, .24));
  const sx = modern ? 15 : 24, sy = modern ? 23 : 35;
  for (let yy = y + 14; yy < y + h - 16; yy += sy) for (let xx = x + 9; xx < x + w - 12; xx += sx) {
    const lit = r() < a.T.lit, ww = modern ? 8 : 12, hh = modern ? 14 : 19;
    P(xx - 2, yy - 2, ww + 4, hh + 3, shade(col, -.29)); (lit ? E : P)(xx, yy, ww, hh, lit ? (r() < .3 ? '#c8a778' : '#e4bf83') : modern ? '#557481' : '#40535d');
    P(xx + ww / 2 | 0, yy, 1, hh, shade(col, -.28)); P(xx, yy + hh / 2 | 0, ww, 1, '#57636a');
    if (!modern) { P(xx - 4, yy + hh, ww + 8, 3, '#6b655a'); P(xx - 4, yy + hh - 4, 1, 6, '#4b4946'); P(xx + ww + 3, yy + hh - 4, 1, 6, '#4b4946'); for (let j = 0; j < 4; j++) P(xx - 2 + j * 5, yy + hh - 3, 1, 5, '#4b4946'); }
  }
  if (!modern) { P(x + w - 11, y + 8, 2, h - 9, '#6d6e65'); P(x + w - 10, y + 8, 1, h - 9, '#a49b7b'); P(x + 12, y - 21, 19, 17, '#676b6b'); oval(a, x + 21, y - 21, 11, 3, '#8c8e81'); a.line(x + w - 19, y - 4, x + w - 19, y - 29, '#3c454a'); a.line(x + w - 29, y - 22, x + w - 9, y - 22, '#3c454a'); }
}
function tree(a, x, y, size, seed = 42, kind = 'neem') {
  const r = a.rng(seed);
  if (kind === 'pine') {
    a.P(x - 3, y - size, 6, size, '#675447');
    for (let k = 0; k < 9; k++) { const yy = y - size + k * size / 11, rx = 7 + k * size / 26, ry = size / 5, tip = x + (r() - .5) * 7; poly(a, [[tip, yy], [x - rx * .35, yy + ry * .5], [x - rx, yy + ry * .78], [x - rx * .6, yy + ry * .83], [x - rx * .72, yy + ry], [x - rx * .12, yy + ry * .9], [x + rx * .75, yy + ry * .94], [x + rx * .55, yy + ry * .74], [x + rx, yy + ry * .72], [x + rx * .28, yy + ry * .43]], k % 2 ? '#345b4f' : '#426e59'); for (let j = 0; j < 90; j++) { const xx = x + (r() * 2 - 1) * rx, fy = .5 + r() * .45; a.P(xx, yy + ry * fy, 1 + (r() * 3 | 0), 1, j % 4 ? '#53755c' : '#7a8d65'); } }
    return;
  }
  if (kind === 'palm') {
    stroke(a, [[x, y], [x + 4, y - size * .5], [x + 13, y - size]], 8, '#9a7a54');
    for (let j = 0; j < size; j += 8) a.line(x + j / size * 13 - 3, y - j, x + j / size * 13 + 4, y - j + 1, '#625443');
    for (let k = 0; k < 9; k++) { const ang = k / 9 * 6.28, tx = x + 13, ty = y - size; for (let j = 0; j < size * .48; j++) { const xx = tx + Math.cos(ang) * j, yy = ty + Math.sin(ang) * j * .4 + j * j / size * .4; a.P(xx, yy, 3, 2, k % 2 ? '#527c56' : '#325b49'); if (j % 4 === 0) a.line(xx, yy, xx - 3, yy + 7, '#3a6349'); } }
    return;
  }
  stroke(a, [[x, y], [x - size * .02, y - size * .5], [x + size * .1, y - size]], size * .08, '#6e5b43');
  for (let k = 0; k < 7; k++) { const xx = x + (r() - .5) * size * .9, yy = y - size * (.65 + r() * .35); stroke(a, [[x, y - size * .45], [xx, yy]], size * .025, '#66553e'); for (let j = 0; j < 130; j++) { const an = r() * 6.28, rr = Math.sqrt(r()), px = xx + Math.cos(an) * rr * size * .25, py = yy + Math.sin(an) * rr * size * .16; a.P(px, py, 3 + (r() * 4 | 0), 2 + (r() * 2 | 0), ['#304c3c', '#3d5e42', '#526f45', '#70844d', '#8d9857'][r() * 5 | 0]); } }
}
function hut(a, x, y, w, h, col = '#b39b76', tile = false) {
  texture(a, x, y, w, h, col, x + y, .12); a.P(x + w - 5, y, 5, h, a.shade(col, -.23));
  poly(a, [[x - 8, y + 2], [x + w * .45, y - h * .65], [x + w + 9, y + 2]], tile ? '#9e6c52' : '#9a855b');
  for (let j = 0; j < h * .65; j += 4) { const inset = j / (h * .65) * w * .5; a.line(x - 8 + inset, y - j, x + w + 9 - inset, y - j, tile ? '#79513e' : '#b5a172'); }
  a.P(x + w * .53, y + h * .25, Math.round(w * .2), Math.round(h * .75), '#4c4940'); a.P(x + 7, y + h * .3, 13, 17, '#48534e'); if (a.T.lamps > .5) a.E(x + 9, y + h * .3 + 2, 9, 12, '#d4b077');
}
function far(id) {
  return (c, a) => {
    const { P, E, line, shade } = a, r = a.rng(106), p = profiles[id];
    if (id === 'city' || id === 'urban') {
      const modern = id === 'urban';
      for (let i = 0; i < 17; i++) { const x = i * 65 - 20, y = 110 + r() * 90; building(a, x, y, 57 + (r() * 25 | 0), 420 - y, ['#77858b', '#8b8982', '#8f9a9b'][i % 3], 710 + i, modern); }
      for (const [x, y, w, col] of [[-35, 102, 116, '#a3947d'], [89, 157, 91, '#81918b'], [802, 116, 78, '#a48d75'], [885, 67, 100, '#9a8174']]) building(a, x, y, w, 448 - y, col, x + 108, modern);
      texture(a, 0, 445, W, 79, '#676e70', 307, .04); P(0, 482, W, 2, '#9c9787');
      if (modern) { texture(a, 0, 322, W, 15, '#9baba8', 410, .1); P(0, 338, W, 5, '#4b606a'); for (const x of [42, 338, 824]) { P(x, 343, 16, 107, '#8c9c98'); P(x + 12, 343, 4, 107, '#687d80'); } for (const x of [92, 811]) { P(x, 218, 59, 54, '#354e5c'); P(x + 3, 221, 53, 48, '#8c7270'); a.pixelText(x < 500 ? 'CITY' : 'METRO', x + 29, 244, 10, '#e8d1a1', { bold: true, align: 'center', emissive: a.T.lamps > .5 }); P(x + 26, 272, 4, 33, '#566b73'); } }
      else for (const [x, col, text] of [[4, '#745447', 'किराना'], [95, '#517a6f', 'अख़बार'], [803, '#9c7650', 'फल'], [891, '#596c77', 'दवा']]) { texture(a, x, 360, 77, 18, col, x, .12); a.pixelText(text, x + 39, 373, 10, '#d8c5a0', { bold: true, align: 'center' }); P(x + 3, 379, 71, 66, '#525754'); for (let j = 381; j < 444; j += 4) P(x + 3, j, 71, 1, '#74746a'); }
      for (let x = 0; x < W; x++) P(x, 111 + Math.round(Math.sin(x / W * Math.PI) * 42), 1, 1, '#384047');
    } else if (id === 'hill') {
      ridge(a, [[0, 190], [79, 73], [180, 170], [259, 45], [412, 210], [537, 100], [681, 190], [776, 30], [880, 142], [960, 84]], 524, '#96a3aa');
      poly(a, [[17, 165], [79, 73], [130, 125], [90, 108], [70, 125], [64, 108]], '#d1d1bf'); poly(a, [[687, 154], [776, 30], [856, 115], [790, 91], [775, 112], [758, 88]], '#dad9c6');
      ridge(a, [[0, 295], [135, 205], [312, 310], [494, 230], [660, 300], [817, 185], [960, 277]], 524, '#66878a'); ridge(a, [[0, 385], [167, 315], [350, 410], [560, 350], [800, 330], [960, 300]], 524, '#52756a');
      for (const [x, y, h] of [[17, 422, 187], [77, 391, 163], [153, 369, 127], [812, 403, 190], [904, 427, 228], [958, 416, 154]]) tree(a, x, y, h, x + 44, 'pine');
      hut(a, 62, 415, 95, 64, '#acaa91', true); hut(a, 819, 427, 104, 54, '#b6b099', true); P(0, 497, W, 27, '#6e7b72'); for (let x = 0; x < W; x += 47) { P(x, 477, 5, 47, '#aaa78e'); P(x, 480, 47, 3, '#b6b19a'); }
    } else if (id === 'coast') {
      P(0, 225, W, 240, '#5f979a'); P(0, 225, W, 2, '#a9b5ac');
      for (let y = 239; y < 439; y += 5) for (let x = r() * 45; x < W; x += 45 + r() * 50) P(x, y, 14 + (r() * 30 | 0), 1, r() < .5 ? '#8db2ac' : '#4d858f');
      ridge(a, [[0, 461], [190, 407], [390, 451], [586, 411], [771, 446], [960, 390]], 524, '#c1b18b');
      ridge(a, [[0, 453], [190, 399], [390, 443], [586, 403], [771, 438], [960, 382]], 465, '#d5c7a5');
      tree(a, 57, 441, 238, 510, 'palm'); tree(a, 877, 423, 247, 512, 'palm'); tree(a, 946, 440, 177, 514, 'palm');
      for (const x of [72, 820]) { line(x, 458, x + 81, 465, '#9e9578'); for (let i = 0; i < 9; i++) { line(x + i * 9, 448, x + i * 8 - 10, 488, '#8c8e76'); line(x, 448 + i * 4, x + 81, 458 + i * 4, '#8c8e76'); } }
      hut(a, 827, 457, 93, 53, '#aa9f7e', true);
    } else if (id === 'desert') {
      ridge(a, [[0, 286], [80, 261], [220, 289], [370, 230], [552, 281], [738, 224], [960, 279]], 524, '#c6ae84'); ridge(a, [[0, 368], [167, 296], [354, 364], [545, 321], [732, 379], [914, 312], [960, 326]], 524, '#b99a6e');
      for (let x = 0; x < W; x += 7) P(x, 366 + Math.round(Math.sin(x * .008) * 17), 5, 1, '#cbb17f');
      texture(a, 0, 448, W, 43, '#63666a', 709, .035); P(0, 446, W, 2, '#d9c393'); P(0, 489, W, 2, '#d2bc90'); for (let x = 0; x < W; x += 75) P(x, 468, 42, 2, '#bab69c');
      for (const x of [29, 861, 938]) { stroke(a, [[x, 418], [x - 2, 357]], 7, '#728065'); stroke(a, [[x - 1, 388], [x - 16, 385], [x - 18, 370]], 5, '#728065'); stroke(a, [[x, 397], [x + 14, 391], [x + 16, 368]], 5, '#728065'); P(x, 360, 1, 57, '#a1a17a'); }
      P(106, 411, 5, 36, '#797866'); P(81, 389, 57, 29, '#536f67'); P(84, 392, 51, 23, '#c5b98c'); a.pixelText('NH 48', 109, 407, 9, '#3d564e', { bold: true, align: 'center' });
      hut(a, 813, 406, 88, 40, '#b7a17b');
    } else if (id === 'railway') {
      for (let i = 0; i < 16; i++) building(a, i * 70 - 15, 240 + r() * 20, 59, 82, '#8e9690', i + 66);
      texture(a, 0, 345, W, 179, '#95988d', 812, .08); P(0, 363, W, 36, '#5d6b6c'); for (let x = 0; x < W; x += 18) P(x, 366, 5, 32, '#4a514d'); P(0, 369, W, 3, '#a7b2af'); P(0, 395, W, 3, '#a7b2af'); P(0, 407, W, 4, '#cfba78');
      for (const x of [62, 839]) { P(x, 141, 6, 202, '#667774'); P(x - 26, 140, 58, 5, '#667774'); line(x - 25, 145, x + 2, 179, '#667774'); line(x + 29, 145, x + 2, 179, '#667774'); }
      for (let x = 0; x < W; x++) P(x, 158 + Math.round(Math.sin(x * .007) * 6), 1, 1, '#5c6a6c');
      for (const [x, title] of [[57, 'अड्डा नगर'], [837, 'ADDA NAGAR']]) { P(x - 32, 244, 126, 41, '#bca164'); P(x - 32, 244, 126, 2, '#596257'); a.pixelText(title, x + 31, 267, 13, '#35484b', { bold: true, align: 'center' }); a.pixelText('जंक्शन  /  JUNCTION', x + 31, 279, 7, '#35484b', { align: 'center' }); for (const xx of [x - 24, x + 84]) P(xx, 285, 4, 59, '#707969'); }
      P(898, 177, 43, 45, '#345459'); a.pixelText('02', 919, 210, 24, '#dfd1a4', { bold: true, align: 'center', emissive: a.T.lamps > .5 });
    } else {
      ridge(a, [[0, 276], [150, 240], [330, 273], [540, 232], [732, 275], [960, 246]], 524, '#84987c'); ridge(a, [[0, 325], [183, 283], [370, 328], [615, 281], [791, 323], [960, 286]], 524, '#6e885c');
      P(0, 345, W, 179, id === 'rural' ? '#a9a466' : '#7f9658');
      for (let y = 347; y < 524; y += 7) { P(0, y, W, 2, id === 'rural' ? '#bcb477' : '#8ca463'); for (let x = 0; x < W; x += 12) if (r() < .7) P(x + (r() * 7 | 0), y - 2, 1, 3, id === 'rural' ? '#d0be7f' : '#a9b574'); }
      for (let x = -400; x < 1400; x += 170) line(480 + (x - 480) * .24, 345, x, 524, '#697f51');
      P(0, 426, W, 12, '#a18d68'); P(0, 438, W, 1, '#786d52');
      if (id === 'village') { hut(a, 22, 350, 99, 74); hut(a, 112, 374, 63, 47); hut(a, 810, 348, 96, 75); hut(a, 905, 372, 68, 53); tree(a, 59, 345, 142, 315); tree(a, 842, 339, 133, 319); P(884, 426, 39, 17, '#9c9278'); oval(a, 904, 426, 20, 6, '#c4b89a'); oval(a, 904, 426, 14, 3, '#565e50'); P(881, 387, 4, 39, '#796346'); P(922, 387, 4, 39, '#796346'); P(880, 386, 47, 4, '#8d7552'); line(904, 390, 904, 419, '#6c6249'); }
      else { P(843, 220, 5, 126, '#8e8f76'); line(845, 220, 814, 346, '#7c806b'); line(845, 220, 878, 346, '#7c806b'); for (let y = 265; y < 346; y += 25) line(824, y, 867, y, '#8d8b6e'); P(106, 353, 5, 61, '#756748'); P(80, 366, 59, 4, '#756748'); poly(a, [[88, 371], [128, 371], [132, 400], [83, 398]], '#a47d58'); oval(a, 108, 345, 10, 12, '#a98b61'); P(92, 335, 32, 4, '#a99968'); for (let y = 406; y < 431; y++) P(875 - (y - 406), y, 42 + (y - 406) * 2, 1, '#bba46e'); P(16, 417, 27, 20, '#838b75'); stroke(a, [[25, 419], [25, 380], [40, 379]], 5, '#648475'); }
    }
    if (a.name === 'night') for (let i = 0; i < 16; i++) if (r() < .5) E(r() * W, 296 + r() * 130, 2, 1, '#d2ae72');
  };
}
function roofFor(id) {
  return (c, a) => {
    const p = profiles[id], r = a.rng(912), { P, shade } = a;
    poly(a, [[155, 48], [831, 33], [902, 109], [89, 122]], '#283b43');
    for (let i = 0; i < 63; i++) { const back = 155 + i * 10.73, front = 89 + i * 12.9, by = 48 - i * .24, fy = 122 - i * .21; poly(a, [[back, by], [back + 11, by], [front + 13, fy], [front, fy]], shade(p.roof, i % 4 === 0 ? -.19 : -.03)); poly(a, [[back, by], [back + 2, by], [front + 3, fy], [front, fy]], shade(p.roof, .2)); a.line(back + 10, by, front + 12, fy, shade(p.roof, -.38)); }
    for (let i = 0; i < 850; i++) { const f = r(), left = 155 - 66 * f, right = 831 + 71 * f, x = left + r() * (right - left), y = 44 + f * 70 - (x - left) / (right - left) * 12; P(x, y, 1 + (r() * 5 | 0), 1, r() < .6 ? '#806f57' : '#a98a61'); }
    a.line(89, 122, 902, 109, '#b99b70'); a.line(89, 123, 902, 110, '#504d40'); poly(a, [[89, 124], [903, 111], [896, 121], [94, 133]], '#293734');
    if (p.thatch) for (let x = 95; x < 900; x += 2) { const yy = 55 + r() * 4; P(x, yy, 1, 49 + (r() * 8 | 0), ['#a48e5d', '#b8a06b', '#7c6e4d'][r() * 3 | 0]); }
    if (p.tarp) { poly(a, [[125, 56], [827, 49], [870, 102], [101, 110]], '#597782'); for (let x = 118; x < 866; x += 18) a.line(x, 58, x - 11, 106, '#47636e'); a.line(104, 110, 869, 102, '#b49966'); }
    if (p.tile) for (let y = 59; y < 104; y += 11) for (let x = 112 + y % 3 * 3; x < 885; x += 19) { P(x, y, 17, 8, shade(p.roof, ((x + y) % 3 - 1) * .12)); P(x, y + 7, 17, 1, '#5c4f42'); P(x + 1, y, 1, 7, '#bd8e69'); }
    for (const x of [199, 786]) { P(x, 113, 9, 303, '#4b4940'); P(x, 113, 2, 303, '#ac8d61'); }
  };
}
function jar(a, x, y, w, h, col, seed) {
  const r = a.rng(seed), { P } = a, cx = x + w / 2;
  poly(a, [[x + 4, y + 4], [x + w - 4, y + 4], [x + w, y + 10], [x + w - 1, y + h - 3], [x + w - 4, y + h], [x + 3, y + h], [x, y + h - 4], [x, y + 10]], '#5b756c');
  P(x + 2, y + 10, w - 4, h - 13, '#829b83');
  for (let i = 0; i < w * h / 11; i++) { const xx = x + 3 + r() * (w - 7), yy = y + h * .35 + r() * (h * .6 - 3); P(xx, yy, 2 + (r() * 3 | 0), 2 + (r() * 2 | 0), r() < .4 ? a.shade(col, .3) : col); }
  P(x + 2, y + 11, 1, h - 16, '#d0d0aa'); P(x + w - 3, y + 10, 1, h - 14, '#a3b59d'); P(x + 4, y + 13, 1, Math.max(2, h * .32 | 0), '#a7c0a8');
  oval(a, cx, y + 5, w / 2 - 2, 3, '#b2b6a0'); P(x + 3, y + 1, w - 6, 4, seed % 3 ? '#a48755' : '#895743'); oval(a, cx, y + 1, w / 2 - 3, 2, seed % 3 ? '#c0a475' : '#ad7553');
}
function backWall(id) {
  return (c, a) => {
    const p = profiles[id], { P, shade } = a;
    if (!p.open) {
      texture(a, 205, 195, 582, 219, '#57645c', 552, .045);
      texture(a, 212, 203, 518, 209, '#637165', 553, .025);
      for (let x = 228; x < 730; x += 81) { P(x, 206, 1, 200, '#485c53'); P(x + 2, 206, 1, 200, '#7b856b'); }
      poly(a, [[208, 198], [788, 198], [788, 265], [674, 240], [546, 250], [405, 238], [208, 257]], '#3f514b');
      P(211, 316, 518, 96, '#706f56');
      for (let i = 0; i < 22; i++) { const x = 218 + i * 23; P(x, 327, 1, 75, i % 2 ? '#79765b' : '#64664f'); }
      P(211, 318, 518, 2, '#8b8060');
    }
    else { texture(a, 205, 326, 582, 90, shade(p.wall, -.2), 552, .055); for (const x of [207, 453, 588, 782]) { P(x, 196, 5, 220, '#5a5948'); P(x, 196, 1, 220, '#b6a071'); } P(209, 325, 573, 5, '#6a604a'); }
    for (const [y, x0, x1] of [[248, 300, 732], [304, 300, 592]]) { texture(a, x0, y, x1 - x0, 6, '#796147', 99 + y, .2); P(x0, y + 6, x1 - x0, 6, '#374a43'); P(x0, y, x1 - x0, 1, '#b79a69'); }
    for (let i = 0; i < 12; i++) { const h = [31, 38, 27, 34, 30][i % 5], w = [26, 28, 24][i % 3]; jar(a, 307 + i * 34 + (i % 2) * 2, 248 - h, w, h, ['#b79554', '#bb9e62', '#b99e66', '#a19051', '#ad7b46'][i % 5], i + 110); }
    for (let i = 0; i < 7; i++) { const h = [36, 30, 39][i % 3]; jar(a, 307 + i * 38, 304 - h, 30, h, ['#b49d60', '#a8864e', '#ba9b61'][i % 3], i + 242); }
    for (let j = 0; j < 4; j++) { P(611 + j * 25, 296 - j % 2 * 4, 17, 8 + j % 2 * 4, '#a5ae99'); P(612 + j * 25, 296 - j % 2 * 4, 15, 1, '#c4c7ab'); }
    texture(a, 599, 330, 36, 23, '#d1bd8c', 779, .06); a.pixelText('अदरक', 617, 343, 8, '#755d42', { align: 'center', bold: true });
    oval(a, 704, 349, 18, 6, '#c4c4a9'); P(687, 349, 35, 48, '#9eada2'); P(690, 351, 5, 44, '#cbd0b5'); P(714, 351, 6, 44, '#627f7d'); oval(a, 704, 397, 17, 4, '#697f79'); oval(a, 704, 347, 18, 4, '#b1baa6'); P(699, 341, 10, 4, '#687b70'); P(721, 382, 10, 3, '#a5b5a1'); P(727, 384, 2, 7, '#a5b5a1'); P(698, 371, 13, 2, '#80968c');
    texture(a, 460, 252, 44, 60, '#725340', 70, .2); P(465, 257, 34, 48, '#c8a069'); poly(a, [[473, 279], [483, 265], [493, 279], [486, 280], [489, 297], [477, 297], [480, 280]], '#a85e43'); oval(a, 483, 275, 8, 9, '#aa8e4d'); P(457, 310, 52, 5, '#775b40'); for (let i = 0; i < 12; i++) oval(a, 460 + i * 4, 288 + Math.round(Math.sin(i / 11 * Math.PI) * 18), 2, 2, i % 2 ? '#bf8a42' : '#d6a14f');
    P(476, 306, 14, 8, '#9a8960'); P(478, 307, 10, 2, '#4b4d3d');
    P(568, 199, 45, 57, '#bdad89'); P(570, 201, 41, 18, '#a35c44'); a.pixelText('शुभ दिन', 590, 213, 7, '#d9c394', { bold: true, align: 'center' }); for (let y = 225; y < 251; y += 6) for (let x = 574; x < 608; x += 6) P(x, y, 2, 2, '#626753');
    oval(a, 636, 216, 19, 19, '#51574f'); oval(a, 636, 216, 16, 16, '#d1c5a4'); for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; P(636 + Math.sin(an) * 13, 216 - Math.cos(an) * 13, 1, 2, '#55564c'); }
    for (let k = 0; k < 6; k++) { const x = 209 + k * 17; a.line(x + 6, 191, x + 7, 202 + k % 2 * 5, '#4a4338'); for (let j = 0; j < 4; j++) { const y = 202 + j * 25 + k % 2 * 5, dx = (j % 2 ? 1 : -1) * (k % 3), col = ['#b59244', '#557e8c', '#aa5944', '#7c8c53', '#ad7c45'][(k + j * 2) % 5]; poly(a, [[x + dx + 2, y], [x + dx + 13, y + 1], [x + dx + 15, y + 21], [x + dx - 1, y + 22]], shade(col, -.23)); P(x + dx + 1, y + 3, 12, 16, col); P(x + dx + 2, y + 4, 2, 14, shade(col, .2)); oval(a, x + dx + 8, y + 10, 4, 3, '#d3bf8b'); P(x + dx + 6, y + 9, 4, 1, shade(col, -.3)); P(x + dx + 1, y + 20, 12, 1, shade(col, .15)); a.line(x + dx + 10, y + 13, x + dx + 12, y + 18, shade(col, -.2)); } }
    texture(a, 732, 208, 52, 208, '#798d8e', 181, .05); P(732, 208, 52, 33, '#a8493c'); a.pixelText('ठंडा', 758, 230, 12, '#e1d4b1', { bold: true, align: 'center' }); P(736, 247, 43, 164, '#2d444e'); P(736, 247, 2, 164, '#b3c3bb');
    for (let j = 0; j < 4; j++) { const y = 252 + j * 37; for (let i = 0; i < 7; i++) { const x = 740 + i * 5, col = ['#a4553b', '#8baf96', '#b78b4d', '#7e9272'][i % 4]; P(x + 1, y + 4, 3, 23, col); P(x + 2, y, 1, 5, '#a9b4a8'); P(x + 1, y + 12, 3, 4, '#d6caa3'); P(x + 1, y + 6, 1, 19, shade(col, .25)); } P(738, y + 29, 39, 3, '#7a9192'); }
    P(782, 268, 4, 27, '#a1aca1'); P(751, 181, 20, 24, '#7e6246'); for (let i = 0; i < 13; i++) a.line(760, 183, 743 + i * 3, 163 + i % 3 * 4, i % 2 ? '#6d8a55' : '#4a714f');
    for (const l of a.L.lamps.slice(0, 3)) { const x = l.x * 2, y = l.y * 2; P(x, 197, 1, y - 197, '#3e3931'); P(x - 5, y - 13, 11, 8, '#5d5444'); oval(a, x, y - 2, 6, 9, '#d8c8a0'); P(x - 2, y - 6, 3, 8, '#ead6a4'); }
    for (const x of [353, 683]) { texture(a, x, 332, 36, 48, '#b4a27d', x, .13); a.pixelText(x < 500 ? 'चाय' : 'गरम', x + 18, 349, 8, '#704d3e', { align: 'center', bold: true }); P(x + 4, 357, 28, 1, '#8f866a'); P(x + 6, 363, 24, 1, '#8f866a'); }
  };
}
function sign(c, a) {
  const { P } = a, r = a.rng(144);
  texture(a, 208, 116, 580, 81, '#273c44', 113, .06); P(204, 112, 588, 4, '#56615d'); P(204, 197, 588, 5, '#252e30'); P(204, 113, 4, 85, '#797c66'); P(788, 113, 4, 85, '#3d4c4c'); P(214, 122, 568, 1, '#8e8e6d'); P(214, 191, 568, 1, '#87896a');
  a.pixelText('अड्डा चाय घर', 478, 163, 38, '#d8c5a3', { bold: true, align: 'center' }); a.pixelText('CHAI  ·  DOSTI  ·  THODI SI FURSAT', 482, 184, 10, '#b6b7a1', { bold: true, align: 'center' });
  for (let i = 0; i < 50; i++) P(216 + r() * 560, 123 + r() * 68, 1, 1, '#273c44');
  poly(a, [[719, 142], [746, 142], [741, 178], [723, 178]], '#b7b5a0'); poly(a, [[722, 149], [742, 149], [738, 175], [726, 175]], '#a66a3a'); P(723, 149, 18, 2, '#d1a66c'); a.line(726, 151, 729, 173, '#ddc39a'); for (let i = 0; i < 3; i++) a.line(724 + i * 7, 137, 725 + i * 7, 130 - i % 2 * 4, '#bdbaa1');
  a.line(809, 107, 809, 129, '#45483e'); a.line(858, 108, 858, 129, '#45483e'); texture(a, 797, 129, 75, 62, '#354a49', 191, .1); a.pixelText('चाय', 834, 153, 18, '#d9bc85', { bold: true, align: 'center' }); a.pixelText('₹ 10', 834, 175, 15, '#d9bc85', { bold: true, align: 'center' });
}
function board(c, a) {
  texture(a, 91, 236, 101, 178, '#675641', 123, .18); texture(a, 97, 242, 89, 165, '#30433d', 125, .04); a.pixelText('आज का मेन्यू', 141, 262, 13, '#d2ceb0', { align: 'center', bold: true }); a.P(105, 269, 73, 1, '#a7af91');
  [['चाय', '10'], ['समोसा', '15'], ['पकोड़ा', '15'], ['कचौरी', '20'], ['मस्का बन', '20'], ['कॉफी', '15'], ['ठंडा पेय', '20']].forEach((v, i) => { a.pixelText(v[0], 105, 288 + i * 16, 11, '#c5c9ae', { bold: true }); a.pixelText(v[1], 161, 288 + i * 16, 11, '#c5c9ae', { bold: true }); });
}
function ground(id) {
  return (c, a) => {
    const { P, shade } = a, p = profiles[id], r = a.rng(590);
    texture(a, 0, 524, W, 116, p.floor, 1132, .11); P(0, 524, W, 3, shade(p.floor, -.34));
    const paved = !['village', 'rural', 'desert', 'coast'].includes(id);
    if (paved) for (let j = 0, y = 529; y < 617; y += 12 + j * 2, j++) for (let x = -30; x < W; x += 44 + j * 9) { const xx = x + j % 2 * 23, w = 39 + j * 9, hh = 10 + j * 2, col = shade(p.floor, (r() - .5) * .25); poly(a, [[xx + 2, y], [xx + w - 3, y + (r() * 2 | 0)], [xx + w, y + hh - 2], [xx + 3, y + hh]], col); a.line(xx + 3, y, xx + w - 3, y, shade(col, .14)); a.line(xx + 3, y + hh, xx + w - 1, y + hh - 2, shade(col, -.24)); }
    else { for (let i = 0; i < 60; i++) { const x = r() * W, y = 530 + r() * 84; P(x, y, 3 + (r() * 13 | 0), 1, shade(p.floor, -.2)); } for (const y of [563, 591]) for (let x = 0; x < W; x += 9) P(x, y + Math.sin(x * .014) * 2, 6, 1, shade(p.floor, -.12)); }
    if (a.T.wet) for (let i = 0; i < 95; i++) { const x = r() * W, y = 535 + r() * 96, w = 6 + r() * 38; P(x, y, w | 0, 1, '#5c717d'); if (i % 3 === 0) P(x + 2, y + 2, Math.max(1, w - 7 | 0), 1, '#869191'); }
    if (a.T.lamps > .3) for (let i = 0; i < 260; i++) { const y = 532 + r() * 104, center = [300, 500, 680, 840][i % 4], x = center + (r() - .5) * (30 + (y - 530) * .8); if (r() < .55) a.E(x, y, 1 + (r() * 8 | 0), 1, mix('#6d6856', '#c59353', r() * .6)); }
    P(0, 618, W, 6, shade(p.floor, .12)); P(0, 624, W, 16, '#47545c'); for (let x = 0; x < W; x += 33) { P(x, 619, 2, 9, '#575f59'); P(x + 4, 619, 20, 1, '#b2a98a'); }
    for (let i = 0; i < 52; i++) { const x = r() * W, y = 529 + r() * 84; P(x, y, 2, 1, ['#be9a55', '#657b4b', '#b5aa8b'][i % 3]); }
    for (const [x, y] of [[180, 597], [708, 608], [865, 581]]) { poly(a, [[x, y], [x + 7, y - 2], [x + 9, y + 4], [x + 2, y + 5]], '#c8bc99'); P(x + 3, y + 1, 4, 1, '#907e63'); }
    if (id === 'railway') { P(0, 612, W, 3, '#c5a65c'); for (let x = 0; x < W; x += 9) P(x, 605, 3, 2, '#b8a66d'); }
  };
}
function stool(a, x, y, col) {
  oval(a, x, y + 1, 23, 5, '#354047'); poly(a, [[x - 20, y + 3], [x - 13, y + 3], [x - 16, y + 43], [x - 22, y + 43]], a.shade(col, -.25)); poly(a, [[x + 12, y + 3], [x + 20, y + 3], [x + 22, y + 43], [x + 16, y + 43]], a.shade(col, -.25)); a.P(x - 19, y + 23, 38, 4, a.shade(col, -.15)); oval(a, x, y, 23, 5, col); a.P(x - 16, y - 2, 32, 1, a.shade(col, .2)); a.P(x - 6, y, 12, 2, a.shade(col, -.4));
}
function furniture(id) {
  return (c, a) => {
    const { P } = a;
    for (let k = 0; k < 3; k++) { const y = 497 - k * 23, col = k % 2 ? '#385c76' : '#a54e3a'; texture(a, 65, y, 77, 23, col, 41 + k, .07); P(67, y + 4, 73, 3, a.shade(col, .2)); for (let j = 0; j < 8; j++) { P(70 + j * 9, y - 12, 5, 13, '#554b36'); P(71 + j * 9, y - 16, 3, 5, '#9b9c81'); P(70 + j * 9, y + 8, 5, 8, a.shade(col, -.23)); } }
    texture(a, 35, 469, 32, 54, '#6f7b78', 109, .11); oval(a, 51, 468, 19, 4, '#a1a99a'); for (let x = 40; x < 66; x += 6) P(x, 477, 1, 40, '#535f5c');
    const rural = ['village', 'rural', 'desert'].includes(id);
    if (rural) { oval(a, 840, 486, 26, 32, '#a47c50'); oval(a, 840, 455, 14, 4, '#8b6948'); oval(a, 840, 455, 10, 2, '#4d4e3e'); P(823, 486, 5, 16, '#bd9969'); }
    else { texture(a, 812, 440, 45, 65, '#3c6a83', 323, .05); oval(a, 834, 440, 24, 5, '#6e8e99'); P(858, 477, 12, 5, '#9aa6a1'); P(864, 481, 3, 10, '#9aa6a1'); P(820, 505, 6, 18, '#6b5944'); P(845, 505, 6, 18, '#6b5944'); }
    for (let i = 0; i < a.L.seats.length; i++) { const s = a.L.seats[i]; stool(a, s.x * 2, s.y * 2, i % 2 ? '#416e8a' : '#ad5743'); }
    for (const x of [875, 929]) { oval(a, x, 495, 18, 18, '#2f3b41'); oval(a, x, 495, 13, 13, '#7b8580'); oval(a, x, 495, 10, 10, '#3d4b50'); } stroke(a, [[875, 492], [890, 463], [909, 487], [929, 495], [920, 457], [935, 450]], 4, '#9b6c4f'); poly(a, [[887, 463], [911, 461], [916, 473], [894, 477]], '#665b50'); P(896, 455, 26, 6, '#38434a');
  };
}
function tables(id) {
  return (c, a) => { const p = profiles[id]; for (const t of a.L.tables) { const x = t.x0 * 2, w = (t.x1 - t.x0) * 2, y = 524; texture(a, x, y, w, 10, p.wood, 481 + x, .18); a.P(x, y, w, 2, '#ba9464'); a.P(x, y + 10, w, 4, '#3d3e34'); for (let j = 0; j < 8; j++) { const xx = x + j * (w / 8); a.P(xx, y + 3 + j % 2, Math.max(2, w / 10 | 0), 1, j % 2 ? '#aa8256' : '#594b38'); } for (const xx of [x + 10, x + w - 17]) { poly(a, [[xx, y + 14], [xx + 7, y + 14], [xx + 10, y + 57], [xx + 3, y + 57]], '#594a38'); a.P(xx + 1, y + 15, 2, 40, '#8b704e'); a.P(xx - 2, y + 52, 14, 4, '#3f4036'); } a.P(x + 15, y + 40, w - 30, 4, '#544735'); } };
}
function counter(id) {
  return (c, a) => {
    const p = profiles[id], { P, shade } = a, r = a.rng(613);
    texture(a, 188, 416, 628, 8, '#9b927b', 31, .1); P(188, 416, 628, 2, '#d2bea0'); P(188, 424, 628, 6, '#393d36');
    for (let x = 196; x < 804; x++) P(x, 430, 1, 94, shade(p.metal, x % 13 < 3 ? .12 : x % 13 < 7 ? -.03 : -.24));
    for (let i = 0; i < 120; i++) { const x = 199 + r() * 601, y = 435 + r() * 82, w = 2 + (r() * 12 | 0), h = 1 + (r() * 4 | 0); P(x, y, w, h, ['#8b654b', '#755341', '#a77750'][i % 3]); if (i % 5 === 0) P(x + 2, y + h, 1, 3 + (r() * 8 | 0), '#755341'); }
    P(196, 435, 608, 2, '#698780'); P(196, 518, 608, 5, '#324d57'); P(196, 487, 608, 2, '#3b5962'); for (let x = 196; x < 804; x += 151) { P(x, 430, 3, 94, '#344e54'); P(x + 3, 432, 1, 88, '#7a9183'); }
    P(212, 450, 49, 69, '#a05b43'); oval(a, 237, 449, 24, 6, '#b17650'); P(222, 438, 30, 11, '#83513d'); P(229, 430, 16, 9, '#5e4436'); P(213, 476, 47, 5, '#b8a27b');
    texture(a, 271, 480, 51, 41, '#ac9c74', 64, .15); for (let y = 484; y < 520; y += 7) P(275, y, 44, 1, '#8d7f5c');
    P(751, 451, 46, 55, '#d9d9bf'); P(754, 454, 40, 9, '#4b737f'); a.pixelText('SCAN & PAY', 774, 461, 5, '#e1e1ca', { bold: true, align: 'center' }); P(758, 467, 32, 32, '#e7e2c8'); const q = a.rng(5); for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (q() < .5) P(760 + x * 2, 469 + y * 2, 2, 2, '#35474b'); for (const [x, y] of [[760, 469], [780, 469], [760, 489]]) { P(x, y, 7, 7, '#35474b'); P(x + 2, y + 2, 3, 3, '#d8dbc3'); P(x + 3, y + 3, 1, 1, '#35474b'); }
    for (const [x, w] of [[224, 132], [360, 132], [496, 104]]) { P(x, 404, w, 12, '#707e7e'); P(x, 404, w, 2, '#b8b9a4'); P(x, 413, w, 3, '#465b60'); P(x, 350, w, 3, '#6e8588'); P(x + 1, 350, w - 2, 1, '#bdc5b9'); }
    texture(a, 600, 396, 112, 17, '#454d4d', 28, .1); P(600, 396, 112, 2, '#a9afa1'); for (const x of [618, 674]) { oval(a, x, 396, 18, 3, '#343f40'); oval(a, x, 396, 9, 2, '#737e77'); P(x - 3, 406, 6, 4, '#212f36'); }
    texture(a, 196, 369, 52, 45, '#ae9270', 80, .17); P(197, 369, 49, 2, '#c4ac7d'); P(219, 371, 4, 40, '#8b7959'); a.pixelText('BISCUITS', 223, 397, 6, '#755840', { bold: true, align: 'center' });
    texture(a, 760, 395, 28, 20, '#263d49', 88, .03); for (let y = 399; y < 411; y += 3) P(763, y, 21, 1, '#526d77');
    for (let i = 0; i < 4; i++) { const x = 712 + i * 5; P(x, 392 - i * 2, 4, 20 + i * 2, '#b5af94'); P(x, 392 - i * 2, 4, 2, '#ded2ad'); }
    P(641, 407, 13, 5, '#a0503d'); P(642, 408, 11, 2, '#d0b588');
  };
}
function glass(c, a) {
  for (const [x, w] of [[224, 132], [360, 132], [496, 104]]) { c.fillStyle = 'rgba(133,177,179,.09)'; c.fillRect(x, 352, w, 53); a.P(x, 352, 2, 54, '#8da4a2'); a.P(x + w - 2, 352, 2, 54, '#587680'); a.P(x, 352, w, 1, '#bac5b6'); a.E(x + 10, 357, 1, 34, 'rgba(220,233,202,.42)'); a.E(x + 12, 358, 1, 14, 'rgba(220,233,202,.25)'); a.E(x + w - 13, 373, 1, 24, 'rgba(220,233,202,.18)'); a.P(x, 405, w, 2, '#b5bba8'); }
}
function canopy(id) {
  return (c, a) => {
    const p = profiles[id], { P } = a;
    if (p.tree === 'post') { texture(a, 30, 0, 14, 610, '#6b736e', 401, .08); P(31, 0, 2, 610, '#9a9b84'); for (let y = 48; y < 575; y += 59) P(28, y, 19, 3, '#535f5c'); }
    else if (p.tree === 'palm') { stroke(a, [[26, 610], [37, 374], [40, 170], [63, 24]], 22, '#856e4e'); for (let y = 50; y < 605; y += 17) a.line(30, y, 48, y + 3, '#5c5942'); }
    else { const pine = p.tree === 'pine'; poly(a, [[0, 610], [0, 24], [36, 0], [57, 0], [46, 160], [49, 352], [76, 610]], '#69553e'); poly(a, [[8, 608], [3, 80], [22, 29], [25, 357], [43, 606]], '#977550'); poly(a, [[43, 608], [32, 363], [40, 98], [55, 0], [60, 0], [48, 361], [72, 610]], '#3d4437'); const r = a.rng(441); for (let i = 0; i < 450; i++) { const x = 4 + r() * 39, y = r() * 590; P(x, y, 1 + (r() * 3 | 0), 3 + (r() * 12 | 0), i % 3 ? '#65573f' : '#a07b50'); } if (!pine) { stroke(a, [[33, 184], [86, 104], [175, 59], [297, 25], [411, 7]], 18, '#63533d'); stroke(a, [[48, 166], [90, 91], [206, 39], [302, 0]], 6, '#a08053'); stroke(a, [[34, 137], [4, 76]], 16, '#66543d'); } }
    texture(a, 888, 0, 10, 609, '#706c5a', 491, .1); P(889, 0, 2, 609, '#a49876'); a.line(894, 48, 840, 48, '#4b514b'); poly(a, [[830, 45], [848, 45], [851, 54], [827, 54]], '#62675c'); P(834, 54, 12, 3, '#ded0a5');
    for (let x = 0; x < W; x++) P(x, 18 + Math.round(Math.sin(x / W * Math.PI) * 22), 1, 1, '#39413e');
  };
}
function foliage(id) {
  return (c, a) => {
    const p = profiles[id], r = a.rng(323), out = [];
    if (p.tree === 'post') return out;
    const positions = p.tree === 'palm' ? [[59, 27, 84, 22], [129, 14, 70, 19], [8, 81, 33, 57]] : p.tree === 'pine' ? [[23, 8, 46, 42], [37, 52, 48, 23], [7, 108, 35, 26]] : [[21, 15, 67, 51], [95, 11, 71, 38], [175, 9, 61, 33], [257, 3, 60, 28], [334, 0, 48, 24], [16, 102, 49, 61], [92, 79, 42, 30], [404, 0, 32, 18]];
    for (const [x, y, rx, ry] of positions) { const b = a.mk(rx * 2 + 10, ry * 2 + 10); Art.setCtx(b.x); for (let k = 0; k < 14; k++) { const an = r() * 6.28, rr = Math.sqrt(r()), xx = rx + Math.cos(an) * rr * rx * .75, yy = ry + Math.sin(an) * rr * ry * .75; for (let j = 0; j < 65; j++) { const ang = r() * 6.28, rad = Math.sqrt(r()), lx = xx + Math.cos(ang) * rad * 20, ly = yy + Math.sin(ang) * rad * 15, light = Math.min(4, Math.max(0, Math.floor(2 - (ly - ry) / ry * 1.5 + (r() - .5) * 2))); a.P(lx, ly, 2 + (r() * 4 | 0), 1 + (r() * 2 | 0), ['#293e34', '#384e39', '#506440', '#6f7d46', '#8b9254'][light]); } } Art.setCtx(c); out.push({ c: b.c, x: x - rx - 5, y: y - ry - 5, amp: 1.8, sp: .48 + r() * .3, ph: r() * 6.28 }); }
    return out;
  };
}
function emit(c, a) {
  const l = a.T.lamps; if (l < .08) return;
  for (const b of a.L.lamps.slice(0, 3)) {
    const x = b.x * 2, y = b.y * 2;
    for (let yy = y - 28; yy < 417; yy += 3) { const dy = (yy - y) / 210, rad = 68 + Math.max(0, yy - y) * .3; for (let xx = x - rad; xx < x + rad; xx += 3) { const fall = Math.max(0, 1 - Math.abs(xx - x) / rad) * Math.max(0, 1 - Math.abs(dy)) * l; c.fillStyle = `rgba(223,167,85,${fall * .20})`; c.fillRect(Math.round(xx), yy, 3, 3); } }
    oval(a, x, y - 1, 4, 7, '#efd5a0', true); a.E(x - 1, y - 5, 2, 7, '#fff0c7');
  }
  a.E(833, 53, 14, 3, '#e9c28b'); a.E(122, 198, 6, 4, '#dfb477'); a.E(738, 248, 1, 156, 'rgba(185,220,211,.30)');
  c.fillStyle = `rgba(220,145,62,${l * .08})`; for (const [x, w] of [[224, 132], [360, 132], [496, 104]]) c.fillRect(x + 2, 354, w - 4, 49);
  a.E(612, 199, 92, 2, 'rgba(255,221,151,.7)');
}
function clouds(c, t, dt, a) { for (let i = 0; i < 5; i++) { const x = (t * (1 + i * .2) + i * 257) % 1160 - 120, y = 32 + i * 25; for (let j = 0; j < 97; j += 3) { const h = Math.round(2 + Math.sin(j / 97 * Math.PI) * 8 + Math.sin(j * .1) * 2); a.E(x + j, y - h, 4, h, a.T.clouds); } } }
function birds(c, t, dt, a) { if (a.name === 'night') return; for (let i = 0; i < 5; i++) { const x = (t * 15 + i * 49) % 1060 - 50, y = 152 + i * 9 + Math.sin(t * .5 + i) * 13, dy = Math.round(Math.sin(t * 6 + i) * 3); stroke(a, [[x - 5, y + dy], [x, y], [x + 5, y + dy]], 1, '#455459'); } }
function pennants(c, t, dt, a) { for (let i = 0; i < 24; i++) { const x = i * 41, y = 18 + Math.round(Math.sin(x / W * Math.PI) * 22); poly(a, [[x, y], [x + 11, y + 1], [x + 7 + Math.sin(t * 2 + i) * 2, y + 10]], ['#a86a4b', '#b8a46a', '#628a78'][i % 3]); } }
function vehicle(a, x, y, color, kind = 'car') {
  x = Math.round(x); y = Math.round(y); const { P, shade } = a;
  oval(a, x + 37, y + 6, 47, 3, '#4c5658');
  if (kind === 'rickshaw') { poly(a, [[x + 6, y - 31], [x + 46, y - 33], [x + 60, y - 17], [x + 61, y + 2], [x + 3, y + 2]], '#3f7868'); poly(a, [[x + 6, y - 31], [x + 44, y - 33], [x + 50, y - 23], [x + 4, y - 22]], '#b7a05b'); P(x + 10, y - 20, 18, 15, '#354e54'); poly(a, [[x + 38, y - 22], [x + 45, y - 22], [x + 54, y - 12], [x + 39, y - 11]], '#92a79e'); P(x + 9, y - 2, 42, 2, '#86a387'); }
  else { poly(a, [[x, y - 14], [x + 13, y - 16], [x + 25, y - 31], [x + 57, y - 31], [x + 70, y - 15], [x + 78, y - 11], [x + 76, y + 2], [x + 1, y + 2]], color); poly(a, [[x + 25, y - 28], [x + 39, y - 28], [x + 39, y - 16], [x + 17, y - 16]], '#63828d'); poly(a, [[x + 42, y - 28], [x + 56, y - 28], [x + 66, y - 16], [x + 42, y - 16]], '#63828d'); P(x + 1, y - 12, 74, 2, shade(color, .22)); P(x + 5, y, 67, 2, shade(color, -.3)); P(x + 43, y - 11, 7, 1, '#afb6a4'); }
  for (const xx of [x + 16, x + 60]) { oval(a, xx, y + 3, 8, 8, '#2d3a42'); oval(a, xx, y + 3, 4, 4, '#929c94'); oval(a, xx, y + 3, 2, 2, '#4f5e62'); }
  (a.T.lamps > .5 ? a.E : a.P)(x + 70, y - 11, 5, 4, '#d7c592'); P(x + 2, y - 9, 3, 4, '#a85643');
}
function layers(opts = {}) {
  const id = typeof opts === 'string' ? opts : opts.id || 'city';
  return { sky, far: far(id), roof: roofFor(id), backWall: backWall(id), sign, board, ground: ground(id), furnBack: furniture(id), tables: tables(id), counter: counter(id), glass, canopy: canopy(id), foliage: foliage(id), emit };
}
window.TapriEnv = { profiles, ink: INK, poly, oval, stroke, texture, ridge, mix, tree, pine: (a, x, y, h) => tree(a, x, y, h, x + y, 'pine'), palm: (a, x, y, h) => tree(a, x, y, h, x + y, 'palm'), hut, building, sky, far, roof: () => roofFor('city'), backWall: () => backWall('city'), ground: () => ground('city'), canopy: () => canopy('city'), foliage: () => foliage('city'), clouds, birds, pennants, vehicle, layers };
})();
