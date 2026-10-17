/* Shared rooms: enter a code, sit at the same tapri, hear the same radio, talk over voice.
   Talks to server/index.mjs over a WebSocket (presence, radio/world state, WebRTC signalling); voice is peer-to-peer WebRTC.
   Players are ordinary seated customers (Tapri.Person) that never leave, so the whole stall reacts to them like to any guest. */
(() => {
'use strict';
const Tapri = window.Tapri, L = Tapri.L, $ = id => document.getElementById(id);
const store = { get(k) { try { return localStorage.getItem('tapri.' + k) || ''; } catch (e) { return ''; } }, set(k, v) { try { localStorage.setItem('tapri.' + k, v); } catch (e) {} } };

let ws = null, pending = null, joined = false, ready = false, closing = false, me = null, code = '', myStyle = null, iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
const players = new Map();          // id -> { id, name, style, seat, person, tag, level }
const pcs = new Map();              // id -> { pc, polite, making, ignore, audio, level }
let localStream = null, micOn = false, ac = null, localAn = null;
let retry = 0, timers = {};

function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
const cleanStyle = s => JSON.parse(JSON.stringify(s, (k, v) => (k[0] === '_' ? undefined : v)));

/* ---------- intro form ---------- */
const hashCode = (location.hash.match(/room=([A-Za-z0-9]+)/) || [])[1];
$('rmName').value = store.get('name'); $('rmCode').value = (hashCode || store.get('code') || '').toUpperCase();
if (hashCode) $('rmCode').focus();
$('rmCode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
for (const id of ['rmName', 'rmCode']) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('rmCode').value ? $('rmJoin').click() : $('rmNew').click(); e.stopPropagation(); });
function begin(create) {
  const c = $('rmCode').value.trim();
  if (!create && c.length < 3) { $('rmErr').textContent = 'Type the room code your friend gave you.'; $('rmCode').focus(); return; }
  $('rmErr').textContent = ''; store.set('name', $('rmName').value.trim());
  pending = { create, code: create ? '' : c, name: $('rmName').value.trim(), mic: $('rmMic').checked };
  $('enter').click();
}
$('rmJoin').onclick = () => begin(false); $('rmNew').onclick = () => begin(true);
Tapri.hooks.entered = () => { if (pending) connect(); };

/* ---------- socket ---------- */
const send = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
function connect() {
  if (!myStyle) myStyle = cleanStyle(Sprites.makeStyle());
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => send({ t: 'join', code: joined ? code : pending.code, create: !joined && pending.create, rejoin: joined, name: pending.name, style: myStyle });
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } handle(m); };
  ws.onclose = () => { clearInterval(timers.ping); if (closing) return; if (joined) { ready = false; toast('Connection lost — reconnecting…'); setTimeout(connect, Math.min(1000 * ++retry, 6000)); } else leaveToIntro('Could not reach the server.'); };
  ws.onerror = () => {};
  clearInterval(timers.ping); timers.ping = setInterval(() => send({ t: 'ping' }), 25000);
}
function leaveToIntro(msg) { closing = true; try { ws && ws.close(); } catch (e) {} location.hash = ''; sessionStorage.setItem('tapri.err', msg || ''); location.reload(); }
const bootErr = sessionStorage.getItem('tapri.err'); if (bootErr) { $('rmErr').textContent = bootErr; sessionStorage.removeItem('tapri.err'); }

function handle(m) {
  switch (m.t) {
    case 'error': leaveToIntro(m.msg); break;
    case 'welcome': onWelcome(m); break;
    case 'peer-join': addPlayer(m.peer); ensurePC(m.peer.id); toast(m.peer.name + ' aa gaya ☕'); countUI(); break;
    case 'peer-leave': { const p = players.get(m.id); if (p) toast(p.name + ' chala gaya'); removePlayer(m.id); countUI(); break; }
    case 'radio': Tapri.radioCtl.apply({ ...m.state, lag: Math.max(0, (m.now - m.state.at) / 1000) }); break;
    case 'world': Tapri.worldCtl.apply(m.world); break;
    case 'signal': onSignal(m.from, m.data); break;
  }
}
function onWelcome(m) {
  const first = !joined; me = { id: m.id, seat: m.seat }; code = m.code; joined = true; retry = 0; if (m.ice) iceServers = m.ice;
  for (const id of [...players.keys()]) removePlayer(id, true);
  for (const id of [...pcs.keys()]) closePC(id);
  addPlayer({ id: m.id, name: pending.name || 'Main', style: myStyle, seat: m.seat }, true);
  for (const p of m.peers) { addPlayer(p); ensurePC(p.id); }
  history.replaceState(null, '', '#room=' + code); store.set('code', code);
  $('roomBar').hidden = false; $('rbCodeTxt').textContent = code; countUI();
  if (m.world) Tapri.worldCtl.apply(m.world); else send({ t: 'world', world: Tapri.worldCtl.get() });
  if (m.radio) Tapri.radioCtl.apply({ ...m.radio, lag: Math.max(0, (m.now - m.radio.at) / 1000) }); else send({ t: 'radio-sync', state: Tapri.radioCtl.get() });
  ready = true;
  if (first) { toast(m.peers.length ? 'Room ' + code + ' — ' + (m.peers.length + 1) + ' log baithe hain' : 'Room ' + code + ' ready — share the code!'); if (pending.mic) startVoice(); }
  else if (micOn) for (const [id] of pcs) addTracks(id);
}
const countUI = () => { $('rbCount').textContent = '👥 ' + players.size; };

/* ---------- players = seated customers ---------- */
function addPlayer(p, mine) {
  removePlayer(p.id, true);
  const seat = L.seats[p.seat]; if (!seat) return;
  const old = seat.p; if (old && !old.player) { old.dead = true; seat.p = null; Tapri.seatItems[p.seat] = { glass: null, plate: null }; Tapri.convoAbort && Tapri.convoAbort(old); }
  const person = new Tapri.Person('sitter', seat, true);
  if (p.style && p.style.outfit) { person.style = p.style; person.female = !!p.style.female; }
  person.player = p; person.life = Infinity; Tapri.people.push(person);
  const tag = document.createElement('div'); tag.className = 'ptag' + (mine ? ' me' : ''); tag.textContent = p.name + (mine ? ' (you)' : ''); Tapri.view.layer.appendChild(tag);
  players.set(p.id, { ...p, mine: !!mine, person, tag });
}
function removePlayer(id, quiet) {
  const p = players.get(id); if (!p) return; players.delete(id); p.tag.remove(); closePC(id);
  const o = p.person; o.player = null; o.life = 0;
  if (quiet) { o.dead = true; if (o.seat.p === o) o.seat.p = null; } else if (o.state === 'seated') { o.act = 'idle'; o.glass = 0; o.state = 'standup'; o.t0 = Tapri.T; Tapri.convoAbort && Tapri.convoAbort(o); } else o.dead = true;
}
// a world / time-of-day switch rebuilds the crowd: sit everyone back down
const origReset = Tapri.resetCrowd;
Tapri.resetCrowd = function () {
  origReset.apply(this, arguments);
  if (!players.size) return;
  const list = [...players.values()]; players.clear();
  for (const p of list) { p.tag.remove(); addPlayer({ id: p.id, name: p.name, style: p.style, seat: p.seat }, p.mine); }
};
// name tags under each player, glowing while they talk
Tapri.hooks.frame = () => {
  if (!players.size) return; const S = Tapri.view.scale();
  for (const p of players.values()) {
    const x = p.person.x * S, y = (p.person.gy + 3) * S, w = p.tag.offsetWidth, h = p.tag.offsetHeight;
    p.tag.style.transform = `translate(${(x - w / 2).toFixed(1)}px,${(y - h / 2 + 4 * S).toFixed(1)}px)`;
    const talking = (p.mine ? micOn && level(localAn) > 0.035 : level(pcs.get(p.id) && pcs.get(p.id).an) > 0.03);
    p.tag.classList.toggle('talk', talking); p.tag.classList.toggle('nomic', p.mine && !micOn && !!localStream);
    if (talking) p.person.talkUntil = Math.max(p.person.talkUntil || 0, Tapri.T + 0.25);
  }
};

/* ---------- shared radio + world ---------- */
Tapri.hooks.changed = what => {
  if (!ready) return; clearTimeout(timers[what]);
  timers[what] = setTimeout(() => send(what === 'radio' ? { t: 'radio', state: Tapri.radioCtl.get() } : { t: 'world', world: Tapri.worldCtl.get() }), what === 'radio' ? 600 : 150);
};
// keep the room's stored position fresh so late joiners land on the right track
setInterval(() => { if (ready) { const s = Tapri.radioCtl.get(); if (s.station === 'yt' && s.playing) send({ t: 'radio-sync', state: s }); } }, 20000);

/* ---------- voice (WebRTC mesh) ---------- */
const sendSig = (to, data) => send({ t: 'signal', to, data });
function ensurePC(id) {
  if (pcs.has(id) || !me) return pcs.get(id);
  const pc = new RTCPeerConnection({ iceServers }), st = { pc, polite: me.id < id, making: false, ignore: false, audio: null, an: null };
  pcs.set(id, st);
  pc.onicecandidate = e => { if (e.candidate) sendSig(id, { candidate: e.candidate }); };
  pc.onnegotiationneeded = async () => { try { st.making = true; await pc.setLocalDescription(); sendSig(id, { description: pc.localDescription }); } catch (e) { console.warn('negotiate', e); } finally { st.making = false; } };
  pc.ontrack = e => attachRemote(id, e.streams[0] || new MediaStream([e.track]));
  pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') { try { pc.restartIce(); } catch (e) {} } };
  if (micOn || localStream) addTracks(id);
  return st;
}
function addTracks(id) { const st = pcs.get(id); if (!st || !localStream) return; const have = st.pc.getSenders().map(s => s.track); for (const t of localStream.getTracks()) if (!have.includes(t)) st.pc.addTrack(t, localStream); }
async function onSignal(from, data) {
  const st = ensurePC(from); if (!st) return; const pc = st.pc;
  try {
    if (data.description) {
      const collision = data.description.type === 'offer' && (st.making || pc.signalingState !== 'stable');
      st.ignore = !st.polite && collision; if (st.ignore) return;
      await pc.setRemoteDescription(data.description);
      if (data.description.type === 'offer') { await pc.setLocalDescription(); sendSig(from, { description: pc.localDescription }); }
    } else if (data.candidate) { try { await pc.addIceCandidate(data.candidate); } catch (e) { if (!st.ignore) throw e; } }
  } catch (e) { console.warn('signal', e); }
}
function closePC(id) { const st = pcs.get(id); if (!st) return; pcs.delete(id); try { st.pc.close(); } catch (e) {} if (st.audio) st.audio.remove(); }
function attachRemote(id, stream) {
  const st = pcs.get(id); if (!st) return; if (st.audio) st.audio.remove();
  const a = document.createElement('audio'); a.autoplay = true; a.playsInline = true; a.srcObject = stream; a.muted = TA.muted; a.style.display = 'none'; document.body.appendChild(a); a.play().catch(() => {});
  st.audio = a; st.an = analyse(stream);
}
function analyse(stream) {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an); an.buf = new Uint8Array(an.fftSize); return an; } catch (e) { return null; }
}
function level(an) { if (!an) return 0; an.getByteTimeDomainData(an.buf); let s = 0; for (let i = 0; i < an.buf.length; i++) { const v = (an.buf[i] - 128) / 128; s += v * v; } return Math.sqrt(s / an.buf.length); }
TA.on('mute', m => { for (const st of pcs.values()) if (st.audio) st.audio.muted = m; });

async function startVoice() {
  if (localStream) return setMic(!micOn);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Voice needs https and a browser with microphone access.'); return; }
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
  } catch (e) { toast('Microphone blocked — allow it in the browser to talk.'); return; }
  localAn = analyse(localStream); for (const id of pcs.keys()) addTracks(id); setMic(true);
}
function setMic(on) {
  micOn = on; if (localStream) localStream.getAudioTracks().forEach(t => { t.enabled = on; });
  const b = $('rbMic'); b.classList.toggle('on', on); b.classList.toggle('muted', !on && !!localStream);
  b.textContent = !localStream ? '🎙 Join voice' : on ? '🎙 Mic on' : '🔇 Mic muted'; b.title = !localStream ? 'Join voice chat' : on ? 'Mute your mic' : 'Unmute your mic';
}
$('rbMic').onclick = () => { TA.resume(); startVoice(); };
$('rbCode').onclick = async () => {
  const url = location.origin + location.pathname + '#room=' + code;
  try { await navigator.clipboard.writeText(url); toast('Invite link copied — code ' + code); } catch (e) { toast('Room code: ' + code); }
};
$('rbLeave').onclick = () => leaveToIntro('');
window.addEventListener('beforeunload', () => { closing = true; });

window.TapriRoom = { players, pcs, get code() { return code; }, get ready() { return ready; } };
})();
