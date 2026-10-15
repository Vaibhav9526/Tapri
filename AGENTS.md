# Tapri

A chai-stall simulation drawn in code on a 480x320 pixel canvas, with a radio (own stations + YouTube playlist), ElevenLabs ambience/voices, two looks and eight places.

## Run
- Serve from the project root with `node tools/serve.mjs`; the site runs at `http://localhost:8080` (sends `no-store`).
- Dev shortcut that skips the intro, fast-forwards the simulation and hides the HUD:
  `#shot=<morning|day|dusk|night>&env=<id>&theme=<id>&t=<seconds>&ui=0`, optionally `&act=agar|fry|shoo|chai|wipe|...` (forces an owner routine).
  `#autoenter` clicks the intro button (for audio tests). Console helpers: `window.__sim(sec)`, `window.__world(env, theme)`, `TA.level()`, `TA.debug()`.

## Layout (who owns what)
- Engine and behaviour (code): `main.js` (loop, camera, speech bubbles, UI, YouTube, world switching), `core.js` (shared state, particles, counter props), `owner.js` (the shop owner's routines), `crowd.js` (customers, helper, conversations), `dog.js`, `dialogues.js` (all spoken lines), `audio.js` (mixer).
- Art: `art.js` (default city art, time of day, registries), `people.js` (character rig), `envs/*.js` (places), `themes/*.js` + `themes.css` (looks). Files are listed in `worlds.js`.
- The theme/environment API is documented in `docs/THEME_API.md`. Read it before touching art.
- Audio files live in `site/audio/` (`_orig/` keeps untouched originals); `tools/normalize_audio.mjs` balances loudness and loop seams, `tools/generate_audio.mjs` makes ElevenLabs files. Do not hand-edit audio files; do not regenerate over normalised ones without removing the matching `_orig` copy.

## Rules
- Preserve the radio/YouTube panel, the mute button, and the `#shot=...` hooks.
- Keep the stall layout anchors in `art.js` (`L`) — people, props and sounds are synchronised to them.
- Check syntax with `node --check site/js/<file>.js` for every file you edit.

## Tests
- `npm i --no-save puppeteer-core`, then with the server running: `node tests/world-matrix.mjs` (every env x theme x time of day), `node tests/world-behavior.mjs` (rig, IK hand anchors, pour/tray/delivery, sit/stand, radio/YouTube), `node tests/world-art-checks.mjs` (deterministic layers, opaque floors, timings). Screenshots go to `%TEMP%/tapri-art-verification/`.
