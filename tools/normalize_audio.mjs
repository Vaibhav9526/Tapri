// Balances every ElevenLabs file so the mix is sane: consistent loudness per group, seamless loop seams,
// rumble removed from beds, peaks limited. Originals are kept in site/audio/_orig and used as the source,
// so this is safe to re-run.   node tools/normalize_audio.mjs
import fs from 'fs'; import path from 'path'; import { execFileSync, spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site', 'audio'), orig = path.join(root, '_orig');
const TARGET = { // integrated LUFS
  'amb/crowd': -27, 'amb/gossip': -31, 'amb/traffic': -32, 'amb/rain': -28, 'amb/birds': -32, 'amb/crickets': -35, 'amb/stove': -33,
  'sfx/dog_bark': -22, 'sfx/sparrow': -28, 'sfx/glass_clink': -26, 'sfx/chai_pour': -26, 'sfx/sip': -30, 'sfx/fly': -34, 'sfx/phone_notify': -26, 'sfx/laugh': -26, 'sfx/cough': -28, 'sfx/kettle': -28,
  'amb/samosa_fry': -31, 'amb/glass_wash': -33, 'sfx/chips_tear': -26, 'sfx/box_rustle': -30, 'sfx/cloth_swish': -30, 'sfx/coins': -28, 'sfx/note_rustle': -32, 'sfx/match_strike': -28, 'sfx/cola_open': -26, 'sfx/stool_scrape': -30, 'sfx/table_set': -28, 'sfx/kettle_lid': -30, 'sfx/sizzle_drop': -26, 'sfx/dog_yelp': -22, 'sfx/trickle': -32,
  'music': -21, 'voice': -24
};
const LOOP_FADE = 1.6;
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === '_orig' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]); }
// keep untouched originals (also for files generated later)
for (const f of walk(root).filter(f => f.endsWith('.mp3'))) { const rel = path.relative(root, f), dst = path.join(orig, rel); if (!fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(f, dst); console.log('backed up', rel); } }
const ff = (...a) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...a], { encoding: 'utf8' });
function loudness(file) { const r = ff('-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'); const m = (r.stderr || '').match(/I:\s+(-?[\d.]+) LUFS/g); if (!m) return null; return parseFloat(m[m.length - 1].replace(/[^-\d.]/g, '').replace(/^-?/, s => s)); }
function lufs(file) { const r = ff('-i', file, '-af', 'ebur128', '-f', 'null', '-'); const s = r.stderr || ''; const i = s.lastIndexOf('I:'); return i < 0 ? null : parseFloat(s.slice(i + 2)); }
function duration(file) { return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })); }
function keyFor(rel) { const k = rel.replace(/\\/g, '/').replace(/\.mp3$/, ''); if (k.startsWith('music/')) return 'music'; if (k.startsWith('voice/') || k.startsWith('voice2/')) return 'voice'; return k.replace(/_\d+$/, ''); }
let n = 0;
for (const src of walk(orig).filter(f => f.endsWith('.mp3'))) {
  const rel = path.relative(orig, src), key = keyFor(rel), target = TARGET[key]; if (target === undefined) continue;
  const dst = path.join(root, rel), cur = lufs(src); if (cur === null || !isFinite(cur)) { console.log('skip (no loudness)', rel); continue; }
  const gain = Math.max(-40, Math.min(30, target - cur)), isBed = rel.replace(/\\/g, '/').startsWith('amb/');
  let chain = '';
  if (isBed) { const d = duration(src), body = d - LOOP_FADE; chain = `[0:a]highpass=f=55,atrim=0:${LOOP_FADE},asetpts=PTS-STARTPTS[h];[0:a]highpass=f=55,atrim=${LOOP_FADE}:${d},asetpts=PTS-STARTPTS[b];[b][h]acrossfade=d=${LOOP_FADE}:c1=qsin:c2=qsin,volume=${gain.toFixed(2)}dB,alimiter=limit=0.8[o]`; }
  else if (key !== 'music') chain = `[0:a]silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,afade=t=in:d=0.008,volume=${gain.toFixed(2)}dB,alimiter=limit=0.85[o]`;
  else chain = `[0:a]volume=${gain.toFixed(2)}dB,alimiter=limit=0.85[o]`;
  const r = ff('-i', src, '-filter_complex', chain, '-map', '[o]', '-ar', '44100', '-b:a', '128k', dst);
  if (r.status !== 0) { console.log('FAILED', rel, (r.stderr || '').slice(-200)); continue; }
  n++; console.log(rel.padEnd(30), `${cur.toFixed(1)} -> ${target} LUFS (${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB)`);
}
console.log('processed', n, 'files');
