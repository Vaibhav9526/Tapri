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

## Shared rooms (multiplayer)
- `node server/index.mjs` (or `npm start`) serves `site/` and runs the rooms over a WebSocket at `/ws`; `tools/serve.mjs` is still fine for solo work.
- Client side lives in `site/js/multi.js` (room form on the intro card, room bar, players as seated `Tapri.Person`s, WebRTC voice). It talks to `main.js` only through `Tapri.hooks.changed/frame/entered`, `Tapri.radioCtl`, `Tapri.worldCtl`, `Tapri.view`.
- Deployed on Render as a Node web service (`render.yaml`); optional env `TURN_URL`, `TURN_USER`, `TURN_PASS` for a TURN relay.
- Test with the server running: `node tests/multi-room.mjs [baseUrl]`.
- More client files: `site/js/avatar.js` (character model -> rig style, preview, editor dialog; saved in localStorage), `site/js/voice.js` (mic pipeline with input volume / voice-activity gate / push-to-talk, output device and volumes, deafen, the voice settings dialog). Players never speak by themselves: `Tapri.say` is a no-op for them and their mouth moves only while their real voice level is up.
- Focus bench (`Tapri.focus`, room bar 🎯): hides every NPC customer and zooms on the room's players via `Tapri.view.focus(x, width)`. The server seats the first players on the middle bench (next to the radio and counter).
- UI icons are inline SVG (`<symbol id="i-name">` sprite at the top of `index.html`, helper `ico('name')` in `js/icons.js`); do not use emoji in the UI. Tests: `node tests/radio-switch.mjs` (rapid station switching must not stack music loops).
- Street life lives in `site/js/street.js` (vendors with carts/props, a child asking customers for money, kids playing gully cricket, passers-by, a cow) on the front lane in front of the tables; lines are `D.street` in `dialogues.js` (voice keys `k`, `k2`, `v1`..`v5`). New ElevenLabs clips made through the MCP are pulled in with `node tools/fetch_street_voices.mjs <list.json>` (writes `voice2/` + `_orig/`, updates the manifest), then `node tools/normalize_audio.mjs`.
- Landscape screens fill the full width (`layout()` in `main.js` covers width and crops a little sky, bottom anchored at y=318).
- New default look: theme `chitra` (`themes/chitra.js`: Indian-comics vector rig that replaces stand/sit via `Sprites.hooks.stand/sit`, smaller real-anatomy head via `hooks.face`) in env `mohalla` (`envs/mohalla.js` vector stall + `envs/mohalla-backdrops.js` painted images under `site/img/mohalla/`). Style/anatomy notes: `docs/CHITRA_STYLE.md`. Themes can also override held props via `actors.props` (`themes/chitra-props.js`).
- Env backdrops: `env.backdrop[time].desktop|mobile = { src, rect:[x,y,w,h] }` (rect = the 480x320 scene inside the image, 3:2); drawn behind the canvas and aligned in `main.js` (`tests/backdrop.mjs`). Envs with a backdrop must make `sky`/`far` transparent.
