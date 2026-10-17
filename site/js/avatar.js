/* Your character: a small model (choices) -> a rig style (Sprites), a live preview, and the editor dialog.
   The model is saved in localStorage; the built style is what gets drawn and what other people in the room receive. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const SKIN = ['#e0b48c', '#d5a57e', '#c99770', '#b58359', '#a76f48', '#925e3d', '#805239', '#5f3b28'];
const HAIR_C = ['#16191a', '#252a28', '#34352d', '#4a3222', '#6e4524', '#9a6a33', '#b8864a', '#9d9e90', '#c8c4b0', '#7a2f2a', '#3d4f7a'];
const SHIRT_C = ['#bab39d', '#637a83', '#8f5649', '#667b62', '#ac915d', '#6c6778', '#a9aaa1', '#3b4851', '#a47850', '#778c8d', '#886475', '#c9c4b4', '#b8483a', '#3f6fa8', '#d19a2e', '#2f2f35'];
const PANTS_C = ['#35424c', '#485969', '#6c604a', '#a39c81', '#4b5d53', '#5f5145', '#23262b', '#7b6a8a'];
const DUPATTA_C = [null, '#b09865', '#a66c54', '#759397', '#8d4b6a', '#4d7a5a', '#c8a23a'];
const CAP_C = [null, '#657e7c', '#8a4a3a', '#3b4851', '#c9c4b4'];
const OUTFITS = { m: ['shirt', 'kurta', 'tee', 'hoodie', 'waistcoat', 'office', 'traveler', 'sweater', 'shawl', 'dhoti', 'lungi', 'fisher', 'turban'], f: ['kurta', 'shirt', 'tee', 'hoodie', 'sweater', 'shawl', 'saree'] };
const HAIR = { m: ['short', 'parted', 'curly', 'bald'], f: ['long', 'short', 'parted', 'curly'] };
const OUTFIT_LABEL = { shirt: 'Shirt', kurta: 'Kurta', tee: 'T-shirt', hoodie: 'Hoodie', waistcoat: 'Waistcoat', office: 'Office', traveler: 'Traveller', sweater: 'Sweater', shawl: 'Shawl', dhoti: 'Dhoti', lungi: 'Lungi', fisher: 'Fisher', turban: 'Turban', saree: 'Saree' };
const HAIR_LABEL = { short: 'Short', parted: 'Side part', curly: 'Curly', bald: 'Bald', long: 'Long' };
const pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);

/* model -> rig style */
function build(m) {
  const s = { female: !!m.female, age: m.age, skin: m.skin, hc: m.hc, hair: m.hair, outfit: m.outfit, shirt: m.shirt, pants: m.pants, shoe: '#3d3b33', sandals: false,
    dupatta: m.female ? m.dupatta : null, cap: !m.female ? m.cap : null, glasses: !!m.glasses, must: !m.female && (m.facial === 'mustache' || m.facial === 'beard'), beard: !m.female && m.facial === 'beard', stubble: !m.female && m.facial === 'stubble',
    check: !!m.check, bindi: !!m.female && !!m.bindi, graphic: m.graphic, h: m.h, seed: m.seed, mass: m.mass, posture: m.posture, cheek: m.cheek, wrist: m.wrist };
  const o = m.outfit;
  if (['dhoti', 'turban'].includes(o)) { s.pants = '#c6bea2'; s.sandals = true; s.wrap = 'dhoti'; }
  if (['lungi', 'fisher'].includes(o)) { s.sandals = true; s.wrap = 'lungi'; }
  if (o === 'turban') s.turban = m.accent;
  if (o === 'fisher') s.fisherCap = '#c3b58f';
  if (o === 'shawl') s.shawl = m.accent;
  if (o === 'waistcoat') s.vest = m.accent;
  if (o === 'office') s.lanyard = '#718e92';
  if (o === 'traveler') s.bag = m.accent;
  return s;
}
function randomModel() {
  const female = Math.random() < 0.45, age = pick(['young', 'young', 'mid', 'mid', 'mid', 'old']), n = Math.floor(rnd(1, 1000));
  return { female, age, skin: pick(SKIN), hc: age === 'old' ? pick(HAIR_C.slice(7, 9)) : pick(HAIR_C.slice(0, 7)), hair: pick(HAIR[female ? 'f' : 'm']), outfit: pick(OUTFITS[female ? 'f' : 'm'].slice(0, 7)),
    shirt: pick(SHIRT_C), pants: pick(PANTS_C), dupatta: female ? pick(DUPATTA_C) : null, cap: !female && n % 6 === 0 ? CAP_C[1] : null, glasses: n % 5 === 0, facial: female ? 'none' : pick(['none', 'none', 'stubble', 'mustache', 'beard']),
    bindi: female && n % 2 === 0, check: n % 3 === 0, graphic: pick(['#bda06a', '#925943', '#6d8d80']), h: +(female ? rnd(0.94, 0.99) : rnd(0.97, 1.05)).toFixed(2), seed: n, mass: pick([0.91, 1, 1.12]), posture: (n % 5 - 2) * 0.3, cheek: n % 3, wrist: n % 2 ? 1 : -1,
    accent: pick(['#b7844c', '#b46748', '#6b5c4b', '#56645e', '#8d8572']) };
}
function fix(m) { // keep a (possibly old/odd) model valid
  const d = randomModel(); m = Object.assign(d, m || {}); const g = m.female ? 'f' : 'm';
  if (!OUTFITS[g].includes(m.outfit)) m.outfit = OUTFITS[g][0]; if (!HAIR[g].includes(m.hair)) m.hair = HAIR[g][0]; return m;
}
let model = fix((() => { try { return JSON.parse(localStorage.getItem('tapri.avatar')); } catch (e) { return null; } })());
const listeners = [];
function save() { try { localStorage.setItem('tapri.avatar', JSON.stringify(model)); } catch (e) {} listeners.forEach(f => f(build(model))); drawAll(); }

/* preview: a seated figure drawn with the real rig, cropped and scaled up */
const previews = new Set();
function drawPreview(cv, style, expr) {
  try {
    const K = Sprites.BW / 170, W = 74 * K, H = 112 * K, ox = Sprites.ORIGX, oy = Sprites.ORIGY;
    const b = Art.mk(Sprites.BW, Sprites.BH); b.x.clearRect(0, 0, Sprites.BW, Sprites.BH);
    Sprites.sit(b.x, style, { expr: expr || 'n', blink: false, look: { x: 0, y: 0 }, legPose: 0, arms: {}, t: 0, holder: {} }, 1);
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
    const sc = Math.min(cv.width / W, cv.height / H); const dw = W * sc, dh = H * sc;
    x.drawImage(b.c, ox - W / 2, oy - 106 * K, W, H, (cv.width - dw) / 2, cv.height - dh, dw, dh);
  } catch (e) { console.warn('avatar preview', e); }
}
function drawAll() { const st = build(model); for (const c of previews) drawPreview(c, st, c.dataset.expr); }
function bindPreview(cv) { previews.add(cv); drawPreview(cv, build(model), cv.dataset.expr); }

/* editor dialog */
let ed = null;
function chip(label, on, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (on ? ' on' : ''); b.textContent = label; b.onclick = fn; return b; }
function swatches(list, cur, fn, allowNone) { const w = document.createElement('div'); w.className = 'sw'; for (const c of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch' + (c === cur ? ' on' : '') + (c ? '' : ' none'); if (c) b.style.background = c; b.title = c || 'none'; b.setAttribute('aria-label', c || 'none'); b.onclick = () => fn(c); w.appendChild(b); } return w; }
function section(title, ...kids) { const s = document.createElement('section'); const h = document.createElement('h4'); h.textContent = title; s.appendChild(h); kids.forEach(k => s.appendChild(k)); return s; }
function row(...kids) { const r = document.createElement('div'); r.className = 'chips'; kids.forEach(k => r.appendChild(k)); return r; }
function renderEditor() {
  const body = $('avBody'), keep = body.scrollTop; body.textContent = ''; const m = model, g = m.female ? 'f' : 'm', set = o => { Object.assign(model, o); model = fix(model); save(); renderEditor(); };
  body.appendChild(section('Body',
    row(chip('Woman', m.female, () => set({ female: true, hair: 'long', outfit: 'kurta', facial: 'none', cap: null })), chip('Man', !m.female, () => set({ female: false, hair: 'short', outfit: 'shirt', dupatta: null, bindi: false }))),
    row(...['young', 'mid', 'old'].map(a => chip({ young: 'Young', mid: 'Adult', old: 'Elder' }[a], m.age === a, () => set({ age: a })))),
    row(...[[0.91, 'Slim'], [1, 'Regular'], [1.12, 'Broad']].map(([v, l]) => chip(l, m.mass === v, () => set({ mass: v })))),
    row(...[[m.female ? 0.95 : 0.97, 'Short'], [m.female ? 0.98 : 1.01, 'Average'], [m.female ? 1.01 : 1.06, 'Tall']].map(([v, l]) => chip(l, Math.abs(m.h - v) < 0.012, () => set({ h: v }))))));
  body.appendChild(section('Skin', swatches(SKIN, m.skin, c => set({ skin: c }))));
  body.appendChild(section('Hair', row(...HAIR[g].map(h => chip(HAIR_LABEL[h], m.hair === h, () => set({ hair: h })))), swatches(HAIR_C, m.hc, c => set({ hc: c }))));
  body.appendChild(section('Outfit', row(...OUTFITS[g].map(o => chip(OUTFIT_LABEL[o], m.outfit === o, () => set({ outfit: o })))),
    swatches(SHIRT_C, m.shirt, c => set({ shirt: c })),
    ...(['dhoti', 'turban'].includes(m.outfit) ? [] : [swatches(PANTS_C, m.pants, c => set({ pants: c }))]),
    ...(['turban', 'shawl', 'waistcoat', 'traveler'].includes(m.outfit) ? [swatches(['#b7844c', '#b46748', '#c0a16a', '#6b5c4b', '#56645e', '#5d6770', '#8d8572', '#8e7268', '#7a8982', '#617877'], m.accent, c => set({ accent: c }))] : [])));
  const extras = [chip('Glasses', !!m.glasses, () => set({ glasses: !m.glasses }))];
  if (m.female) extras.push(chip('Bindi', !!m.bindi, () => set({ bindi: !m.bindi })));
  body.appendChild(section('Extras', row(...extras),
    ...(m.female ? [swatches(DUPATTA_C, m.dupatta, c => set({ dupatta: c })), Object.assign(document.createElement('small'), { textContent: 'Dupatta colour' })]
      : [row(...[['none', 'Clean'], ['stubble', 'Stubble'], ['mustache', 'Moustache'], ['beard', 'Beard']].map(([v, l]) => chip(l, m.facial === v, () => set({ facial: v })))), swatches(CAP_C, m.cap, c => set({ cap: c })), Object.assign(document.createElement('small'), { textContent: 'Cap' })])));
  body.scrollTop = keep;
}
function openEditor() {
  if (!ed) {
    ed = $('avatarEd'); $('avClose').onclick = $('avDone').onclick = () => { ed.hidden = true; };
    $('avShuffle2').onclick = () => { shuffle(); renderEditor(); };
    ed.addEventListener('pointerdown', e => { if (e.target === ed) ed.hidden = true; });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !ed.hidden) ed.hidden = true; });
    bindPreview($('avBig'));
  }
  renderEditor(); ed.hidden = false; drawAll();
}
function shuffle() { const keepName = true; model = fix(randomModel()); save(); return keepName; }
const api = window.TapriAvatar = { style: () => build(model), onChange: f => listeners.push(f), openEditor, shuffle: () => { shuffle(); if (ed && !ed.hidden) renderEditor(); }, bindPreview, drawAll };
// the intro preview + buttons
const prev = $('avPrev'); if (prev) bindPreview(prev);
$('avEdit') && ($('avEdit').onclick = openEditor); $('avPrev') && ($('avPrev').onclick = openEditor); $('avShuffle') && ($('avShuffle').onclick = api.shuffle);
// themes load asynchronously and can change the rig: redraw once everything is up
setTimeout(drawAll, 600); setTimeout(drawAll, 2500);
})();
