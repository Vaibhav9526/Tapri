(() => {
'use strict';
const { L, D, clamp, lerp, rnd, pick, W } = Tapri;
const $ = id => document.getElementById(id);
const cv = $('cv'), main = cv.getContext('2d'); main.imageSmoothingEnabled = false;
const LW = L.W, LH = L.H, GROUND = L.ground;
const store = { get() { try { return JSON.parse(localStorage.getItem('tapri2') || '{}'); } catch (e) { return {}; } }, set(o) { try { localStorage.setItem('tapri2', JSON.stringify(Object.assign(store.get(), o))); } catch (e) {} } };
Tapri.mouse = { x: 0, y: 0, t: -99, on: false };
const owner = Tapri.owner, helper = Tapri.helper, people = Tapri.people;
let started = false, T = 0, last = performance.now(), sceneName = 'day', autoScene = true, rainTouched = false, radioOn = true, layers = null, glass = null, vignette = null;

/* ====================== actors: lit, outlined, reflected ====================== */
const BW = Sprites.BW, BH = Sprites.BH, OXs = Sprites.ORIGX, OYs = Sprites.ORIGY;
const buf = Art.mk(BW, BH), sil = Art.mk(BW, BH);
function lightSide(ax) { if (Art.T.lamps > 0.3) { let best = null, bd = 1e9; for (const l of L.lamps.slice(0, 3)) { const d = Math.abs(l.x - ax); if (d < bd) { bd = d; best = l; } } return best.x > ax ? 1 : -1; } return -1; }
const bbc = document.createElement('canvas'), bbx = bbc.getContext('2d', { willReadFrequently: true }); let boxes = {};
function bboxOf(img) { const s = 8, tw = Math.ceil(img.width / s), th = Math.ceil(img.height / s); bbc.width = tw; bbc.height = th; bbx.clearRect(0, 0, tw, th); bbx.drawImage(img, 0, 0, tw, th); const d = bbx.getImageData(0, 0, tw, th).data; let x0 = tw, y0 = th, x1 = -1, y1 = -1; for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (d[(y * tw + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) return null; const X0 = Math.max(0, (x0 - 1) * s), Y0 = Math.max(0, (y0 - 1) * s), X1 = Math.min(img.width, (x1 + 2) * s), Y1 = Math.min(img.height, (y1 + 2) * s); return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 }; }
function paintBackdrop() { const b = document.getElementById('bd'), x = b.getContext('2d'); x.imageSmoothingEnabled = true; x.clearRect(0, 0, b.width, b.height); for (const k of ['sky', 'far', 'back', 'furnBack', 'tables']) x.drawImage(layers[k], 0, 0, b.width, b.height); x.fillStyle = 'rgba(0,0,12,.4)'; x.fillRect(0, 0, b.width, b.height); }
function computeBoxes() { boxes = new Map(); for (const k of ['furnBack', 'front', 'tables', 'canopy', 'emit']) boxes.set(layers[k], bboxOf(layers[k])); boxes.set(glass, bboxOf(glass)); }
function blit(c, img) { const b = boxes.get(img); if (b === undefined) return c.drawImage(img, 0, 0); if (b === null) return; c.drawImage(img, b.x, b.y, b.w, b.h, b.x, b.y, b.w, b.h); }
function drawActor(fn, ax, ay, o = {}) {
  const K = Art.K || 1; ax = Math.round(ax * K); ay = Math.round(ay * K); const b = buf.x; b.clearRect(0, 0, BW, BH); fn(b, lightSide(ax / K)); const hw = Math.min(OXs, Math.round(112 * K / 2 * 1.0) + 8 * K), sx = OXs - hw, sw2 = hw * 2;
  const lowQ = Tapri.quality >= 1, s = sil.x; s.globalCompositeOperation = 'source-over'; if (o.outline !== false) { s.clearRect(sx, 0, sw2, BH); s.drawImage(buf.c, sx, 0, sw2, BH, sx, 0, sw2, BH); s.globalCompositeOperation = 'source-in'; s.fillStyle = Art.tone((Art.theme && Art.theme.outlineColor) || '#150c08'); s.fillRect(sx, 0, sw2, BH); s.globalCompositeOperation = 'source-over'; }
  const x0 = ax - OXs, y0 = ay - OYs;
  if (o.shadow !== false) { const rx = (o.sw || 11) * K; main.fillStyle = 'rgba(0,0,0,.26)'; main.fillRect(ax - rx, ay, rx * 2, K); main.fillRect(ax - rx + 2 * K, ay + K, rx * 2 - 4 * K, K); main.fillRect(ax - rx + 5 * K, ay - K, rx * 2 - 10 * K, K); }
  if ((Art.T.wet || Tapri.rainLevel > 0.3) && o.reflect !== false) { if (Tapri.quality < 2) { main.save(); main.globalAlpha = 0.12; main.translate(0, 2 * ay); main.scale(1, -1); main.drawImage(buf.c, sx, 0, sw2, OYs, x0 + sx, y0, sw2, OYs); main.restore(); } }
  main.save(); if (o.alpha !== undefined) main.globalAlpha = o.alpha;
  if (o.outline !== false) { const ow = (Art.theme && Art.theme.outlineW) || 1; for (const [dx, dy] of lowQ ? [[-ow, 0], [ow, 0], [0, ow]] : ow > 1 ? [[-ow, 0], [ow, 0], [0, -ow], [0, ow], [-1, -1], [1, -1], [-1, 1], [1, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]]) main.drawImage(sil.c, sx, 0, sw2, BH, x0 + sx + dx, y0 + dy, sw2, BH); }
  main.drawImage(buf.c, sx, 0, sw2, BH, x0 + sx, y0, sw2, BH); main.restore();
}

/* ====================== dog (see dog.js) & sparrows ====================== */
const dog = Tapri.dog;
const sparrows = []; Tapri.sparrows = sparrows;
function sparrowsUpdate(dt) {
  const T = Tapri.T, day = sceneName === 'day' || sceneName === 'morning';
  if (day && sparrows.length < 2 && Math.random() < dt * 0.06) sparrows.push({ x: rnd(30, LW - 30), y: rnd(298, 308), mode: 'peck', dir: Math.random() < 0.5 ? 1 : -1, hop: 0, fly: 0, vx: 0, vy: 0 });
  for (const s of sparrows) {
    const near = people.some(p => (p.state === 'walkin' || p.state === 'leave') && Math.abs(p.x - s.x) < 40 && Math.abs(p.gy - s.y) < 14) || (helper.moving && Math.abs(helper.x - s.x) < 36);
    if (s.mode !== 'fly' && near) { s.mode = 'fly'; s.vx = s.dir * rnd(40, 70); s.vy = -rnd(50, 80); TA.sfx('sparrow', { vol: 0.8, pan: clamp(s.x / 240 - 1, -1, 1) }); }
    if (s.mode === 'peck') { if (Math.random() < dt * 0.6) { s.mode = 'hop'; s.hop = 0.3; s.dir = Math.random() < 0.5 ? 1 : -1; } if (Math.random() < dt * 0.02) { s.mode = 'fly'; s.vx = s.dir * 50; s.vy = -60; } }
    else if (s.mode === 'hop') { s.x += s.dir * 24 * dt; s.hop -= dt; if (s.hop <= 0) s.mode = 'peck'; } else { s.x += s.vx * dt; s.y += s.vy * dt; s.vy -= 14 * dt; s.fly += dt * 20; }
  }
  for (let i = sparrows.length - 1; i >= 0; i--) if (sparrows[i].y < -10 || sparrows[i].x < -10 || sparrows[i].x > LW + 10) sparrows.splice(i, 1);
}
/* ====================== radio on the shelf, clock ====================== */
const radio = { hover: false, wiggle: 0, nextNote: 0, x: L.radio.x, y: L.radio.y }; Tapri.radio = radio; Tapri.radioOn = () => radioOn; Object.defineProperty(Tapri, 'layers', { get: () => layers });
/* ====================== frame ====================== */
function step(dt) {
  Tapri.T = T; Tapri.dt = dt; Tapri.runTimers(); Tapri.beat = TA.beat(T); Tapri.rainLevel = TA.state.rain;
  if (started) { owner.update(dt); Tapri.updateCrowd(dt); Tapri.street.update(dt); dog.update(dt); sparrowsUpdate(dt); Tapri.updateFX(dt, sceneName, TA.state.rain); }
}
function render() {
  const c = main; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(layers.sky, 0, 0); Art.runDynamic('sky', c, T, Tapri.dt); c.drawImage(layers.far, 0, 0); Art.runDynamic('far', c, T, Tapri.dt); c.drawImage(layers.back, 0, 0); Tapri.stage.drawClock(c); Tapri.stage.drawRadio(c); blit(c, layers.furnBack); dog.drawPuddles(c);
  try { drawActor(owner.draw, owner.x, owner.groundY, { shadow: false, reflect: false }); } catch (e) { if (!window.__oe) { window.__oe = 1; console.log('OWNER_DRAW_ERR ' + e.stack); } }
  blit(c, layers.front); Tapri.drawCounterProps(c); blit(c, glass);
  const act = people.concat(Tapri.street.actors); act.push(helper);
  const A = act.filter(p => (p.gy || 0) <= GROUND + 0.5).sort((a, b) => a.gy - b.gy), B = act.filter(p => p.gy > GROUND + 0.5).sort((a, b) => a.gy - b.gy);
  drawActor(dog.draw, dog.x, dog.y, { sw: 14, outline: true });
  const drawP = p => { if (p === helper) drawActor(helper.draw, helper.x, helper.gy, { sw: 10 }); else if (p.state === 'seated') drawActor(p.draw.bind(p), p.x, GROUND, { sw: 13 }); else drawActor(p.draw.bind(p), p.x, p.gy, { sw: 10 }); };
  A.forEach(drawP); blit(c, layers.tables); Tapri.stage.drawTableItems(c); B.forEach(drawP); Tapri.street.drawExtras(c); Art.runDynamic('front', c, T, Tapri.dt);
  Tapri.stage.drawSparrows(c); blit(c, layers.canopy); Tapri.stage.drawFoliage(c, layers, T); Tapri.drawParticles(c, sceneName); Tapri.stage.drawTub(c);
  c.save(); c.globalCompositeOperation = 'lighter'; blit(c, layers.emit);
  const lam = Art.T.lamps; if (lam > 0.05) L.lamps.forEach((l, i) => { const f = lam * l.a * (0.86 + 0.14 * Math.sin(T * 6 + i * 2) + (Math.random() < 0.015 ? -0.1 : 0)); c.globalAlpha = clamp(f, 0, 1) * 0.85; const K = Art.K || 1, sp = Art.glowSprite(l.r * K, Art.T.lampCol); c.drawImage(sp, (l.x - l.r) * K, (l.y - l.r) * K); });
  c.restore(); c.globalAlpha = 1; Tapri.drawRain(c); if (vignette && Tapri.quality < 2 && !bd.has) c.drawImage(vignette, 0, 0);
  if (Art.theme && Art.theme.post && !(Tapri.quality >= 1)) { try { Art.theme.post(c, T, Art.api); } catch (e) { if (!window.__pe) { window.__pe = 1; console.log('THEME_POST_ERR ' + e.message); } } }
}
/* ====================== camera (cover the screen, pan on tall phones) ====================== */
const stage = $('stage'), viewport = $('viewport'); let vw = 0, vh = 0, S = 1, camX = 0, camY = 0, camTarget = 240, manualUntil = 0, drag = null;
let availW = 0, availH = 0, zoomClose = false, focusOn = false, focusW = 250, focusY = 245;
/* ====================== painted backdrop (env.backdrop) ====================== */
/* env.backdrop = { day:{desktop:{src,rect:[x,y,w,h]}, mobile:{...}}, dusk, night, morning }. rect = where the 480x320 scene sits inside the image (image px). */
const bd = { has: false, el: null, imgs: [], src: '' };
function bdPortrait() { return window.innerWidth < 760 || window.innerHeight > window.innerWidth * 1.15; }
function pickBackdrop() { const env = Art.ENVS && Art.ENVS[world.env], B = env && env.backdrop; if (!B) return null; const t = B[sceneName] || B.day || B.morning || B.dusk || B.night; if (!t) return null; const e = bdPortrait() ? (t.mobile || t.desktop) : (t.desktop || t.mobile); return e && e.src && e.rect ? e : null; }
function updateBackdrop() {
  const e = pickBackdrop(); bd.has = !!e; bd.entry = e; document.body.classList.toggle('hasbd', bd.has);
  if (!bd.el) { bd.el = document.createElement('div'); bd.el.id = 'backdrop'; bd.el.setAttribute('aria-hidden', 'true'); viewport.insertBefore(bd.el, viewport.firstChild); }
  bd.el.style.display = bd.has ? '' : 'none';
  if (!e) { if (bd.src) { bd.src = ''; bd.imgs.forEach(i => i.remove()); bd.imgs = []; } return; }
  const key = e.src + '|' + e.rect.join(','); if (key === bd.src) return; bd.src = key;
  const im = new Image(); im.className = 'bdimg'; im._rect = e.rect; im.decoding = 'async'; im.style.opacity = '0';
  im.onload = () => { if (bd.src !== key) return; im.style.width = im.naturalWidth + 'px'; im.style.height = im.naturalHeight + 'px'; bd.el.appendChild(im); const old = bd.imgs; bd.imgs = [im].concat(old); alignBackdrop(); requestAnimationFrame(() => requestAnimationFrame(() => { im.style.opacity = '1'; })); setTimeout(() => { old.forEach(o => o.remove()); bd.imgs = bd.imgs.filter(o => !old.includes(o)); }, 1100); };
  im.onerror = () => { if (bd.src === key) console.log('BACKDROP_LOAD_ERR ' + e.src); };
  im.src = e.src;
}
function alignBackdrop() {
  if (!bd.has) return; for (const im of bd.imgs) { if (!im.naturalWidth) continue; const [rx, ry, rw] = im._rect, k = (LW * S) / rw, tx = camX - rx * k, ty = camY - ry * k, l = im._l;
    if (l && Math.abs(l[0] - tx) < 0.1 && Math.abs(l[1] - ty) < 0.1 && Math.abs(l[2] - k) < 0.00005) continue; im._l = [tx, ty, k]; im.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + k.toFixed(5) + ')'; }
}
function layout() { vw = window.innerWidth; vh = window.innerHeight; const open = panel.classList.contains('open'), mob = vw <= 760; availW = open && !mob ? vw - 372 : vw; availH = open && mob ? Math.max(vh * 0.4, vh - panel.offsetHeight - 84) : vh; const portrait = vw < 760 || vh > vw * 1.15; updateBackdrop(); S = focusOn ? Math.min(availW / focusW, availH * 1.3 / LH) : !portrait ? (bd.has ? Math.min : Math.max)(availW / LW, availH / LH) : portrait && zoomClose ? Math.min(Math.max(availW / 200, availH * 0.6 / LH), availH / LH) : Math.min(availW / LW, availH / LH); stage.style.width = LW * S + 'px'; stage.style.height = LH * S + 'px'; document.documentElement.style.setProperty('--u', S + 'px'); camY = focusOn ? clamp(availH * 0.6 - focusY * S, Math.min(0, availH - LH * S), 0) : !portrait && !bd.has ? clamp(availH - 318 * S, Math.min(0, availH - LH * S), 0) : Math.max(0, (availH - LH * S) / 2); if (bd.has && bd.entry && bd.entry.size && !focusOn) { const [, ry, rw] = bd.entry.rect, [, ih] = bd.entry.size, k = LW * S / rw, lo = availH - (ih - ry) * k, hi = ry * k; if (lo <= hi) camY = clamp(camY, lo, hi); }   // keep the painted backdrop covering the screen top to bottom
  if (open && mob) camY = Math.max(camY, 58); applyCam(true); }
function applyCam(snap) { const minX = Math.min(0, availW - LW * S); const want = LW * S <= availW + 2 && !focusOn ? (availW - LW * S) / 2 : clamp(availW / 2 - camTarget * S, minX, 0); camX = snap ? want : lerp(camX, want, 0.045); stage.style.transform = `translate3d(${camX.toFixed(1)}px,${camY.toFixed(1)}px,0)`; alignBackdrop(); }
function camFollow() { const T = Tapri.T; if ((LW * S <= availW + 4 && !focusOn) || T < manualUntil) return; let t = owner.x; for (const [e, b] of bubs) { if (b.kind !== 'note' && e !== owner && e.x !== undefined) { t = e.x; break; } } if (helper.carrying) t = helper.x; camTarget = lerp(camTarget, clamp(t, 150, 330), 0.04); }
window.addEventListener('resize', () => { layout(); if (Art.T) ambient(); });
function toggleZoom() { zoomClose = !zoomClose; $('btnZoom').classList.toggle('on', zoomClose); camTarget = clamp(owner.x, 120, 360); manualUntil = 0; layout(); }
$('btnZoom').onclick = () => { TA.resume(); toggleZoom(); }; let lastTap = 0;
viewport.addEventListener('pointerdown', e => { drag = { x: e.clientX, t: camTarget, moved: false }; });
viewport.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); const lx = (e.clientX - r.left) / S, ly = (e.clientY - r.top) / S; Tapri.mouse.x = lx; Tapri.mouse.y = ly; Tapri.mouse.t = Tapri.T; Tapri.mouse.on = true; radio.hover = inRadio(lx, ly); viewport.style.cursor = hitTest(lx, ly) ? 'pointer' : 'default';
  if (drag && (e.pointerType !== 'mouse' || e.buttons)) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved && LW * S > availW + 4) { camTarget = clamp(drag.t - dx / S, 120, 360); manualUntil = Tapri.T + 9; applyCam(true); } } });
viewport.addEventListener('pointerup', e => { const moved = drag && drag.moved; drag = null; if (moved) return; if (e.pointerType !== 'mouse' && vw < 760) { const now = performance.now(); if (now - lastTap < 320) { lastTap = 0; toggleZoom(); return; } lastTap = now; } const r = stage.getBoundingClientRect(); onTap((e.clientX - r.left) / S, (e.clientY - r.top) / S); });
viewport.addEventListener('pointerleave', () => { Tapri.mouse.on = false; radio.hover = false; });

/* ====================== taps ====================== */
function inRadio(x, y) { return x > radio.x - 20 && x < radio.x + 20 && y > radio.y - 32 && y < radio.y + 4; }
function hitTest(x, y) {
  if (inRadio(x, y)) return { k: 'radio' };
  for (const p of people.slice().reverse()) { const sit = p.state === 'seated'; const ph = Sprites.metrics ? Sprites.metrics(p.style, {}, sit).height : (sit ? 82 : 98); if (Math.abs(p.x - x) < 14 && y > p.gy - ph && y < p.gy) return { k: 'person', p }; }
  if (Math.abs(helper.x - x) < 12 && y > helper.gy - 90 && y < helper.gy) return { k: 'helper' };
  if (Math.abs(owner.x - x) < 16 && y > owner.groundY - 96 && y < 210) return { k: 'owner' };
  if (dog.hit(x, y)) return { k: 'dog' };
  return null;
}
function onTap(x, y) {
  TA.resume(); const h = hitTest(x, y); if (!h) return;
  if (h.k === 'radio') { radio.wiggle = Tapri.T + 0.25; togglePanel(); TA.pop(); }
  else if (h.k === 'dog') { dog.bark(2, Tapri.mouse.x); }
  else if (h.k === 'owner') { owner.smileUntil = Tapri.T + 2.2; if (W.stock.samosa >= 3 && Math.random() < 0.6) owner.say('o', D.owner[0]); }
  else if (h.k === 'helper') { helper.talkUntil = 0; }
  else { const p = h.p; p.smileUntil = Tapri.T + 2.4; p.waveUntil = Tapri.T + 1.4; }
}

/* ====================== speech bubbles (DOM) ====================== */
const bubEl = $('bubbles'), bubs = new Map();
Tapri.hooks.bubble = (ent, text, ms, kind) => {
  if (!started && kind !== 'note') return; Tapri.stats && Tapri.stats.bubbles.push(text); const old = bubs.get(ent); if (old) { old.el.remove(); bubs.delete(ent); }
  if (kind !== 'note' && [...bubs.values()].filter(b => b.kind !== 'note').length >= 3) { const o = [...bubs.entries()].find(([e, b]) => b.kind !== 'note'); if (o) { o[1].el.remove(); bubs.delete(o[0]); } }
  const el = document.createElement('div'); el.className = 'bub ' + (kind || 'say'); el.textContent = text; const tail = document.createElement('i'); tail.className = 'tail'; el.appendChild(tail); bubEl.appendChild(el);
  const b = { el, ent, kind, until: Tapri.T + ms / 1000, born: Tapri.T, fixed: kind === 'note' ? (ent.anchor ? ent.anchor() : null) : null }; bubs.set(ent, b); requestAnimationFrame(() => el.classList.add('in'));
};
function anchorOf(ent) { if (ent === owner) return { x: owner.x, y: owner.groundY - 100 }; if (ent === helper) return { x: helper.x, y: helper.gy - 92 }; if (ent.anchor) return ent.anchor(); return { x: ent.x, y: ent.y || 120 }; }
function placeBubbles() {
  const rects = [], hudTop = 64;
  for (const [ent, b] of [...bubs.entries()]) {
    if (Tapri.T > b.until || ent.dead) { b.el.classList.remove('in'); b.el.classList.add('out'); const el = b.el; setTimeout(() => el.remove(), 400); bubs.delete(ent); continue; }
    const a = b.fixed || anchorOf(ent), ax = a.x * S, ay = a.y * S, w = b.el.offsetWidth, h = b.el.offsetHeight; if (!w) continue;
    const minC = -camX + w / 2 + 8, maxC = -camX + availW - w / 2 - 8; const cx = clamp(ax, Math.min(minC, maxC), Math.max(minC, maxC)); let top = Math.max(ay - 6, -camY + hudTop + h + 4);
    if (b.kind !== 'note') for (const r of rects) { if (cx - w / 2 < r.r && cx + w / 2 > r.l && top - h < r.b && top > r.t) top = r.t - 4; }
    rects.push({ l: cx - w / 2, r: cx + w / 2, t: top - h, b: top });
    b.el.style.transform = `translate(${(cx - w / 2).toFixed(1)}px,${(top - h).toFixed(1)}px)`; b.el.style.setProperty('--tx', clamp(ax - (cx - w / 2), 10, w - 10) + 'px');
  }
}

/* ====================== scene ====================== */
/* ====================== worlds: theme (look) x environment (place) ====================== */
const world = { env: 'mohalla', theme: 'chitra' };
function applyWorldHooks() { const th = Art.THEMES[world.theme] || Art.THEMES.retro, env = Art.ENVS[world.env] || Art.ENVS.city; for (const k of Object.keys(Sprites.hooks)) delete Sprites.hooks[k]; Object.assign(Sprites.hooks, th.actors || {}); Sprites.envPeople = env.people || null; TA.setEnvMix(env.mix);  if (window.TapriAvatar) setTimeout(() => TapriAvatar.drawAll(), 0); }
function setWorld(o) { Object.assign(world, o); if (!Art.ENVS[world.env]) world.env = 'city'; if (!Art.THEMES[world.theme]) world.theme = 'retro'; store.set({ world: { env: world.env, theme: world.theme } }); buildScene(sceneName); bubs.forEach(b => b.el.remove()); bubs.clear(); Tapri.parts.leaves.length = 0; Tapri.parts.moths.length = 0; sparrows.length = 0; Tapri.resetCrowd(); owner.start(); dog.reset(); renderWorldUI(); changed('world'); }
const WORLD_ICON = { city: 'building', coast: 'waves', desert: 'tent', hill: 'mountain', railway: 'train', rural: 'sprout', urban: 'building2', village: 'home', retro: 'radio', comic: 'comic' };
function renderWorldUI() {
  const tb = $('themes'), eb = $('envs'); tb.innerHTML = ''; eb.innerHTML = '';
  for (const id in Art.THEMES) { const t = Art.THEMES[id], b = document.createElement('button'); b.innerHTML = '<i>' + (WORLD_ICON[id] ? ico(WORLD_ICON[id]) : t.icon) + '</i><span>' + t.label + '</span>'; b.className = id === world.theme ? 'on' : ''; b.onclick = () => { TA.resume(); setWorld({ theme: id }); }; tb.appendChild(b); }
  for (const id in Art.ENVS) { const e = Art.ENVS[id], b = document.createElement('button'); b.innerHTML = '<i>' + (WORLD_ICON[id] ? ico(WORLD_ICON[id]) : e.icon) + '</i><span>' + e.label + '</span>'; b.className = id === world.env ? 'on' : ''; b.onclick = () => { TA.resume(); setWorld({ env: id }); }; eb.appendChild(b); }
}
function toggleWorld(f) { const w = $('world'), o = f !== undefined ? f : !w.classList.contains('open'); w.classList.toggle('open', o); $('btnWorld').classList.toggle('on', o); if (o) togglePanel(false); }
$('btnWorld').onclick = () => { TA.resume(); toggleWorld(); }; $('closeWorld').onclick = () => toggleWorld(false);
function loadScript(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src + '?v=' + Date.now(); s.onload = () => res(true); s.onerror = () => { console.log('WORLD_FILE_FAIL ' + src); res(false); }; document.head.appendChild(s); }); }
async function loadWorldFiles() { for (const f of (window.TAPRI_WORLD_FILES || [])) await loadScript('js/' + f); }
function timeScene() { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 5.5 ? 'night' : h < 10.5 ? 'morning' : h < 17 ? 'day' : h < 19.5 ? 'dusk' : 'night'; }
function ambient() { const portrait = window.innerWidth < 760 || window.innerHeight > window.innerWidth * 1.15, sk = Art.T.sky; let bg = portrait ? `linear-gradient(${sk[0]} 0%, ${sk[2]} 36%, #3a3228 58%, #17130f 100%)` : sk[0]; if (bd.has) bg = '#0b0a12'; document.body.style.background = bg; viewport.style.background = bg; const b = document.getElementById('bd'); if (b) b.style.opacity = portrait ? 0 : 1; }
function buildScene(name) { sceneName = name; Tapri.sceneName = name; applyWorldHooks(); const K0 = Art.K || 1; if (cv.width !== LW * K0) { cv.width = LW * K0; cv.height = LH * K0; main.imageSmoothingEnabled = false; } layers = Art.build(name, world.env, world.theme); glass = Art.glassLayer(); computeBoxes(); paintBackdrop(); { const had = bd.has; updateBackdrop(); if (bd.has !== had) layout(); } document.body.dataset.theme = Art.themeId; document.body.dataset.env = Art.envId;
  const RW = LW * K0, RH = LH * K0, v = Art.mk(RW, RH); const g = v.x.createRadialGradient(RW / 2, RH / 2, RH * 0.45, RW / 2, RH / 2, RW * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, name === 'night' ? 'rgba(0,0,8,.45)' : name === 'dusk' ? 'rgba(10,0,20,.32)' : 'rgba(20,10,0,.18)'); v.x.fillStyle = g; v.x.fillRect(0, 0, RW, RH); vignette = v.c;
  ambient(); document.querySelector('meta[name=theme-color]').setAttribute('content', Art.T.sky[0]); }
function setScene(name) {
  if (name === 'auto') { autoScene = true; name = timeScene(); } else autoScene = false;
  document.querySelectorAll('#dock [data-scene]').forEach(b => b.classList.toggle('on', b.dataset.scene === (autoScene ? 'auto' : name)));
  if (layers && name === sceneName) return;
  buildScene(name); TA.setScene(name); Tapri.parts.leaves.length = 0; Tapri.parts.moths.length = 0; sparrows.length = 0; bubs.forEach(b => b.el.remove()); bubs.clear();
  if (started) { Tapri.resetCrowd(); owner.start(); dog.reset(); }
  changed('world');
  if (!rainTouched && TA.state.rain !== (name === 'night' ? 0.3 : 0)) { TA.set('rain', name === 'night' ? 0.3 : 0); syncSliders(); }
}

/* ====================== UI ====================== */
const panel = $('panel');
function togglePanel(f) { const o = f !== undefined ? f : !panel.classList.contains('open'); panel.classList.toggle('open', o); $('btnRadio').classList.toggle('on', o); if (o) { const w = $('world'); if (w) { w.classList.remove('open'); $('btnWorld').classList.remove('on'); } } layout(); }
$('btnRadio').onclick = () => { TA.resume(); togglePanel(); }; $('closePanel').onclick = () => togglePanel(false); $('grab').onclick = () => togglePanel(false);
document.querySelectorAll('#dock [data-scene]').forEach(b => b.onclick = () => { TA.resume(); setScene(b.dataset.scene); });

function setMuteUI() { const m = TA.muted, bm = $('btnMute'); bm.classList.toggle('muted', m); $('icoWaves').style.display = m ? 'none' : ''; $('icoX').style.display = m ? '' : 'none'; bm.setAttribute('aria-pressed', m); bm.title = m ? 'Unmute (M)' : 'Mute all sounds (M)'; }
function doMute(m) { TA.setMuted(m); store.set({ muted: m }); if (yt && ytReady) { try { m ? yt.mute() : yt.unMute(); } catch (e) {} } setMuteUI(); }
$('btnMute').onclick = () => { TA.resume(); doMute(!TA.muted); };
window.addEventListener('keydown', e => { if (e.key === 'm' || e.key === 'M') { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return; doMute(!TA.muted); } });

const ST = [{ id: 'yt', f: '91.1', n: 'Hamari Playlist' }, { id: 'lofi', f: '98.3', n: 'Lo-fi Chai' }, { id: 'retro', f: '102.5', n: 'Purane Gaane' }, { id: 'baarish', f: '104.7', n: 'Baarish FM' }, { id: 'off', f: '88.0', n: 'Sirf Tapri (no music)' }];
let stIdx = 1; const stBox = $('stations'); ST.forEach((s, i) => { const b = document.createElement('button'); b.textContent = s.f; b.title = s.n; b.onclick = () => tune(i); stBox.appendChild(b); });
function tune(i) { stIdx = (i + ST.length) % ST.length; const s = ST[stIdx]; TA.resume(); [...stBox.children].forEach((b, k) => b.classList.toggle('on', k === stIdx)); $('freq').textContent = s.f; $('sname').textContent = s.n; $('needle').style.left = (6 + stIdx / (ST.length - 1) * 88) + '%'; TA.dialPos = stIdx / (ST.length - 1); $('ytBox').classList.toggle('hidden', s.id !== 'yt'); store.set({ station: s.id }); TA.tune(radioOn ? s.id : 'off'); ytSync(); changed('radio'); }
$('prevSt').onclick = () => tune(stIdx - 1); $('nextSt').onclick = () => tune(stIdx + 1);
Tapri.hooks.radioKnob = () => tune(stIdx + 1);
function setRadio(on) { radioOn = on; $('led').classList.toggle('on', on); TA.setRadio(on); if (on) TA.tune(ST[stIdx].id); ytSync(); }
$('power').onclick = () => { TA.resume(); setRadio(!radioOn); };
function bindSlider(el, key, fn) { el.addEventListener('input', () => { const v = +el.value; fn(v); store.set({ [key]: v }); if (key === 'rain') rainTouched = true; }); }
bindSlider($('vMusic'), 'music', v => { TA.set('music', v); ytVol(); }); bindSlider($('vTone'), 'tone', v => TA.setTone(v));
document.querySelectorAll('[data-k]').forEach(el => bindSlider(el, el.dataset.k, v => TA.set(el.dataset.k, v)));
function syncSliders() { $('vMusic').value = TA.state.music; $('vTone').value = store.get().tone ?? 0.5; document.querySelectorAll('[data-k]').forEach(el => el.value = TA.state[el.dataset.k]); }
const PRESETS = { busy: { crowd: .7, voices: .75, traffic: .5, rain: 0, nature: .5, chai: .55, music: .45, events: .4 }, calm: { crowd: .22, voices: .45, traffic: .14, rain: 0, nature: .55, chai: .35, music: .6, events: .22 }, rain: { crowd: .3, voices: .5, traffic: .2, rain: .75, nature: .15, chai: .45, music: .5, events: .55 }, storm: { crowd: .2, voices: .35, traffic: .15, rain: .95, nature: .1, chai: .4, music: .4, events: .85, scene: 'dusk' }, night: { crowd: .25, voices: .4, traffic: .18, rain: 0, nature: .7, chai: .4, music: .55, events: .3, scene: 'night' }, mela: { crowd: 1, voices: .9, traffic: .75, rain: 0, nature: .3, chai: .75, music: .3, events: .7, scene: 'day' }, music: { crowd: .06, voices: .2, traffic: .05, rain: 0, nature: .1, chai: .12, music: .8, events: .08 } };
document.querySelectorAll('#presets [data-p]').forEach(b => b.onclick = () => { TA.resume(); const p = PRESETS[b.dataset.p]; for (const k in p) if (k !== 'scene') TA.set(k, p[k]); rainTouched = true; if (p.scene) setScene(p.scene); syncSliders(); store.set({ mix: Object.assign({}, TA.state) }); ytVol(); toast(b.textContent.trim()); });

/* ---- panel tabs, toast, sleep timer, now-playing pill, lightning, shortcuts ---- */
function selTab(t) { document.querySelectorAll('#tabs [data-t]').forEach(x => x.classList.toggle('on', x.dataset.t === t)); document.querySelectorAll('#panel .tab').forEach(x => { x.hidden = x.dataset.tab !== t; }); store.set({ tab: t }); }
document.querySelectorAll('#tabs [data-t]').forEach(b => b.onclick = () => selTab(b.dataset.t));
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1800); }
let sleepAt = 0, sleepTick = 0, sleepBase = 0;
function setSleep(min) {
  clearInterval(sleepTick); sleepBase = 0; document.querySelectorAll('#sleep [data-m]').forEach(b => b.classList.toggle('on', +b.dataset.m === min)); $('sleepLeft').textContent = ''; if (!min) { sleepAt = 0; return; }
  sleepAt = performance.now() + min * 60000; toast('Radio sleeps in ' + min + ' min');
  sleepTick = setInterval(() => { const left = (sleepAt - performance.now()) / 1000; $('sleepLeft').textContent = left > 60 ? Math.ceil(left / 60) + ' min left' : Math.max(0, Math.ceil(left)) + ' s left';
    if (left <= 15) { if (!sleepBase) sleepBase = TA.state.music || 0.001; TA.set('music', sleepBase * Math.max(0, left / 15)); ytVol(); }
    if (left <= 0) { clearInterval(sleepTick); setRadio(false); TA.set('music', sleepBase); ytVol(); syncSliders(); $('sleepLeft').textContent = ''; document.querySelectorAll('#sleep [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === '0')); toast('Radio off — shabba khair'); } }, 1000);
}
document.querySelectorAll('#sleep [data-m]').forEach(b => b.onclick = () => setSleep(+b.dataset.m));
$('evTest').onclick = () => { TA.resume(); TA.fire(); };
$('pill').onclick = () => { TA.resume(); togglePanel(true); selTab('radio'); };
const SCN = { morning: 'Morning', day: 'Day', dusk: 'Dusk', night: 'Night' };
setInterval(() => { $('pillTxt').textContent = $('sname').textContent; $('eq').classList.toggle('on', TA.isPlaying()); const E = Art.ENVS[world.env]; if (E) $('placeTxt').textContent = E.label + ' · ' + (SCN[sceneName] || ''); }, 700);
TA.on('event', k => { if (k === 'thunder' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); } });
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || !started) return; if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return; const k = e.key.toLowerCase();
  if (k === 'r') { TA.resume(); togglePanel(); } else if (k === 'w') toggleWorld(); else if (k >= '1' && k <= '4') setScene(['morning', 'day', 'dusk', 'night'][+k - 1]); else if (k === '0') setScene('auto');
});

/* ====================== YouTube ====================== */
let yt = null, ytReady = false, ytId = '', ytApiReady = false;
function parsePlaylist(s) { s = (s || '').trim(); if (!s) return ''; const m = s.match(/[?&]list=([\w-]+)/); return m ? m[1] : (/^[\w-]{10,}$/.test(s) ? s : ''); }
function ytVol() { if (yt && ytReady) yt.setVolume(Math.round(Math.pow(TA.state.music, 1.4) * 100)); }
function loadYTApi() { if (window.YT || document.getElementById('ytapi')) return; const s = document.createElement('script'); s.id = 'ytapi'; s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); }
window.onYouTubeIframeAPIReady = () => { ytApiReady = true; if (ytId) makeYT(); };
function makeYT() { if (!ytApiReady || !ytId || yt) return; yt = new YT.Player('ytPlayer', { width: '100%', height: '100%', playerVars: { listType: 'playlist', list: ytId, playsinline: 1, rel: 0, modestbranding: 1 }, events: {
  onReady: () => { ytReady = true; if (pendingYT) { const q = pendingYT; pendingYT = null; applyYT(q); } ytVol(); if (store.get().shuffle) yt.setShuffle(true); if (TA.muted) yt.mute(); ytSync(); },
  onStateChange: e => { const pl = e.data === 1; TA.ytPlaying(pl && ST[stIdx].id === 'yt'); if (e.data === 1 || e.data === 5) { try { const t = yt.getVideoData().title; if (t) { $('np').textContent = '▶ ' + t; if (ST[stIdx].id === 'yt') $('sname').textContent = t; } } catch (er) {} } if (e.data === 1 && ST[stIdx].id !== 'yt') yt.pauseVideo(); },
  onError: () => { $('np').textContent = 'Could not play this (private playlist or embedding disabled?)'; } } }); }
function ytSync() { if (!ytReady) { if (ST[stIdx].id === 'yt' && !ytId) $('np').textContent = 'Paste a YouTube playlist link above ↑'; return; } const w = radioOn && ST[stIdx].id === 'yt'; try { w ? yt.playVideo() : yt.pauseVideo(); } catch (e) {} ytVol(); }
function setPlaylist(s, save) { const id = parsePlaylist(s); if (!id) { $('np').textContent = 'That doesn’t look like a playlist link.'; return; } ytId = id; if (save) store.set({ playlist: id }); $('ytUrl').value = id; $('np').textContent = 'Loading…';
  if (yt && ytReady) { yt.loadPlaylist({ list: id, listType: 'playlist', index: 0 }); ytVol(); if (store.get().shuffle) yt.setShuffle(true); if (ST[stIdx].id !== 'yt') yt.pauseVideo(); } else { loadYTApi(); makeYT(); } if (ST[stIdx].id !== 'yt') tune(0); changed('radio'); }
$('ytLoad').onclick = () => { TA.resume(); setPlaylist($('ytUrl').value, true); }; $('ytUrl').addEventListener('keydown', e => { if (e.key === 'Enter') $('ytLoad').click(); });
$('ytPlay').onclick = () => { if (!ytReady) return; if (ST[stIdx].id !== 'yt') { tune(0); return; } yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo(); changed('radio'); };
$('ytNext').onclick = () => { if (ytReady) { yt.nextVideo(); changed('radio'); } }; $('ytPrev').onclick = () => { if (ytReady) { yt.previousVideo(); changed('radio'); } }; $('ytShuf').onchange = e => { store.set({ shuffle: e.target.checked }); if (ytReady) yt.setShuffle(e.target.checked); };

/* ====================== shared room (see multi.js) ====================== */
let applying = false, pendingYT = null;
function changed(what) { if (!applying && Tapri.hooks.changed) Tapri.hooks.changed(what); }
function ytState() { let idx = 0, time = 0, playing = false; if (yt && ytReady) { try { idx = yt.getPlaylistIndex(); time = yt.getCurrentTime(); playing = yt.getPlayerState() === 1; } catch (e) {} } return { idx: Math.max(0, idx), time, playing }; }
function applyYT(s) {
  if (!ytReady) { pendingYT = s; return; }
  const cur = ytState(), want = s.time + (s.playing ? s.lag || 0 : 0);
  try {
    if (cur.idx !== s.idx || Math.abs(cur.time - want) > 4) yt.loadPlaylist({ list: ytId, listType: 'playlist', index: s.idx, startSeconds: want });
    if (!s.playing) yt.pauseVideo();
  } catch (e) {}
  ytSync();
}
Tapri.radioCtl = {
  get() { const y = ytState(); return { station: ST[stIdx].id, playlist: ytId, idx: y.idx, time: y.time, playing: y.playing }; },
  apply(s) {
    applying = true;
    try {
      if (s.playlist && s.playlist !== ytId) { ytId = s.playlist; $('ytUrl').value = ytId; $('np').textContent = 'Loading…'; if (yt && ytReady) yt.loadPlaylist({ list: ytId, listType: 'playlist', index: s.idx || 0 }); else { loadYTApi(); makeYT(); } }
      const i = ST.findIndex(x => x.id === s.station); if (i >= 0 && i !== stIdx) tune(i);
      if (s.station === 'yt' && ytId) applyYT(s);
    } finally { applying = false; }
  }
};
Tapri.worldCtl = {
  get() { return { env: world.env, theme: world.theme, scene: sceneName }; },
  apply(w) { applying = true; try { if (w.env !== world.env || w.theme !== world.theme) setWorld({ env: w.env, theme: w.theme }); if (w.scene && w.scene !== sceneName) setScene(w.scene); } finally { applying = false; } }
};
Tapri.view = { layer: bubEl, scale: () => S,
  // focus bench: zoom in on x (scene px) showing about w px of the stall; focus(null) goes back to the whole stall
  focus(x, w) { const was = focusOn; focusOn = x != null; if (focusOn) { focusW = clamp(w || 250, 180, LW); camTarget = clamp(x, focusW / 2, LW - focusW / 2); manualUntil = Tapri.T + 1e9; } else if (was) manualUntil = 0; if (focusOn || was) layout(); } };

/* ====================== boot ====================== */
const saved = store.get();
Object.keys(PRESETS.busy).forEach(k => { if (saved.mix && saved.mix[k] !== undefined) TA.state[k] = saved.mix[k]; }); if (saved.music !== undefined) TA.state.music = saved.music; if (saved.rain !== undefined) rainTouched = true; $('ytShuf').checked = !!saved.shuffle; selTab(saved.tab || 'radio');
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load('700 26px "Noto Sans Devanagari"'), document.fonts.load('500 8px "Noto Sans Devanagari"'), document.fonts.load('600 14px "Pixelify Sans"')]), new Promise(r => setTimeout(r, 1800))]); } catch (e) {}
  await loadWorldFiles(); const sw = store.get().world; if (sw) { if (Art.ENVS[sw.env]) world.env = sw.env; if (Art.THEMES[sw.theme]) world.theme = sw.theme; } if (!Art.ENVS[world.env]) world.env = 'city'; renderWorldUI();
  layout(); setScene('auto'); Tapri.resetCrowd(); owner.start(); dog.reset(); requestAnimationFrame(loop);
}
const bdc = document.getElementById('bd'), bdx = bdc.getContext('2d'); let bdn = 0;
Tapri.quality = 0; let slowT = 0, fastT = 0, ema = 0.016;
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; ema += (dt - ema) * 0.08; if (started) { if (ema > 0.034) { slowT += dt; fastT = 0; } else if (ema < 0.026) { fastT += dt; slowT = 0; } else { slowT = fastT = 0; } if (slowT > 2.5 && Tapri.quality < 2) { Tapri.quality++; slowT = 0; } if (fastT > 12 && Tapri.quality > 0) { Tapri.quality--; fastT = 0; } } step(dt); camFollow(); applyCam(false); render(); placeBubbles(); if (Tapri.hooks.frame) Tapri.hooks.frame(); requestAnimationFrame(loop); }
Tapri.stats = { bubbles: [], helperStates: {}, ownerActs: {}, seen: new Set() };
window.__world = (e, t) => setWorld({ env: e, theme: t });
window.__sim = sec => { const n = Math.round(sec / 0.05); for (let i = 0; i < n; i++) { T += 0.05; step(0.05); const st = Tapri.stats; st.helperStates[helper.state] = (st.helperStates[helper.state] || 0) + 1; const key = owner.runner ? (owner.runner.ctx.routine ? 'routine' : owner.runner.ctx.buyer ? 'sell:' + owner.runner.ctx.item : 'chai') : 'idle'; st.ownerActs[key] = (st.ownerActs[key] || 0) + 1; } };
$('enter').onclick = async () => {
  await TA.start(); TA.resume(); $('intro').classList.add('gone'); started = true; Tapri.resetCrowd(); owner.start(); dog.reset();
  Object.keys(TA.state).forEach(k => TA.set(k, TA.state[k])); const tone = saved.tone ?? 0.5; $('vTone').value = tone; TA.setTone(tone); syncSliders(); TA.setScene(sceneName);
  if (saved.muted) { doMute(true); } else setMuteUI();
  const cfgPl = parsePlaylist(window.TAPRI_CONFIG && window.TAPRI_CONFIG.PLAYLIST) || saved.playlist || ''; const startSt = saved.station ? ST.findIndex(s => s.id === saved.station) : (cfgPl ? 0 : 1);
  setRadio(true); tune(startSt >= 0 ? startSt : 1); if (cfgPl) setPlaylist(cfgPl, false); if (window.innerWidth > 900) togglePanel(true);
  if (Tapri.hooks.entered) Tapri.hooks.entered();
  setTimeout(() => ['lofi', 'retro', 'baarish'].forEach(n => fetch('audio/music/' + n + '.mp3').catch(() => {})), 4000);   // warm the cache so a station switch is instant
};
setMuteUI();
// dev: index.html#shot=night&t=20&act=fry  (auto-enters, fast-forwards, optionally forces an owner action)
const sh = location.hash.match(/shot=(\w+)/); if (sh) { const tm = +(location.hash.match(/[&#]t=(\d+)/) || [0, 0])[1], ac = (location.hash.match(/act=([\w:]+)/) || [])[1]; const wait = setInterval(() => { if (!layers) return; clearInterval(wait); const qe = (location.hash.match(/env=(\w+)/) || [])[1], qt = (location.hash.match(/theme=(\w+)/) || [])[1]; if (qe || qt) setWorld({ env: qe || world.env, theme: qt || world.theme }); setScene(sh[1]); started = true; Tapri.resetCrowd(); owner.start(); if (ac && owner.force) owner.force(ac); window.__sim(tm); if (location.hash.includes('ui=0')) { document.getElementById('hud').style.display = document.getElementById('dock').style.display = 'none'; } $('intro').style.display = 'none'; console.log('STATS ' + JSON.stringify({ T: Math.round(T), people: people.map(p => p.kind + ':' + p.state + ':' + p.act), helper: Tapri.stats.helperStates, owner: Tapri.stats.ownerActs, sold: owner.sold, stock: W.stock, bubbles: Tapri.stats.bubbles.filter(x => x.length > 1).slice(0, 40) })); }, 200); }
TA.on('bed', n => console.log('BED ' + n)); TA.on('bank', n => console.log('BANK ' + n)); TA.on('mute', m => console.log('MUTE ' + m));
if (location.hash.includes('autoenter')) setTimeout(() => document.getElementById('enter').click(), 800);
boot();
})();
