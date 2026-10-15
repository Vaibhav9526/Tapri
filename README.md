# Tapri Radio

A living Indian chai-stall (tapri) you can sit at: a pixel-art scene drawn entirely in code, with an owner who really works (chai, samosas, agarbatti, shooing flies, selling chips and cold drinks, UPI soundbox), customers who chat, a helper boy, a street dog, an ElevenLabs-made soundscape, and a radio with its own stations plus your YouTube playlist.

* Two looks (Retro village / Comic) x eight places (city, village, rural, urban, hill station, seaside, desert highway, railway station) x four times of day.
* Run: `node tools/serve.mjs` then open http://localhost:8080 (click "Baith jaao" to start the sound).
* Put your playlist in `site/js/config.js` or paste it in the radio panel.
* Docs: `AGENTS.md`, `docs/THEME_API.md`, `docs/RENDER_CONTRACT.md`. Tests: `tests/` (needs `npm i --no-save puppeteer-core`).
* Audio: `site/audio/` (ElevenLabs; `_orig/` keeps untouched originals). `tools/normalize_audio.mjs` balances loudness and loops; `tools/generate_audio.mjs` makes files (needs `ELEVENLABS_API_KEY` in `tools/.env`).
