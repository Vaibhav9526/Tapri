// Downloads the street-life voice clips generated in ElevenLabs (flow "Tapri street voices") into site/audio/voice2 and
// registers them in the voice manifest under "<voice>|<text>", exactly like tools/generate_audio.mjs does.
// Usage: node tools/fetch_street_voices.mjs <list.json>   (list = [[voice, text, signedUrl], ...])
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'site', 'audio');
const list = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const mp = path.join(out, 'voice2', 'manifest.json'), manifest = JSON.parse(fs.readFileSync(mp, 'utf8'));
for (const [v, text, url] of list) {
  const key = v + '|' + text, f = 'voice2/' + crypto.createHash('md5').update(key).digest('hex').slice(0, 10) + '.mp3';
  const r = await fetch(url); if (!r.ok) { console.error('FAILED', key, r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(path.join(out, f), buf); fs.mkdirSync(path.join(out, '_orig', 'voice2'), { recursive: true }); fs.writeFileSync(path.join(out, '_orig', f), buf);
  manifest.lines[key] = f; console.log('saved', f, (buf.length / 1024).toFixed(0) + 'KB', key);
}
fs.writeFileSync(mp, JSON.stringify(manifest, null, 1));
