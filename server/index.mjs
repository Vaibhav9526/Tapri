/* Tapri server: serves site/ and runs the shared rooms.
   A room is a 4-letter code. Everyone in it sits at the same stall (max 6 seats), hears the same radio and talks over
   WebRTC voice; this server only relays small JSON messages (presence, radio/world state, WebRTC signalling). */
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = process.env.PORT || 8080;
const SEATS = 6, SEAT_ORDER = [2, 3, 0, 1, 4, 5], EMPTY_TTL = 10 * 60 * 1000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((q, s) => {
  const url = decodeURIComponent(q.url.split('?')[0]);
  if (url === '/healthz') { s.writeHead(200); return s.end('ok'); }
  let p = path.normalize(path.join(root, url));
  if (!p.startsWith(root)) { s.writeHead(403); return s.end('forbidden'); }
  if (url.endsWith('/')) p = path.join(p, 'index.html');
  fs.readFile(p, (e, d) => {
    if (e) { s.writeHead(404); return s.end('not found'); }
    const ext = path.extname(p), cache = p.includes(`${path.sep}audio${path.sep}`) ? 'public, max-age=86400' : 'no-cache';
    s.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': cache }); s.end(d);
  });
});

/* ---------- rooms ---------- */
const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => { for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; if (!rooms.has(c)) return c; } };
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const cleanName = n => String(n || '').replace(/[<>]/g, '').trim().slice(0, 16) || 'Mehmaan';
const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
const bcast = (room, m, except) => { for (const c of room.clients.values()) if (c !== except) send(c.ws, m); };
const pub = c => ({ id: c.id, name: c.name, style: c.style, seat: c.seat });
function ice() {
  const list = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  if (process.env.TURN_URL) list.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USER, credential: process.env.TURN_PASS });
  return list;
}
let nextId = 1;

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
wss.on('connection', ws => {
  let me = null, room = null; ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  const leave = () => {
    if (!room || !me) return; room.clients.delete(me.id); bcast(room, { t: 'peer-leave', id: me.id });
    if (!room.clients.size) room.emptySince = Date.now(); room = me = null;
  };
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'join' && !me) {
      let code = normCode(m.code), r = rooms.get(code);
      if (m.create || (!r && m.rejoin && code.length >= 3)) { if (!r) { code = m.create ? newCode() : code; r = { code, clients: new Map(), radio: null, world: null, emptySince: 0 }; rooms.set(code, r); } }
      if (!r) return send(ws, { t: 'error', msg: 'No room with that code. Check it, or create a new one.' });
      const taken = new Set([...r.clients.values()].map(c => c.seat)); let seat = -1; for (const i of SEAT_ORDER) if (!taken.has(i)) { seat = i; break; }
      if (seat < 0) return send(ws, { t: 'error', msg: 'This tapri is full (6 seats). Try again in a bit.' });
      me = { id: nextId++, ws, name: cleanName(m.name), style: m.style && typeof m.style === 'object' ? m.style : {}, seat }; room = r; r.emptySince = 0;
      send(ws, { t: 'welcome', id: me.id, code: r.code, seat, peers: [...r.clients.values()].map(pub), radio: r.radio, world: r.world, now: Date.now(), ice: ice() });
      r.clients.set(me.id, me); bcast(r, { t: 'peer-join', peer: pub(me) }, me);
    } else if (!me) return;
    else if (m.t === 'radio' && m.state) { room.radio = { ...m.state, at: Date.now() }; bcast(room, { t: 'radio', state: room.radio, now: Date.now(), from: me.id }, me); }
    else if (m.t === 'radio-sync' && m.state) room.radio = { ...m.state, at: Date.now() };
    else if (m.t === 'profile') { if (m.name) me.name = cleanName(m.name); if (m.style && typeof m.style === 'object') me.style = m.style; bcast(room, { t: 'peer-update', peer: pub(me) }, me); }
    else if (m.t === 'world' && m.world) { room.world = m.world; bcast(room, { t: 'world', world: m.world, from: me.id }, me); }
    else if (m.t === 'signal') { const to = room.clients.get(m.to); if (to) send(to.ws, { t: 'signal', from: me.id, data: m.data }); }
    else if (m.t === 'ping') send(ws, { t: 'pong' });
  });
  ws.on('close', leave); ws.on('error', leave);
});
// drop dead sockets and long-empty rooms
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); }
  for (const [c, r] of rooms) if (!r.clients.size && r.emptySince && Date.now() - r.emptySince > EMPTY_TTL) rooms.delete(c);
}, 30000);

server.listen(port, () => console.log('Tapri on http://localhost:' + port));
