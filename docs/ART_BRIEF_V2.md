# Art brief v2 — rebuild the chai tapri and the people from scratch

The user looked at the current build and rejected the art: **the stall, the background and the character sprites all look wrong ("weird", "shit")**.
Do not tweak it — **rebuild the stall scene and the characters from scratch**, in both themes and all eight places, to a clearly higher standard.
(Framing/zoom is already fixed in code: the whole 480×320 scene is now shown uncropped. Do not touch main.js.)

## Look at the references first
`D:\Tizmo AI\Tapri\reference\` — study every image:
* `dolly_draft1.jpeg` — the main target: a real Indian tapri at dusk. Note the rusty **corrugated-blue-steel counter front**, corrugated tin roof, a dark
  hand-lettered signboard with a chai glass and slogans ("Chai · Dosti · Bakwaas aur kuch nahi ♥"), shelves of glass jars, **hanging chips/snack strips**,
  a small **chalkboard menu with prices**, wall posters, string lights, the chai-wala pouring from a height, a crowd of young guys on wooden benches in hoodies and tees,
  steel samovar/kettle, plastic jars, a bin, sky with city skyline. The people are big, expressive and clearly *Indian* — skin tones, hair, clothes, body language.
* The "Rakesh Hotel" / "Rakesh Café" images — glass display cases with samosas/pakoras, Coca-Cola crate and fridge, red/blue plastic stools, tin roof, rain-wet street, warm lamp pools.
Match their **pixel-art richness**: soft dithered gradients, warm pools of light, coloured shadows, material texture (rust, wood grain, wet stone), lived-in clutter, strong silhouettes.
Do **not** copy a real person's face/name. Take the *style and atmosphere* only; invent the characters and the shop name (e.g. a fictional "… ki Tapri").
If you can open web pages or videos, also look at real tapri photos/videos (search "chai tapri", "Indian roadside tea stall", "Dolly ki Tapri Nagpur") for authentic detail.

## What a real tapri has (use as a checklist)
* **Structure:** small roadside kiosk; corrugated tin roof *or* a stretched blue/orange tarpaulin on bamboo; plywood/steel counter, often rusty or painted; hand-painted or flex signboard with a chai cup and phone number; string lights, a bare bulb, a tube-light.
* **On the counter:** a 2-burner LPG/kerosene stove, a **soot-blackened aluminium tea pot with a long handle**, steel ladle and strainer, tall steel tea-can/samovar, a **steel tray of small tea glasses**, kulhad stacks, thermos, water jug;
  glass jars (rusk, Parle-G, biscuits, namkeen), eggs tray, bread loaves, maska-bun, Maggi packets; hanging snack strips; matchbox; a small radio/speaker; a deity picture with garland and incense; cash box; **UPI QR standee + soundbox**.
* **Around it:** plastic stools (red/blue), wooden benches or low tables, a charpai in villages, a parked motorbike or handcart, a street dog, crows, a water drum or matka, a Coca-Cola crate, a bin, stray paper cups, auto-rickshaws passing.
* **People:** office-goers with lanyards, students with backpacks, auto drivers in khaki, labourers with gamchha, elderly uncles with a newspaper, young guys in hoodies, women with dupatta/saree — and the way they really stand and sit (leaning on the counter, one foot on the stool, cupping a glass, blowing on tea, scrolling a phone).
* **Owner/helper:** the high chai-pour, the saucepan boil-over, the strainer, wiping the counter with a gamchha, handing glasses on a steel tray.

## Deliverables
1. **A new stall for every environment** (city, village, rural, urban, hill, coast, desert, railway): same gameplay anchors (see `docs/THEME_API.md`), but a genuinely richer, more authentic tapri — better roof, signboard, counter front, shelves, hanging strips, menu board, lights, props, clutter, and a much better backdrop and ground. Every time of day (morning/day/dusk/night; wet night with reflections and glows) must look like a finished illustration, not a diagram.
2. **A new character rig from scratch** (`people.js`), both themes. Believable Indian people: correct proportions and mass, natural posture, clearly different body types and ages, expressive faces, hands that read as hands, clothes with folds and layers, hair that looks like hair. Seated, standing, walking, drinking, eating, phone use, newspaper, laughing, shooing a dog — all convincing. Avoid the stiff, flat, "paper doll" look.
   * Retro theme: older village crowd, faded film look.  Comic theme: real life, slightly cartoonized (bigger head/eyes, bold ink outlines, cel shading).
3. If the **480×320 grid cannot give the quality** you want (very likely for faces, hands and clutter), say so *before* you start drawing: propose a larger logical size (e.g. 640×427 or 720×480), the exact scale you want people to be vs. the stall, and **a table of every gameplay anchor in the new coordinates**
   (counter top/front, case x ranges, stove/kettle/kadhai, tray, soundbox, QR, shelves, radio, shrine holder, chips strip, fridge, carton, seats, benches, walker/standing/helper lines, dog lane, lamp positions, owner reach limits).
   The Claude session will port `owner.js / crowd.js / dog.js / core.js / main.js` to that grid. **Do not edit gameplay code yourself.**
4. Keep the contract in `docs/THEME_API.md` (registries, layer names, `stand()/sit()` return values, hooks). Tell us if it must change.

## Process
* Work in small steps; after each environment, screenshot all four times of day in both themes at 1280×800 and 390×844 and **look at them critically against the reference images**. Iterate until it would hold up next to `dolly_draft1.jpeg`.
* Run `node --check` on every file; run `node tests/world-art-checks.mjs` (and the other scripts in `tests/`) before you report.
* Report with: what changed, the screenshots you checked, and anything you want changed in the gameplay code.
