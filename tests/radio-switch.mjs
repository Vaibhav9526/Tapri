// Rapid station switching must leave exactly one music loop playing and never wedge the page. Usage: node tests/radio-switch.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:8080/';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
try {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
  p.on('pageerror', e => errors.push(e.message));
  await p.evaluateOnNewDocument(() => {   // count looping buffer sources that are started and not yet stopped
    window.__loops = new Set(); const S = AudioBufferSourceNode.prototype, st = S.start, sp = S.stop;
    S.start = function () { if (this.loop) window.__loops.add(this); this.addEventListener('ended', () => window.__loops.delete(this)); return st.apply(this, arguments); };
    S.stop = function () { const r = sp.apply(this, arguments); setTimeout(() => window.__loops.delete(this), 400); return r; };
  });
  await p.goto(base + '#autoenter', { waitUntil: 'load' });
  await p.waitForFunction(() => document.getElementById('intro').classList.contains('gone'), { timeout: 20000 });
  await new Promise(r => setTimeout(r, 3500)); const base0 = await p.evaluate(() => window.__loops.size); const t0 = Date.now();
  for (let i = 0; i < 40; i++) { await p.evaluate(i => document.querySelectorAll('#stations button')[[1, 2, 3, 1, 2, 4, 3][i % 7]].click(), i); await new Promise(r => setTimeout(r, i % 3 ? 30 : 160)); }
  await p.evaluate(() => document.querySelectorAll('#stations button')[2].click());
  await new Promise(r => setTimeout(r, 2500));
  const n = await p.evaluate(() => window.__loops.size), name = await p.evaluate(() => document.getElementById('sname').textContent);
  console.log('baseline loops', base0, 'station', name, 'live loops', n, 'ms', Date.now() - t0);
  assert.equal(name, 'Purane Gaane'); assert(n <= base0, 'extra music loops are playing: ' + n + ' vs baseline ' + base0); assert.deepEqual(errors, []); console.log('PASS');
} catch (e) { console.error('FAIL', e.message, errors); process.exitCode = 1; } finally { await b.close(); }
