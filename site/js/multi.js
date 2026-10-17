/* Shared rooms: enter a code, sit at the same tapri, hear the same radio, talk over voice.
   Talks to server/index.mjs over a WebSocket (presence, radio/world state, WebRTC signalling); voice is peer-to-peer WebRTC.
   Players are ordinary seated customers (Tapri.Person) that never leave and never speak on their own: their mouth moves only
   while their real microphone is active. Sound itself lives in voice.js, the character editor in avatar.js. */
(() => {
'use strict';
const Tapri = window.Tapri, L = Tapri.L, $ = id => document.getElementById(id), V = window.TapriVoice, AV = window.TapriAvatar;
const store = { get(k) { try { return localStorage.getItem('tapri.' + k) || ''; } catch (e) { return ''; } }, set(k, v) { try { localStorage.setItem('tapri.' + k, v); } catch (e) {} } };

let ws = null, pending = null, joined = false, ready = false, closing = false, me = null, code = '', iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
const players = new Map();          // id -> { id, name, style, seat, person, tag, mine }
const pcs = new Map();              // id -> { pc, polite, making, ignore }
let retry = 0, timers = {}, myName = store.get('name');
let focusPref = store.get('focus') !== '0';   // the bench focus only applies inside a room; solo play always has the full crowd
Tapri.focus = false;

// the rig caches sprites on the style object (keys starting with _); never send or keep those across the wire
const clean = s => JSON.parse(JSON.stringify(s, (k, v) => (k[0] === '_' ? undefined : v)));
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }

/* ---------- entry page ---------- */
const hashCode = (location.hash.match(/room=([A-Za-z0-9]+)/) || [])[1];
const nameBoxes = [$('rmName'), $('avName')];
nameBoxes.forEach(el => { el.value = myName; el.addEventListener('input', () => { myName = el.value.slice(0, 16); nameBoxes.forEach(o => { if (o !== el) o.value = myName; }); store.set('name', myName.trim()); if (joined) { const p = players.get(me.id); if (p) { p.name = myName.trim() || 'Mehmaan'; p.tag.textContent = p.name + ' (you)'; } send({ t: 'profile', name: myName }); } }); el.addEventListener('keydown', e => e.stopPropagation()); });
$('rmCode').value = (hashCode || store.get('code') || '').toUpperCase();
const showTab = join => { $('tabJoin').classList.toggle('on', join); $('tabCreate').classList.toggle('on', !join); $('paneJoin').hidden = !join; $('paneCreate').hidden = join; if (join) $('rmCode').focus(); };
$('tabCreate').onclick = () => showTab(false); $('tabJoin').onclick = () => showTab(true); if (hashCode) showTab(true);
$('rmCode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); $('rmErr').textContent = ''; });
$('rmCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('rmJoin').click(); e.stopPropagation(); });
function begin(create) {
  const c = $('rmCode').value.trim();
  if (!create && c.length < 3) { $('rmErr').textContent = 'Type the room code your friend gave you.'; $('rmCode').focus(); return; }
  $('rmErr').textContent = '';
  pending = { create, code: create ? '' : c, name: myName.trim(), mic: $('rmMic').checked };
  $('enter').click();
}
$('rmJoin').onclick = () => begin(false); $('rmNew').onclick = () => begin(true);
Tapri.hooks.entered = () => { if (pending) connect(); };

/* ---------- socket ---------- */
const send = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => send({ t: 'join', code: joined ? code : pending.code, create: !joined && pending.create, rejoin: joined, name: myName.trim() || pending.name, style: clean(AV.style()) });
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } handle(m); };
  ws.onclose = () => { clearInterval(timers.ping); if (closing) return; if (joined) { ready = false; toast('Connection lost — reconnecting…'); setTimeout(connect, Math.min(1000 * ++retry, 6000)); } else leaveToIntro('Could not reach the server.'); };
  ws.onerror = () => {};
  clearInterval(timers.ping); timers.ping = setInterval(() => send({ t: 'ping' }), 25000);
}
function leaveToIntro(msg) { closing = true; try { ws && ws.close(); } catch (e) {} location.hash = ''; try { sessionStorage.setItem('tapri.err', msg || ''); } catch (e) {} location.reload(); }
try { const bootErr = sessionStorage.getItem('tapri.err'); if (bootErr) { $('rmErr').textContent = bootErr; sessionStorage.removeItem('tapri.err'); } } catch (e) {}

function handle(m) {
  switch (m.t) {
    case 'error': leaveToIntro(m.msg); break;
    case 'welcome': onWelcome(m); break;
    case 'peer-join': addPlayer(m.peer); ensurePC(m.peer.id); toast(m.peer.name + ' aa gaya'); countUI(); break;
    case 'peer-update': { const p = players.get(m.peer.id); if (p) { p.name = m.peer.name; p.tag.textContent = p.name; if (m.peer.style && m.peer.style.outfit) { const st = clean(m.peer.style); p.style = st; p.person.style = st; p.person.female = !!st.female; } } break; }
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
  addPlayer({ id: m.id, name: myName.trim() || 'Main', style: AV.style(), seat: m.seat }, true);
  for (const p of m.peers) { addPlayer(p); ensurePC(p.id); }
  history.replaceState(null, '', '#room=' + code); store.set('code', code);
  $('roomBar').hidden = false; $('rbCodeTxt').textContent = code; countUI(); paintBar();
  if (m.world) Tapri.worldCtl.apply(m.world); else send({ t: 'world', world: Tapri.worldCtl.get() });
  if (m.radio) Tapri.radioCtl.apply({ ...m.radio, lag: Math.max(0, (m.now - m.radio.at) / 1000) }); else send({ t: 'radio-sync', state: Tapri.radioCtl.get() });
  ready = true; updateFocus();
  if (first) { toast(m.peers.length ? 'Room ' + code + ' — ' + (m.peers.length + 1) + ' log baithe hain' : 'Room ' + code + ' ready — share the code!'); if (pending.mic) startVoice(); }
  else if (V.started) for (const id of pcs.keys()) addTracks(id);
}
const countUI = () => { $('rbCount').innerHTML = ico('users') + '<span>' + players.size + '</span>'; V.refreshPeers(); };
const peerList = () => [...players.values()].filter(p => !p.mine).map(p => ({ id: p.id, name: p.name }));

/* ---------- players = seated customers who only move their mouth when they really talk ---------- */
const origSay = Tapri.say;
Tapri.say = function (ent) { return ent && ent.player ? Tapri.lineDur(null, arguments[2] || '') : origSay.apply(this, arguments); };
function addPlayer(p, mine) {
  removePlayer(p.id, true);
  const seat = L.seats[p.seat]; if (!seat) return;
  const old = seat.p; if (old && !old.player) { old.dead = true; seat.p = null; Tapri.seatItems[p.seat] = { glass: null, plate: null }; Tapri.convoAbort && Tapri.convoAbort(old); }
  const person = new Tapri.Person('sitter', seat, true);
  if (p.style && p.style.outfit) { person.style = mine ? p.style : clean(p.style); person.female = !!person.style.female; }
  person.player = p; person.life = Infinity; person.phoneMode = null; person.paper = false; person.canChat = () => false; person.jig = false; Tapri.people.push(person);
  const tag = document.createElement('div'); tag.className = 'ptag' + (mine ? ' me' : ''); tag.textContent = p.name + (mine ? ' (you)' : ''); Tapri.view.layer.appendChild(tag);
  players.set(p.id, { ...p, mine: !!mine, person, tag, talkAt: 0 }); updateFocus();
}
function removePlayer(id, quiet) {
  const p = players.get(id); if (!p) return; players.delete(id); p.tag.remove(); closePC(id);
  const o = p.person; o.player = null; o.life = 0;
  if (quiet) { o.dead = true; if (o.seat.p === o) o.seat.p = null; } else if (o.state === 'seated') { o.act = 'idle'; o.glass = 0; o.state = 'standup'; o.t0 = Tapri.T; Tapri.convoAbort && Tapri.convoAbort(o); } else o.dead = true;
  updateFocus();
}
// a world / time-of-day switch rebuilds the crowd: sit everyone back down
const origReset = Tapri.resetCrowd;
Tapri.resetCrowd = function () {
  origReset.apply(this, arguments);
  if (!players.size) return;
  const list = [...players.values()]; players.clear();
  for (const p of list) { p.tag.remove(); addPlayer({ id: p.id, name: p.name, style: p.style, seat: p.seat }, p.mine); }
};
// my own look changes live and everyone else sees it
AV.onChange(style => { if (!joined || !me) return; const p = players.get(me.id); if (p) { p.style = style; p.person.style = style; p.person.female = !!style.female; } clearTimeout(timers.prof); timers.prof = setTimeout(() => send({ t: 'profile', style: clean(style), name: myName }), 250); });
// name tags under each player, glowing while they talk; the mouth moves only while sound is really coming from them
Tapri.hooks.frame = () => {
  if (!players.size) return; const S = Tapri.view.scale(), now = performance.now();
  for (const p of players.values()) {
    const a = p.person.anchor(), x = a.x * S, y = a.y * S, w = p.tag.offsetWidth, h = p.tag.offsetHeight;
    p.tag.style.transform = `translate(${(x - w / 2).toFixed(1)}px,${(y - h - 3).toFixed(1)}px)`;
    const talking = p.mine ? V.speaking : V.peerTalking(p.id);
    p.tag.classList.toggle('talk', talking); p.tag.classList.toggle('nomic', p.mine && V.started && (!V.mic || V.deafened));
    if (talking) p.person.talkUntil = Tapri.T + 0.2; else if (p.person.talkUntil > Tapri.T + 0.2) p.person.talkUntil = 0;
  }
};

/* ---------- focus bench: only the people in the room, zoomed in ---------- */
function updateFocus() {
  if (!Tapri.view) return;
  Tapri.focus = focusPref && joined;
  if (!Tapri.focus || !players.size) { Tapri.view.focus(null); return; }
  const xs = [...players.values()].map(p => L.seats[p.seat].x), lo = Math.min(...xs), hi = Math.max(...xs);
  Tapri.view.focus((lo + hi) / 2, Math.max(270, hi - lo + 170));
}
function setFocus(on) { focusPref = on; Tapri.focus = on && joined; store.set('focus', on ? '1' : '0'); if (!on && joined) Tapri.resetCrowd(); updateFocus(); paintBar(); toast(on ? 'Focus bench: only your group is shown' : 'Back to the busy tapri'); }

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
  const pc = new RTCPeerConnection({ iceServers }), st = { pc, polite: me.id < id, making: false, ignore: false };
  pcs.set(id, st);
  pc.onicecandidate = e => { if (e.candidate) sendSig(id, { candidate: e.candidate }); };
  pc.onnegotiationneeded = async () => { try { st.making = true; await pc.setLocalDescription(); sendSig(id, { description: pc.localDescription }); } catch (e) { console.warn('negotiate', e); } finally { st.making = false; } };
  pc.ontrack = e => { const p = players.get(id); V.attach(id, e.streams[0] || new MediaStream([e.track]), p ? p.name : ''); V.refreshPeers(); };
  pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') { try { pc.restartIce(); } catch (e) {} } };
  if (V.started) addTracks(id);
  return st;
}
function addTracks(id) { const st = pcs.get(id), s = V.stream; if (!st || !s) return; const have = st.pc.getSenders().map(x => x.track); for (const t of s.getTracks()) if (!have.includes(t)) st.pc.addTrack(t, s); }
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
function closePC(id) { const st = pcs.get(id); if (!st) return; pcs.delete(id); try { st.pc.close(); } catch (e) {} V.detach(id); }

async function startVoice() {
  const r = await V.start(); if (r !== true) { toast(r); return false; }
  for (const id of pcs.keys()) addTracks(id); paintBar(); return true;
}
V.on(() => {}, paintBar, peerList);

/* ---------- room bar ---------- */
function paintBar() {
  const mic = $('rbMic'), on = V.started && V.mic && !V.deafened;
  mic.classList.toggle('on', on); mic.classList.toggle('muted', V.started && !on);
  mic.innerHTML = !V.started ? ico('mic') + '<span>Join voice</span>' : on ? ico('mic') : ico('mic-off'); mic.title = !V.started ? 'Join voice chat' : on ? 'Mute your mic' + (V.ptt ? ' (push to talk: ' + V.ptt + ')' : '') : 'Unmute your mic';
  const d = $('rbDeaf'); d.classList.toggle('muted', V.deafened); d.innerHTML = ico(V.deafened ? 'headphones-off' : 'headphones'); d.title = V.deafened ? 'Undeafen' : 'Deafen (stop hearing everyone)'; d.hidden = !V.started;
  $('rbFocus').classList.toggle('on', focusPref);
}
$('rbMic').onclick = async () => { TA.resume(); if (!V.started) { await startVoice(); return; } V.setMic(!V.mic); };
$('rbDeaf').onclick = () => V.setDeaf(!V.deafened);
$('rbFocus').onclick = () => setFocus(!focusPref);
$('rbLook').onclick = () => AV.openEditor();
$('rbSet').onclick = () => { TA.resume(); V.openSettings(); };
$('rbCode').onclick = async () => {
  const url = location.origin + location.pathname + '#room=' + code;
  try { await navigator.clipboard.writeText(url); toast('Invite link copied — code ' + code); } catch (e) { toast('Room code: ' + code); }
};
$('rbLeave').onclick = () => leaveToIntro('');
window.addEventListener('beforeunload', () => { closing = true; });
paintBar();

window.TapriRoom = { players, pcs, get code() { return code; }, get ready() { return ready; } };
})();
