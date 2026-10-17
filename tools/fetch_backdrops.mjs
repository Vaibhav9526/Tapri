// Downloads painted backdrop images (generated in ElevenLabs, flow "Tapri mohalla backdrops") and converts them to webp.
// Usage: node tools/fetch_backdrops.mjs <list.json>   list = [[outName, signedUrl], ...]  -> site/img/mohalla/<outName>.webp
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site', 'img', 'mohalla'); fs.mkdirSync(out, { recursive: true });
for (const [name, url] of JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))) {
  const r = await fetch(url); if (!r.ok) { console.error('FAILED', name, r.status); continue; }
  const tmp = path.join(out, name + '.src'); fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  const dst = path.join(out, name + '.webp'); execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-c:v', 'libwebp', '-quality', '84', dst]); fs.unlinkSync(tmp);
  const dims = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', dst], { encoding: 'utf8' }).trim();
  console.log(name, dims, (fs.statSync(dst).size / 1024).toFixed(0) + 'KB');
}
