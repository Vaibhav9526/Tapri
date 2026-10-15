// Generates every real sound the site can use with ElevenLabs and drops it where the site looks for it.
//   1. put your key in tools/.env  ->  ELEVENLABS_API_KEY=sk_...      (or set it in the environment)
//   2. node tools/generate_audio.mjs            -> everything (skips files that already exist)
//      node tools/generate_audio.mjs amb sfx    -> only some groups: amb | sfx | music | voice
//      node tools/generate_audio.mjs --force    -> regenerate even if the file exists
// Anything missing falls back to the site's built-in synthesized sound, so partial runs are fine.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'site', 'audio');
try { for (const l of fs.readFileSync(path.join(here, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch (e) {}
const key = process.env.ELEVENLABS_API_KEY; if (!key) { console.error('No ELEVENLABS_API_KEY (put it in tools/.env).'); process.exit(1); }
const args = process.argv.slice(2), force = args.includes('--force'), groups = args.filter(a => !a.startsWith('--')), want = g => !groups.length || groups.includes(g);
const api = (p, body, method = 'POST') => fetch('https://api.elevenlabs.io' + p, { method, headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
async function save(file, res) { if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 200)); const p = path.join(out, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(await res.arrayBuffer())); console.log('saved', file); }
const have = f => !force && fs.existsSync(path.join(out, f));
async function run(label, f, fn) { if (have(f)) return console.log('have ', f); try { await fn(); } catch (e) { console.error('FAILED', label, e.message); } }

// ---- ambience loops (22 s, seamless) ----
const AMB = {
  crowd: 'busy Indian street tea stall crowd murmur, many people chatting in Hindi in the background, no clear words, clinking glasses, no music, seamless loop',
  gossip: 'two or three Indian men and women gossiping quietly in Hindi at a tea stall, low murmuring conversation, soft laughter now and then, slow and calm like gentle white noise, seamless loop',
  traffic: 'distant Indian city road traffic, auto rickshaw engines, occasional soft horns, evening, seamless loop',
  rain: 'steady rain on a tin roof and wet street, cozy, seamless loop',
  birds: 'morning in an Indian neighbourhood, sparrows chirping, a crow cawing in the distance, peaceful, seamless loop',
  crickets: 'crickets and distant night sounds in an Indian town, quiet, with faint frogs, seamless loop',
  stove: 'kettle simmering on a gas stove, gentle bubbling and steam hiss, tea stall, seamless loop'
};
// ---- one-shots with variants ----
const SFX = {
  dog_bark: [3, 'single dog bark, medium street dog outdoors in the evening, one or two barks', 2],
  sparrow: [3, 'a few short sparrow chirps, close, outdoors', 2],
  glass_clink: [2, 'small tea glasses clinking against each other on a steel tray', 2],
  chai_pour: [2, 'hot tea being poured from a steel kettle into a small glass, about two seconds', 3],
  sip: [2, 'a person sipping hot tea from a glass, slurp, quiet', 1.5],
  fly: [2, 'a housefly buzzing around and flying past close to the microphone', 3],
  phone_notify: [2, 'smartphone message notification, soft muted chime', 1.5],
  laugh: [2, 'two men laughing together, relaxed, slightly distant, outdoors', 3],
  cough: [1, 'a man coughing once, outdoors, slightly distant', 1.5],
  kettle: [1, 'metal ladle stirring tea in a steel pot, spoon clinking on the rim', 3]
};
const MUSIC = {
  lofi: 'warm lo-fi hip hop instrumental, soft rhodes chords, vinyl crackle, mellow drums, relaxed chai-stall evening, 74 bpm',
  retro: 'vintage 1970s Bollywood instrumental as heard on an old AM transistor radio, harmonium, dholak, sitar, warm and nostalgic, 92 bpm',
  baarish: 'gentle rainy-night piano and soft pads, sparse notes, calm, intimate, instrumental, 58 bpm'
};

if (want('amb')) for (const [k, text] of Object.entries(AMB)) await run(k, `amb/${k}.mp3`, async () => save(`amb/${k}.mp3`, await api('/v1/sound-generation', { text, duration_seconds: 22, prompt_influence: 0.5, loop: true })));
if (want('sfx')) for (const [k, [n, text, dur]] of Object.entries(SFX)) for (let i = 1; i <= n; i++) await run(k, `sfx/${k}_${i}.mp3`, async () => save(`sfx/${k}_${i}.mp3`, await api('/v1/sound-generation', { text, duration_seconds: dur, prompt_influence: 0.6 })));
if (want('music')) for (const [k, prompt] of Object.entries(MUSIC)) await run(k, `music/${k}.mp3`, async () => save(`music/${k}.mp3`, await api('/v1/music', { prompt, music_length_ms: 120000, force_instrumental: true })));

// ---- spoken lines: every line in site/js/dialogues.js, one clip per (voice,text). Voice keys m,m2,f,f2,o,h map to voice ids below. ----
if (want('voice')) {
  const D = (new Function('window', fs.readFileSync(path.join(here, '..', 'site', 'js', 'dialogues.js'), 'utf8') + '; return window.TAPRI_DIALOGUES;'))({});
  const vr = await api('/v1/voices', null, 'GET'); if (!vr.ok) { console.error('could not list voices', vr.status); process.exit(1); }
  const all = (await vr.json()).voices || [], g2 = x => (x.labels && x.labels.gender) || '', men = all.filter(v => g2(v) === 'male'), women = all.filter(v => g2(v) === 'female');
  const cast = { m: men[0], m2: men[1] || men[0], o: men[2] || men[0], h: men[1] || men[0], f: women[0] || all[0], f2: women[1] || women[0] || all[0] };
  console.log('voices:', Object.entries(cast).map(([k, v]) => k + '=' + (v && v.name)).join(', '));
  const mp = path.join(out, 'voice2', 'manifest.json'); let manifest = { lines: {} }; try { manifest = JSON.parse(fs.readFileSync(mp, 'utf8')); } catch (e) {}
  for (const { v, text } of D.ALL_LINES()) {
    const key = v + '|' + text, id = crypto.createHash('md5').update(key).digest('hex').slice(0, 10), f = 'voice2/' + id + '.mp3';
    await run(key, f, async () => save(f, await api('/v1/text-to-speech/' + cast[v].voice_id + '?output_format=mp3_44100_128', { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35 } })));
    if (fs.existsSync(path.join(out, f))) manifest.lines[key] = f;
    fs.mkdirSync(path.dirname(mp), { recursive: true }); fs.writeFileSync(mp, JSON.stringify(manifest, null, 1));
  }
}
console.log('done');
