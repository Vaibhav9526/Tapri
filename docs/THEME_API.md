# Tapri — themes and environments (spec for the art work)

The site is a live chai-stall simulation drawn in code on a **480×320 pixel canvas**. Gameplay, sound and the people are done.
What is being added now is **two looks (themes)** and **many places (environments)** so the same stall can sit in a city,
a village, farmland, a modern urban block, a hill station, a seaside, a desert highway, a railway station and so on.

* **Theme = how everything is rendered** (colour grade, outlines, post effects, how characters/bubbles look).
  1. `retro` — an old-age **village** look: faded film colours, grain, elderly people, old-fashioned clothes and props.
  2. `comic` — **real life, slightly cartoonized**: bold ink outlines, saturated flat/cel colours, halftone shadows, characters with
     bigger heads and expressive faces, comic-style speech balloons. Not anime, not chibi — believable people, a little exaggerated.
* **Environment = what is around and behind the stall.** An environment can replace the roof, back wall, ground, far scenery,
  add moving things (traffic, trains, cattle, boats, clouds) and bias who turns up (ages/clothes) and what you hear.
* Every theme works in every environment, and in all four times of day (`morning | day | dusk | night`).

## Who edits what (important)
* **Art owner (you):** everything under `site/js/envs/`, `site/js/themes/`, `site/themes.css`, `site/js/worlds.js`,
  plus the drawing code in `site/js/art.js` (default city art) and `site/js/people.js` (character rig).
* **Not yours:** `core.js owner.js crowd.js dog.js main.js audio.js index.html style.css` and `site/audio/`, `tools/`.
  If you need a change there, tell the Claude session (cross-session message or Orca) and say exactly what and why.

## Run / test
* `node tools/serve.mjs` → http://localhost:8080 (already running; `Cache-Control: no-store`).
* Dev shortcut (skips the intro, fast-forwards, hides the HUD):
  `http://localhost:8080/#shot=<morning|day|dusk|night>&env=<id>&theme=<id>&t=<seconds to simulate>&ui=0`
  e.g. `#shot=dusk&env=village&theme=comic&t=40&ui=0`. Add `&act=agar|fry|shoo|chai|wipe|...` to force an owner routine.
* `node --check` every file you touch. `window.__sim(sec)` fast-forwards the simulation. Console prefixes to watch:
  `ENV_DYNAMIC_ERR`, `THEME_POST_ERR`, `WORLD_FILE_FAIL`.
* A headless-Chrome driver with puppeteer-core is at
  `C:\Users\VAIBHAV\AppData\Local\Temp\claude\D--Tizmo-AI-Tapri\d17e061e-a24c-4f93-b793-7f82f0271ed2\scratchpad\drv\` (`run.mjs`, `seq.mjs`); or use your own.
* **Always look at screenshots of every environment × theme × time of day you add**, at desktop (1280×800) and phone portrait (390×844).

## Registering a world
Add the file name to `site/js/worlds.js` (`window.TAPRI_WORLD_FILES`); `main.js` loads them in order before the scene is built.

```js
Art.registerEnv('hill', { label: 'Hill Station', icon: '⛰️', layers: {...}, dynamic: [...], mix: {...}, people: {...} });
Art.registerTheme('comic', { label: 'Comic', icon: '💥', grade, post, outlineW, outlineColor, actors: {...}, ... });
```
Existing examples to copy: `envs/village.js` (open-air stall, thatch roof, fields, moving cart/clouds/smoke) and `themes/retro.js`.
The default `city` environment is the original art in `art.js`.

### Environment spec
```js
{
  label, icon,                         // shown in the Look & place card
  layers: {                            // every key optional; missing ones fall back to the default city art (Art.defaults[key])
    sky(ctx, api), far(ctx, api),      // full-canvas backdrops (sky is below `far`)
    roof(ctx, api), backWall(ctx, api), sign(ctx, api), board(ctx, api), ground(ctx, api),   // all painted on one canvas, in this order, above `far`
    furnBack(ctx, api),                // stools, crates, bins, drum  (behind the seated people)
    tables(ctx, api),                  // the benches in front of the seated people
    counter(ctx, api),                 // counter + display cases + stove + carton + soundbox (drawn in front of the owner)
    glass(ctx, api),                   // glass fronts of the display cases (very top of the counter group)
    canopy(ctx, api), foliage(ctx,api),// canopy = static foreground (trunk, poles); foliage() returns [{c,x,y,amp,sp,ph,loose}] sprites that sway
    emit(ctx, api)                     // glowing things, drawn with additive blending (bulbs, windows, fridge, signs)
  },
  dynamic: [{ z:'sky'|'far'|'front', draw(ctx, t, dt, api, env) }],   // per-frame moving things: clouds/birds ('sky'), trains/boats/carts ('far'), road traffic ('front')
  mix:    { traffic, birds, crickets, crowd },   // multipliers (default 1) on the ambience beds for this place
  people: { age:{young,mid,old}, outfits:[...], female:0..1 }   // who turns up; outfits are style.outfit strings your torso code understands
}
```
* `ctx` is a plain 2D context of a 480×320 canvas (already `imageSmoothingEnabled=false`). Draw with whole-pixel coordinates.
* **`api`** gives you: `api.P(x,y,w,h,col)` (fill, *lit by the time of day and graded by the theme*), `api.E(x,y,w,h,col)` (emissive, never darkened),
  `bx` (shaded box), `disc`, `line`, `speckle`, `pixelText`, `shade(hex,amt)`, `tone(hex)`, `rng(seed)`, `mk(w,h)`, `glowSprite`,
  `api.T` (time-of-day definition: `.amb`, `.sky`, `.lamps`, `.lit`, `.clouds`, `.stars`, `.moon`, `.wet`), `api.name`, `api.L` (layout), `api.clamp`.
  **Use `P` for anything that should look different at night; use `E` for light sources.** Re-use the same palette so people and scenery match.
* Layers are rebuilt on every scene/time/theme change (≈30 ms), so they may do real work but must be deterministic (seed `rng`).
* Dynamic draws run every frame: keep them cheap, use `Art.api` helpers, never allocate big canvases per frame.
* A layer can be an **open-air** version: skip `backWall` paint and let the `far` backdrop show behind the shelves (see `envs/village.js`);
  call `Art.defaults.backWallItems(ctx)` to still get shelves/jars/shrine/fridge/chips-strip without the wall.

### Gameplay anchors you must keep (the people interact with these)
The stall layout (`api.L`) is fixed; paint around it, don't move it.
* Counter top y=208 (x 94–408), counter front panel y 215–262; owner stands behind it, upper body visible above y=208.
* Display cases on the counter x 112–178, 180–246, 248–300 (y 176–208) — samosa/pakoda/kachori items are drawn on top by code.
* Stove x 300–356 at y≈198 (kettle at x 312, kadhai at x 338); glass tray end of counter x 372–396; soundbox x 380–394; QR sticker x 376–398,y 226–252.
* Shelves: top shelf y 124 (x 150–366), second shelf y 152 (x 150–296). Radio is drawn by code at (276,152); clock hands at (318,108);
  shrine photo x 230–252,y 126–156 with the incense holder at (241,153); chips strip x 104–160,y 96–150; fridge x 366–392,y 104–208; carton x 98–124,y 184–208.
* Seats (stool tops, ground = y 292): x 68,108 | 258,304 | 412,456 at y 266; benches x 48–128, 236–326, 392–474 at y 262–268.
* Ground line for walkers y 304; customers at the counter stand at y 278; helper's home x≈346,y 284 with a washing tub at x 326.
* Pavement/ground must still read as walkable between y 262 and 312; the dog walks y 298–306.
* Lamps (`L.lamps`) are the light sources used for actor lighting at dusk/night — if you move bulbs in your art, keep these positions or tell us.

### Theme spec
```js
{
  label, icon,
  grade(hexAfterAmbient, albedoHex, T) -> hex,   // colour grade applied to *every* P()/Sprites colour (memoised). Posterize, saturate, tint here.
  post(ctx, t, api),                              // runs last on the finished 480×320 frame (grain, scanlines, halftone, ink-edge pass...). Keep it < 3 ms.
  outlineW: 1 | 2, outlineColor: '#hex',          // outline drawn around every actor (people/dog). 2 = bold comic line.
  actors: { head, torso, arm, style },            // see below; any key optional
}
```
CSS for the HUD and speech bubbles goes in `site/themes.css`, scoped `body[data-theme="comic"] { ... }`.
Bubbles are DOM elements `.bub` (+ `.order`, `.call`, `.speaker`, `.note`) sized from `--u` (screen px per scene pixel); the tail is `.bub .tail`.
For comic: balloons with thick black outlines, hard shadow, a comic font (load from Google Fonts in `themes.css` with `@import`, keep a Devanagari fallback —
speech is Hindi in Devanagari, so the font **must** fall back to `'Noto Sans Devanagari'`), maybe a jagged "shout" tail for `.order`.

### Characters (`people.js`)
People are drawn by one rig: `Sprites.stand(g, style, pose, light)` and `Sprites.sit(...)`, built from `head(s, cx, top, o)`, `torso(s, cx, top, rows, narrow, extra)`,
`arm(s, sx, sy, tx, ty, sg, far, sleeve)` with shaded `limb()`s and a two-bone IK. Proportions are ~7 heads tall, 96 px standing.
* A theme can swap pieces without touching the rig: `actors: { head: fn, torso: fn, arm: fn, style: (style, opts) => void }`
  (same signatures as the built-ins in `people.js`; `Sprites.hooks` is cleared and refilled from the active theme on every world change).
  `style` runs when a person is created — use it to change clothes, hair, accessories, proportions (`s.h` = height factor).
* Style fields: `female, age('young'|'mid'|'old'), skin, hc (hair colour), hair, outfit('shirt'|'tee'|'kurta'|'hoodie'|...), shirt, pants, shoe, sandals, dupatta, cap, glasses, must, beard, stubble, check, bindi, graphic, h`.
  You may add new outfits/accessories (dhoti, turban, shawl, sweater, lungi, fisherman's cap, cowboy hat, saree...) — then make the torso/legs code draw them.
* Keep the contract used by the simulation: `stand()`/`sit()` return `{hand, lhand, shY, headTop, sx0}` / `{handR, handL, head, sh, shY}`; held props (glass, phone, kettle...) are drawn at those hand positions.
  Pose inputs (`pose.arms`, `pose.fx/fy`, `pose.expr` = `'n'|'smile'|'talk'|'laugh'|'sip'|'eat'`, `pose.glow`, `pose.crouch`, `pose.dip`...) must keep working.
* **Comic characters:** bigger head (≈1.25–1.4× width), larger readable eyes with highlights, thicker brows, simpler 2-tone cel shading,
  a heavier outline, slightly shorter legs and broader gestures — still clearly a real person of that age/gender/region. Faces must stay expressive when talking/laughing/sipping.
* **Retro characters:** the current pixel rig with an older, village crowd (grey hair, spectacles, moustaches, dhoti/kurta, gamchha, turbans, shawls, sweaters) and film-faded colours.
* People should differ by environment via `env.people` (a hill station wears sweaters and shawls, a desert highway wears turbans, the coast wears lungis and fishermen's caps,
  a modern urban block wears jeans, tees and lanyards, a railway station has people with bags and flasks...).

### Already done — do not redo
Tree sway (`foliage`), clouds drifting (in `envs/village.js` as an example), the dog's behaviour, arm IK (elbows pick the natural side, hand targets are smoothed),
speech, audio, owner/helper/customer behaviour, the Look & place UI. If something in these looks wrong, report it.

## What to deliver
1. **Environments** (each with all four times of day looking right): `city` (rework the default old-city bazaar so it feels crowded and alive),
   `village` (improve mine: it is a first pass), `rural` (farmland: fields, tractor/bullock plough, windmill/tube-well, scarecrow, farmers),
   `urban` (modern dense city: apartment blocks, flyover/metro with moving traffic, hoardings, neon at night), `hill` (mountains, mist, pine trees, sweater crowd),
   `coast` (sea, boats, palms, fisher folk, gulls), `desert` (dunes, camel caravan, turbans, hot haze), `railway` (station platform feel, a train that passes with its sound-less rumble animation).
   Each should have 2–4 moving elements (`dynamic`) and its own ambient `mix` and `people`.
2. **Theme `retro`**: polish `themes/retro.js` (it already has a first grade/grain/scanlines) and make the *people* look like an old village crowd.
3. **Theme `comic`**: new `themes/comic.js` + `themes.css` + the toon head/torso/arm.
4. Keep everything pixel-art consistent (no blur, no anti-aliased shapes, whole-pixel coordinates).
5. Report back with a short summary and the list of screenshots you checked.
