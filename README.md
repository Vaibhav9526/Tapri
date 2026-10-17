# Tapri Radio

A living Indian chai-stall (tapri) you can sit at — a 480×320 pixel-art scene drawn entirely in code, with an owner who really works (brewing chai, frying samosas, lighting agarbatti, shooing flies, selling chips and cold drinks, a UPI soundbox), customers who chat, a helper boy, a street dog, street life on the front lane (vendors, kids playing gully cricket, a cow), an ElevenLabs-made soundscape, and a radio with its own stations plus your YouTube playlist.

You can also share the bench: shared rooms sync the radio across friends, with WebRTC voice chat and custom avatars.

## Quick start

**Solo**

```
node tools/serve.mjs
```

Open <http://localhost:8080> and click **"Baith jaao"** to start the sound.

**Shared rooms (multiplayer)**

```
npm install
npm start          # node server/index.mjs
```

Same URL — the intro card gains a room form. Players are seated on the bench, the radio is synced, and voice chat runs over WebRTC (optional TURN relay via `TURN_URL`, `TURN_USER`, `TURN_PASS`).

## The world

- **3 looks (themes):** Retro, Comic, Chitra
- **9 places (envs):** Old City, Metro City, Village, Farmland, Hill Station, Seaside, Desert Highway, Railway Station, Mohalla
- **4 times of day:** morning, day, dusk, night

## Dev shortcuts

URL hash hooks (from the project root URL):

- `#shot=<morning|day|dusk|night>&env=<id>&theme=<id>&t=<seconds>&ui=0` — skip the intro, fast-forward the sim, hide the HUD
- `&act=agar|fry|shoo|chai|wipe|...` — force an owner routine
- `#autoenter` — auto-click the intro button (for audio tests)

Console helpers: `window.__sim(sec)`, `window.__world(env, theme)`, `TA.level()`, `TA.debug()`.

## Radio

Put your YouTube playlist in `site/js/config.js` or paste it into the radio panel in the UI. The radio panel, mute button, and `#shot=...` hooks are load-bearing — keep them working.

## Project layout

```
site/
  index.html, style.css, themes.css
  js/
    main.js        loop, camera, speech bubbles, UI, YouTube, world switching
    core.js        shared state, particles, counter props
    owner.js       the shop owner's routines
    crowd.js       customers, helper, conversations
    dog.js         the street dog
    street.js      front-lane street life (vendors, kids, cow)
    dialogues.js   all spoken lines
    audio.js       mixer
    art.js         default city art, time of day, theme/env registries, layout anchors (L)
    people.js      character rig
    worlds.js      load order for themes/envs — list new files here
    themes/        retro.js, comic.js, chitra.js
    envs/          city, urban, village, rural, hill, coast, desert, railway, mohalla
    multi.js       rooms client (room bar, players as seated Persons, WebRTC voice)
    avatar.js      avatar editor (character model -> rig style, localStorage)
    voice.js       mic pipeline (input volume, VAD gate, push-to-talk, deafen)
    config.js      YouTube playlist
  audio/           amb/ music/ sfx/ voice/ voice2/  (`_orig/` = untouched originals)
server/
  index.mjs        static server + WebSocket rooms at /ws
tools/
  serve.mjs        dev server for solo work (sends no-store)
  normalize_audio.mjs   balances loudness and loop seams
  generate_audio.mjs    makes ElevenLabs files (needs ELEVENLABS_API_KEY in tools/.env)
  fetch_street_voices.mjs  pulls new ElevenLabs clips into voice2/
tests/             puppeteer-based checks (see below)
docs/              THEME_API.md, RENDER_CONTRACT.md, ART_BRIEF_V2.md, CHITRA_STYLE.md
```

## Audio pipeline

Audio lives in `site/audio/`; `_orig/` keeps the untouched originals. Do not hand-edit audio files, and don't regenerate over normalised ones without removing the matching `_orig` copy.

- `node tools/generate_audio.mjs` — create ElevenLabs files (`ELEVENLABS_API_KEY` in `tools/.env`)
- `node tools/fetch_street_voices.mjs <list.json>` — pull new street-voice clips into `voice2/` + `_orig/`, updates the manifest
- `node tools/normalize_audio.mjs` — balance loudness and loop seams

## Tests

```
npm i --no-save puppeteer-core
node tools/serve.mjs        # or npm start for room tests
```

| Test | What it checks |
| --- | --- |
| `node tests/world-matrix.mjs` | every env × theme × time of day |
| `node tests/world-behavior.mjs` | rig, IK hand anchors, pour/tray/delivery, sit/stand, radio/YouTube |
| `node tests/world-art-checks.mjs` | deterministic layers, opaque floors, timings |
| `node tests/multi-room.mjs [baseUrl]` | shared rooms (run against `npm start`) |
| `node tests/radio-switch.mjs` | rapid station switching must not stack music loops |

Screenshots land in `%TEMP%/tapri-art-verification/`. Check syntax after edits with `node --check site/js/<file>.js`.

## Deployment

- **Render** — Node web service via `render.yaml` (`npm install`, `node server/index.mjs`, health check `/healthz`). Set `TURN_*` env vars for a TURN relay if needed.
- **Vercel** — static hosting of `site/` via `vercel.json` (audio cached 24h, js/css always revalidated). Static deploys are solo-only — rooms need the Node server.

## Docs

- `AGENTS.md` — project rules, run commands, file ownership
- `docs/THEME_API.md` — theme/environment API (read before touching art)
- `docs/RENDER_CONTRACT.md`, `docs/ART_BRIEF_V2.md`, `docs/CHITRA_STYLE.md` — art direction and render contract
