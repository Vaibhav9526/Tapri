// Two browsers in one room: seats, avatars, name tags, talking animation only with real voice, focus bench, synced radio/world,
// WebRTC voice, voice settings. Usage: node tests/multi-room.mjs [baseUrl]
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
const wait = (p, fn, arg) => p.waitForFunction(fn, { timeout: 25000, polling: 200 }, arg);
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const A = await open('A'), B = await open('B');
  await sleep(1500); await A.screenshot({ path: path.join(out, 'multi-intro.png') });
  // A: pick a distinct character in the editor, then create the room
  await A.type('#rmName', 'Asha'); await A.click('#avEdit'); await A.evaluate(() => document.querySelector('#avBody .chip').click()); // Woman
  await A.waitForSelector('#avatarEd:not([hidden])'); await sleep(400); await A.screenshot({ path: path.join(out, 'multi-editor.png') });
  await A.click('#avDone'); await A.click('#rmNew');
  await wait(A, () => window.TapriRoom && window.TapriRoom.ready);
  const code = await A.evaluate(() => window.TapriRoom.code); assert.match(code, /^[A-Z2-9]{4}$/); console.log('room', code);
  await B.type('#rmName', 'Ravi'); await B.evaluate(() => TapriAvatar.shuffle()); await B.click('#tabJoin'); await B.type('#rmCode', code.toLowerCase()); await B.click('#rmJoin');
  await wait(B, () => window.TapriRoom && window.TapriRoom.ready);
  await wait(A, () => window.TapriRoom.players.size === 2); await wait(B, () => window.TapriRoom.players.size === 2);
  for (const [n, p] of [['A', A], ['B', B]]) {
    const r = await p.evaluate(() => [...window.TapriRoom.players.values()].map(x => ({ name: x.name, state: x.person.state, seat: x.seat, look: x.style.outfit + '/' + x.style.skin + '/' + x.style.female })));
    console.log(n, JSON.stringify(r)); assert.deepEqual(r.map(x => x.name).sort(), ['Asha', 'Ravi']); assert(r.every(x => x.state === 'seated')); assert.notEqual(r[0].look, r[1].look, 'two different characters');
  }
  // focus bench: nobody but the room is sitting around
  await sleep(1500);
  for (const p of [A, B]) assert.equal(await p.evaluate(() => Tapri.people.filter(x => !x.player && !x.dead).length), 0, 'focus bench hides the crowd');
  // voice connects both ways
  await wait(A, () => window.TapriRoom.pcs.size === 1 && [...window.TapriRoom.pcs.values()].every(s => s.pc.connectionState === 'connected'));
  await wait(B, () => window.TapriRoom.pcs.size === 1 && [...window.TapriRoom.pcs.values()].every(s => s.pc.connectionState === 'connected'));
  console.log('voice connected both ways');
  // talking animation follows real sound only: A's fake mic beeps -> B sees A talk; muting A silences the animation
  await wait(B, () => [...window.TapriRoom.players.values()].some(x => !x.mine && x.tag.classList.contains('talk')));
  console.log('remote talking shown');
  await A.click('#rbMic'); await sleep(1500);
  let talkFrames = 0; for (let i = 0; i < 12; i++) { talkFrames += await B.evaluate(() => [...window.TapriRoom.players.values()].filter(x => !x.mine && (x.tag.classList.contains('talk') || x.person.talkUntil > Tapri.T)).length); await sleep(250); }
  assert.equal(talkFrames, 0, 'no talking animation while muted'); console.log('muted => no talking animation');
  await A.click('#rbMic');
  // live avatar change reaches the other side
  const before = await B.evaluate(() => [...window.TapriRoom.players.values()].find(x => !x.mine).style.shirt);
  await A.click('#rbLook'); await A.evaluate(() => { const sw = [...document.querySelectorAll('#avBody .sw')][2]; [...sw.querySelectorAll('.swatch')].find(x => !x.classList.contains('on')).click(); });
  await wait(B, s => [...window.TapriRoom.players.values()].find(x => !x.mine).style.shirt !== s, before); console.log('avatar change synced'); await A.click('#avDone');
  // voice settings dialog
  await A.click('#rbSet'); await sleep(400); await A.screenshot({ path: path.join(out, 'multi-voice.png') });
  await A.select('#vsOut', ''); await A.click('#vsClose');
  // radio + world sync
  await A.evaluate(() => document.querySelectorAll('#stations button')[2].click());
  await wait(B, () => document.getElementById('sname').textContent === 'Purane Gaane'); console.log('radio synced');
  await A.evaluate(() => __world('village', 'comic')); await sleep(1500);
  const wa = await A.evaluate(() => Tapri.worldCtl.get()), wb = await B.evaluate(() => Tapri.worldCtl.get());
  assert.equal(wb.theme, wa.theme); assert.equal(wb.env, wa.env); console.log('world synced', JSON.stringify(wb));
  assert.equal(await B.evaluate(() => window.TapriRoom.players.size), 2, 'players survive world switch');
  await sleep(1500); await B.screenshot({ path: path.join(out, 'multi-B.png') });
  await B.click('#rbFocus'); await sleep(1200); await B.screenshot({ path: path.join(out, 'multi-B-wide.png') });
  await A.click('#rbLeave'); await wait(B, () => window.TapriRoom.players.size === 1); console.log('leave ok');
  const C = await open('C'); await C.click('#tabJoin'); await C.type('#rmCode', 'ZZZZ'); await C.click('#rmJoin');
  await wait(C, () => document.getElementById('rmErr').textContent.includes('No room')); console.log('bad code rejected');
  assert.deepEqual(errors, [], errors.join('\n')); console.log('PASS');
} catch (e) { console.error('FAIL', e.message, errors); process.exitCode = 1; } finally { await b.close(); }
