# MOST Home Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild all sections below hero per `redesign.md` — turn the page from a stack of content blocks into a single narrative scene: mountain ridge → mission → expertise map → transition → three routes → contact basecamp → footer.

**Architecture:** Single-page long-scroll. Hero and ridge-quote untouched. Below hero, six new sections in this exact order: Mission Statement → Expertise Route Map → Transition Marker → Three Client Routes → Contact Basecamp → Footer. SVG is the primary graphic medium for routes, contour lines, waypoints. Each section continues "The Route" theme.

**Tech Stack:** Plain HTML/CSS/JS. New CSS custom properties for redesign tokens (Deep Navy, Warm Line, Route Glow, segment accents). IntersectionObserver for reveal + scroll-driven waypoint activation. No new libraries.

**Constraints:**
- Hero (`<section class="hero">`, `<div class="ridge-edge">`, `<svg class="hero-trail">`, `.hero-trail-points`, `.hero-trail-labels`) — DO NOT TOUCH.
- Mobile-blocker (<860px) overlay — keep.
- Navbar — keep current 4-link top-nav layout (spec describes sidebar but hero is locked).
- Reduced-motion preference must disable parallax + line-drawing animations.
- WCAG AA contrast on all text.

---

## Sections to build (in order)

### Mission Statement (`#mission`)
- Tło: Navy/Deep Navy, very subtle horizontal contour lines, ghost "MOST" wordmark behind.
- Lewy 120px rail z pionową linią Orange-gradient + węzeł na ostatniej frazie.
- Eyebrow `about us`.
- Statement w 4 frazach (po jednej linii każda), Urbanist 48-72px, każda fade+translateY on scroll w sekwencji.

### Expertise Route Map (`#expertise`)
- Tło Light 100 (`#F0EBE9`) — kontrast vs dark sąsiadów.
- Sticky lewa kolumna (40%): eyebrow `our expertise`, H2 `We integrate legal considerations into business strategy`, lead `supporting our clients in:`, progress indicator `01 / 06`.
- Prawa kolumna (60%): inline SVG route line z 6 waypointami, organiczna trasa od lewego-dołu do prawego-środka, contour background.
- Aktywny waypoint: pomarańczowy glow + expanded label, reszta cienkie etykiety.
- Scroll progresywnie aktywuje kolejne waypointy (IntersectionObserver na trigger points lub scrollY range).

### Transition Marker
- 140-220px tall, full width.
- Gradient tło Light → Navy.
- Cienka pozioma route line z 5 altitude markers (małe pionowe ticki). Jeden pomarańczowy aktywny segment przesuwa się po linii w miarę scrollu.

### Three Client Routes (`#for-you`)
- Interactive switcher variant (spec 8.4): tabs Founders / Companies / Investors.
- Aktywny segment ma własny gradient tła (Founders ciepły, Companies neutralny, Investors chłodno-niebieski), własną route SVG (różny kształt), ghost label w tle.
- Każdy segment: eyebrow `for every stage`, segment title 64-96px, lead, body, CTA `read more`.
- Smooth crossfade między segmentami (~600ms).

### Contact Basecamp (`#contact`)
- Tło Purple Dark `#6A6E86`.
- Lewa: H2 `Want to Grow Together?`, CTA `contact us` (light pill, Navy text).
- Prawa: ogromny abstract M/Union shape Navy, partial bleed.
- Krótka route line wpada do CTA z lewej-góry.

### Footer
- Tło Navy.
- 4-kolumnowy grid (top): Logo+tagline | Menu | Segments | Contact.
- Divider gradient.
- Bottom row: details (NIP/KRS/REGON) + Legal links (Privacy / Terms).

---

## Implementation steps

1. **Strip current post-hero HTML/CSS/JS** — remove all sections I added in `2026-05-17-most-site-build.md` (audience tabs, expertise list, how-we-work, about, team, contact + their CSS + audience tab JS).
2. **Mission Statement** — HTML + CSS + reveal-per-phrase IntersectionObserver.
3. **Expertise Route Map** — HTML + CSS + SVG route + waypoint scroll activation.
4. **Transition Marker** — HTML + CSS + scroll-driven orange segment.
5. **Three Client Routes** — HTML + CSS + JS tab switcher with route SVGs per segment.
6. **Contact Basecamp** — HTML + CSS + final route line.
7. **Footer** — HTML + CSS.
8. **JS wiring** — consolidate observers / switcher / reduced-motion guards.
9. **Navbar anchors verify**, final commit.

Each step verified against acceptance criteria in `redesign.md` Section 14.
