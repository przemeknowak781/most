# MOST Partners Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete MOST Partners landing page (single-page, English) using existing accepted hero, replacing all post-hero content with proper sections per spec.md + texts.md.

**Architecture:** Single-page long-scroll site. Sections (top to bottom): Hero (kept) → Intro quote on flipped mountains (kept) → Audience Tabs (Founders/Companies/Investors — switchable content) → Expertise (8 service categories) → How We Work (6 numbered steps) → About → Team → Contact. ARIA tabs pattern for audience switcher.

**Tech Stack:** Plain HTML5 + CSS3 (custom properties, grid, scroll-snap) + vanilla JS. Existing font stack: Outfit, Urbanist, Montserrat. Existing design tokens preserved (`--navy`, `--orange`, `--light` etc).

**Constraints:**
- Do NOT redesign the hero (lines 89-170 of current index.html).
- Keep mobile-blocker overlay (<860px).
- Keep navbar structure (just update link labels/anchors).
- Keep `scroll-snap-type: y proximity` and `scroll-padding-top` for in-hero snap.

---

## Task 1: Remove deprecated post-hero sections

**Files:**
- Modify: `index.html` — remove `<section class="advisors">` (lines 172-243) and `<section class="mission">` (lines 245-305).
- Modify: `styles.css` — remove `/* ADVISORS / STAGE CARDS */` and `/* MISSION */` CSS blocks.

These are placeholders from earlier iterations that don't match the spec.

## Task 2: Update navbar labels and anchors

**Files:**
- Modify: `index.html` lines 48-53 (desktop nav) and 78-83 (mobile menu).

Final nav:
- `About` → `#about`
- `Expertise` → `#expertise`
- `Team` → `#team`
- `Contact` → `#contact`

Drop "Our / us" prefixes for cleaner labels per spec ("About (what we do) / Team (who we are) / Expertise (how we can help) / Contact (how to reach us)").

## Task 3: Audience Tabs section (`#for-you`)

**Files:**
- Modify: `index.html` — insert section after `<div class="hero-trail-labels">`.
- Modify: `styles.css` — add `/* AUDIENCE TABS */` block.
- Modify: `script.js` — add tab-switching handler.

**HTML structure:**
```html
<section class="audience" id="for-you" aria-label="For founders, companies, and investors">
  <div class="audience__head">
    <p class="eyebrow">who we partner with</p>
    <h2>We take over the legal aspects of running your business — so you can focus on building and growing it.</h2>
  </div>
  <div class="audience__tabs" role="tablist">
    <button role="tab" aria-selected="true" data-tab="founders">Founders</button>
    <button role="tab" aria-selected="false" data-tab="companies">Companies</button>
    <button role="tab" aria-selected="false" data-tab="investors">Investors</button>
  </div>
  <div class="audience__panels">
    <article role="tabpanel" data-panel="founders" aria-current="true">
      <p class="audience__lead">Legal support that grows with your business.</p>
      <p class="audience__body">As a founder, you make decisions quickly and carry the weight of building something from zero. We make sure the legal side keeps pace — giving you clarity, confidence, and space to focus on what you are building. From day one, we help you set the right foundations, attract talent, close clients, raise capital, and scale globally.</p>
      <div class="audience__lists">
        <div>
          <h3>What we help you achieve</h3>
          <ul>… 7 items from texts.md FOUNDERS …</ul>
        </div>
        <div>
          <h3>Our expertise</h3>
          <ul>… 7 items …</ul>
        </div>
      </div>
    </article>
    <!-- companies + investors equivalents, hidden initially -->
  </div>
</section>
```

**JS behavior:** Click on tab → set `aria-selected`/`data-state="active"` on the button, set `aria-current="true"` on matching panel, others get `aria-current="false"` and CSS hides via `[aria-current="false"]`. Smooth opacity crossfade. Default panel: founders.

## Task 4: Expertise section (`#expertise`)

**Files:**
- Modify: `index.html` — append section after audience tabs.
- Modify: `styles.css` — `/* EXPERTISE */`.

**Content:** All 8 categories from texts.md (Company Incorporation … Ongoing Legal Support). Each block: number + title + intro sentence + 4-7 bullet list "What we do".

**Layout:** 2-column grid on desktop (alternating side), single column on small viewports.

## Task 5: How We Work section (`#how-we-work`)

**Files:**
- Modify: `index.html` — append section.
- Modify: `styles.css` — `/* HOW WE WORK */`.

**Content:** 6 numbered points from texts.md (lines 31-58). Each: bold title + body paragraph.

**Layout:** Vertical timeline / numbered list with accent orange numerals.

## Task 6: About section (`#about`)

**Files:**
- Modify: `index.html` — append.
- Modify: `styles.css` — `/* ABOUT */`.

**Content:** From `ABOUT MOST PARTNERS` block in texts.md. Subsections: Our perspective, Our experience, Our approach, Our mission, Our commitment.

**Layout:** Two-column on desktop: left = sticky title/eyebrow, right = scrolling subsection blocks.

## Task 7: Team section (`#team`)

**Files:**
- Modify: `index.html` — append.
- Modify: `styles.css` — `/* TEAM */`.

**Content:** Team intro (line 203 of texts.md) + 7 member cards from texts.md.

**Layout:** Featured card (Barbara) on top, then responsive grid of 6 others. Each card: name + role + initials avatar (no photos available) + short bio + "Areas of focus" tags.

## Task 8: Contact section (`#contact`)

**Files:**
- Modify: `index.html` — append.
- Modify: `styles.css` — `/* CONTACT */`.

**Content:** Headline + email placeholder + brief CTA. No real contact details in texts.md, so use `hello@mostpartners.com` placeholder.

**Layout:** Centered, large headline + email mailto link.

## Task 9: Verify + commit

Read final HTML/CSS for syntax, verify reveal-on-scroll animations still work, commit with descriptive message.
