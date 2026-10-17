// Painted env backdrop: right image per viewport, scene rect maps exactly onto the stage, stays aligned. Needs site/img/_test/{d,m,d2}.png (made by ffmpeg, see header of this file's author notes).
// Usage: node tests/backdrop.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:8080/', out = path.join(process.env.TEMP || '.', 'tapri-art-verification');
await mkdir(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const REG = () => Art.registerEnv('bdtest', { label: 'bdtest', backdrop: {
  day: { desktop: { src: 'img/_test/d.png', rect: [600, 300, 1200, 800] }, mobile: { src: 'img/_test/m.png', rect: [60, 700, 960, 640] } },
  night: { desktop: { src: 'img/_test/d2.png', rect: [600, 300, 1200, 800] } } }, layers: { sky() {}, far() {} } });
// compare where the image's scene rect lands vs. the stage rect
const probe = () => { const st = document.getElementById('stage').getBoundingClientRect(); const out = { stage: [st.left, st.top, st.width, st.height], imgs: [] };
  for (const im of document.querySelectorAll('#backdrop .bdimg')) { const r = im.getBoundingClientRect(), k = r.width / im.naturalWidth, [rx, ry, rw, rh] = ({ 'img/_test/d.png': [600, 300, 1200, 800], 'img/_test/m.png': [60, 700, 960, 640], 'img/_test/d2.png': [600, 300, 1200, 800] })[im.getAttribute('src')]; out.imgs.push({ src: im.getAttribute('src'), scene: [r.left + rx * k, r.top + ry * k, rw * k, rh * k], op: getComputedStyle(im).opacity }); }
  out.bdCanvas = getComputedStyle(document.getElementById('bd')).display; return out; };
async function run(name, vp, emu) {
  const p = await b.newPage(); await p.setViewport(vp);
  p.on('pageerror', e => errors.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|googleapis|youtube|ERR_/.test(m.text())) errors.push(name + ' console: ' + m.text()); });
  await p.goto(base + '#shot=day&env=city&theme=retro&t=5&ui=0', { waitUntil: 'load' }); await sleep(2500);
  const near = (a, bb, msg) => a.forEach((v, i) => assert(Math.abs(v - bb[i]) <= 1, `${name} ${msg}: ${a.map(x => x.toFixed(1))} vs ${bb.map(x => x.toFixed(1))}`));
  // city: no backdrop, unchanged
  let r = await p.evaluate(probe); assert.equal(r.imgs.length, 0); assert.notEqual(r.bdCanvas, 'none');
  const cityStage = r.stage; await p.screenshot({ path: path.join(out, `backdrop-${name}-city.png`) });
  await p.evaluate(REG); await p.evaluate(() => window.__world('bdtest', 'retro')); await sleep(1800);
  r = await p.evaluate(probe); assert.equal(r.imgs.length, 1, name + ' one image'); assert.equal(r.bdCanvas, 'none');
  assert.equal(r.imgs[0].src, emu ? 'img/_test/m.png' : 'img/_test/d.png'); near(r.imgs[0].scene, r.stage, 'scene->stage'); assert.equal(r.imgs[0].op, '1');
  if (!emu) { const [, , w, h] = r.stage; assert(Math.abs(r.stage[0] * 2 + w - vp.width) < 2 && r.stage[1] >= -1 && r.stage[1] + h <= vp.height + 1, 'contain+centred ' + r.stage); }
  await p.screenshot({ path: path.join(out, `backdrop-${name}-day.png`) });
  // camera moves: phone zoom-in pans the stage; alignment must follow every frame
  if (emu) { await p.evaluate(() => document.getElementById('btnZoom').click()); for (const t of [100, 900]) { await sleep(t); r = await p.evaluate(probe); near(r.imgs[0].scene, r.stage, 'zoom pan @' + t); }
    assert(r.stage[2] > 480 * 0.9 * 390 / 480, 'zoomed'); await p.mouse.move(300, 400); await p.mouse.down(); await p.mouse.move(120, 400, { steps: 6 }); await p.mouse.up(); for (const t of [50, 400, 1500]) { await sleep(t); r = await p.evaluate(probe); near(r.imgs[0].scene, r.stage, 'drag pan @' + t); }
    await p.screenshot({ path: path.join(out, 'backdrop-mobile-zoom.png') }); await p.evaluate(() => document.getElementById('btnZoom').click()); await sleep(800); }
  // time change -> night image (night entry has only desktop: used on phones too)
  await p.evaluate(() => document.querySelector('#dock [data-scene="night"]').click()); await sleep(1800); r = await p.evaluate(probe); assert.equal(r.imgs.length, 1, 'crossfade finished');
  assert.equal(r.imgs[0].src, 'img/_test/d2.png'); near(r.imgs[0].scene, r.stage, 'night'); await p.screenshot({ path: path.join(out, `backdrop-${name}-night.png`) });
  await p.close();
}
async function resizeTest() {
  const p = await b.newPage(); await p.setViewport({ width: 1536, height: 860 }); p.on('pageerror', e => errors.push('rs: ' + e.message));
  await p.goto(base + '#shot=day&env=city&theme=retro&t=5&ui=0', { waitUntil: 'load' }); await sleep(2500);
  await p.evaluate(REG); await p.evaluate(() => window.__world('bdtest', 'retro')); await sleep(1500);
  assert.equal((await p.evaluate(probe)).imgs[0].src, 'img/_test/d.png');
  for (const [w, h, src] of [[390, 844, 'img/_test/m.png'], [1000, 700, 'img/_test/d.png'], [700, 900, 'img/_test/m.png']]) {
    await p.setViewport({ width: w, height: h }); await sleep(1800); const r = await p.evaluate(probe);
    assert.equal(r.imgs.length, 1, 'resize one img ' + w); assert.equal(r.imgs[0].src, src, `resize ${w}x${h}`);
    r.imgs[0].scene.forEach((v, i) => assert(Math.abs(v - r.stage[i]) <= 1, `resize ${w}: ${r.imgs[0].scene} vs ${r.stage}`));
  }
  // back to a backdrop-less env: canvas returns, images gone
  await p.setViewport({ width: 1536, height: 860 }); await p.evaluate(() => window.__world('city', 'retro')); await sleep(1500);
  const r = await p.evaluate(probe); assert.equal(r.imgs.length, 0); assert.notEqual(r.bdCanvas, 'none'); await p.close();
}
try {
  await run('desktop', { width: 1536, height: 860 }, false);
  await run('mobile', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, true);
  await resizeTest();
  assert.deepEqual(errors, [], errors.join('\n')); console.log('backdrop OK');
} finally { await b.close(); }
