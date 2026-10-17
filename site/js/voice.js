/* Voice for shared rooms: microphone pipeline (input volume -> noise gate / push-to-talk -> what peers hear), remote audio playback
   (output device, master + per-person volume, deafen) and the Discord-style settings dialog.
   multi.js owns the peer connections; this file owns everything about sound. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const DEF = { inputId: '', outputId: '', inVol: 1, sens: 0.28, mode: 'vad', pttKey: 'KeyV', echo: true, noise: true, agc: true, outVol: 1 };
const cfg = (() => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem('tapri.voice'))); } catch (e) { return { ...DEF }; } })();
const saveCfg = () => { try { localStorage.setItem('tapri.voice', JSON.stringify(cfg)); } catch (e) {} };
const thresh = () => cfg.sens * cfg.sens * 0.2;         // slider 0..1 -> RMS; the meter uses the same curve so the marker lines up
const meterVal = rms => Math.min(1, Math.sqrt(rms / 0.2));

let ac = null, raw = null, src = null, inGain, tap, gate, dest, loop, graphReady = false, monitorGain = null;
let micEnabled = true, deafened = false, pttDown = false, holdUntil = 0, speakingLocal = false, level = 0, started = false;
const peers = new Map();      // id -> { audio, an, vol, muted, name, lastTalk }
let onStream = () => {}, onState = () => {}, peerList = () => [];

const rms = an => { if (!an) return 0; an.getByteTimeDomainData(an.buf); let s = 0; for (let i = 0; i < an.buf.length; i++) { const v = (an.buf[i] - 128) / 128; s += v * v; } return Math.sqrt(s / an.buf.length); };
function mkAnalyser(node) { const an = ac.createAnalyser(); an.fftSize = 1024; an.buf = new Uint8Array(an.fftSize); node.connect(an); return an; }
function ensureCtx() { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; }
function ensureGraph() {
  if (graphReady) return; ensureCtx();
  inGain = ac.createGain(); inGain.gain.value = cfg.inVol; gate = ac.createGain(); gate.gain.value = 0; dest = ac.createMediaStreamDestination();
  tap = ac.createAnalyser(); tap.fftSize = 1024; tap.buf = new Uint8Array(tap.fftSize); inGain.connect(tap); inGain.connect(gate); gate.connect(dest);
  graphReady = true; loop = setInterval(tick, 40);
}
function tick() {
  level = rms(tap); const now = performance.now(), t = thresh();
  if (cfg.mode === 'ptt') { speakingLocal = pttDown && micEnabled && !deafened && level > 0.006; }
  else { if (level > t) holdUntil = now + 350; speakingLocal = micEnabled && !deafened && now < holdUntil; }
  const open = cfg.mode === 'ptt' ? pttDown && micEnabled && !deafened : speakingLocal;
  gate.gain.setTargetAtTime(open ? 1 : 0, ac.currentTime, 0.015);
  for (const p of peers.values()) { if (rms(p.an) > 0.008) p.lastTalk = now; }
  if (meterEl) paintMeter();
}

/* ----- microphone ----- */
async function openMic() {
  ensureGraph(); const c = { echoCancellation: cfg.echo, noiseSuppression: cfg.noise, autoGainControl: cfg.agc };
  if (cfg.inputId) c.deviceId = { ideal: cfg.inputId };
  const s = await navigator.mediaDevices.getUserMedia({ audio: c, video: false });
  if (raw) raw.getTracks().forEach(t => t.stop()); if (src) src.disconnect(); raw = s; src = ac.createMediaStreamSource(s); src.connect(inGain);
  const t = s.getAudioTracks()[0]; if (t && t.getSettings().deviceId && !cfg.inputId) { /* remember nothing: default device */ }
  refreshDevices();
}
async function start() {
  if (started) return true;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { return 'Voice needs https and a browser with microphone access.'; }
  try { await openMic(); } catch (e) { return e && e.name === 'NotFoundError' ? 'No microphone found.' : 'Microphone blocked — allow it in the browser to talk.'; }
  started = true; onStream(dest.stream); onState(); return true;
}
const setMic = on => { micEnabled = on; if (on && deafened) setDeaf(false); onState(); };
function setDeaf(on) { deafened = on; applyOutputs(); onState(); }

/* ----- remote audio ----- */
const peerVol = p => (p.muted || deafened || TA.muted ? 0 : Math.min(1, cfg.outVol * p.vol));
function applyPeer(p) { p.audio.volume = peerVol(p); p.audio.muted = p.audio.volume === 0; if (cfg.outputId && p.audio.setSinkId) p.audio.setSinkId(cfg.outputId).catch(() => {}); }
function applyOutputs() { peers.forEach(applyPeer); }
function attach(id, stream, name) {
  detach(id); ensureCtx();
  const a = document.createElement('audio'); a.autoplay = true; a.playsInline = true; a.srcObject = stream; a.style.display = 'none'; document.body.appendChild(a);
  const prev = peers.get(id), p = { audio: a, an: mkAnalyser(ac.createMediaStreamSource(stream)), vol: prev ? prev.vol : 1, muted: prev ? prev.muted : false, name, lastTalk: 0 };
  peers.set(id, p); applyPeer(p); a.play().catch(() => {});
}
function detach(id) { const p = peers.get(id); if (!p) return; p.audio.remove(); peers.delete(id); }
TA.on('mute', () => applyOutputs());

/* ----- push to talk ----- */
const typing = e => e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== 'range';
window.addEventListener('keydown', e => { if (capturing) return; if (e.code === cfg.pttKey && !typing(e) && !e.repeat) { pttDown = true; if (cfg.mode === 'ptt') e.preventDefault(); } });
window.addEventListener('keyup', e => { if (e.code === cfg.pttKey) pttDown = false; });
window.addEventListener('blur', () => { pttDown = false; });

/* ----- settings dialog ----- */
let meterEl = null, capturing = false;
const keyName = c => c.replace(/^Key/, '').replace(/^Digit/, '').replace('Space', 'Space').replace('Arrow', '↔ ').replace('Control', 'Ctrl');
function paintMeter() { const bar = $('vsLevel'), bar2 = $('vsLevel2'), mark = $('vsMark'); if (!bar) return; const w = (meterVal(level) * 100).toFixed(1) + '%', hot = speakingLocal || (cfg.mode === 'ptt' && pttDown && level > 0.006); bar.style.width = bar2.style.width = w; mark.style.left = (meterVal(thresh()) * 100).toFixed(1) + '%'; bar.classList.toggle('hot', hot); bar2.classList.toggle('hot', hot); }
async function refreshDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return; let list = []; try { list = await navigator.mediaDevices.enumerateDevices(); } catch (e) { return; }
  const fill = (el, kind, cur) => { if (!el) return; el.textContent = ''; const d = document.createElement('option'); d.value = ''; d.textContent = 'Default'; el.appendChild(d); list.filter(x => x.kind === kind && x.deviceId !== 'default' && x.deviceId !== 'communications').forEach((x, i) => { const o = document.createElement('option'); o.value = x.deviceId; o.textContent = x.label || (kind === 'audioinput' ? 'Microphone ' : 'Speaker ') + (i + 1); el.appendChild(o); }); el.value = [...el.options].some(o => o.value === cur) ? cur : ''; };
  fill($('vsIn'), 'audioinput', cfg.inputId); fill($('vsOut'), 'audiooutput', cfg.outputId); if ($('vsOut')) $('vsOut').disabled = !HTMLMediaElement.prototype.setSinkId;
}
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
function paintPeers() {
  const box = $('vsPeers'); box.textContent = ''; const list = peerList();
  if (!list.length) { const e = document.createElement('p'); e.className = 'vs-empty'; e.textContent = 'Nobody else is here yet.'; box.appendChild(e); return; }
  for (const { id, name } of list) {
    const p = peers.get(id) || { vol: 1, muted: false }, r = document.createElement('div'); r.className = 'vs-peer';
    const n = document.createElement('span'); n.textContent = name; const sl = document.createElement('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.01; sl.value = p.vol; sl.setAttribute('aria-label', name + ' volume');
    const mu = document.createElement('button'); mu.type = 'button'; mu.textContent = p.muted ? '🔇' : '🔊'; mu.title = p.muted ? 'Unmute ' + name : 'Mute ' + name;
    const upd = () => { const q = peers.get(id); if (q) { q.vol = +sl.value; q.muted = p.muted; applyPeer(q); } else { /* not connected yet */ } };
    sl.oninput = () => { p.vol = +sl.value; const q = peers.get(id); if (q) { q.vol = p.vol; applyPeer(q); } };
    mu.onclick = () => { p.muted = !p.muted; mu.textContent = p.muted ? '🔇' : '🔊'; const q = peers.get(id); if (q) { q.muted = p.muted; applyPeer(q); } };
    r.append(n, sl, mu); box.appendChild(r);
  }
}
function bindSettings() {
  const d = $('voiceSet'); if (d.dataset.bound) return; d.dataset.bound = 1; meterEl = $('vsLevel');
  $('vsClose').onclick = $('vsDone').onclick = closeSettings; d.addEventListener('pointerdown', e => { if (e.target === d) closeSettings(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !d.hidden && !capturing) closeSettings(); });
  $('vsIn').onchange = async e => { cfg.inputId = e.target.value; saveCfg(); if (started) { try { await openMic(); } catch (er) { $('vsMsg').textContent = 'Could not switch microphone.'; } } };
  $('vsOut').onchange = e => { cfg.outputId = e.target.value; saveCfg(); applyOutputs(); };
  const vol = (id, key, out, fn) => { const el = $(id); el.value = cfg[key]; out.textContent = Math.round(cfg[key] * 100) + '%'; el.oninput = () => { cfg[key] = +el.value; out.textContent = Math.round(cfg[key] * 100) + '%'; saveCfg(); fn && fn(); }; };
  vol('vsInVol', 'inVol', $('vsInVolN'), () => { if (inGain) inGain.gain.value = cfg.inVol; });
  vol('vsOutVol', 'outVol', $('vsOutVolN'), applyOutputs);
  $('vsSens').value = cfg.sens; $('vsSens').oninput = e => { cfg.sens = +e.target.value; saveCfg(); };
  const mode = () => { document.querySelectorAll('#voiceSet [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === cfg.mode)); $('vsVadBox').hidden = cfg.mode !== 'vad'; $('vsPttBox').hidden = cfg.mode !== 'ptt'; };
  document.querySelectorAll('#voiceSet [data-mode]').forEach(b => b.onclick = () => { cfg.mode = b.dataset.mode; saveCfg(); mode(); }); mode();
  $('vsKey').textContent = keyName(cfg.pttKey);
  $('vsKey').onclick = () => { capturing = true; $('vsKey').textContent = 'Press a key…'; const h = e => { e.preventDefault(); e.stopPropagation(); capturing = false; if (e.code !== 'Escape') { cfg.pttKey = e.code; saveCfg(); } $('vsKey').textContent = keyName(cfg.pttKey); window.removeEventListener('keydown', h, true); }; window.addEventListener('keydown', h, true); };
  for (const [id, key] of [['vsEcho', 'echo'], ['vsNoise', 'noise'], ['vsAgc', 'agc']]) { const el = $(id); el.checked = cfg[key]; el.onchange = async () => { cfg[key] = el.checked; saveCfg(); if (started) { try { await openMic(); } catch (er) {} } }; }
  $('vsMonitor').onchange = e => { if (!started) { e.target.checked = false; return; } if (e.target.checked) { monitorGain = ac.createGain(); monitorGain.gain.value = 0.8; inGain.connect(monitorGain); monitorGain.connect(ac.destination); } else if (monitorGain) { monitorGain.disconnect(); inGain.disconnect(monitorGain); monitorGain = null; } };
  $('vsStart').onclick = async () => { const r = await start(); if (r !== true) $('vsMsg').textContent = r; paintState(); };
}
function paintState() { $('vsStartBox').hidden = started; $('vsLive').hidden = !started; if (started) refreshDevices(); }
function openSettings() { bindSettings(); $('vsMsg').textContent = ''; $('vsMonitor').checked = !!monitorGain; paintPeers(); paintState(); refreshDevices(); $('voiceSet').hidden = false; }
function closeSettings() { if (monitorGain) { $('vsMonitor').checked = false; $('vsMonitor').onchange({ target: $('vsMonitor') }); } $('voiceSet').hidden = true; }

window.TapriVoice = {
  start, attach, detach, setMic, setDeaf, openSettings, refreshPeers: () => { if (!$('voiceSet').hidden) paintPeers(); },
  get started() { return started; }, get mic() { return micEnabled; }, get deafened() { return deafened; }, get stream() { return dest ? dest.stream : null; },
  get speaking() { return speakingLocal; }, get ptt() { return cfg.mode === 'ptt' ? keyName(cfg.pttKey) : ''; },
  peerTalking: id => { const p = peers.get(id); return !!p && performance.now() - p.lastTalk < 300 && peerVol(p) >= 0; },
  on(fnStream, fnState, fnPeers) { onStream = fnStream; onState = fnState; peerList = fnPeers; }
};
})();
