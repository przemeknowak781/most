# MOST — design guidelines

The rules this site is built to. They come from the Design 2.0 preview in
`mostkonfigurator` (its `index.html` is the guideline document, in Polish); this
file is the version that applies to the production site, in the terms the code
actually uses.

Two standing decisions sit on top of the rules:

- **The palette values are coming-soon's**, not the preview's. The preview's
  token *names and roles* are what we adopted; the hexes come from
  `comingsoon/styles.css`. This is deliberate and temporary — the client has not
  signed off on a final palette yet.
- **The configurator is not ported.** No `preview.css`, no `preview.js`, no
  `dp-*` UI, no colour pickers, no JSON export. This repo is the finished site.

---

## 1. Tokens

Every colour has exactly one job. If you need a colour, use the token whose role
matches; do not reach for a literal because it happens to look right.

### Foundation

| Token | Value | Role |
|---|---|---|
| `--navy-deep` | `#080b13` | Deepest ground: night sky, page base |
| `--navy` | `#0c101c` | Content surfaces: cards, panels, footer |
| `--light` | `#f3efed` | Light: typography and bright accents on dark |
| `--orange` | `#e65f32` | Energy signal: CTA, the one accent per page |
| `--orange-soft` | `#e89a68` | Warm halftone: gradients, marks, glows |
| `--glow` | `#ffa86e` | Trail light: route lines, checkpoints, leaders |
| `--purple-dark` | `#6a6e86` | Cold mountain shade: secondary backgrounds |
| `--purple-light` | `#8087ad` | Dawn haze: soft fills and illustrations |

### Text

`--text-accent` `#ffbc8c` — the orange *texts*: eyebrows, numerals, column
titles. It is a separate token from `--glow` and from `--orange` on purpose:
recolouring the trail must not recolour the eyebrows, and label colour must
never spend the page's single accent (see rule 8).

`--text-caps` `#f3efed` — neutral uppercase labels: stat captions, trail-point
captions. Separate from `--light` so caption colour can be tuned without moving
headline colour.

`--light-80 / -60 / -28 / -10`, `--line` — the opacity ramp on `--light`.

### Segment accents

`--accent-founders` `#d17e5f` (warm) · `--accent-companies` `#9b8b95` (neutral) ·
`--accent-investors` `#5b7ab0` (cool).

### Hero scene — independent by design

`--hero-sky` `--hero-sun` `--hero-halo` `--hero-wash` `--hero-cool`
`--hero-trail`.

The hero runs on its own six tokens and **never references the global palette**.
Recolouring the site does not repaint the hero, and vice versa. The defaults
mirror their global twins, so the split is invisible until someone diverges
them. Everything from `.hero` down to and including `.ridge-edge` belongs to the
scene.

---

## 2. The eight rules

### 01 · The trail line

One thin luminous line runs through the page like a route on a ridge — not a
per-section flourish. Checkpoints pulse like camp lights (`trail-point-pulse`,
3.4s). Dashed vertical leaders (`stroke-dasharray: 2 4`, glow at 42%) tie the
numbers back to the trail. The glow comes from a `drop-shadow`, never a second
stroke.

Step and waypoint lists inherit the same vocabulary: a 1px left rule and a small
glowing node, as in `.approach__item`.

### 02 · Sun and glow

Animated light overlays. The sun **breathes behind the ridge** on a 9-second
rhythm; the climbers' halo runs at 6.5s, the low haze at 12s. Warmth warms the
scene — it never pulls attention off the content, and it must never throb.

The sun disc, the haze and the climbers' halo have to melt into one continuous
łuna rather than reading as three separate spots. Gradients run out to 84–100%
so there is no visible rim.

**Placement is coming-soon's, mirrored.** Coming-soon puts the sun bottom-left;
here it sits bottom-**right**, behind the ridge that ascends toward the climbers,
so they climb into the light and the left third stays deep and cool for the
headline. The background photograph is horizontally symmetric, so nothing is
gained by flipping the image itself — only the light layers move.

### 03 · The mountain as stage

A real photograph (`background.webp`), not an illustration, and it has to stay
**clearly visible**. Cool navy from above, warm from the sun, and the photo
always works *under* the content, never beside it.

The grade is coming-soon's: `saturate(1.04) contrast(1.08) brightness(0.94)` at
`object-position: 55% 50%`. Washes fade out below 55% of the frame so the lower
half is unwashed photograph. The horizontal darkening ramp stays on the side the
copy is on — the light flips, the ground under the headline does not.

Every hero on the site uses this grade: `.hero-bg`, `.page-hero__bg`,
`.aud-hero__photo`, `.contact-hero__photo`, and the `.ridge-edge` tail.

### 04 · Three planes of depth

Deep Navy sky · Navy surfaces · Light typography. Hierarchy comes from contrast
between the planes, not from ornament. Text is muted on the deep plane, mid on
the navy plane, and flips to navy on any light plane.

### 05 · Pill buttons

Rounded outline, uppercase, wide tracking (0.18em), transparent at rest,
`border-radius: 999px`. Calm at rest; on hover the pill **fills with light** and
the label flips to navy, with a 2px lift. A CTA that is filled at rest, or that
fills with orange on hover, is wrong.

### 06 · Numerals and eyebrow

Every section eyebrow is wrapped in a pair of em dashes: `— text —`. Outfit 500,
uppercase, tracking 0.24em (0.36em for the wide hero/audience variant).

Card numerals are zero-padded, muted, and sit in the card corner like trail
kilometrage — never a highlight.

### 07 · Architecture as texture

Concrete, glass and steel enter as *texture*, not as the subject: the rhythm,
the grid, the light — not a recognisable building. These photos are **not**
duotoned; they are chosen to sit in the palette already and get a neutral grade
only (`contrast(1.04) brightness(0.9) saturate(0.96)`) plus a neutral vignette.

Four local frames (`arch-1..4.webp`) cross-fade on a 12s loop — one swap every
3s — so the block reads as a living pattern rather than a gallery. The first
frame keeps `opacity: 1` so a still image remains when motion is off. Assets are
local; nothing is hot-linked.

### 08 · Orange as the accent

**One orange accent per page. No more.** Orange is the sign of energy and
movement and is deeply written into the brand; sparing, consistent use is what
keeps it legible.

The canonical form is the one-word rule: *Three routes. **One** partner.* — only
"One" carries it, in `--orange-soft`, italic, with a soft halo.

Three warmths, three jobs, and they must stay distinguishable: `--orange` is the
signal, `--orange-soft` is the halftone, `--glow` is the trail. Orange *text*
uses `--text-accent` and does not count against the page's one accent. Ambient
card warmth stays extremely low — atmosphere, not accent.

---

## 3. Typography — two voices, one narrative

Two families. There is no third; Montserrat is gone.

- **Urbanist** 500–600 — headings, statistics, numeration. Tracking `-0.005em`
  (`-0.01em` on large accent statements).
- **Outfit** 400–500 — body copy, lists, navigation, labels and signals.
  Uppercase labels are tracked 0.16–0.24em, with 0.36em reserved for the wide
  eyebrow variant.

The font request is exactly:

```
https://fonts.googleapis.com/css2?family=Outfit:wght@400;500&family=Urbanist:wght@500;600&display=swap
```

---

## 4. Motion

Reduced motion is a hard requirement, not a nicety. Under
`prefers-reduced-motion: reduce` the parallax, the line-drawing and the
cross-fades stop, and every animated decoration has a defined static resting
state — the trail is fully drawn, the first architecture frame stays visible.

---

## 5. Known gaps

Recorded rather than silently left out. Each is a design call the client should
weigh in on before it is made.

- **Rule 08 beyond the shared components.** The homepage now carries one accent
  ("One"), and the shared chrome — pills, footer, scroll bar, links — has been
  neutralised site-wide. `about-us`, `our-team`, `contact` and the three
  audience pages still run several saturated accents each; which single element
  keeps it on each page is not a mechanical decision.
- **Rule 04 on the audience pages.** `for-founders` / `for-companies` /
  `for-investors` still invert to two full-bleed light sections plus a colour
  slab, which is five planes rather than three. Converting them to the navy
  plane with raised panels is a layout change, not a recolour.
- **Rule 01 on `expertise.html` and `contact.html`.** Neither page carries the
  trail. `new plan.md` slates `expertise.html` for deletion, so it may resolve
  itself; `contact.html` needs the device added.
- **Rule 01 continuity on `about-us` / `our-team`.** Both render disconnected
  trail fragments rather than one continuous route, and neither has the dashed
  vertical leaders that tie their numbers to it.
