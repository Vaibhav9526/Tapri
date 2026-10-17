import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
const out = path.join(process.env.TEMP, 'tapri-art-verification', 'worlds');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu'] });
try {
  const p = await b.newPage();
  await p.goto('http://localhost:8080/?artchecks=1#shot=day&env=village&theme=comic&t=2', { waitUntil: 'load' });
  await p.waitForFunction(() => window.Art?.THEMES.comic && window.Tapri?.T >= 2);
  const checks = await p.evaluate(() => {
    const all = [], hash = data => { let h = 2166136261; for (let i = 0; i < data.length; i++) h = Math.imul(h ^ data[i], 16777619); return h >>> 0; };
    for (const theme of ['retro', 'comic']) for (const env of Object.keys(Art.ENVS)) for (const time of ['morning', 'day', 'dusk', 'night']) {
      const start = performance.now(), layers = Art.build(time, env, theme), buildMs = performance.now() - start, c = Art.mk();
      function frame(t) { c.x.clearRect(0, 0, Art.RW, Art.RH); for (const z of ['sky', 'far', 'front']) Art.runDynamic(z, c.x, t, .016); return hash(c.x.getImageData(0, 0, Art.RW, Art.RH).data); }
      const motion = frame(8) !== frame(13);
      const first = hash(layers.far.getContext('2d').getImageData(0, 0, Art.RW, Art.RH).data), second = hash(Art.build(time, env, theme).far.getContext('2d').getImageData(0, 0, Art.RW, Art.RH).data);
      const g = layers.back.getContext('2d').getImageData(0, 266 * Art.K, Art.RW, 45 * Art.K).data; let solid = true; for (let i = 3; i < g.length; i += 4) if (g[i] !== 255) solid = false;
      const th = Art.THEMES[theme]; for (let i = 0; i < 10; i++) th.post(c.x, 42, Art.api); const ps = performance.now(); for (let i = 0; i < 40; i++) th.post(c.x, 42, Art.api); const postMs = (performance.now() - ps) / 40;
      if (!motion || first !== second || !solid) throw Error(JSON.stringify({ env, theme, time, motion, deterministic: first === second, solid }));
      all.push({ env, theme, time, motion, deterministic: true, solid, buildMs, postMs });
    }
    return all;
  });
  assert.equal(checks.length, 2 * 4 * (await p.evaluate(() => Object.keys(Art.ENVS).length)));
  for (const theme of ['retro', 'comic']) {
    const image = await p.evaluate(theme => {
      Art.build('day', 'village', theme); for (const k of Object.keys(Sprites.hooks)) delete Sprites.hooks[k]; Object.assign(Sprites.hooks, Art.theme.actors); Sprites.envPeople = Art.env.people;
      const c = document.createElement('canvas'); c.width = 960; c.height = 640; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#e4dbc1'; g.fillRect(0, 0, 960, 640); g.fillStyle = '#332f32'; g.font = 'bold 18px sans-serif'; g.fillText(theme.toUpperCase() + ' / rig, clothing & hand anchors', 18, 27);
      const outfits = ['turban', 'office', 'shawl', 'fisher', 'sweater', 'saree', 'dhoti', 'kurta', 'waistcoat', 'lungi', 'traveler', 'tee'];
      outfits.forEach((outfit, i) => { const col = i % 6, row = Math.floor(i / 6), old = i % 3 === 0, female = i === 2 || i === 5 || i === 9, s = Sprites.makeStyle({ female, age: old ? 'old' : 'mid', override: { outfit, turban: outfit === 'turban' ? '#c1874e' : null, shawl: outfit === 'shawl' ? '#8e6d64' : null, fisherCap: outfit === 'fisher' ? '#d8c89e' : null, vest: outfit === 'waistcoat' ? '#61746a' : null, bag: outfit === 'traveler' ? '#946d52' : null, lanyard: outfit === 'office' ? '#65888b' : null } });
        const b = Art.mk(Sprites.BW, Sprites.BH), poses = [{ expr: 'smile', arms: { L: [-17, -67], R: [16, -39] } }, { expr: 'sip', arms: { L: [-13, -32], R: [3, -65] } }, { expr: 'talk', arms: { L: [-18, -41], R: [24, -46] } }], pose = { ...poses[i % 3], t: 42, noSmooth: true, phase: 2, moving: row === 0 && i % 2 === 1 };
        const info = Sprites[row ? 'sit' : 'stand'](b.x, s, pose, -1), hand = row ? info.handR : info.hand;
        if (i % 3 === 1) Sprites.props.glass(hand.hx, hand.hy + 3, .8); else if (i % 3 === 2) Sprites.props.phone(hand.hx, hand.hy, 42);
        const x = col * 160, y = 40 + row * 300; g.drawImage(b.c, 45 * Art.K, 20 * Art.K, 80 * Art.K, 110 * Art.K, x + 1, y, 160, 220); g.fillStyle = '#332f32'; g.font = '15px sans-serif'; g.fillText(outfit, x + 12, y + 247); g.font = '12px sans-serif'; g.fillText((row ? 'seated' : 'standing') + ' / ' + pose.expr, x + 12, y + 266);
      });
      return c.toDataURL().split(',')[1];
    }, theme);
    await writeFile(path.join(out, `rig-${theme}.png`), Buffer.from(image, 'base64'));
  }
  await writeFile(path.join(out, 'art-check-results.json'), JSON.stringify(checks, null, 2));
  console.log('PASS: 64 deterministic layers, animated frame pairs, opaque walkable floors.', 'Post max ms:', Math.max(...checks.map(x => x.postMs)), 'Build max ms:', Math.max(...checks.map(x => x.buildMs)));
} finally { await b.close(); }
