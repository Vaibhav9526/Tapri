import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
const out = path.join(process.env.TEMP, 'tapri-art-verification', 'worlds');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu'] });
const p = await b.newPage(), errors = [], records = [];
p.on('pageerror', e => errors.push(e.stack));
p.on('console', m => { if (/ENV_DYNAMIC_ERR|THEME_POST_ERR|WORLD_FILE_FAIL|OWNER_DRAW_ERR/.test(m.text())) errors.push(m.text()); });
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => { let seed = 9341; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); window.requestAnimationFrame = fn => { if (fn.name === 'loop') window.__frame = fn; else setTimeout(fn, 0); }; });
async function shot(name) { await p.evaluate(() => window.__frame(performance.now())); await p.screenshot({ path: path.join(out, name + '.png') }); }
try {
  for (const theme of ['retro', 'comic']) {
    await p.goto(`http://localhost:8080/?behavior=${theme}#shot=day&env=village&theme=${theme}&t=2`, { waitUntil: 'load' });
    await p.waitForFunction(theme => window.Art?.themeId === theme && window.Tapri?.T >= 1.9, { polling: 100 }, theme).catch(async e => { console.log(await p.evaluate(() => ({ theme: window.Art?.themeId, time: window.Tapri?.T, intro: document.getElementById('intro').style.display })), errors); throw e; });
    console.log('CHECK', theme);
    const rig = await p.evaluate(() => {
      const g = Art.mk(Sprites.BW, Sprites.BH), checks = [], outfits = ['shirt', 'tee', 'kurta', 'hoodie', 'dhoti', 'lungi', 'fisher', 'sweater', 'shawl', 'waistcoat', 'saree', 'turban', 'office', 'traveler'];
      for (const outfit of outfits) for (const expr of ['n', 'talk', 'laugh', 'sip', 'eat', 'smile']) {
        const style = Sprites.makeStyle({ age: 'old', override: { outfit } });
        const pose = { t: 42, expr, arms: { L: [-20, -64], R: [19, -58] }, noSmooth: true };
        for (const mode of ['stand', 'sit']) {
          g.x.clearRect(0, 0, g.c.width, g.c.height); const r = Sprites[mode](g.x, style, pose, -1), hands = mode === 'stand' ? [r.hand, r.lhand] : [r.handR, r.handL];
          if (!hands.every(h => [h.hx, h.hy, h.ex, h.ey].every(Number.isFinite))) throw Error('Invalid rig return: ' + mode + outfit + expr);
          if (!g.x.getImageData(0, 0, g.c.width, g.c.height).data.some((x, i) => i % 4 === 3 && x)) throw Error('Empty sprite');
          checks.push(mode + ':' + outfit + ':' + expr);
        }
      }
      const K = Art.K, base = Sprites.ik(-10 * K, -60 * K, -18 * K, -74 * K, 17 * K, 15 * K, 1); Sprites.begin(g.x, -1); const a = Sprites.hooks.arm || Sprites.arm, h = a(styleForArm(), -10 * K, -60 * K, -18 * K, -74 * K, 1, false);
      function styleForArm() { return Sprites.makeStyle({ override: { outfit: 'shirt' } }); }
      if (Math.abs(base.hx - h.hx) > .001 || Math.abs(base.hy - h.hy) > .001) throw Error('Hook changed IK hand anchors');
      return checks.length;
    });
    assert.equal(rig, 168);
    await p.evaluate(() => { Tapri.people.forEach(p => { p.nextOrder = p.nextAct = p.life = Infinity; p.ordered = 1; p.wants = false; p.glass = 0; p.plate = 0; }); Tapri.owner.jobs.length = 0; Tapri.owner.force('chai'); });
    let pouring = false, received = false;
    for (let i = 0; i < 130; i++) {
      const st = await p.evaluate(() => { __sim(.25); window.__frame(performance.now()); return { pour: Tapri.W.glasses.some(g => g.pour), tray: Tapri.W.tray.length, helper: Tapri.helper.state }; });
      if (st.pour && !pouring) { pouring = true; await shot(theme + '-pouring'); }
      if (st.tray || ['toTray', 'pickup', 'toLane', 'toStop', 'give'].includes(st.helper)) received = true;
    }
    assert(pouring, theme + ' pours chai'); assert(received, theme + ' dispatches tray');
    const delivery = await p.evaluate(() => {
      const customer = Tapri.people.find(p => p.state === 'seated'); if (!customer) throw Error('No seated customer');
      Tapri.owner.jobs.length = 0; customer.wants = true; customer.ordered = 1; customer.glass = 0; customer.plate = 0; customer.act = 'idle'; customer.nextAct = customer.life = Infinity;
      const h = Tapri.helper; h.state = 'idle'; h.cur = null; h.carrying = false; h.dirty.length = 0; Tapri.W.tray.length = 0; Tapri.W.tray.push({ for: customer, kind: 'glass' });
      for (let i = 0; i < 500 && !customer.glass; i++) __sim(.05);
      return { glass: customer.glass, wants: customer.wants, helper: h.state };
    });
    assert(delivery.glass > 0 && !delivery.wants); await shot(theme + '-delivery');
    await p.evaluate(() => { const ps = Tapri.people.filter(p => p.state === 'seated'); ['phone', 'text', 'call', 'paper', 'sip', 'eat'].forEach((act, i) => { const p = ps[i]; if (!p) return; p.act = act; p.actT0 = Tapri.T - .9; p.actUntil = p.nextAct = p.life = Infinity; p.glass = act === 'sip' ? .8 : 0; p.plate = act === 'eat' ? 1 : 0; p.wants = false; }); });
    await shot(theme + '-phone-food-poses');
    const transition = await p.evaluate(() => { const p = Tapri.people.find(p => p.kind === 'sitter'); p.glass = p.plate = 0; p.act = 'idle'; p.wants = false; p.state = 'sitdown'; p.t0 = Tapri.T; __sim(.65); const seated = p.state; p.state = 'standup'; p.t0 = Tapri.T; __sim(.65); return { seated, standing: p.state }; });
    assert.equal(transition.seated, 'seated'); assert.equal(transition.standing, 'leave');
    const ui = await p.evaluate(() => { document.getElementById('btnRadio').click(); const open = document.getElementById('panel').classList.contains('open'); const youtube = !!document.getElementById('ytLoad').onclick; document.getElementById('closePanel').click(); document.getElementById('btnWorld').click(); const worlds = document.querySelectorAll('#envs button').length, themes = document.querySelectorAll('#themes button').length; document.getElementById('closeWorld').click(); return { open, youtube, worlds, themes }; });
    assert(ui.open && ui.youtube && ui.worlds === 8 && ui.themes === 2);
    await p.evaluate(() => { Tapri.hooks.bubble(Tapri.owner, 'भैया, दो गरम चाय और समोसे!', 60000, 'order'); });
    await new Promise(r => setTimeout(r, 50)); await shot(theme + '-devanagari-balloon');
    const font = await p.evaluate(() => getComputedStyle(document.querySelector('.bub.order')).fontFamily); assert(/Noto Sans Devanagari/.test(font));
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await shot(theme + '-reduced-motion');
    records.push({ theme, rigCases: rig, pouring, trayDispatched: received, delivery, transition, ui, font });
  }
  assert.deepEqual(errors, []);
  await writeFile(path.join(out, 'behavior-results.json'), JSON.stringify({ errors, records }, null, 2));
  console.log('PASS:', JSON.stringify(records));
} finally { await b.close(); }
