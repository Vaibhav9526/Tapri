// Two browsers in one room: seats, name tags, synced radio/world, WebRTC voice. Usage: node tests/multi-room.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:8080/', out = path.join(process.env.TEMP || '.', 'tapri-art-verification');
await mkdir(out, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--disable-gpu', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
async function open(name) {
  const ctx = await b.createBrowserContext(); await ctx.overridePermissions(new URL(base).origin, ['microphone']);
  const p = await ctx.newPage(); await p.setViewport({ width: 1280, height: 800 });
  p.on('pageerror', e => errors.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|googleapis|youtube|ERR_/.test(m.text())) errors.push(name + ' console: ' + m.text()); });
  await p.goto(base, { waitUntil: 'load' }); return p;
}
const wait = (p, fn, arg) => p.waitForFunction(fn, { timeout: 20000, polling: 200 }, arg);
try {
  const A = await open('A'), B = await open('B');
  await A.type('#rmName', 'Asha'); await A.click('#rmNew');
  await wait(A, () => window.TapriRoom && window.TapriRoom.ready);
  const code = await A.evaluate(() => window.TapriRoom.code); assert.match(code, /^[A-Z2-9]{4}$/); console.log('room', code);
  await B.type('#rmName', 'Ravi'); await B.type('#rmCode', code.toLowerCase()); await B.click('#rmJoin');
  await wait(B, () => window.TapriRoom && window.TapriRoom.ready);
  await wait(A, () => window.TapriRoom.players.size === 2); await wait(B, () => window.TapriRoom.players.size === 2);
  for (const [n, p] of [['A', A], ['B', B]]) {
    const r = await p.evaluate(() => [...window.TapriRoom.players.values()].map(x => ({ name: x.name, state: x.person.state, seat: x.seat, tag: x.tag.textContent })));
    console.log(n, JSON.stringify(r)); assert.deepEqual(r.map(x => x.name).sort(), ['Asha', 'Ravi']); assert(r.every(x => x.state === 'seated'));
  }
  // voice: both mics on and peer connections connected
  await wait(A, () => [...window.TapriRoom.pcs.values()].every(s => s.pc.connectionState === 'connected') && window.TapriRoom.pcs.size === 1);
  await wait(B, () => [...window.TapriRoom.pcs.values()].every(s => s.pc.connectionState === 'connected') && window.TapriRoom.pcs.size === 1);
  await wait(B, () => [...window.TapriRoom.pcs.values()].every(s => s.audio && s.audio.srcObject && s.audio.srcObject.getAudioTracks().length));
  console.log('voice connected both ways');
  // radio + world sync
  await A.evaluate(() => document.querySelectorAll('#stations button')[2].click());
  await wait(B, () => document.getElementById('sname').textContent === 'Purane Gaane'); console.log('radio synced');
  await A.evaluate(() => __world('village', 'comic'));
  await wait(B, () => Art.themeId === 'comic' || document.getElementById('placeTxt').textContent.length > 0);
  await new Promise(r => setTimeout(r, 1200));
  const wa = await A.evaluate(() => Tapri.worldCtl.get()), wb = await B.evaluate(() => Tapri.worldCtl.get());
  assert.equal(wb.theme, wa.theme); assert.equal(wb.env, wa.env); console.log('world synced', JSON.stringify(wb));
  assert.equal(await B.evaluate(() => window.TapriRoom.players.size), 2, 'players survive world switch');
  await new Promise(r => setTimeout(r, 1500)); await B.screenshot({ path: path.join(out, 'multi-B.png') });
  // leaving
  await A.click('#rbLeave'); await wait(B, () => window.TapriRoom.players.size === 1); console.log('leave ok');
  // bad code
  const C = await open('C'); await C.type('#rmCode', 'ZZZZ'); await C.click('#rmJoin');
  await wait(C, () => document.getElementById('rmErr').textContent.includes('No room')); console.log('bad code rejected');
  assert.deepEqual(errors, [], errors.join('\n')); console.log('PASS');
} catch (e) { console.error('FAIL', e.message, errors); process.exitCode = 1; } finally { await b.close(); }
