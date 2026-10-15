import puppeteer from 'puppeteer-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const out = path.join(process.env.TEMP, 'tapri-art-verification', 'worlds');
await mkdir(out, { recursive: true });
const envs = ['city', 'village', 'rural', 'urban', 'hill', 'coast', 'desert', 'railway'], themes = ['retro', 'comic'], times = ['morning', 'day', 'dusk', 'night'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const results = [], errors = [];
try {
  for (const device of ['desktop', 'phone']) {
    const p = await browser.newPage();
    await p.setViewport({ width: device === 'phone' ? 390 : 1280, height: device === 'phone' ? 844 : 800, deviceScaleFactor: 1, isMobile: device === 'phone', hasTouch: device === 'phone' });
    p.on('pageerror', e => errors.push(device + ': ' + e.stack));
    p.on('console', m => { if (/ENV_DYNAMIC_ERR|THEME_POST_ERR|WORLD_FILE_FAIL|OWNER_DRAW_ERR/.test(m.text())) errors.push(device + ': ' + m.text()); });
    await p.evaluateOnNewDocument(() => { let seed = 82314; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); window.requestAnimationFrame = fn => { if (fn.name === 'loop') window.__frame = fn; else setTimeout(fn, 0); }; });
    for (const env of envs) for (const theme of themes) {
      await p.goto(`http://localhost:8080/?verify=${env}-${theme}#shot=morning&env=${env}&theme=${theme}&t=40&ui=0`, { waitUntil: 'load' });
      await p.waitForFunction((env, theme) => window.Art?.envId === env && Art.themeId === theme && window.Tapri?.T >= 39 && document.getElementById('intro').style.display === 'none', { timeout: 20000, polling: 100 }, env, theme);
      for (const time of times) {
        const info = await p.evaluate((time) => { document.querySelector(`#dock [data-scene="${time}"]`).click(); window.__frame(performance.now()); return { env: Art.envId, theme: Art.themeId, time: Art.name, people: Tapri.people.length, old: Tapri.people.filter(p => p.style.age === 'old').length, outfits: [...new Set(Tapri.people.map(p => p.style.outfit))], dynamics: Art.env.dynamic.length, hooks: Object.keys(Sprites.hooks) }; }, time);
        assert.equal(info.env, env); assert.equal(info.theme, theme); assert.equal(info.time, time); assert(info.dynamics >= 2 && info.dynamics <= 4); assert(info.people > 0);
        const file = `${env}-${theme}-${time}-${device}.png`;
        await p.screenshot({ path: path.join(out, file) });
        await writeFile(path.join(out, `${env}-${theme}-${time}-${device}-scene.png`), Buffer.from(await p.evaluate(() => document.getElementById('cv').toDataURL().split(',')[1]), 'base64'));
        results.push({ file, device, ...info }); console.log('SHOT', file);
      }
    }
    await p.close();
  }
  const p = await browser.newPage();
  for (const env of envs) for (const device of ['desktop', 'phone']) {
    const w = device === 'phone' ? 270 : 480, h = device === 'phone' ? 584 : 300;
    const items = [];
    for (const theme of themes) for (const time of times) { const filename = `${env}-${theme}-${time}-${device}.png`, b = await readFile(path.join(out, filename)); items.push(`<div><div>${env} / ${theme} / ${time} / ${device}</div><img src="data:image/png;base64,${b.toString('base64')}" width="${w}" height="${h}"></div>`); }
    await p.setViewport({ width: (w + 12) * 4, height: (h + 39) * 2, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:#ece8df;color:#25242a;font:14px sans-serif;display:grid;grid-template-columns:repeat(4,${w}px);gap:12px;padding:0">${items.join('')}</body></html>`);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    await p.screenshot({ path: path.join(out, `sheet-${env}-${device}.png`) });
  }
  await writeFile(path.join(out, 'matrix-results.json'), JSON.stringify({ count: results.length, errors, results }, null, 2));
  assert.equal(results.length, 128); assert.deepEqual(errors, []);
  console.log('PASS: 128 screenshots, world selection, hooks, people, dynamic counts, no art runtime errors. Output:', out);
} finally { await browser.close(); }
