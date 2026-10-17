// Painted stall for "mohalla": the stall itself is a painting (an ElevenLabs gpt-image-2 repaint of the vector stall, using
// real tapri photos as references, so the counter/shelves/benches stay on the gameplay anchors). The whole painting is the
// back layer; the counter front and the benches are cut out of it again so the owner stands behind the counter and the
// seated people sit behind the benches. Until the images load (or if they are missing) the vector stall in mohalla.js is used.
(() => {
'use strict';
const E = Art.ENVS.mohalla; if (!E) return;
const orig = Object.assign({}, E.layers), IM = {};
// scene-px cut-outs (x, y, w, h) re-drawn in front of the people
const CUT = { counter: [[94, 203, 306, 62]], tables: [[26, 256, 116, 44], [228, 257, 106, 43], [384, 257, 96, 43]] };
let loaded = 0;
for (const t of ['day', 'dusk', 'night']) {
  const im = new Image(); im.decoding = 'async';
  im.onload = () => { IM[t] = im; loaded++; if (Art.envId === 'mohalla' && window.__world) setTimeout(() => window.__world('mohalla', Art.themeId), 0); };
  im.src = 'img/mohalla/stall-' + t + '.webp';
}
const pick = api => IM[api.name] || (api.name === 'morning' && IM.day) || IM.day || null;
function whole(ctx, api) { // the full painting, its edges feathered into the painted street behind
  const im = pick(api); if (!im) return false; const W = Art.RW, H = Art.RH, b = Art.mk(W, H), x = b.x; x.imageSmoothingEnabled = true; x.drawImage(im, 0, 0, W, H);
  x.globalCompositeOperation = 'destination-in'; const K = api.K, fx = 18 * K, ft = 26 * K;
  let gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(fx / W, '#000'); gr.addColorStop(1 - fx / W, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(ft / H, '#000'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  ctx.drawImage(b.c, 0, 0); return true;
}
function cuts(ctx, api, list) {
  const im = pick(api); if (!im) return false; const K = api.K, s = im.width / 480; ctx.save(); ctx.imageSmoothingEnabled = true;
  for (const [x, y, w, h] of list) ctx.drawImage(im, x * s, y * s, w * s, h * s, x * K, y * K, w * K, h * K);
  ctx.restore(); return true;
}
const none = () => [];
Object.assign(E.layers, {
  roof(ctx, api) { if (!whole(ctx, api)) orig.roof && orig.roof(ctx, api); },
  backWall(ctx, api) { if (!pick(api)) orig.backWall && orig.backWall(ctx, api); },
  sign(ctx, api) { if (!pick(api)) orig.sign && orig.sign(ctx, api); },
  board(ctx, api) { if (!pick(api)) orig.board && orig.board(ctx, api); },
  ground(ctx, api) { if (!pick(api)) orig.ground && orig.ground(ctx, api); },
  furnBack(ctx, api) { if (!pick(api)) orig.furnBack && orig.furnBack(ctx, api); },
  counter(ctx, api) { if (!cuts(ctx, api, CUT.counter)) orig.counter && orig.counter(ctx, api); },
  glass(ctx, api) { if (!pick(api)) orig.glass && orig.glass(ctx, api); },
  tables(ctx, api) { if (!cuts(ctx, api, CUT.tables)) orig.tables && orig.tables(ctx, api); },
  canopy(ctx, api) { if (!pick(api)) orig.canopy && orig.canopy(ctx, api); },
  foliage(ctx, api) { return pick(api) ? none() : (orig.foliage ? orig.foliage(ctx, api) : []); },
  emit(ctx, api) { if (!pick(api)) orig.emit && orig.emit(ctx, api); }
});
// the vector stall's moving extras (bunting, kite, tube light...) belong to the cartoon stall: skip them over the painting
if (E.dynamic) E.dynamic = E.dynamic.map(d => Object.assign({}, d, { draw(...args) { if (!IM.day) return d.draw(...args); } }));
// the painting already shows its own snacks and steel trays
E.stage = Object.assign(E.stage || {}, { caseTrays() {}, pakoda() {}, kachori() {}, samosaStock() {} });
})();
