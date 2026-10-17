# Chitra Style: drawing Indian comic characters in canvas code

Target: Amar Chitra Katha (ACK) first, with Raj / Diamond Comics (Chacha Chaudhary, Pinki) as the lighter, more cartoon-like end of the range.
Scene: Indian chai stall. Customers on benches, chaiwala behind a counter, kids, vendors, elders, women in sarees and salwar kameez.

Confidence tags used below:
- [src] = found in web search (thin, mostly general descriptions).
- [conv] = standard figure-drawing convention or house rule chosen for this project. Treat as a target, not a historical fact.

Research note: web search gave little technical detail on ACK line work or colouring. Founder Anant Pai, the Ajanta/Ellora/Elephanta source material for deities [src], and the artist Ram Waeerkar practising figures in front of mirrors [src] were the only concrete points. Chacha Chaudhary's art is described as simple line, big red turban, round face, white brush moustache, twinkling eyes [src]. Everything else is [conv].

---

## 0. Canvas units

- Work in head units `H` (chin bottom to crown of skull). Set `H` per character in px, then derive everything from it.
- At 480x320, a standing adult in the stall scene is usually 60–110 px tall, so `H` ≈ 8–15 px. Below ~9 px, drop inner details (see section 3).
- Floor line: `y_floor`. Ground contact at `y_floor`. Seated and standing figures share one floor per bench row.
- Build each figure as: skeleton points -> limb widths -> silhouette path -> flat fill -> outline -> 2–5 detail strokes.

---

## 1. Proportions

### 1.1 Height and head count

| Figure | Total height | Head count (H) | Notes [src/conv] |
|---|---|---|---|
| Adult man | 7.5 H | 7.5 | Adults typically 7–8 H [src]. ACK-style men are slightly heroic: use 7.5 |
| Adult woman | 7.0 H | 7.0 | Shorter, softer; saree/dupatta adds visual width, not height |
| Elderly (man/woman) | 6.5–7.0 H effective | ~6.5 | Older man about 6 H in one guide [src]. Stoop lowers the crown by ~0.5 H |
| Child 7–10 yrs | 5.5 H | 5.5 | Sourced range for kids is 4–6 H [src]. 5.5 is the midpoint for 7–10 [conv] |
| Teen 13–16 | 6.5–7.0 H | 6.8 | Between child and adult; limbs lengthen before shoulders widen |

Rule: count head height from the chin to the crown, not to the hair top, to keep head size consistent when hair is oiled or tied up.

### 1.2 Widths (in H)

| Figure | Shoulder breadth (tip to tip) | Hip breadth | Neck visible width |
|---|---|---|---|
| Adult man | 2.0 | 1.4 | 0.55 |
| Adult woman | 1.7 | 1.6 | 0.45 |
| Elderly | 1.8 (narrowed) | 1.3 | 0.5 (scrawny) |
| Child 7–10 | 1.4 | 1.1 | 0.35 |
| Teen | 1.9 (M) / 1.5 (F) | 1.4 (M) / 1.6 (F) | 0.5 / 0.45 |

- Women's hips equal or exceed shoulders. Men's shoulders exceed hips by about 0.6 H.
- Children have almost no waist: torso is a rounded rectangle.

### 1.3 Arms (from shoulder joint)

| Segment | Length (H) | Notes |
|---|---|---|
| Upper arm (shoulder joint -> elbow) | 1.5 | Adult. Child: 1.2 |
| Forearm (elbow -> wrist) | 1.25 | Child: 1.0 |
| Hand (wrist -> fingertip) | 0.75 | Child: 0.6 |
| Total arm | 3.5 | Fingertips hang at mid-thigh |

Joint heights, standing adult (floor = 0):

- Shoulder joint: 6.2 H
- Elbow (arm hanging): 4.6 H (roughly navel height)
- Wrist (arm hanging): 3.4 H (lower than crotch)
- Fingertips: 2.7 H (mid-thigh)

Shoulder joints sit about 1.0 H below the crown in an upright adult. Child: shoulder joint 4.6 H, elbow 3.6 H, wrist 2.7 H.

### 1.4 Legs (from hip joint)

| Segment | Length (H) | Notes |
|---|---|---|
| Thigh (hip joint -> knee) | 1.7 | Child: 1.4 |
| Shin (knee -> ankle) | 1.6 | Child: 1.3 |
| Ankle height above floor | 0.3 | |
| Foot length (heel -> toe) | 1.0 | Child: 0.8. Foot width ≈ 0.4 |

Joint heights, standing adult:

- Hip joint: 3.6 H (crotch ~3.75 H)
- Knee: 1.9 H
- Ankle: 0.3 H

Child 5.5 H: hip 2.9 H, knee 1.4 H, ankle 0.25 H.

### 1.5 Neck and head

- Neck visible from front: 0.4 H (adult), 0.3 H (child), 0.45 H (elderly, thin neck, forward head).
- Head in profile: ~0.9 H deep. Child head is rounder: depth ~0.95 H.
- Head is tilted 0–5° when talking, 10–15° when listening to a friend or sipping.

### 1.6 Seated on a low bench

Chai benches are low wooden benches or stools. Assume a seat top at 1.6 H off the floor (about 40 cm for a 1.75 m man). Adjust per bench in `art.js`.

| Measurement | Adult man | Adult woman | Child 7–10 |
|---|---|---|---|
| Seat top (floor -> seat) | 1.6 H | 1.6 H | 1.5 H (child sits on bench too) |
| Hip joint height | 1.9 H | 1.9 H | 1.7 H |
| Knee height | 1.9–2.0 H | 1.9 H | 1.6 H |
| Thigh angle | Horizontal, 0–5° down | Horizontal | Horizontal |
| Shin | Near vertical, 80–95° to thigh | Knees together, feet tucked | Feet dangle, toes at 0.1 H above floor |
| Torso | Upright 0–5°; leaning 8–12° forward when sipping | 0–5° upright, shoulders squared | Upright, sometimes leaning on a friend |
| Seated crown height | ~5.2 H | ~5.0 H | ~4.3 H |

- Seated pelvis: draw the thigh as a thick capsule ending at the knee. The hip sits 0.15 H back from the bench edge.
- A man with knees spread: knees 1.0 H apart at the knee joint. A woman with knees together: 0.25 H gap.
- Feet on the floor at `y_floor`. Dangling child's feet stop 0.1 H above floor.

### 1.7 Standing contrapposto

- Weight on one leg: pelvis tilt 4–6° toward the free side, shoulders counter-tilt 4–6°.
- Weight-bearing hip sits higher by 0.15 H. Weight foot directly under the hip joint.
- Free leg: knee bent 5–10°, heel lifted 0.1 H.
- Spine: slight S-curve, head over the weight leg.
- Counter stance (chaiwala stirring a pot): weight on back leg, front hip forward, shoulder dropped on the stirring side.

### 1.8 Elderly stoop

- Crown lowered 0.5 H. Head forward of the shoulders by 0.3 H.
- Upper back rounded: spine curve adds 10–15° forward tilt.
- Knees slightly bent, 5–8°. Hip joint 0.2 H lower than adult.
- Shoulders narrower and sloping, 1.8 H tip to tip.
- Arms slightly longer relative to torso visually (hands reach upper thigh).
- Optional walking stick: 2.0 H long, held at hand with the tip at `y_floor`.

---

## 2. Face construction

### 2.1 Head shape

- Adult man: squarish jaw, chin with a small flat front. Head width ≈ 0.85 H.
- Adult woman: oval head, narrower chin. Head width ≈ 0.8 H.
- Elderly: longer face, jaw sagging slightly. Head width 0.85 H with a long nose.
- Child 7–10: round head, width ≈ 0.95 H, chin small and round.
- Chacha-style (Raj/Diamond): round face, big round cheeks [src].

Build the head as: a cranium ellipse (top 0.55 H), then the face tapering to the chin. Put the chin at the head bottom.

### 2.2 Eye line and feature placement

Divide head height into vertical zones, top to bottom (in fractions of H):

- Top of skull: 0.0
- Eyebrow line: 0.30 (adult), 0.33 (child)
- Eye line (eyes centre): 0.50 (adult), 0.56 (child), 0.52 (elderly)
- Nose base (bottom of nose): 0.75 (adult), 0.72 (child)
- Mouth line: 0.83 (adult), 0.80 (child)
- Chin: 1.0

Horizontal:

- Eye spacing: one eye-width apart. Eyes sit one eye-width in from each side of the head. Child eyes wider apart and larger.
- Nose width at base: 0.25 H.
- Mouth width: 0.35 H (adult), 0.3 H (child).

### 2.3 Eyes

- Almond shape: 0.25 H wide, 0.1 H tall (adult). Child: 0.28 H wide, 0.12 H tall.
- Upper lid: thick black line, slightly heavier at the outer corner. Lower lid: thin line.
- Iris: a dark spot (near black or deep brown) fills 60–70% of the eye height. White highlight: a 1 px dot at upper inner quadrant.
- Lashes: 2–3 small strokes at the outer upper lid. Skip lashes below 9 px height.
- Kajal (women and kids): thick black line extending 0.1 H past the outer corner.
- Elderly: eyes slightly narrower, with a light lower-lid bag line.
- Twinkling eyes (Chacha-style): a second small highlight in the iris [src].

### 2.4 Nose

- Strong bridge line: a single stroke from between the brows down to the nose tip, slightly convex. This is the key ACK feature. Draw the shadow side of the bridge in the darker shade.
- Nose tip: a small hook or round tip, 0.1 H below the nose base line.
- Nostrils: one small curved stroke per side, not an oval.
- Adult man: longer, sharper bridge. Adult woman: narrower bridge, rounder tip. Child: small, short bridge, round tip. Elderly: longest bridge, slight hook.

### 2.5 Lips

- Upper lip: a single dark line with a small central bump (cupid's bow).
- Lower lip: fuller, separated by a thin dark line.
- Closed mouth: 0.35 H wide line with a slight upturn at corners.
- Open talking mouth: a dark half-ellipse 0.2 H wide, 0.08 H tall, with one tooth-colour strip.
- Smile: curve up at both corners, 0.1 H lift. Laugh: wide open half-ellipse, dark inside.

### 2.6 Ears

- Ear sits between eye line and nose base at the side of the head.
- Size: about 0.35 H tall, 0.2 H wide.
- Draw as a C-shape with one inner stroke. Men with long hair: hide the ear.

### 2.7 Brows

- Thick, short, slightly arched. Length 0.3 H, thickness 0.04 H.
- Men: heavier, sometimes joined at the centre (with a short stroke).
- Women: thin arch, lightly drawn, extended with a kajal-style tail.
- Elderly: white or grey, bushy, may extend past the outer corner.
- Worried or angry: inner ends raised.
- Surprise: brows lifted 0.1 H.

### 2.8 Moustache styles

- Thin pencil moustache: a single dark stroke 0.35 H wide with curled ends.
- Handlebar: thick, curled up at both ends (older men, shopkeepers).
- Brush moustache: thick, straight, slightly wider than the mouth (Chacha-style) [src].
- Bushy grey moustache: fills the upper lip; a few white strokes for age.
- Clean-shaven young men: no moustache. Show stubble with light dots, not black fill.

### 2.9 Hair

- Oiled side-part (men): dark flat fill over the skull. A white or lighter part line curving from the forehead to the crown. Hair lies flat, slight sheen with one white stroke.
- Short cropped (boys): a dark cap with two or three hatching strokes at the edges.
- Curly (kids): small loops of dark outline, or clustered dark dots at the hairline.
- Bun (women): dark shape at the back of the head, about 0.5 H diameter. Oiled hair pulled back, parted at the centre.
- Plait/braid: 2–3 parallel dark strokes falling from the bun or behind the shoulder to waist height. Add flowers (small white or red circles, 0.1 H) pinned at the bun.
- Elderly men: white hair, thinning at the crown. Elderly women: white hair in a low bun, sometimes with a headscarf.
- Child girls: two plaits with ribbons, or a single plait.

### 2.10 Tilak, bindi, and marks

- Tilak (men, religious): a vertical or three horizontal lines on the forehead (red, white, or yellow). Width 0.15 H, placed at the brow line.
- Bindi (women): a red or black dot, 0.06 H diameter, centred on the brow line. Skip if the figure is a widow or in a context where it is not worn.
- Dot on the chin (kids) optional.

### 2.11 Wrinkles (elderly)

- Forehead: 2–3 horizontal lines spaced 0.06 H, drawn as thin strokes in the shadow colour.
- Crow's feet: 2–3 short strokes at the outer eye corner.
- Nasolabial lines: from nose wing to mouth corner, one stroke per side.
- Neck: 2 horizontal folds.
- Hands: visible tendons and knuckles, not many lines.

### 2.12 Expressions

| Expression | Brows | Eyes | Mouth |
|---|---|---|---|
| Neutral | Flat | Lids half-open (upper lid 0.4 of iris) | Closed line |
| Talking | Slightly raised | Normal | Open half-ellipse, teeth strip |
| Laughing | Raised and curved | Closed upward arcs (^ ^) | Wide open, dark inside |
| Smiling | Relaxed | Normal, slight squint at the bottom | Upturned corners |
| Sipping chai | Relaxed, eyes half closed | Lids lowered, 30% closed | Small round O at cup edge |
| Surprised | Raised 0.1 H | Wide open, white showing | Round O |
| Annoyed | Inner ends down | Narrow | Flat, down corners |
| Begging (kid) | Raised inner ends | Big round eyes | Downturned small mouth |

Head pose supports expression: tilted head for shy or thinking, head back for laughing, lean forward for gossip.

---

## 3. Ink and colour

### 3.1 Line weight

At 480x320 scale (suggestion):

- Outer silhouette contour: 2.0 px (at H ≈ 12 px). Scale: `lw_outer = max(1, H * 0.16)`.
- Inner detail lines (folds, hair strands, features): `lw_inner = max(0.7, H * 0.07)`.
- Facial features (eye outline, lips): `lw_face = max(0.6, H * 0.06)`.
- Shadow strokes (no outline): 0 width, fill only.
- Rule: outer contour always thicker than inner detail. Line weight decreases away from the silhouette.
- Rounded line caps and joins (`lineCap = "round"`, `lineJoin = "round"`).

### 3.2 Black spot-blacks

Place solid black (near #1B1410) in:

- Hair mass (not highlights).
- Eye iris and pupil.
- Mouth opening interior.
- Deep shadow in folds and under the chin (small, crisp shapes).
- Shoe and sandal straps.
- The deepest shadow of a saree pallu or dhoti fold.

Shadows are flat shapes, not gradients.

### 3.3 Flat colour and one shade

- One base colour per material, then one darker shade (about 25% darker) for the shadow side.
- Cel-shading: draw the shadow shape with the darker shade, boundary hard-edged.
- Light source: upper left. Shadow on the right and below each form.
- Highlight: optional lighter tint (+15%) on a single curved stroke. Skip below ~10 px.
- Never blend or gradient skin or cloth.

### 3.4 Palette (suggested hex; adjust for stall lighting)

Skin (ACK-range browns, warm):

- Fair-warm: #E8B991 (shade #C68F65)
- Wheat: #D89E6E (shade #A8724B)
- Medium brown: #B7784D (shade #8A5532)
- Deep brown: #8A5634 (shade #62391F)
- Dark brown: #5E3B22 (shade #3E2414)

Hair: #1B1410 (black), #3A2A1E (dark brown), #8C8C8C (grey), #F2F0EA (white).

Clothing:

- Kurta (men): off-white #F1ECDD, mustard #D7A22B, saffron #E08A2A, marigold #E5A93C, sky blue #7FA9C8, olive #6B7A3D, maroon #7A2A2A.
- Saree (women): maroon #7B2032, peacock blue #1F5F7A, magenta #B0307A, mustard #CF9A2E, green #2F6E4D. Border: gold #D9A441 or red #B0202A with a gold stripe.
- Dhoti (men): white #F7F4EA with a yellow-gold border #E3B33A (1 stripe).
- Gamchha: red-and-white check #C8362C / #F5EFE4, or blue #2E5C8A check.
- Lungi: checked, red/green or blue/black, 2 colours plus a thin white stripe.
- Salwar kameez: teal #2D7F76, pink #D9749A, yellow #E6C34D, dupatta contrast colour.
- School uniform (kids): white shirt #F6F6F2, navy or grey shorts/skirt #2F3F57 or #6B6F78. Red tie or sweater.
- Nehru jacket / waistcoat: dark grey #3D3D45 or bottle green #2D4F3E, gold buttons.
- Shawl (elderly): brown #7A5A3A or grey wool #8B8B88.

Background/stall: dark tea-stain brown, metal kettle grey #9AA3A8, red tin roof #B5402A.

### 3.5 Folds

- Draw folds as 2–4 short strokes from the joint or seam outward, tapering at the ends.
- Cloth falls in groups: one main fold, then smaller secondary folds parallel to it.
- At knees and elbows: a V or a broken line (two curves meeting at a point).
- Kurta: 3 vertical strokes from the chest down, plus one diagonal from the shoulder.
- Saree: pleats as 4–6 parallel vertical lines at the front, pleat edges darker.
- Pallu: a curved fold with a darker shade on the under-edge.
- Hanging cloth: one stroke per 0.3 H of length, don't fill every gap.

---

## 4. Clothing construction in simple shapes

All shapes are in H units. Draw body first, clothes on top, outline last.

### 4.1 Kurta-pyjama (men, elderly)

- Kurta: trapezoid, shoulder width + 0.2 H, hem at knee (1.9 H from floor) or mid-thigh (2.5 H).
- Collar: small band at neck, 0.3 H wide, with a centre slit line.
- Sleeves: tapered tubes, 0.3 H wider than arm at cuff; cuffs slightly darker.
- Pyjama: two tubes from waist to ankle, 0.5 H wide each at the ankle. Cuff bunched at 0.3 H above floor.
- Waistband tie: small dark loop at the front.

### 4.2 Shirt and trousers (men)

- Shirt: rectangle with a V-collar and two sleeves. Tuck or untuck.
- Trousers: two tapered tubes, 0.5 H at the ankle, creases as 2 vertical strokes.
- Belt: dark stripe at waist.

### 4.3 Saree (women)

- Petticoat/blouse first: fitted blouse with a short sleeve (ends 0.3 H below the shoulder). Blouse is a trapezoid, midriff exposed (in ACK style, show 0.3 H).
- Saree wrap: from the waist, a skirt of 6–8 vertical pleats fanning out to the feet. Pleats are wider at the hem (0.9 H at the bottom).
- Pallu: long rectangle draped from the left shoulder over the right arm, ending at knee height. Draw it as a curved band with two folds.
- Border: thin band at the hem (0.1 H), then a coloured stripe.
- Hand under pallu: show the hand emerging at the elbow.

### 4.4 Salwar kameez + dupatta (women)

- Kameez: long top, 0.2–0.4 H longer than the body's hip line. Side slits as narrow darker lines.
- Salwar: wide-legged trousers gathered at the ankle (0.5 H wide). Draw as two curved tubes.
- Dupatta: long rectangle over the shoulders, ends hanging down the back or swept over one arm. Show it with two curved folds and a border line.
- Neck: round or V-neck (simple arc).

### 4.5 Dhoti (men)

- Waist wrap: a white rectangle at the waist, 1.0 H wide, folding down at the front.
- Front fold: a pleated triangle hanging from the waist to the ankle, darker shade on the left.
- Leg section: two thin folded tubes showing at the ankles.
- Border: a gold stripe along one edge.

### 4.6 Lungi (men, working/vendors)

- Checked wrap from waist to ankle, 1.0–1.2 H wide.
- Draw a horizontal knot at the waist (small dark curve).
- Check pattern: 2-colour grid, skip detail below 12 px height. Use 3–4 horizontal bands instead.

### 4.7 Gamchha

- Thin cloth band, 0.15 H wide, length 1.5 H.
- Draw over the shoulder: loop around the neck, the free end hangs down the back or chest.
- Pattern: 2–3 check lines in red or blue.

### 4.8 Nehru jacket / waistcoat (men)

- Waistcoat: waist-length (hem at hip joint, ~1.9 H from floor), open V at the chest.
- Nehru jacket: knee-length, high mandarin collar, 4–5 buttons down the centre.
- Button line: vertical row of small dots at centre front.

### 4.9 School uniform (kids)

- Shirt: white rectangle, collar folded flat, pocket at chest (0.2 H square).
- Shorts: boys, navy, 0.6 H long from the waist.
- Skirt: girls, navy pleated, 0.8 H long, pleats as 3–4 lines.
- Socks: white tubes to 0.2 H above the ankle.
- Shoes: black, rounded toe.
- Tie: thin red line. Sweater: V-neck with a single stripe.

### 4.10 Sweater, shawl (winter, elderly)

- Sweater: rounded torso with a ribbed hem (2 horizontal lines), sleeves 0.2 H wider than arm.
- Shawl: over the shoulders, a trapezoid falling to the elbow. Two folds from the shoulder.

### 4.11 Footwear

- Chappal (thong): sole shape with a V strap between the big toe and second toe. Dark sole outline, 1 px.
- Jutti: pointed slipper, curled toe up 0.1 H. Embroidered band (1 stripe).
- Barefoot: draw the foot as a flat shape with 3 toe bumps. Many stall customers and kids are barefoot.
- Shoe (formal, school): low profile, rounded toe, dark fill.

---

## 5. Hands and feet

### 5.1 Hand

- Palm: rounded rectangle, 0.4 H wide, 0.4 H long (without fingers).
- Thumb: separate small tube attached to the palm side, angled 30–45° from the index. Length 0.3 H.
- Fingers: three groups: index + middle as one tube, ring + pinky as one tube, with a thumb. Draw 3–4 lines to separate.
- Fingertip: round, not pointed.
- Wrist: slim neck 0.25 H wide, slightly narrower than the palm.
- Relaxed hand: fingers curled 30–45°.
- Child hand: palm rounder, fingers shorter (0.25 H), no knuckle lines.
- Elderly hand: knuckles drawn as small bumps, thin fingers.

### 5.2 Hand holding a chai glass (cutting chai)

- Glass: tumbler, 0.35 H tall, 0.25 H wide at the top, 0.2 H at the bottom. Draw with a thin dark outline and a lighter reflection stripe.
- Chai: fill the glass to 80% with medium brown #B9793C (shade #8A5532), with a pale foam ring (#E7D3A0) on top 1 px.
- Grip: thumb on the front of the glass, index and middle finger wrapped behind. Show 2 finger tips at the back edge.
- Position: hand at chest or chin height, glass 0.2 H from the mouth.
- Saucer (for cutting chai): flat ellipse 0.45 H wide under the glass, held on the palm.
- Sipping pose: head tilted 10°, eyes half closed, glass tilted 30°.

### 5.3 Hand holding a phone

- Phone: 0.2 H wide, 0.35 H tall rectangle, rounded corners. Black or dark grey, lighter screen with 1 highlight stroke.
- Grip: fingers wrap under the phone's bottom edge, thumb on the screen side.
- Position: held at waist height or near the face (0.4 H from the cheek).

### 5.4 Feet

- Standing foot: wedge from heel to toe, 1.0 H long, 0.35 H tall at the ankle.
- Sole on floor: flat bottom at `y_floor`.
- Toes: 3 small arcs at the front, the big toe slightly larger.
- Barefoot dirt: optional 2–3 brown dots at the heel (1 px), not a full detail.

---

## 6. Do and don't

Do:

- Keep the strong nose bridge line on every adult face. It separates ACK from western cartoons.
- Use cel-shading (flat fill, one darker shade, hard edge). Shadow shapes are readable at a glance.
- Show traditional clothing in full: saree pleats, dhoti border, dupatta fold, gamchha on the shoulder.
- Put a tilak, bindi, or flower in hair where it fits the character.
- Use oiled, side-parted hair on men. Show plait and flowers on women and girls.
- Give each character one clear colour identity (shirt colour, saree colour) so they read in a crowd.
- Draw elders with visible wrinkles, stooped posture, white hair, and a walking stick or shawl.
- Keep backgrounds simple: flat colours, a few stall props, minimal perspective.
- Use realistic body ratios: adult 7–7.5 H, child 5.5 H. Do not stretch limbs.
- Keep expressions readable at small size. Exaggerate the eyes, brows and mouth, not the body.

Don't:

- Don't use anime eyes (huge, star highlights, big lash clusters, tiny noses).
- Don't draw large eyes with a pointed chin on every face. Vary jaws and noses.
- Don't gradient-shade skin or cloth. Use flat fills.
- Don't use western cartoon noses (round blob with a dot). Use the bridge line.
- Don't draw sarees without pleats or pallu. A plain tube is wrong.
- Don't use western suits as the default. Kurta, shirt-trousers and dhoti are the common dress.
- Don't add thick black fills everywhere. Black is for hair, iris, shadows and spot details only.
- Don't use big round cartoon heads on adults. Children have big heads, adults do not.
- Don't draw hands with five equal fingers. Use three groups (thumb + two tubes).
- Don't add detailed backgrounds or perspective floors. Keep the stall flat and readable.
- Don't skip the outline on outer silhouettes. Inner details get thinner lines, not no lines.
- Don't use anime motion lines, sweat drops, or big action poses for street scenes. Stillness fits chai culture.

---

## 7. Quick checklist per character

1. Set `H` and choose the body type (man, woman, elder, child, teen).
2. Place joints with section 1 numbers; check the seated or standing pose.
3. Draw the silhouette and clothing shapes from section 4.
4. Flat fill base colours, then shade side in the darker tone.
5. Draw face from section 2: head shape, eye line, nose bridge, mouth, brows, hair, marks.
6. Add black spots (hair, iris, mouth, deep folds).
7. Outline outer silhouette thick; inner details thin.
8. Add props (chai glass, phone, walking stick) and check hand grips.
9. Check at 1x scale: can the character be read in a crowd of 5?
