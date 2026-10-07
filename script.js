const root = document.documentElement;

function setCssVar(el, name, value) {
  if (!el || el.style.getPropertyValue(name) === value) return;
  el.style.setProperty(name, value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clearCssVar(el, name) {
  if (!el || el.style.getPropertyValue(name) === "") return;
  el.style.removeProperty(name);
}

/* Below 1024px the site is read on phones and tablets, and nothing on it
   follows the scroll position: no parallax, no pinned stage, no card that
   changes as you pass it. The reader scrolls and the page simply moves.
   Everything that is scroll-driven on desktop asks this query, stands down
   while it matches, and puts its desktop state back when the window grows
   past it again (a rotated tablet, a resized browser). The layout for those
   components is in the stylesheet's MOTION & INTERACTIVE COMPONENTS
   section. */
const compactQuery = window.matchMedia("(max-width: 1023px)");

function onCompactChange(fn) {
  if (compactQuery.addEventListener) compactQuery.addEventListener("change", fn);
  else if (compactQuery.addListener) compactQuery.addListener(fn);
}

// All coords use the GORA SVG viewBox (2000 x 850). Trail SVG is positioned/sized
// to match the gora image rect at runtime, so trail path, dots, leaders, and climbers
// all live in the same coordinate space and stay aligned across viewport changes.
const TRAIL = {
  viewBox: { width: 2000, height: 850 },
  pathOffsetY: -120,
  start: { x: 0, y: 642, slope: -0.03 },
  end: { x: 2000, y: 264, slope: -0.16 },
  curve: [
    { x: 144, y: 638, slope: -0.02 },
    { x: 268, y: 631, slope: -0.08 },
    { x: 400, y: 623, slope: -0.04, checkpoint: { main: "20+", sub: "legal experts" } },
    { x: 574, y: 604, slope: -0.22 },
    { x: 712, y: 574, slope: -0.34 },
    { x: 850, y: 548, slope: -0.12, checkpoint: { main: "100+", sub: "clients served annually" } },
    { x: 956, y: 512, slope: -0.30 },
    { x: 1053, y: 501, slope: 0.02 },
    { x: 1124, y: 481, slope: -0.16 },
    { x: 1210, y: 438, slope: -0.48 },
    { x: 1280, y: 397, slope: -0.30, checkpoint: { main: "15+", sub: "years of experience" } },
    { x: 1392, y: 374, slope: -0.04 },
    { x: 1526, y: 361, slope: -0.16 },
    { x: 1633, y: 326, slope: -0.42 },
    { x: 1700, y: 302, slope: -0.22, checkpoint: { main: "Global", sub: "international reach" } },
    { x: 1858, y: 278, slope: -0.08 },
  ],
  heroLeaderEndY: 868,
  climbers: {
    x: 1278,
    y: 210,
    width: 220,
    viewBox: { width: 1024, height: 864 },
    anchor: { x: 132, y: 864 },
    sunOffset: { x: 210, y: 40 },
  },
};

/* ============ THE RIDGE TEXTURE ============
   Every line that runs across the site has the rock of the How We Work
   ridge: the gora ridge less its 30-unit smoothing, plus a third of its
   hills, in ridge units, one value every 2 units (styles.css draws the same
   rock into its fixed ridge lines). A smooth route drawn by script takes the
   rock at the size How We Work shows it (0.72px per ridge unit, its size at
   1440), whatever the route's own scale on screen, so the steps look alike
   on a phone and on a wide screen - and passes exactly through the points
   where its markers stand. */
const RIDGE_TEXTURE = "14.7,13,11.2,9.4,8,6.9,6,6,6.2,6.4,6.6,7.6,8.2,7.9,7.6,6.9,4.3,2.3,2.6,3.2,6,7.2,7.6,7.7,6.7,6.1,6.2,6.3,5.8,4.7,3.6,2.6,1.7,1.3,1,1,0.9,0,-1.3,-2.3,-3,-2.5,-2.1,-1.7,-2.3,-3.2,-4,-5.1,-6.1,-6.9,-7.7,-8.5,-9,-9.1,-9.2,-9.3,-8.5,-7.3,-6.1,-5.1,-4.3,-4.1,-3.9,-2.6,-1.1,-0.9,-0.9,-1.8,-2.7,-3.3,-3.7,-4.1,-4,-3.9,-3.9,-4.6,-5.3,-6.1,-7,-7.9,-8.8,-9.8,-10.8,-11.4,-12.1,-12.6,-13.1,-12.4,-11.4,-10.5,-9.7,-8.8,-8.2,-7.6,-6.9,-6.3,-5.7,-5.1,-4.5,-3.9,-3.6,-3.4,-3.2,-2.9,-3.2,-3.9,-4.6,-4.1,-3.3,-2.5,-1.7,-1,-0.3,0.5,1.2,1.6,1.3,1.1,0.9,0.4,-0.3,-1,-1.8,-2.8,-3.9,-4.9,-5.9,-6.9,-8,-8,-7.7,-7.4,-7.1,-6.8,-6.9,-7.1,-7.4,-7.7,-7.9,-8.2,-8.1,-7.7,-7.4,-7.2,-6.9,-6.7,-6.5,-6.3,-6.2,-6.1,-5.7,-5.4,-5,-4.6,-4.3,-3.8,-3.3,-2.8,-2.2,-2,-2.4,-2.9,-3.4,-3.9,-3.7,-3.2,-2.7,-2.3,-1.8,-1.3,-1,-0.8,-0.7,-0.6,-0.4,-0.3,-0.2,-0.2,-0.2,-0.2,-0.2,-0.2,-0.1,0.2,0.5,0.8,1.2,0.7,0.1,-0.6,-1.3,-2,-2.6,-3.1,-3.6,-4.2,-4.7,-5.3,-5.5,-5.3,-5,-4.8,-4.5,-4.4,-4.4,-4.4,-4.4,-5.2,-6.3,-7.4,-6.4,-5.3,-5.4,-5.9,-6.5,-6.5,-6,-5.5,-5.4,-6.1,-6.8,-6.2,-5.3,-4.2,-3.3,-2.3,-1.4,-1.1,-0.8,3.7,3.8,3.8,3.9,3.9,3.9,4,4,4,4,4,4,3.9,3.9,3.9,3.8,3.8,3.8,3.8,3.6,3.1,2.6,2.2,1.7,1.1,0.7,1,1.2,1.5,7,6.8,6.4,5.8,5.2,6.1,8.7,8.8,8.9,9.1,9.5,10,10.4,11,11.5,12.7,13.6,13.5,14.4,18,18.8,19.7,20.4,21.4,22.4,23.2,23.3,23,22.7,22.5,22.3,22.2,22.2,21.5,20.5,19.8,19.7,19.7,19.6,19.5,19.5,19.4,18.5,17.5,16.5,15.5,12.7,12.9,14.1,14.7,14.8,14.9,15,14.8,14.2,13.7,12.7,10.1,9.1,9.9,10.7,10.7,9.3,3.6,3.1,2.5,-3.4,-4.6,-4.8,-4.1,-4.4,-5.7,-6.4,-5.8,-5.5,-5.8,-6.1,-5.9,-5.8,-5.7,-5.7,-6,-6.3,-6.4,-5.6,-4.8,-4,-2.3,-0.6,1.1,2.2,3.3,4.4,6.2,8,8.6,9.5,12.6,12.8,12.6,9.3,7.5,6.6,6.1,5.4,5.1,7.9,8.2,9.6,10.2,9.6,8.9,5.8,3.5,4,3.3,-0.5,0,-0.2,-1.8,-3.3,-2.8,-1.8,-1.3,-1.9,-2.5,-2.7,-1.7,-0.8,-0.2,0,0.8,1.9,3,1.7,-0.1,0.1,1,1.8,2.6,3,3,2.8,2.8,2.6,2.5,2.7,3.4,4,4.7,5.4,5.1,3.7,4,4.2,4.5,3.8,2,1,0.8,0.6,-1.9,-2.7,-3.4,-4.1,-4.8,-5.4,-5.6,-5.6,-5.8,-7.2,-8.7,-8.5,-7.8,-7.2,-7.1,-7.6,-7.8,-7.6,-7.4,-7.6,-9.4,-11.4,-13.1,-13.1,-15.3,-14.8,-14.4,-14,-13.6,-11,-10.3,-9.6,-9,-8.5,-7.9,-7.4,-6.9,-6.4,-6.3,-6.2,-3.3,-2.8,-2.2,-1.8,-1.3,-0.8,-0.4,0.1,0.6,1.1,1.5,1.9,2.4,3.7,4.8,5.5,7.4,10.5,10.5,10.5,10.5,10.6,10.7,10.8,10.9,11,11.2,11.5,12,12.6,13.2,13.8,14.1,14.4,13.8,12.3,11.1,9.9,8.8,7.9,7.2,6.6,5.2,3.9,3.9,3.8,3.7,4.2,5.5,6.9,8.3,9.5,10.5,11.4,12.4,13.4,13.4,13,12.7,13,13.3,13,13,13.1,13.2,13.3,14.1,15,15.9,16.4,16.5,16.7,17,16.9,16.4,15.9,16.7,17.6,16.6,15.5,15.4,15.7,16.1,16.4,16.8,16.9,15.8,14.9,14.5,15.7,16.8,16.7,16.7,17.1,17.6,15,5.3,2.6,2.5,2.7,2.3,0.5,0.1,0.3,0.4,0.6,0.9,1.4,2.1,3.8,5.6,7.4,9.3,11.1,10.6,10,9.6,9.1,8.9,8.5,8.1,7.8,7.5,6.4,5.2,5.7,6.3,7,7.5,8.1,8.6,9.1,9.5,10,9.3,7.4,6.8,6.2,5.6,4.7,4.1,3.2,2.9,2.3,1.8,1.5,0.9,0.3,-0.2,-1.1,-2,-2.9,-4.2,-6.3,-7.2,-7.1,-7.1,-7.1,-7.2,-6.8,-6.4,-6,-5.5,-4.9,-4.2,-3.7,-3.5,-3.2,-1.3,-0.8,-0.2,0.4,0.9,0.9,0.4,-0.2,-4.4,-4.6,-3.7,-6.8,-5.5,-4.1,-3.9,-4.4,-4.8,-4.8,-4.9,-5.5,-7.9,-7.4,-6.6,-6.2,-5.7,-5.4,-6.6,-7.9,-7.7,-6.5,-5.3,-4.2,-5.4,-7,-6.1,-5,-4.8,-5.6,-6.7,-7.8,-8.9,-7.3,-6,-5.4,-5,-4.5,-2.9,-2.9,-2.9,-1.7,-0.7,-0.4,0,0.1,0,0,0,-1,-2.8,-2.6,-4.7,-4.3,-3.9,-3.5,-3.6,-4,-4.5,-5,-5.5,-5.5,-3.3,-0.8,-1,-1.5,-2,-2.4,-2.9,-3.2,-4,-5.2,-6.1,-10.8,-12.6,-17.9,-17.8,-17.9,-18,-17.9,-18.1,-17.7,-17.3,-17.1,-16.7,-16.5,-16,-14.7,-13.4,-12.1,-12.5,-13.9,-15.3,-16.9,-17.2,-17.3,-17.6,-18.4,-19.2,-19.6,-19.1,-18.7,-18.2,-17.8,-17.3,-16.6,-16,-15.5,-14.9,-12.2,-10.4,-9.8,-9.2,-5.9,-5.8,-5.7,-5.9,-6.1,-6.3,-6.5,-7.1,-8.3,-9.5,-10.5,-8.9,-8.8,-8.9,-9.2,-9.4,-9.6,-9.8,-9.8,-9.6,-9.4,-9.2,-9,-8.8,-8.5,-6.9,-5.4,-4.1,-4.4,-5.3,-6.2,-7.4,-9.1,-10.6,-12.2,-13.8,-12.4,-12.1,-13.4,-14.3,-10.9,-8.1,-7.1,-6.2,-5.3,-3.2,-1.5,-1.6,-1.6,-0.9,2,4.5,4.2,4,3.7,7.4,7.9,7.6,5.8,4.1,2.4,0.7,-0.4,-1.5,-2.2,-0.9,0.4,0.8,0.6,1.1,2.5,3.9,5.3,7.3,9.2,11.8,14.2,15.8,17.4,18.2,18.3,18.5,18.7,18.9,19.2,19.5,19.8,18.2,16.6,15.1,14,13.3,12.8,11.1,8,6.9,6.6,6.2,3.5,1.2,0.5,-0.3,0.7,2,3.3,4.6,5.9,6.4,6.1,5.9,6,6.8,7.3,7,6.7,6.5,6.2,5.2,3.3,2.9,2.6,-0.7,0.9,2.5,4.2,5.9,6,-0.2,0.6,1.4,2.2,2.9,3.7,4.5,5.3,4.8,4.2,3.5,2.6,1.8,1,0.1,-0.7,0.7,1.1,-0.9,-1,-1,-1,-2.7,-4.7,-6.5,-6.7,-6.6,-6.5,-7,-7.1,-5.8,-4.2,-2.8,-2.4,-2.8,-2.9,-2.6,-2.4,-2.7,-3.2,-3.8,-4.3,-8.9,-10.9,-10.8,-10.6,-10.6,-10.4,-10.3,-10,-9.5,-8.9,-8.4,-7.8,-7.3,-6.8,-6.3,-5.8,-5.3,-5.1,-5.8,-6.4,-7.1,-7.7,-7.9,-7.5,-7.1,-6.7,-6.3,-6,-5.6,-6.1,-7.7,-9.2,-10.8,-11.2,-11.5,-11.8,-12.2,-12.6,-13,-13.4,-13.8,-14.2,-13.7,-13.2,-12.8,-12.3,-11.9,-11.5,-11.2,-10.9,-10.6,-10.3,-10.1,-10.2,-10.5,-10.8,-11,-11.3,-11.7,-11.9,-9.7,-7.7,-5.6,-3.4,-2,-2.4,-2.8,-3.1,-3.5,-2.5,-0.2,2,4.5,5.4,5.1,4.8,4.6,4.4,4.8,5.4,6.1,6.9,7.6,8.5".split(",").map(Number);
const RIDGE_PX = 0.72;

function ridgeTexture(u) {
  /* mirrored past the ends, so a line of any length finds rock */
  const last = RIDGE_TEXTURE.length - 1;
  const span = last * 2;
  let v = ((u % (2 * span)) + 2 * span) % (2 * span);
  if (v > span) v = 2 * span - v;
  const x = v / 2;
  const i = Math.min(Math.floor(x), last - 1);
  return RIDGE_TEXTURE[i] + (RIDGE_TEXTURE[i + 1] - RIDGE_TEXTURE[i]) * (x - i);
}

/* segments: cubic pieces [x0, y0, c1x, c1y, c2x, c2y, x1, y1] in the route's
   own units; sx, sy: screen px per unit. The rock fades to nothing within
   18px of each fixed x, so the line meets its markers exactly. */
function grainRoute(segments, sx, sy, fixedXs, offset = 0, amp = 0.8) {
  const k = RIDGE_PX / sy;
  const pts = [];
  segments.forEach(([x0, y0, c1x, c1y, c2x, c2y, x1, y1], si) => {
    const steps = Math.max(2, Math.ceil((Math.abs(x1 - x0) * sx) / 3));
    for (let n = si ? 1 : 0; n <= steps; n++) {
      const t = n / steps;
      const u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1;
      let y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1;
      let w = 1;
      for (const fx of fixedXs) {
        const q = (Math.abs(x - fx) * sx) / 18;
        if (q < 1) w = Math.min(w, q * q * (3 - 2 * q));
      }
      y += amp * k * ridgeTexture(offset + (x * sx) / RIDGE_PX) * w;
      pts.push([x, y]);
    }
  });
  return pts;
}

function routeD(pts) {
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}`;
}

function trailSegments(trail) {
  const anchors = [
    trail.start,
    ...trail.curve,
    trail.end,
  ].map((point) => getTrailPoint(point));
  const segments = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const t = (b.x - a.x) / 3;
    segments.push([a.x, a.y, a.x + t, a.y + a.slope * t, b.x - t, b.y - b.slope * t, b.x, b.y]);
  }
  return segments;
}

/* Without a scale this is the smooth route; with one (the trail's size on
   screen, known once it sits on the ridge image) it carries the rock. */
function buildTrailPath(trail, sx = 0, sy = sx) {
  const segments = trailSegments(trail);
  if (sx > 0) {
    const fixed = trail.curve.filter((p) => p.checkpoint).map((p) => p.x);
    return routeD(grainRoute(segments, sx, sy, fixed, 400));
  }
  let d = `M${segments[0][0]} ${segments[0][1]}`;
  segments.forEach(([, , c1x, c1y, c2x, c2y, x1, y1]) => {
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x1} ${y1}`;
  });
  return d;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

let trailDots = [];
let trailLabels = [];
let trailOverlayRaf = 0;
let trailOverlaySettleTimer = 0;

function getTrailPoint(point) {
  return {
    ...point,
    y: point.y + TRAIL.pathOffsetY,
  };
}

function scheduleTrailOverlay(settle = false) {
  if (!trailOverlayRaf) {
    trailOverlayRaf = window.requestAnimationFrame(() => {
      trailOverlayRaf = 0;
      positionTrailOverlay();
      if (settle) window.requestAnimationFrame(positionTrailOverlay);
    });
  }

  if (settle) {
    window.clearTimeout(trailOverlaySettleTimer);
    trailOverlaySettleTimer = window.setTimeout(positionTrailOverlay, 140);
  }
}

function setupHeroTrail() {
  const pathEls = document.querySelectorAll(".hero-trail__path");
  const trailSvg = document.querySelector(".hero-trail");
  const heroLeaders = document.querySelector(".hero-trail__leaders");
  const ridgeLeaders = document.querySelector(".ridge-edge__leaders");
  const pointsHost = document.querySelector(".hero-trail-points");
  const labelsHost = document.querySelector(".hero-trail-labels");
  if (!pathEls.length || !trailSvg || !heroLeaders || !ridgeLeaders || !pointsHost || !labelsHost) return;

  const trailPath = buildTrailPath(TRAIL);
  pathEls.forEach((pathEl) => pathEl.setAttribute("d", trailPath));

  const checkpoints = TRAIL.curve.filter((p) => p.checkpoint);

  const SVG_NS = "http://www.w3.org/2000/svg";
  clearChildren(heroLeaders);
  clearChildren(ridgeLeaders);
  clearChildren(pointsHost);
  clearChildren(labelsHost);

  trailDots = [];
  trailLabels = [];

  if ("ResizeObserver" in window && !setupHeroTrail._observer) {
    // Only observe ridgesImg — it drives all dependent sizing. Removed
    // redundant observers on trailSvg/labelsHost/ridges which all resize
    // in lockstep with it (was causing 3-4x scheduleTrailOverlay calls).
    setupHeroTrail._observer = new ResizeObserver(() => scheduleTrailOverlay(true));
    const ridgesImg = document.querySelector(".hero-ridges__img");
    /* The ridge hangs from the hero's foot, so a hero that grows or shrinks
       moves it without resizing it - late fonts rewrapping the copy, or the
       stats taking a line more after a rotation. Below 1024px nothing else
       re-seats the trail (it no longer follows the scroll), so the hero is
       watched as well. */
    const heroBox = ridgesImg && ridgesImg.closest(".hero");
    if (heroBox) setupHeroTrail._observer.observe(heroBox);
    if (ridgesImg) {
      setupHeroTrail._observer.observe(ridgesImg);
      ridgesImg.addEventListener("load", () => scheduleTrailOverlay(true));
      if (ridgesImg.complete) scheduleTrailOverlay(true);
    }
  }

  checkpoints.forEach((cp, i) => {
    const trailCp = getTrailPoint(cp);
    const heroLine = document.createElementNS(SVG_NS, "line");
    heroLine.setAttribute("class", "hero-trail__leader");
    heroLine.setAttribute("x1", String(trailCp.x));
    heroLine.setAttribute("y1", String(trailCp.y));
    heroLine.setAttribute("x2", String(trailCp.x));
    heroLine.setAttribute("y2", String(TRAIL.heroLeaderEndY));
    heroLeaders.appendChild(heroLine);

    const dot = document.createElement("span");
    dot.className = "hero-trail-point";
    dot.style.animationDelay = `${-i * 0.8}s`;
    pointsHost.appendChild(dot);
    trailDots.push({ el: dot, cp: trailCp });

    const label = document.createElement("div");
    label.className = "hero-trail-label";
    if (i === checkpoints.length - 1) label.classList.add("hero-trail-label--last");
    const strong = document.createElement("strong");
    strong.textContent = cp.checkpoint.main;
    const sub = document.createElement("span");
    sub.textContent = cp.checkpoint.sub;
    label.append(strong, sub);
    labelsHost.appendChild(label);
    trailLabels.push({ el: label, cp });
  });

  positionTrailOverlay();
}

function syncTrailContainersToRidge() {
  const ridgesImg = document.querySelector(".hero-ridges__img");
  const trailSvg = document.querySelector(".hero-trail");
  const pointsHost = document.querySelector(".hero-trail-points");
  if (!ridgesImg || !trailSvg) return;

  const heroRect = trailSvg.parentElement.getBoundingClientRect();
  const imgRect = ridgesImg.getBoundingClientRect();
  if (imgRect.width === 0 || imgRect.height === 0) return;

  const left = imgRect.left - heroRect.left;
  const top = imgRect.top - heroRect.top;

  const box = { left: `${left}px`, top: `${top}px`, right: "auto", bottom: "auto", width: `${imgRect.width}px`, height: `${imgRect.height}px` };
  for (const el of [trailSvg, pointsHost]) {
    if (!el) continue;
    for (const prop in box) if (el.style[prop] !== box[prop]) el.style[prop] = box[prop];
  }
}

/* Parked elements (display: none in the stylesheet) are left alone. The
   answer is read once per element and layout: a resize can cross a
   breakpoint that parks or brings back an element (the climbers on a
   phone turned on its side), so the resize handler starts it afresh. */
let parkedCache = new WeakMap();
function shownOrNull(el) {
  if (!el) return null;
  if (!parkedCache.has(el)) parkedCache.set(el, getComputedStyle(el).display === "none");
  return parkedCache.get(el) ? null : el;
}

let trailRockScale = 0;

function positionTrailOverlay() {
  syncTrailContainersToRidge();

  const trailSvg = document.querySelector(".hero-trail");
  const pointsHost = document.querySelector(".hero-trail-points");
  const labelsHost = document.querySelector(".hero-trail-labels");
  if (!trailSvg || !pointsHost || !labelsHost) return;

  /* the rock is drawn at its size on screen, so a new size redraws it */
  const trailBox = trailSvg.getBoundingClientRect();
  if (trailBox.width && trailBox.height) {
    const sx = trailBox.width / TRAIL.viewBox.width;
    if (!trailRockScale || Math.abs(sx / trailRockScale - 1) > 0.06) {
      trailRockScale = sx;
      const d = buildTrailPath(TRAIL, sx, trailBox.height / TRAIL.viewBox.height);
      document.querySelectorAll(".hero-trail__path").forEach((pathEl) => pathEl.setAttribute("d", d));
    }
  }

  const ctm = trailSvg.getScreenCTM();
  if (!ctm) return;

  // ---- READ PHASE: gather all geometry first to avoid layout thrashing ----
  const pointsRect = pointsHost.getBoundingClientRect();
  const labelsRect = labelsHost.getBoundingClientRect();
  const pt = trailSvg.createSVGPoint();

  const dotPositions = trailDots.map(({ el, cp }) => {
    pt.x = cp.x;
    pt.y = cp.y;
    const screen = pt.matrixTransform(ctm);
    return { el, left: screen.x - pointsRect.left, top: screen.y - pointsRect.top };
  });
  const labelPositions = trailLabels.map(({ el, cp }) => {
    pt.x = cp.x;
    pt.y = cp.y;
    const screen = pt.matrixTransform(ctm);
    return { el, left: screen.x - labelsRect.left };
  });

  // The leaders used to stop at a constant in trail space. That constant is
  // measured from the ridge image, so lowering the ridge carried the leader
  // ends down with it and off the bottom of the hero. Resolving the stats'
  // own top back into trail coordinates keeps them meeting whatever the
  // ridge does.
  let leaderWrite = null;
  const statsEl = document.querySelector(".hero-stats");
  if (statsEl) {
    const inv = ctm.inverse();
    const sp = trailSvg.createSVGPoint();
    sp.x = 0;
    sp.y = statsEl.getBoundingClientRect().top - 14;
    const localY = sp.matrixTransform(inv).y;
    if (Number.isFinite(localY)) {
      leaderWrite = [...document.querySelectorAll(".hero-trail__leader")].map((el) => ({
        el,
        // never let a leader invert if the stats sit above its checkpoint
        y2: Math.max(localY, parseFloat(el.getAttribute("y1")) + 8),
      }));
    }
  }

  let climberWrite = null;
  let sunWrite = null;
  const climbers = shownOrNull(document.querySelector(".hero-climbers"));
  const climbersSun = shownOrNull(document.querySelector(".hero-climbers-sun"));
  if (TRAIL.climbers && (climbers || climbersSun)) {
    const ridgesImg = document.querySelector(".hero-ridges__img");
    if (ridgesImg) {
      const imgRect = ridgesImg.getBoundingClientRect();
      if (imgRect.width !== 0 && imgRect.height !== 0) {
        const climberViewBox = TRAIL.climbers.viewBox;
        const climberScale = ((TRAIL.climbers.width / TRAIL.viewBox.width) * imgRect.width) / climberViewBox.width;
        const widthPx = climberViewBox.width * climberScale;
        const anchor = TRAIL.climbers.anchor;
        const screen = {
          x: imgRect.left + (TRAIL.climbers.x / TRAIL.viewBox.width) * imgRect.width,
          y: imgRect.top + (TRAIL.climbers.y / TRAIL.viewBox.height) * imgRect.height,
        };
        if (climbers) {
          const climbersHostRect = climbers.parentElement.getBoundingClientRect();
          climberWrite = {
            el: climbers,
            width: widthPx,
            left: screen.x - climbersHostRect.left - anchor.x * climberScale,
            top: screen.y - climbersHostRect.top - anchor.y * climberScale,
          };
        }
        if (climbersSun) {
          const sunScreen = {
            x: imgRect.left + ((TRAIL.climbers.x + TRAIL.climbers.sunOffset.x) / TRAIL.viewBox.width) * imgRect.width,
            y: imgRect.top + ((TRAIL.climbers.y + TRAIL.climbers.sunOffset.y) / TRAIL.viewBox.height) * imgRect.height,
          };
          const sunHostRect = climbersSun.parentElement.getBoundingClientRect();
          sunWrite = {
            el: climbersSun,
            width: widthPx * 5.6,
            left: sunScreen.x - sunHostRect.left,
            top: sunScreen.y - sunHostRect.top,
          };
        }
      }
    }
  }

  // ---- WRITE PHASE: batch all style mutations after reads are done ----
  if (leaderWrite) {
    for (const l of leaderWrite) l.el.setAttribute("y2", String(l.y2));
  }
  for (const p of dotPositions) {
    p.el.style.left = `${p.left}px`;
    p.el.style.top = `${p.top}px`;
  }
  for (const p of labelPositions) {
    p.el.style.left = `${p.left}px`;
  }
  /* .is-placed: below 1024px the stylesheet keeps the climbers hidden until
     their first box is written, so the move from their default spot is
     never painted (it counted as a layout shift on every load) */
  if (climberWrite) {
    climberWrite.el.style.width = `${climberWrite.width}px`;
    climberWrite.el.style.left = `${climberWrite.left}px`;
    climberWrite.el.style.top = `${climberWrite.top}px`;
    climberWrite.el.classList.add("is-placed");
  }
  if (sunWrite) {
    sunWrite.el.style.width = `${sunWrite.width}px`;
    sunWrite.el.style.left = `${sunWrite.left}px`;
    sunWrite.el.style.top = `${sunWrite.top}px`;
    sunWrite.el.classList.add("is-placed");
  }
}

const topNav = document.querySelector(".top-nav");
const heroEl = document.querySelector(".hero");
const ridgeEdgeEl = document.querySelector(".ridge-edge");

const scrollProgressEl = document.querySelector(".scroll-progress");

/* Every read first, then every write - and each value is written on the one
   element whose subtree uses it. A custom property set on <html> is
   inherited by the whole document, so writing these there on every frame
   restyled every element twice a frame.

   Below 1024px the scene holds still: the hero photo, its ridge and glow,
   the copy fade, the ridge-edge band and the horizon photos all read these
   properties, so instead of writing them the script drops them and every
   rule falls back to its resting value - the page as it stands at the top.
   The layout reads that only the parallax needs are skipped too. */
function updateScroll() {
  const scrollY = window.scrollY || 0;
  const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const vh = window.innerHeight || 1;
  const still = compactQuery.matches;
  const heroHeight = heroEl && !still ? heroEl.offsetHeight || vh : 0;
  const edgeRect = ridgeEdgeEl && !still ? ridgeEdgeEl.getBoundingClientRect() : null;

  const scrollProgress = Math.min(1, scrollY / Math.max(1, scrollHeight - vh));
  if (scrollProgressEl) setCssVar(scrollProgressEl, "--scroll-progress", scrollProgress.toFixed(4));
  if (still) {
    clearCssVar(heroEl, "--scroll-y");
    clearCssVar(heroEl, "--hero-progress");
    clearCssVar(ridgeEdgeEl, "--ridge-progress");
  } else {
    if (heroEl) {
      setCssVar(heroEl, "--scroll-y", `${scrollY}px`);
      setCssVar(heroEl, "--hero-progress", Math.min(1, Math.max(0, scrollY / heroHeight)).toFixed(4));
    }
    if (edgeRect) {
      const ridgeProgress = Math.min(1, Math.max(0, (vh - edgeRect.top) / (edgeRect.height + vh)));
      setCssVar(ridgeEdgeEl, "--ridge-progress", ridgeProgress.toFixed(4));
    }
  }

  if (topNav) topNav.classList.toggle("is-scrolled", scrollY > 12);
  if (!still && window.updateParallax) window.updateParallax();
}

function setupSectionReveal() {
  const targets = document.querySelectorAll(".basecamp, .route-stage, .member, .member-trail, .has-trail, [data-reveal]");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  /* On desktop a section shows once 18% of it is on screen. A ratio cannot
     pass the share of the element the screen can hold, so on a phone -
     a section in landscape can be six screens tall - it never fired and
     the section's content stayed invisible. Below 1024px it shows as it
     arrives instead: once its top is past the lower eighth of the screen,
     whatever its height. The observer is rebuilt for whatever is still
     hidden when the window crosses 1024px. */
  const pending = new Set(targets);
  let observer = null;

  function watch() {
    if (observer) observer.disconnect();
    observer = null;
    if (!pending.size) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          pending.delete(entry.target);
          io.unobserve(entry.target);
        });
      },
      compactQuery.matches ? { threshold: 0, rootMargin: "0px 0px -12% 0px" } : { threshold: 0.18 }
    );
    pending.forEach((el) => io.observe(el));
    observer = io;
  }

  watch();
  onCompactChange(watch);
}

/* Below 1024px the header folds into one button that opens a full-screen
   modal dialog. While it is open it behaves as a modal must: everything
   behind it is inert (out of the tab order and the accessibility tree), the
   page does not scroll underneath, Tab cycles inside it, Esc closes it, and
   focus goes to the close button - which sits exactly where the menu button
   was - and comes back to the menu button afterwards. The scroll lock is
   overflow on the root rather than a fixed body, so closing never has to
   put the reader back where they were: they never left. */
function setupMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const openButton = document.querySelector(".top-nav .icon-button");
  const closeButton = menu && menu.querySelector(".close-button");

  if (!menu || !openButton || !closeButton) return;

  const root = document.documentElement;
  const desktop = window.matchMedia("(min-width: 1024px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inerted = [];
  let hideTimer = 0;

  const isOpen = () => menu.classList.contains("is-open");
  const focusables = () =>
    Array.from(menu.querySelectorAll("a[href], button:not([disabled])")).filter((el) => el.getClientRects().length);

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    /* inert already keeps focus off the page; this keeps it off the browser
       chrome too, so Tab and Shift+Tab simply go round the menu */
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const inside = menu.contains(document.activeElement);
    if (event.shiftKey && (document.activeElement === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  }

  function open() {
    if (isOpen()) return;
    window.clearTimeout(hideTimer);
    menu.hidden = false;
    menu.inert = false;
    inerted = Array.from(document.body.children).filter(
      (el) => el !== menu && !el.inert && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName)
    );
    inerted.forEach((el) => (el.inert = true));
    root.classList.add("menu-open");
    document.body.classList.add("menu-open");
    openButton.setAttribute("aria-expanded", "true");
    /* commit the closed styles first, or the fade-in has nothing to run from */
    menu.getBoundingClientRect();
    menu.classList.add("is-open");
    closeButton.focus({ preventScroll: true });
    document.addEventListener("keydown", onKeydown);
  }

  function finishClose() {
    if (!isOpen()) menu.hidden = true;
  }

  function close(restoreFocus = true) {
    if (!isOpen()) return;
    menu.classList.remove("is-open");
    /* still fading out: not reachable, not tappable */
    menu.inert = true;
    inerted.forEach((el) => (el.inert = false));
    inerted = [];
    root.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
    openButton.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    if (restoreFocus) openButton.focus({ preventScroll: true });
    window.clearTimeout(hideTimer);
    /* the fade only exists below 1024px: past it (a tablet rotated with the
       menu open) the sheet has no compact styles left and must go at once */
    if (reducedMotion.matches || !compactQuery.matches) finishClose();
    else hideTimer = window.setTimeout(finishClose, 320);
  }

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", () => close());
  menu.addEventListener("transitionend", (event) => {
    if (event.target === menu && event.propertyName === "opacity") finishClose();
  });
  /* a link to another page or an anchor on this one: either way the menu
     has done its job. A placeholder (href="#", the LinkedIn profile until
     its address is confirmed) goes nowhere, so the menu stays open. */
  menu.querySelectorAll('a[href]:not([href="#"])').forEach((link) => link.addEventListener("click", () => close()));

  /* the dialog only exists below 1024px; growing the window past that (a
     rotated tablet, a resized browser) puts the desktop header back. Focus
     inside the menu would be left on an element that is about to be
     hidden and fall to <body>, and the next Tab would skip the header, so
     it moves to the same link in the desktop header (the wordmark when
     there is none). The header is only reachable once close() has lifted
     its inert. */
  const onBreakpoint = (event) => {
    if (!event.matches || !isOpen()) return;
    const active = document.activeElement;
    const hadFocus = active && menu.contains(active);
    close(false);
    if (!hadFocus) return;
    const header = document.querySelector(".top-nav");
    if (!header) return;
    const href = active.getAttribute("href");
    const twin =
      (href && Array.from(header.querySelectorAll("a[href]")).find((a) => a.getAttribute("href") === href && a.getClientRects().length)) ||
      header.querySelector(".wordmark");
    if (twin) twin.focus({ preventScroll: true });
  };
  if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
  else if (desktop.addListener) desktop.addListener(onBreakpoint);
}

/* LinkedIn, Privacy Policy and Terms still point at "#" until the client
   confirms their addresses. Following one scrolls the reader back to the top
   of the page - on a phone, a whole long page - so below 1024px a
   placeholder simply stays put. The real fix is the address in the markup. */
function setupPlaceholderLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest('a[href="#"]');
    if (link && compactQuery.matches) event.preventDefault();
  });
}

let ticking = false;

/* The hero trail tracks a ridge that moves with parallax, so it only needs
   re-measuring while the hero is on screen; coming back re-seats it. Below
   1024px the ridge does not move with the scroll, so the trail is only
   re-seated when the layout changes (resize, rotation, fonts, load). */
let heroInView = true;
if (heroEl && "IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    heroInView = entries[entries.length - 1].isIntersecting;
    if (heroInView) scheduleTrailOverlay(true);
  }).observe(heroEl);
}

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      updateScroll();
      if (heroInView && !compactQuery.matches) scheduleTrailOverlay();
      ticking = false;
    });
    ticking = true;
  },
  { passive: true }
);

let resizeRaf = 0;
window.addEventListener("resize", () => {
  if (resizeRaf) return;
  resizeRaf = window.requestAnimationFrame(() => {
    resizeRaf = 0;
    parkedCache = new WeakMap();
    updateScroll();
    scheduleTrailOverlay(true);
  });
}, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => scheduleTrailOverlay(true), { passive: true });
}

window.addEventListener("orientationchange", () => scheduleTrailOverlay(true), { passive: true });

if (document.fonts) {
  document.fonts.ready.then(() => scheduleTrailOverlay(true));
}

let scheduleAudienceConnectors = () => {};

function setupAudienceTriptych() {
  const root = document.querySelector("[data-audience-triptych]");
  if (!root) return;
  const cards = Array.from(root.querySelectorAll("[data-audience-card]"));
  if (!cards.length) return;
  const section = root.closest(".audience-intro") || root;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const audienceThemes = ["founders", "companies", "investors"];
  let sectionTop = 0;
  let sectionHeight = 1;
  let sectionScrollable = 1;
  let activeIndex = null;
  /* A card the reader opened or closed stays that way until the section has
     left the screen; only then does the scroll take the cards back. */
  let chosen = null;

  function updateBackdrop(progress) {
    if (reducedMotion) {
      setCssVar(section, "--audience-bg-x", "0px");
      setCssVar(section, "--audience-bg-y", "0px");
      setCssVar(section, "--audience-bg-sweep", "0px");
      setCssVar(section, "--audience-title-bg-x", "0px");
      setCssVar(section, "--audience-title-bg-y", "0px");
      setCssVar(section, "--audience-title-bg-sweep", "0px");
      setCssVar(section, "--audience-bg-alpha", "0.180");
      return;
    }

    const eased = progress * progress * (3 - 2 * progress);
    const wave = Math.sin(progress * Math.PI * 2);
    const bgX = (eased - 0.5) * 140;
    const bgY = wave * 26 + (eased - 0.5) * 36;
    const bgSweep = (0.5 - eased) * 96;
    setCssVar(section, "--audience-bg-x", `${bgX.toFixed(1)}px`);
    setCssVar(section, "--audience-bg-y", `${bgY.toFixed(1)}px`);
    setCssVar(section, "--audience-bg-sweep", `${bgSweep.toFixed(1)}px`);
    setCssVar(section, "--audience-title-bg-x", `${(bgX * 0.22).toFixed(1)}px`);
    setCssVar(section, "--audience-title-bg-y", `${(bgY * 0.18).toFixed(1)}px`);
    setCssVar(section, "--audience-title-bg-sweep", `${(bgSweep * 0.28).toFixed(1)}px`);
    setCssVar(section, "--audience-bg-alpha", (0.15 + Math.sin(progress * Math.PI) * 0.07).toFixed(3));
  }

  function setActiveCard(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    root.classList.toggle("has-no-active", index < 0);
    cards.forEach((_, idx) => {
      root.classList.toggle(`is-active-${idx}`, idx === index);
    });
    audienceThemes.forEach((theme, idx) => {
      section.classList.toggle(`is-audience-${theme}`, idx === index);
    });

    cards.forEach((card, idx) => {
      const expanded = idx === index;
      card.classList.toggle("is-expanded", expanded);
      card.classList.toggle("is-active", expanded);

      const toggle = card.querySelector("[data-audience-toggle]");
      if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

      /* a folded card's copy and link are invisible, so they leave the Tab
         order and the accessibility tree with it */
      const body = card.querySelector(".preview__body");
      if (body) body.inert = !expanded;

      const label = toggle?.querySelector(".preview__toggle-label");
      if (label) label.textContent = expanded ? "show less" : "read more";
    });

    scheduleAudienceConnectors();
    window.requestAnimationFrame(scheduleAudienceConnectors);
  }

  function measure() {
    if (compactQuery.matches) return;
    const rect = section.getBoundingClientRect();
    sectionTop = (window.scrollY || 0) + rect.top;
    sectionHeight = section.offsetHeight || window.innerHeight;
    sectionScrollable = Math.max(1, sectionHeight - window.innerHeight);
  }

  /* Below 1024px there is no stage: the three cards are read one after
     another, every one of them open (the stylesheet lays them out and hides
     the toggles), and the backdrop holds still. The scroll is not asked
     anything. Growing past 1024px hands the cards back to the scroll, which
     sets every class and attribute again from where the reader is - the
     same state a fresh load at that position would have. */
  let compactMode = null;

  function openAll() {
    activeIndex = null;
    chosen = null;
    root.classList.remove("has-no-active");
    cards.forEach((card, idx) => {
      root.classList.remove(`is-active-${idx}`);
      card.classList.add("is-expanded");
      card.classList.remove("is-active");
      const toggle = card.querySelector("[data-audience-toggle]");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
      const body = card.querySelector(".preview__body");
      if (body) body.inert = false;
      const label = toggle?.querySelector(".preview__toggle-label");
      if (label) label.textContent = "show less";
    });
    audienceThemes.forEach((theme) => section.classList.remove(`is-audience-${theme}`));
    ["--audience-bg-x", "--audience-bg-y", "--audience-bg-sweep", "--audience-title-bg-x", "--audience-title-bg-y", "--audience-title-bg-sweep", "--audience-bg-alpha"]
      .forEach((name) => clearCssVar(section, name));
  }

  function syncMode() {
    const compact = compactQuery.matches;
    if (compact === compactMode) return;
    compactMode = compact;
    if (compact) {
      openAll();
      return;
    }
    activeIndex = null;
    chosen = null;
    measure();
    updateFromScroll();
    scheduleAudienceConnectors();
  }

  function updateFromScroll() {
    if (compactMode) return;
    const scrollY = window.scrollY || 0;
    const vh = window.innerHeight || 1;
    if (chosen !== null) {
      if (scrollY + vh < sectionTop || scrollY > sectionTop + sectionHeight) chosen = null;
      else {
        if (!reducedMotion) updateBackdrop(clamp((scrollY - sectionTop) / sectionScrollable, 0, 1));
        return;
      }
    }

    if (reducedMotion) {
      updateBackdrop(0);
      setActiveCard(0);
      return;
    }

    const revealStart = sectionTop - vh * 0.08;
    updateBackdrop(clamp((scrollY - sectionTop) / sectionScrollable, 0, 1));

    if (scrollY < revealStart) {
      setActiveCard(-1);
      return;
    }

    const progress = clamp((scrollY - revealStart) / Math.max(1, sectionScrollable * 0.9), 0, 0.999);
    setActiveCard(Math.min(cards.length - 1, Math.floor(progress * cards.length)));
  }

  let raf = 0;
  function scheduleUpdate() {
    if (raf || compactMode) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      updateFromScroll();
    });
  }

  cards.forEach((card) => {
    const toggle = card.querySelector("[data-audience-toggle]");
    if (!toggle) return;
    card.addEventListener("transitionend", () => {
      if (compactMode) return;
      measure();
      scheduleAudienceConnectors();
    });
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (compactMode) return;
      /* show less closes the card; read more opens it */
      chosen = card.classList.contains("is-expanded") ? -1 : cards.indexOf(card);
      setActiveCard(chosen);
    });
  });

  syncMode();
  onCompactChange(syncMode);
  measure();
  updateFromScroll();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    scheduleUpdate();
  }, { passive: true });
  window.addEventListener("load", () => {
    measure();
    scheduleUpdate();
  }, { once: true });
  if (document.fonts) document.fonts.ready.then(() => {
    measure();
    scheduleUpdate();
  });
}

function setupAudienceConnectors() {
  const section = document.querySelector(".audience-intro");
  if (!section) return;
  const connectors = Array.from(section.querySelectorAll(".audience-col__connector"));
  if (!connectors.length) return;

  // The top edge of the section is the Home route: a smooth curve through
  // these points (Catmull-Rom, the same path the CSS mask and stroke draw),
  // so the connector dots land on the line and not on a notch.
  const trailPoints = [
    [0, 94], [221, 98], [432, 96], [589, 72], [746, 51],
    [917, 28], [1058, 24], [1164, 12], [1200, 10],
  ];
  const trailSegments = [];
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const a = trailPoints[i - 1] || trailPoints[i];
    const b = trailPoints[i];
    const c = trailPoints[i + 1];
    const e = trailPoints[i + 2] || c;
    trailSegments.push([
      b[0], b[1],
      b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6,
      c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6,
      c[0], c[1],
    ]);
  }
  /* smooth until the section's size is known; then the route carries the
     ridge's rock (drawn into the section's edge through two custom
     properties: the cut and the line), and the dots ride the same points */
  let trailSamples = grainRoute(trailSegments, 1, 1, [], 0, 0);
  let trailRockKey = "";
  const drawRouteRock = (width, depth) => {
    const sx = width / 1200;
    const sy = depth / 160;
    const key = `${Math.round(sx * 50)}:${Math.round(sy * 50)}`;
    if (!width || !depth || key === trailRockKey) return;
    trailRockKey = key;
    trailSamples = grainRoute(trailSegments, sx, sy, [], 1300);
    const d = routeD(trailSamples);
    const svg = (body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 160' preserveAspectRatio='none'>${body}</svg>`)}")`;
    section.style.setProperty("--audience-edge-top", svg(`<path d='${d} L1200 160 L0 160 Z' fill='#fff'/>`));
    section.style.setProperty("--audience-edge-top-line", svg(`<path d='${d}' stroke='#FFA86E' stroke-opacity='.95' stroke-width='1.1' fill='none' stroke-linecap='round' stroke-linejoin='round' vector-effect='non-scaling-stroke'/>`));
  };

  function cssClamp(min, preferred, max) {
    return Math.min(Math.max(preferred, min), max);
  }

  function readPx(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function trailYAt(x) {
    const clampedX = clamp(x, 0, 1200);
    for (let i = 1; i < trailSamples.length; i++) {
      const [prevX, prevY] = trailSamples[i - 1];
      const [nextX, nextY] = trailSamples[i];
      if (clampedX <= nextX) {
        const t = (clampedX - prevX) / Math.max(0.001, nextX - prevX);
        return prevY + (nextY - prevY) * t;
      }
    }
    return trailSamples[trailSamples.length - 1][1];
  }

  let cachedPseudo = null;
  let cachedPseudoWidth = -1;
  function getPseudoMetrics() {
    const vw = window.innerWidth;
    if (cachedPseudo && cachedPseudoWidth === vw) return cachedPseudo;
    const pseudo = getComputedStyle(section, "::after");
    cachedPseudo = {
      cutOffset: readPx(pseudo.top, cssClamp(-180, vw * -0.1, -118)),
      cutDepth: readPx(pseudo.height, cssClamp(130, vw * 0.11, 190)),
    };
    cachedPseudoWidth = vw;
    return cachedPseudo;
  }

  /* below 1024px the connectors are short leaders between stacked cards,
     drawn by the stylesheet alone; there is no edge for them to reach */
  function update() {
    const sectionRect = section.getBoundingClientRect();
    if (!sectionRect.width) return;

    const { cutOffset, cutDepth } = getPseudoMetrics();
    drawRouteRock(sectionRect.width, cutDepth);
    if (compactQuery.matches) return;

    // Phase 1: read all connector rects
    const reads = connectors.map((connector) => connector.getBoundingClientRect());
    // Phase 2: compute + write
    connectors.forEach((connector, i) => {
      const rect = reads[i];
      const centerX = rect.left + rect.width / 2 - sectionRect.left;
      const pathX = (centerX / sectionRect.width) * 1200;
      const pathY = trailYAt(pathX);
      const lineY = sectionRect.top + cutOffset + cutDepth * (pathY / 160);
      setCssVar(connector, "--connector-top", `${(lineY - rect.top).toFixed(1)}px`);
    });
  }

  let raf = 0;
  scheduleAudienceConnectors = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };

  scheduleAudienceConnectors();
  window.addEventListener("resize", () => {
    cachedPseudoWidth = -1; // invalidate pseudo cache on viewport change
    scheduleAudienceConnectors();
  }, { passive: true });
  window.addEventListener("load", scheduleAudienceConnectors, { once: true });
  if (document.fonts) document.fonts.ready.then(scheduleAudienceConnectors);
}

function setupMarqueePause() {
  const btn = document.querySelector("[data-marquee-pause]");
  const row = document.querySelector(".clients__viewport");
  if (!btn || !row) return;
  btn.addEventListener("click", () => {
    const paused = row.classList.toggle("is-paused");
    btn.setAttribute("aria-pressed", String(paused));
  });
}

function setupMemberReadmore() {
  const buttons = document.querySelectorAll("[data-readmore]");
  buttons.forEach((btn) => {
    const card = btn.closest(".member");
    if (!card) return;
    const label = btn.querySelector("span");
    btn.addEventListener("click", () => {
      const isExpanded = card.classList.toggle("is-expanded");
      btn.setAttribute("aria-expanded", String(isExpanded));
      if (label) label.textContent = isExpanded ? "Read less" : "Read more";
      /* the paragraphs open above the button and push it down - keep it,
         and its new label, on screen */
      requestAnimationFrame(() => btn.scrollIntoView({ block: "nearest" }));
    });
  });
}

/* Team portrait frames are a proposal for the client, so the page keeps the
   neutral silhouettes unless a frame is asked for: ?portraits=a (terracotta
   sky) or ?portraits=b (latte sky) - #portraits-a / #portraits-b where a
   preview host drops the query - or data-portraits on <html> for a preview
   build. Members with a processed photo swap it in; the rest keep the
   silhouette inside the same frame. */
function setupPortraitProposal() {
  /* our-team.html ships the client's reference style (data-portraits="tone"
     on <html>): colour-toned head-and-shoulders portraits, the tone and the
     backdrop baked into the photographs. For comparison, ?portraits=a and
     ?portraits=b stand the cut-out photographs in the earlier sky windows and
     ?portraits=pop shows the head-above-the-card proposal. */
  const root = document.documentElement;
  const hashed = window.location.hash.match(/^#portraits-(a|b|pop|tone)$/);
  const asked = new URLSearchParams(window.location.search).get("portraits") || (hashed && hashed[1]);
  if (!root.dataset.portraits || !["a", "b", "pop", "tone"].includes(asked) || asked === root.dataset.portraits) return;
  root.dataset.portraits = asked;
  if (asked === "tone") return;
  document.querySelectorAll(".member__portrait").forEach((img) => {
    const stem = img.getAttribute("src").replace(/-tone\.webp$/, "");
    if (asked === "pop") {
      img.srcset = `${stem}-r3-400.webp 400w, ${stem}-r3.webp 600w`;
      img.width = 600;
      img.height = 700;
      img.src = `${stem}-r3.webp`;
    } else {
      img.srcset = `${stem}-640.webp 640w, ${stem}-1024.webp 1024w, ${stem}.webp 1200w`;
      img.src = `${stem}.webp`;
    }
  });
}

/* Alternatives for the client to look at, off by default (client, 6.10):
   ?who=ivory|grey|latte shows Home's Who we are on a light ground, and
   ?titles=smaller the titles a size smaller, each as a data attribute on
   <html> the stylesheet answers. #who-latte, #titles-smaller and the like
   do the same where a preview host drops the query. Without one the page
   is as it ships. (The titles in capitals and the ridges drawn straight
   were looked at and set aside, 7.10.) ?preview (or either of them)
   brings up a panel that switches them in place; while it is up, the
   links to the site's pages carry the choice and the panel, so the whole
   site can be walked in an alternative. */
const PREVIEW_SWITCHES = {
  who: ["ivory", "grey", "latte"],
  titles: ["smaller"],
};

/* the panel's words, in Polish as the client reviews in it: each switch's
   name, then its choices, the shipped one first */
const PREVIEW_PANEL = [
  ["who", "Who We Are (Home)", [["", "ciemne"], ["ivory", "złamana biel"], ["grey", "szarość"], ["latte", "latte"]]],
  ["titles", "Tytuły", [["", "obecne"], ["smaller", "mniejsze"]]],
];

function setupPreviewSwitches() {
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.slice(1);
  Object.entries(PREVIEW_SWITCHES).forEach(([name, values]) => {
    const fromHash = values.find((v) => hash === `${name}-${v}`);
    const asked = params.get(name) || fromHash;
    if (values.includes(asked)) root.dataset[name] = asked;
  });
  const chosen = () => Object.keys(PREVIEW_SWITCHES).filter((name) => root.dataset[name]);
  if (!params.has("preview") && hash !== "preview" && !chosen().length) return;

  const withChoice = (url) => {
    Object.keys(PREVIEW_SWITCHES).forEach((name) => url.searchParams.delete(name));
    chosen().forEach((name) => url.searchParams.set(name, root.dataset[name]));
    url.searchParams.set("preview", "1");
    return url;
  };
  const carry = () => {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.dataset.previewHref || link.getAttribute("href");
      if (href.startsWith("#")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      link.dataset.previewHref = href;
      link.href = withChoice(url).href;
    });
  };
  carry();

  const panel = document.createElement("aside");
  panel.className = "variant-panel";
  panel.setAttribute("aria-label", "Warianty do porównania");
  panel.lang = "pl";
  panel.innerHTML =
    '<button type="button" class="variant-panel__toggle" aria-expanded="true" aria-controls="variant-panel-body">' +
    'Warianty do porównania<span class="variant-panel__sign" aria-hidden="true">–</span></button>' +
    '<div class="variant-panel__body" id="variant-panel-body">' +
    PREVIEW_PANEL.map(([name, label, choices]) =>
      `<div class="variant-panel__group" role="group" aria-labelledby="variant-panel-${name}">` +
      `<p class="variant-panel__label" id="variant-panel-${name}">${label}</p>` +
      choices.map(([value, text]) =>
        `<button type="button" class="variant-panel__choice" data-name="${name}" data-value="${value}" aria-pressed="false">${text}</button>`
      ).join("") +
      "</div>"
    ).join("") +
    '<p class="variant-panel__note">Wybór przechodzi na kolejne podstrony.</p>' +
    "</div>";
  const choices = panel.querySelectorAll(".variant-panel__choice");
  const mark = () => choices.forEach((button) => {
    button.setAttribute("aria-pressed", String((root.dataset[button.dataset.name] || "") === button.dataset.value));
  });
  panel.addEventListener("click", (event) => {
    const button = event.target.closest(".variant-panel__choice");
    if (!button) return;
    if (button.dataset.value) root.dataset[button.dataset.name] = button.dataset.value;
    else delete root.dataset[button.dataset.name];
    mark();
    carry();
    history.replaceState(history.state, "", withChoice(new URL(window.location.href)).href);
    /* the titles change size and Who we are its edge: what the page
       measured, it measures again */
    window.dispatchEvent(new Event("resize"));
  });

  /* it folds down to its title, as the copy review's legend does; folded
     to begin with on a phone, and as the reader left it from page to page */
  const toggle = panel.querySelector(".variant-panel__toggle");
  const fold = (folded) => {
    panel.classList.toggle("is-collapsed", folded);
    toggle.setAttribute("aria-expanded", String(!folded));
    toggle.querySelector(".variant-panel__sign").textContent = folded ? "+" : "–";
  };
  toggle.addEventListener("click", () => {
    const folded = !panel.classList.contains("is-collapsed");
    fold(folded);
    try {
      sessionStorage.setItem("most-variant-panel", folded ? "folded" : "open");
    } catch {}
  });
  let left = null;
  try {
    left = sessionStorage.getItem("most-variant-panel");
  } catch {}
  fold(left ? left === "folded" : !window.matchMedia("(min-width: 1024px)").matches);
  mark();
  document.body.appendChild(panel);
}

/* Copy review for the client: ?copy=draft outlines every text that is not
   the client's own wording, by where it comes from (data-copy on the
   element): "ours" - written by us and never seen by the client as text;
   "wireframe" - ours, already shown in the wireframe; "g1-edited" - the
   client's text, shortened or reworded by us. Untagged text is the client's
   (G1) or Figma's, 1:1. Off by default; the page is unchanged without it.
   #copy-draft does the same where a preview host drops the query. */
function setupCopyReview() {
  const asked = new URLSearchParams(window.location.search).get("copy") === "draft"
    || window.location.hash === "#copy-draft";
  if (!asked) return;
  document.documentElement.dataset.copyReview = "on";
  const run = () => markCopyReview(window.MOST_COPY_REVIEW || {});
  if (window.MOST_COPY_REVIEW) return run();
  const tag = document.createElement("script");
  tag.src = "copy-review.js";
  tag.onload = run;
  document.head.appendChild(tag);
}

function normaliseCopy(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/* Finds each listed text on the page - the deepest element whose text is
   exactly it, or failing that begins with it - and outlines it by source. */
function markCopyReview(data) {
  const page = window.location.pathname.split("/").pop() || "index.html";
  const entries = data[page] || [];
  const nodes = Array.from(document.querySelectorAll("main *, footer *, header.top-nav *"))
    .filter((el) => !el.closest("svg, script, style") && el.children.length < 12);
  const texts = new Map(nodes.map((el) => [el, normaliseCopy(el.textContent || "")]));
  const counts = { ours: 0, wireframe: 0, "g1-edited": 0 };
  const squash = (t) => t.replace(/ /g, "");
  const find = (want) => {
    let hits = nodes.filter((el) => texts.get(el) === want);
    if (!hits.length) hits = nodes.filter((el) => squash(texts.get(el)) === squash(want));
    if (!hits.length && want.length >= 30) hits = nodes.filter((el) => texts.get(el).startsWith(want));
    if (!hits.length && want.length >= 30) hits = nodes.filter((el) => texts.get(el).includes(want));
    return hits.filter((el) => !hits.some((other) => other !== el && el.contains(other)));
  };
  entries.forEach((entry) => {
    /* an entry like "Formation / Funding / Growth" lists separate elements */
    const parts = entry.t.includes(" / ") ? entry.t.split(" / ") : [entry.t];
    let found = 0;
    parts.forEach((part) => {
      const want = normaliseCopy(part);
      if (!want) return;
      find(want).forEach((el) => {
        el.dataset.copy = entry.c;
        el.title = [entry.s && `Źródło: ${entry.s}`, entry.a && `Pytanie: ${entry.a}`].filter(Boolean).join("\n");
        found += 1;
      });
    });
    if (found && entry.c in counts) counts[entry.c] += 1;
  });
  const legend = document.createElement("aside");
  legend.className = "copy-legend";
  legend.setAttribute("aria-label", "Copy review legend");
  legend.lang = "pl";
  /* the legend folds down to its title, so it never has to sit on the
     texts it is explaining */
  legend.innerHTML =
    '<button type="button" class="copy-legend__toggle" aria-expanded="true" aria-controls="copy-legend-body">' +
    'Teksty robocze na tej stronie<span class="copy-legend__sign" aria-hidden="true">–</span></button>' +
    '<div class="copy-legend__body" id="copy-legend-body">' +
    `<p><span class="copy-legend__swatch copy-legend__swatch--ours"></span>nasze, nowe (${counts.ours})</p>` +
    `<p><span class="copy-legend__swatch copy-legend__swatch--wireframe"></span>nasze, z wireframe'u (${counts.wireframe})</p>` +
    `<p><span class="copy-legend__swatch copy-legend__swatch--g1-edited"></span>tekst klienta skrócony przez nas (${counts["g1-edited"]})</p>` +
    '<p class="copy-legend__note">Bez ramki: tekst klienta (dokument) lub z Figmy, 1:1. Najedź na ramkę, żeby zobaczyć źródło.</p>' +
    "</div>";
  const toggle = legend.querySelector(".copy-legend__toggle");
  toggle.addEventListener("click", () => {
    const folded = legend.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", String(!folded));
    toggle.querySelector(".copy-legend__sign").textContent = folded ? "+" : "–";
  });
  document.body.appendChild(legend);

  /* and it takes whichever corner covers the fewest lines of text on the
     first screen - the heroes put their copy on different sides. Chosen
     again once the webfonts have set the lines. */
  const placeLegend = () => {
    const lines = [];
    document.querySelectorAll("main h1, main h2, main h3, main p, main li, main a, main button").forEach((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      Array.from(range.getClientRects()).forEach((r) => {
        if (r.width && r.height && r.top < window.innerHeight) lines.push(r);
      });
    });
    const covered = () => {
      const box = legend.getBoundingClientRect();
      return lines.filter((r) => r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom).length;
    };
    let best = "";
    let least = Infinity;
    /* bottom right is the variant panel's when it is up */
    const corners = document.querySelector(".variant-panel") ? ["", "copy-legend--bl"] : ["", "copy-legend--bl", "copy-legend--br"];
    corners.forEach((corner) => {
      legend.classList.remove("copy-legend--bl", "copy-legend--br");
      if (corner) legend.classList.add(corner);
      const n = covered();
      if (n < least) {
        least = n;
        best = corner;
      }
    });
    legend.classList.remove("copy-legend--bl", "copy-legend--br");
    if (best) legend.classList.add(best);
  };
  placeLegend();
  if (document.fonts) document.fonts.ready.then(placeLegend);
}

function setupParallax() {
  const images = Array.from(document.querySelectorAll(".photo-break img, .aud-bleed img, .aud-work__photo img"));
  if (!images.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  /* Below 1024px the photos do not drift: each one sits centred in its band,
     where the stylesheet puts it, and the scroll handler does not call in.
     Growing past 1024px places them again from the scroll position. */
  let resting = false;

  function tick() {
    if (compactQuery.matches) {
      if (!resting) images.forEach((img) => (img.style.transform = ""));
      resting = true;
      return;
    }
    resting = false;
    const vh = window.innerHeight;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      // the band itself (or How We Work's backdrop on the audience pages):
      // a phone crop wraps some photos in a <picture>
      const parent = img.closest(".photo-break, .aud-bleed, .aud-work__photo") || img.parentElement;
      if (!parent) continue;

      const rect = parent.getBoundingClientRect();
      // Skip if far outside viewport to avoid unnecessary work
      if (rect.bottom < -200 || rect.top > vh + 200) continue;

      // progress 0 = entering from bottom, 0.5 = centered, 1 = exiting top
      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));

      // Translate ±8% relative to image height
      const translateY = (0.5 - clamped) * 16;
      img.style.transform = `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}%), 0)`;
    }
  }

  window.updateParallax = tick;
  tick(); // Apply immediately on load
  onCompactChange(tick);
}

setupParallax();
updateScroll();
setupSectionReveal();
setupMobileMenu();
setupPlaceholderLinks();
setupHeroTrail();
setupAudienceTriptych();
setupAudienceConnectors();
setupMemberReadmore();
setupMarqueePause();
setupPreviewSwitches();
setupPortraitProposal();
setupCopyReview();

window.addEventListener("load", () => scheduleTrailOverlay(true));

/* Expertise "Our Areas": eight areas as tabs, one open at a time.

   The markup is a list of in-page links and the eight areas in order, each
   under its own drawing, so without script every area is there to read.
   This turns it into ARIA tabs: the links become the tabs (roles,
   aria-selected, a roving tabindex) and the areas their panels, and only the
   chosen one shows. The marker on the rail follows the open area. A link to
   #area-panel-N (or #area-tab-N) opens that area.

   Every drawing is one unbroken line, so a change of area is a thread: the
   open drawing winds back up along its line while the next one unwinds
   beside it, a moment behind. The first one draws itself as the section
   arrives. With reduced motion the drawings simply swap.

   On a desktop window tall enough to hold the rail and the longest area,
   and without reduced motion, the areas also follow the scroll: the rail
   and the open area pin under the bar (sticky, .is-track in the
   stylesheet) while a short track walks them from the first to the eighth,
   and the page then runs straight on into How We Work. A click, an arrow
   key or a link glides to that area's place on the track, so the tabs and
   the scroll never disagree. Everywhere else - under 1024px, where the tabs
   run across a strip, on short windows and with reduced motion - a click or
   a key only swaps the panel and nothing follows the scroll. */
(() => {
  const section = document.querySelector(".ex-areas");
  const nav = section ? section.querySelector(".ex-areas__nav") : null;
  const list = nav ? nav.querySelector(".ex-areas__tabs") : null;
  const tabs = list ? Array.from(list.querySelectorAll(".ex-areas__tab")) : [];
  const panels = section ? Array.from(section.querySelectorAll(".ex-areas__panel")) : [];
  const body = section ? section.querySelector(".ex-areas__body") : null;
  const head = section ? section.querySelector(".ex-areas__head") : null;
  if (!list || !body || !head || !tabs.length || tabs.length !== panels.length) return;

  const dot = nav.querySelector(".ex-areas__dot");
  /* Under 1024px the strip's line is a ridge (styles.css --ex-strip-ridge:
     a 1076 x 30 profile stretched over the tab list, in a 30px band). These
     are its heights in px, one every 2 units, so the marker can stand on it
     over any tab. */
  const STRIP_RIDGE = "12.1,12.4,12.8,13.2,13.3,13.4,13.5,13.6,13.7,13.7,13.7,13.7,13.7,14,14.2,14.4,14.1,13.6,13.1,12.6,12.2,11.8,11.4,11,10.9,11.1,11.3,11.4,11.5,11.5,11.2,10.4,10,10.9,10.9,10.5,10.3,10.8,11,10.6,10.4,11.1,11.8,12.5,13.2,13.5,15.4,16,16,16.1,16.1,16.2,16.2,16.2,16.2,16.2,16.2,16.2,16.2,16.2,16,15.7,15.3,15,14.6,14.8,15,18,17.8,17.5,17.1,18.6,19.1,19.1,19.5,19.8,20.2,20.6,21.5,21.7,22.5,24.3,25,25.6,26.3,27,26.9,26.7,26.6,26.5,26.4,25.9,25.2,25.1,25.1,25,24.9,24.5,23.8,23.1,21.5,21.6,22.3,22.4,22.4,22.4,21.9,21.5,19.7,19.4,19.9,19.8,18.7,15.9,13.7,11.9,11.7,12.2,11.2,10.8,11.2,11,10.9,11,11,10.9,10.7,10.8,11.4,12.1,13.3,14.6,15.4,16.2,17.5,18.6,19,20.8,20.9,19,17.8,17.4,16.9,17.7,18.5,19.6,19.2,18.6,16.2,16.2,14.8,14,13.9,12.3,12.5,13.3,13.1,12.7,12.8,13.5,13.9,14.2,15,15.4,14.2,14.1,14.7,15.3,15.6,15.5,15.4,15.3,15.4,15.8,16.3,16.8,16.3,16,16.2,16.2,14.9,14.4,14.2,12.7,12.2,11.6,11.1,10.8,10.7,10.3,9.2,9.3,9.8,9.9,9.6,9.6,9.8,9.1,7.6,6.7,5.5,5.8,6.2,6.4,8,8.5,9,9.4,9.8,10.2,10.4,10.6,12.2,12.6,13,13.4,13.8,14.1,14.5,14.9,15.2,16,16.8,17.6,19.7,19.8,19.8,19.9,19.9,20,20.2,20.3,20.8,21.2,21.7,21.9,21.8,20.8,19.9,19.1,18.4,18,17.1,16.5,16.4,16.4,17.1,18.1,19.1,19.9,20.7,21.4,21.6,21.3,21.4,21.6,21.4,21.5,21.6,21.9,22.6,23.2,23.3,23.5,23.6,23.3,23.2,23.8,23.3,22.7,22.9,23.1,23.4,23.4,22.6,22.2,23.1,23.4,23.4,23.7,22.6,16.8,15.8,15.8,15.1,14.4,14.5,14.7,14.8,15.2,16.1,17.5,18.8,20.1,19.8,19.4,19.1,18.8,18.6,18.3,17.9,17,17.4,17.8,18.3,18.7,19,19.3,19.3,18,17.5,17.1,16.5,15.9,15.5,15.1,14.8,14.4,13.9,13.3,12.7,11.9,10.3,10.1,10.1,10,10.2,10.5,10.7,11.2,11.7,11.9,12.2,13.3,13.7,14.1,14.4,14,12.7,11.3,10.9,10.6,11.6,11.6,11.2,11.1,11.1,9.6,10,10.4,10.7,10.6,9.6,9.8,10.6,11.4,10.4,10.4,11.2,10.9,10.1,9.3,9.6,10.6,10.9,11.3,12.2,12.1,12.9,13.4,13.7,13.7,13.7,13.7,12.2,12.3,11.2,11.5,11.8,11.6,11.3,10.9,10.6,11.8,13.1,12.8,12.5,12.1,11.8,11.2,10.4,7.7,5.6,3.9,3.9,3.9,3.8,4,4.3,4.5,4.7,5.5,6.4,6.9,5.9,4.8,4.2,4.1,3.7,3,3,3.3,3.7,4,4.5,4.9,5.4,7.1,8,8.5,10.3,10.4,10.3,10.1,10,9.5,8.6,7.9,8.8,8.7,8.6,8.4,8.3,8.4,8.5,8.7,8.8,9,10.2,11.2,11.2,10.6,9.8,8.6,7.5,6.3,7.5,6.7,6.5,9.1,10,10.6,11.9,13,13,13.4,15.6,16.2,16.1,17,18.2,17.8,16.5,15.3,14.2,13.4,13.1,14.1,14.6,14.5,15.4,16.4,17.6,19.1,21.1,22.5,23.6,24,24.2,24.3,24.5,24.7,24.5,23.3,22.2,21.5,21.1,19.5,18,17.8,16.8,15,14.4,14.4,15.4,16.3,17.3,17.6,17.4,17.4,18,17.9,17.7,17.5,16.9,15.8,15.5,13.9,15.1,16.3,17.5,14.9,14.4,15,15.6,16.1,16.7,16.6,16.1,15.4,14.8,14.1,13.6,14.6,13.4,13.4,13.3,12.5,11.1,10.2,10.3,10.2,10,10.9,12,12.5,12.2,12.3,12.4".split(",").map(Number);
  const ridgeAt = (f) => {
    const x = clamp(f, 0, 1) * (STRIP_RIDGE.length - 1);
    const i = Math.min(Math.floor(x), STRIP_RIDGE.length - 2);
    return STRIP_RIDGE[i] + (STRIP_RIDGE[i + 1] - STRIP_RIDGE[i]) * (x - i);
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* the track wants a desktop window with some height and motion; whether
     the stage really fits under the bar is measured (layout) */
  const trackQuery = window.matchMedia("(min-width: 1024px) and (min-height: 691px) and (prefers-reduced-motion: no-preference)");
  const last = tabs.length - 1;
  let index = -1;

  /* ---------- the widget ---------- */
  const titleId = section.getAttribute("aria-labelledby");
  list.setAttribute("role", "tablist");
  if (titleId) list.setAttribute("aria-labelledby", titleId);
  tabs.forEach((tab, i) => {
    const panel = panels[i];
    tab.parentElement.setAttribute("role", "presentation");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
  });

  const orient = () => list.setAttribute("aria-orientation", compactQuery.matches ? "horizontal" : "vertical");

  /* The marker sits on the rail beside the open tab: level with its middle
     on the vertical rail, over its middle on the strip. Every tab's spot is
     measured from layout at once (fonts, wrapping and resizes just change
     the answer), so a change of area only writes. */
  let spots = [];
  const measureSpots = () => {
    const box = nav.getBoundingClientRect();
    const strip = list.getBoundingClientRect();
    const across = compactQuery.matches;
    spots = tabs.map((tab) => {
      const r = tab.getBoundingClientRect();
      if (!across) return { y: Math.round(r.top - box.top + nav.scrollTop + r.height / 2) };
      const mid = r.left + r.width / 2;
      /* on the strip, the ridge's height over the tab's middle */
      return { x: Math.round(mid - box.left + nav.scrollLeft), ride: ridgeAt(strip.width ? (mid - strip.left) / strip.width : 0) };
    });
  };

  const place = (instant) => {
    const spot = spots[index];
    if (!dot || !spot) return;
    if (instant) dot.style.transition = "none";
    if ("x" in spot) {
      setCssVar(dot, "--dot-x", `${spot.x}px`);
      setCssVar(dot, "--dot-ride", `${spot.ride.toFixed(1)}px`);
    } else {
      setCssVar(dot, "--dot-y", `${spot.y}px`);
    }
    if (instant) {
      void dot.offsetWidth;
      dot.style.transition = "";
    }
  };

  /* On the strip the open tab is kept in view without moving the page:
     only the strip scrolls. */
  const bringIntoStrip = (tab) => {
    if (!compactQuery.matches) return;
    const box = nav.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    const pad = 24;
    let dx = 0;
    if (r.left < box.left + pad) dx = r.left - box.left - pad;
    else if (r.right > box.right - pad) dx = r.right - box.right + pad;
    if (dx) nav.scrollBy({ left: dx, behavior: reduceMotion.matches ? "auto" : "smooth" });
  };

  /* ---------- the drawings: one thread each ----------
     A line is wound by its dash offset (its length: nothing shows) and
     unwound to 0. Script measures each line into --len (the dash), and only
     a line that is drawn or on the move is shown (.is-live). A change starts
     every line from wherever it stands, so a quick run of changes turns the
     lines back smoothly and never leaves one half drawn. */
  const WIND_MS = 700;
  const UNWIND_MS = 1250;
  const LAG_MS = 180;
  const FIRST_MS = 1600;
  const WIND_EASE = "cubic-bezier(0.45, 0.05, 0.6, 1)";
  const UNWIND_EASE = "cubic-bezier(0.3, 0.06, 0.38, 0.94)";
  let seen = false;

  const threads = panels.map((panel) => {
    const art = panel.previousElementSibling;
    const path = art && art.classList.contains("ex-areas__art") ? art.querySelector("path") : null;
    if (!path) return null;
    let len = 0;
    try {
      len = Math.ceil(path.getTotalLength());
    } catch {}
    if (len) setCssVar(art, "--len", String(len));
    path.style.strokeDashoffset = `${len}px`;
    return { art, path, len, at: len, anim: null };
  });

  const offsetOf = (t) => {
    if (!t.anim) return t.at;
    const v = parseFloat(getComputedStyle(t.path).strokeDashoffset);
    return Number.isFinite(v) ? v : t.at;
  };

  const wind = (t, drawn, ms = 0, delay = 0, ease = UNWIND_EASE) => {
    if (!t) return;
    const to = drawn ? 0 : t.len;
    const from = offsetOf(t);
    if (t.anim) {
      t.anim.cancel();
      t.anim = null;
    }
    t.at = to;
    t.path.style.strokeDashoffset = `${to}px`;
    const move = ms > 0 && t.len > 0 && typeof t.path.animate === "function" && Math.abs(from - to) >= 1;
    t.art.classList.toggle("is-live", drawn || move);
    if (!move) return;
    const anim = t.path.animate([{ strokeDashoffset: `${from}px` }, { strokeDashoffset: `${to}px` }], {
      duration: ms * Math.max(0.3, Math.abs(to - from) / t.len),
      delay,
      easing: ease,
      fill: "backwards",
    });
    t.anim = anim;
    anim.onfinish = () => {
      if (t.anim !== anim) return;
      t.anim = null;
      if (!drawn) t.art.classList.remove("is-live");
    };
  };

  /* The open line winds up while the next unwinds beside it, a moment
     behind. A line still winding from an earlier change is put away at
     once, so a quick run of changes never shows more than the two. */
  const swap = (from, to, instant) => {
    const still = instant || reduceMotion.matches;
    threads.forEach((t, n) => {
      if (t && n !== from && n !== to && (t.anim || t.at === 0)) wind(t, false);
    });
    const out = from >= 0 && from !== to ? threads[from] : null;
    if (out) wind(out, false, still ? 0 : WIND_MS, 0, WIND_EASE);
    const next = threads[to];
    if (!seen) wind(next, false);
    else wind(next, true, still ? 0 : UNWIND_MS, out && out.anim ? LAG_MS : 0, UNWIND_EASE);
  };

  /* ---------- the track ----------
     s is how far the page has scrolled past the point where the stage pins.
     The first area holds for EDGE of a step once pinned, each of the six in
     between for a step, and the eighth for EDGE of a step before the stage
     lets go; a step is STEP of the window's height. */
  const STEP = 0.2;
  const EDGE = 0.25;
  let track = false;
  const geo = { offset: 0, step: 1, edge: 0, length: 0, slack: [] };

  const travelled = () => -section.getBoundingClientRect().top - geo.offset;
  const areaAt = (s) => clamp(Math.floor((s - geo.edge) / geo.step) + 1, 0, last);
  const spotOf = (i) => (i <= 0 ? 0 : i >= last ? geo.length : geo.edge + (i - 0.5) * geo.step);

  /* The spacer after the stage is the track plus the difference between
     the open area and the tallest, so the section keeps one height. */
  const setSpacer = () => {
    if (track) setCssVar(section, "--ex-track", `${(geo.length + (geo.slack[index] || 0)).toFixed(2)}px`);
    else clearCssVar(section, "--ex-track");
  };

  const select = (i, { instant = false } = {}) => {
    if (i === index) return;
    const from = index;
    index = i;
    tabs.forEach((tab, n) => {
      const on = n === i;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
    });
    setSpacer();
    swap(from, i, instant || from < 0);
    place(instant);
  };

  /* Reads, then writes: the track's rules go on, the stage is measured with
     every area laid out, and if the tallest does not fit between the pin
     line and the foot of the window the section stays plain tabs. Where
     there is room to spare the stage pins in the middle of the space under
     the bar rather than tight under it. */
  const bar = document.querySelector(".top-nav");
  const layout = () => {
    track = false;
    clearCssVar(section, "--ex-pin");
    section.classList.toggle("is-track", trackQuery.matches);
    if (trackQuery.matches) {
      /* the layout viewport: on a tablet on its side it holds still while
         the browser's bars slide away, where innerHeight does not */
      const vh = document.documentElement.clientHeight || window.innerHeight;
      const floor = parseFloat(getComputedStyle(body).top) || 0;
      const rail = nav.getBoundingClientRect().height;
      /* the panels stand under the drawings' row (read off a drawing: the
         open panel may be mid fade-in, moved by its transform) */
      const art = threads[index] ? threads[index].art : null;
      const row = art ? art.getBoundingClientRect().height + (parseFloat(getComputedStyle(art).marginBottom) || 0) : panels[index].offsetTop;
      const heights = panels.map((panel) => Math.max(rail, row + panel.getBoundingClientRect().height));
      const tallest = Math.max(...heights);
      if (floor + tallest + 8 <= vh) {
        const under = bar ? bar.getBoundingClientRect().bottom : 0;
        const pin = Math.round(Math.max(floor, under + (vh - under - tallest) / 2));
        setCssVar(section, "--ex-pin", `${pin}px`);
        track = true;
        geo.step = clamp(Math.round(vh * STEP), 160, 300);
        geo.edge = Math.round(geo.step * EDGE);
        geo.length = 2 * geo.edge + (last - 1) * geo.step;
        geo.slack = heights.map((h) => tallest - h);
        geo.offset = head.offsetTop + head.offsetHeight + (parseFloat(getComputedStyle(head).marginBottom) || 0) - pin;
      } else {
        section.classList.remove("is-track");
      }
    }
    setSpacer();
    measureSpots();
    place(true);
  };

  /* A click, a key or a link glides to the area's place on the track; the
     area is chosen at once and held while the page travels, so the ones in
     between do not flash past. The hold ends when the page arrives, when
     the scroll stops short, or as soon as the reader scrolls themselves. */
  let hold = -1;
  let holdTimer = 0;
  let frame = 0;

  const sync = () => {
    frame = 0;
    if (!track) return;
    const s = travelled();
    if (hold >= 0) {
      if (Math.abs(s - spotOf(hold)) > 2) return;
      hold = -1;
      clearTimeout(holdTimer);
    }
    select(areaAt(s));
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sync);
  };

  const letGo = () => {
    if (hold < 0) return;
    hold = -1;
    clearTimeout(holdTimer);
    schedule();
  };

  const goTo = (i, { instant = false, force = false } = {}) => {
    if (!track) {
      select(i);
      return;
    }
    const s = travelled();
    select(i);
    if (!force && areaAt(s) === i) return;
    hold = i;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(letGo, 400);
    window.scrollTo({ top: Math.round(window.scrollY + spotOf(i) - s), behavior: instant || reduceMotion.matches ? "instant" : "smooth" });
  };

  window.addEventListener(
    "scroll",
    () => {
      if (hold >= 0) {
        clearTimeout(holdTimer);
        holdTimer = setTimeout(letGo, 240);
      }
      schedule();
    },
    { passive: true }
  );

  /* the reader's own scrolling ends a glide (and a deep link's landing) */
  const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
  let landing = -1;
  const own = (e) => {
    if (e.type === "keydown" && (e.defaultPrevented || !SCROLL_KEYS.has(e.key))) return;
    landing = -1;
    letGo();
  };
  window.addEventListener("wheel", own, { passive: true });
  window.addEventListener("touchstart", own, { passive: true });
  window.addEventListener("keydown", own);

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", (e) => {
      /* a modified click still opens the link as a link would */
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      goTo(i);
      bringIntoStrip(tab);
    });
    tab.addEventListener("keydown", (e) => {
      let next;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          next = (i + 1) % tabs.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          next = (i - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = last;
          break;
        case " ":
          /* a link does not answer Space; a tab does */
          e.preventDefault();
          goTo(i);
          return;
        default:
          return;
      }
      e.preventDefault();
      goTo(next);
      tabs[next].focus({ preventScroll: true });
      bringIntoStrip(tabs[next]);
    });
  });

  /* On the track, a tab or a panel reached with the keyboard is shown
     where the page stands: if focusing it scrolled the page to another
     area's place, the page is put back on its own. The scroll never moves
     focus; focus only moves the scroll. */
  section.addEventListener("focusin", (e) => {
    if (!track || hold >= 0) return;
    let i = tabs.indexOf(e.target);
    if (i < 0) i = panels.indexOf(e.target);
    if (i < 0) return;
    let keyboard = true;
    try {
      keyboard = e.target.matches(":focus-visible");
    } catch {}
    if (keyboard && areaAt(travelled()) !== i) goTo(i, { instant: true });
  });

  /* ---------- deep links ---------- */
  const fromHash = () => {
    let id = "";
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {}
    if (!id) return -1;
    return panels.findIndex((panel, n) => panel.id === id || tabs[n].id === id);
  };

  /* On the track the page lands on the area's place (the browser's own jump
     lands on the stage), again after fonts and images have settled, until
     the reader scrolls. */
  const land = () => {
    if (landing >= 0 && track) goTo(landing, { instant: true, force: true });
  };

  const start = fromHash();
  orient();
  select(start >= 0 ? start : 0, { instant: true });
  section.classList.add("is-tabs");
  layout();
  if (start >= 0) {
    landing = start;
    land();
    bringIntoStrip(tabs[start]);
  } else if (track) {
    select(areaAt(travelled()), { instant: true });
  }

  window.addEventListener("hashchange", () => {
    const n = fromHash();
    if (n < 0) return;
    goTo(n, { force: true });
    bringIntoStrip(tabs[n]);
  });

  /* ---------- the first drawing ---------- */
  const arrive = () => {
    if (seen) return;
    seen = true;
    wind(threads[index], true, reduceMotion.matches ? 0 : FIRST_MS, 0, UNWIND_EASE);
  };
  const firstArt = threads[index] ? threads[index].art : null;
  if (firstArt && "IntersectionObserver" in window && !reduceMotion.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        arrive();
      },
      { threshold: 0.6 }
    );
    io.observe(firstArt);
  } else {
    arrive();
  }

  /* The trail over the seam draws as the section arrives. The shared reveal
     waits for 18% of a section to show, which on the track (a section three
     screens tall) came long after the seam: it draws as the section's top
     comes in instead, as it did when the section was one screen. */
  if (section.classList.contains("has-trail") && "IntersectionObserver" in window) {
    const seam = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        seam.disconnect();
        section.classList.add("is-visible");
      },
      { rootMargin: "0px 0px -18% 0px" }
    );
    seam.observe(section);
  }

  /* ---------- layout changes ---------- */
  let relayoutFrame = 0;
  const relayout = () => {
    if (relayoutFrame) return;
    relayoutFrame = requestAnimationFrame(() => {
      relayoutFrame = 0;
      layout();
      if (!track) hold = -1;
      land();
      schedule();
    });
  };
  window.addEventListener("resize", relayout);
  const onTrackChange = () => relayout();
  if (trackQuery.addEventListener) trackQuery.addEventListener("change", onTrackChange);
  else if (trackQuery.addListener) trackQuery.addListener(onTrackChange);
  onCompactChange(() => {
    orient();
    relayout();
    bringIntoStrip(tabs[index]);
  });
  if (typeof ResizeObserver === "function") new ResizeObserver(relayout).observe(list);
  /* the fonts come in with a stylesheet that loads late, after fonts.ready
     may already have answered */
  if (document.fonts) {
    document.fonts.ready.then(relayout);
    if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", relayout);
  }
  window.addEventListener("load", () => {
    relayout();
    /* past the load the page is the reader's */
    setTimeout(() => {
      landing = -1;
    }, 600);
  });
})();

/* Scroll-in reveals, plus one-at-a-time icon drawing.

   Two separate triggers on purpose. Rows slide in as soon as they touch the
   viewport so nothing is ever blank, but an icon only starts drawing once its
   row reaches the middle band of the screen - the point where a reader is
   actually looking at it. Tying the drawing to the layout reveal instead made
   icons draw while their row was still a sliver at the bottom edge, so by the
   time you got there the stroke was already finished.

   Scroll snapping can also jump a whole section in a single frame, and an
   element that never intersects never fires an observer - so a scroll sweep
   backs the reveal up. */
(() => {
  const pending = new Set(document.querySelectorAll(".io-reveal"));
  /* A group (data-draw-group) draws as one: Our Expertise's row on Home,
     six drawings side by side, reaches the band all at once, and the
     queue below would have snapped five of them finished to draw the
     last. Its drawings follow each other a beat apart instead. */
  const groups = Array.from(document.querySelectorAll("[data-draw-group]"));
  const allIcons = Array.from(document.querySelectorAll(".ex-icon, .js-draw"));
  const icons = allIcons.filter((svg) => !svg.closest("[data-draw-group]"));
  if (!pending.size && !allIcons.length) return;

  /* ---------- icon drawing: one at a time, inside the reading band ---------- */
  const DRAW_MS = 2600;
  const DRAW_GAP = 140;
  const BAND_TOP = 0.26;
  const BAND_BOTTOM = 0.72;

  // A non-scaling stroke is dashed in screen pixels, not in the path's own
  // units, so its length has to be measured on screen - otherwise a path
  // drawn larger than its viewBox (the audience trail at 1920) stops short
  // of its end. Re-measured on resize for the same reason.
  const measure = (path) => {
    let len = 4000;
    try {
      len = path.getTotalLength();
      if (getComputedStyle(path).vectorEffect === "non-scaling-stroke") {
        const m = path.getScreenCTM();
        if (m) len *= Math.hypot(m.a, m.b);
      }
      len = Math.ceil(len);
    } catch {}
    path.style.setProperty("--len", len);
  };
  const measureAll = () =>
    allIcons.forEach((svg) => svg.querySelectorAll("path").forEach(measure));
  measureAll();
  let measureTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(measureTimer);
    measureTimer = window.setTimeout(measureAll, 160);
  });

  // One drawing at a time, and it is always the row you are looking at: a row
  // arriving in the band takes over and the previous stroke snaps to finished.
  // Queueing instead made every row wait out a 2.6s draw, so at reading speed
  // most icons were skipped entirely rather than drawn.
  let current = null;
  let timer = 0;

  // Dropping the class does not cancel a stroke already in flight, so the
  // outgoing icon is pinned finished inline - that is what actually stops it.
  const finish = (svg) => {
    svg.querySelectorAll("path").forEach((path) => {
      path.style.transition = "none";
      path.style.strokeDashoffset = "0";
    });
    svg.classList.remove("is-drawing");
    svg.classList.add("is-drawn");
  };

  const startDraw = (svg) => {
    if (current && current !== svg) finish(current);
    clearTimeout(timer);
    current = svg;
    svg.classList.add("is-drawing");
    timer = setTimeout(() => {
      current = null;
    }, DRAW_MS);
  };

  // the icons the band has not started yet
  const undrawn = new Set(icons);
  let drawIo = null;
  const claim = (svg) => {
    undrawn.delete(svg);
    if (drawIo) drawIo.unobserve(svg);
    teardown();
  };

  if (icons.length) {
    if ("IntersectionObserver" in window) {
      drawIo = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            claim(entry.target);
            startDraw(entry.target);
          }),
        { rootMargin: `-${BAND_TOP * 100}% 0px -${(1 - BAND_BOTTOM) * 100}% 0px` }
      );
      icons.forEach((svg) => drawIo.observe(svg));
    } else {
      icons.forEach((svg) => svg.classList.add("is-drawn"));
      undrawn.clear();
    }
  }

  const GROUP_BEAT = 180;
  const undrawnGroups = new Set(groups);
  let groupIo = null;
  const drawGroup = (group, done) => {
    undrawnGroups.delete(group);
    if (groupIo) groupIo.unobserve(group);
    group.querySelectorAll(".ex-icon, .js-draw").forEach((svg, i) => {
      if (done) {
        finish(svg);
        return;
      }
      svg.style.setProperty("--draw-delay", `${i * GROUP_BEAT}ms`);
      svg.classList.add("is-drawing");
    });
    teardown();
  };
  if (groups.length) {
    if ("IntersectionObserver" in window) {
      groupIo = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.isIntersecting && drawGroup(entry.target, false)),
        { rootMargin: `-${BAND_TOP * 100}% 0px -${(1 - BAND_BOTTOM) * 100}% 0px` }
      );
      groups.forEach((group) => groupIo.observe(group));
    } else {
      groups.forEach((group) => group.querySelectorAll(".ex-icon, .js-draw").forEach(finish));
      undrawnGroups.clear();
    }
  }

  /* A jump - the End key, an anchor, a fling, a restored scroll position -
     can carry an icon from below the band to above it between two frames,
     and the observer only sees where an icon is, never what it passed: it
     stayed blank until the reader scrolled back through the band. The
     scroll sweep settles those. One already above the screen is shown
     drawn, as one read and passed; one left on screen above the band draws
     now, since that is where the reader is looking. An icon in or below the
     band is still the observer's; one that is not laid out (a parked
     drawing) waits. */
  const sweepIcons = () => {
    const bandTop = window.innerHeight * BAND_TOP;
    undrawnGroups.forEach((group) => {
      const r = group.getBoundingClientRect();
      if ((!r.width && !r.height) || r.bottom >= bandTop) return;
      drawGroup(group, r.bottom <= 0);
    });
    undrawn.forEach((svg) => {
      const r = svg.getBoundingClientRect();
      if ((!r.width && !r.height) || r.bottom >= bandTop) return;
      claim(svg);
      if (r.bottom <= 0) finish(svg);
      else startDraw(svg);
    });
  };

  /* ---------- layout reveals ---------- */
  const reveal = (el) => {
    el.classList.add("is-in");
    pending.delete(el);
    if (io) io.unobserve(el);
    teardown();
  };

  let io = null;
  const sweep = () => {
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) reveal(el);
    });
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sweep();
      sweepIcons();
    });
  };

  // the sweep stays until every reveal has run and every icon is claimed
  function teardown() {
    if (pending.size || undrawn.size || undrawnGroups.size) return;
    io?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }

  if (pending.size && "IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    pending.forEach((el) => io.observe(el));
  }
  if (pending.size || undrawn.size || undrawnGroups.size) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    sweep();
    sweepIcons();
  }
})();

/* ------------------------------------------------------------------
   CONTACT FORM

   The client review asked, reasonably, how the form works. It used to
   show a "your message is on the way" note and send nothing at all.

   It now has one real delivery path and one honest fallback. Put the
   mail service's URL in the form's data-endpoint and the message is
   POSTed there as JSON; leave it empty and the form opens the visitor's
   mail client with the message prefilled, which at least reaches the
   firm. What it never does is claim a delivery that did not happen.
------------------------------------------------------------------- */
(function contactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = form.querySelector(".contact-form__status");
  const submit = form.querySelector('button[type="submit"]');
  const trap = form.querySelector('input[name="company"]');
  const mailto = (form.dataset.mailto || "").trim();
  const submitLabel = submit ? submit.textContent : "Submit";

  // read at submit time, so the endpoint can be injected after load
  const endpointNow = () => (form.dataset.endpoint || "").trim();

  function say(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle("is-error", kind === "error");
    status.focus();
  }

  function fields() {
    const data = new FormData(form);
    data.delete("company");
    data.delete("consent");
    return data;
  }

  function handOverToMailClient() {
    const data = fields();
    const body = [
      `Name: ${data.get("name") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Phone: ${data.get("phone") || ""}`,
      "",
      data.get("message") || "",
    ].join("\n");
    const href =
      `mailto:${mailto}` +
      `?subject=${encodeURIComponent("Enquiry from mostpartners.com")}` +
      `&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    say(
      "Your mail app should be opening with the message ready to send. " +
        `If nothing happens, write to ${mailto} directly.`
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // a bot filled the hidden field: accept quietly, deliver nothing
    if (trap && trap.value) {
      say("Thanks — your message is with us.");
      return;
    }

    if (!form.reportValidity()) return;

    const endpoint = endpointNow();
    if (!endpoint) {
      handOverToMailClient();
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Sending…";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(fields())),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      say("Thanks — your message is on the way. We will get back to you shortly.");
      if (submit) submit.textContent = "Sent";
    } catch (error) {
      if (submit) {
        submit.disabled = false;
        submit.textContent = submitLabel;
      }
      say(
        `That did not go through${mailto ? ` — please write to ${mailto} instead.` : "."}`,
        "error"
      );
    }
  });
})();

/* ---------- MOBILE & TABLET (<=1023px) — PAGES ---------- */

/* Copy review legend below 1024px (from the contact page agent). It runs
   on every page and does nothing unless the page is in review mode
   (?copy=draft or #copy-draft). setupCopyReview builds the legend open,
   which covers a quarter to a third of a phone screen and the hero
   heading on a tablet, so below 1024px this folds it (to a 44px round
   button, see contact.css) as soon as it appears - by clicking the legend's own toggle, so the class,
   aria-expanded and the sign stay in step. Crossing 1024px either way
   re-applies the default (folded below, open above, so a window grown to
   desktop gets the desktop's open legend back) until the reader uses the
   toggle; from then on their choice stands. */
(function copyLegendCompact() {
  const asked = new URLSearchParams(window.location.search).get("copy") === "draft"
    || window.location.hash === "#copy-draft";
  if (!asked || !window.matchMedia || !document.body) return;
  const foldQuery = window.matchMedia("(max-width: 1023px)");
  let legend = null;
  let chosen = false;
  let ours = false;

  const apply = () => {
    if (!legend || chosen) return;
    const toggle = legend.querySelector(".copy-legend__toggle");
    if (!toggle || legend.classList.contains("is-collapsed") === foldQuery.matches) return;
    ours = true;
    toggle.click();
    ours = false;
  };

  const adopt = (el) => {
    legend = el;
    legend.addEventListener("click", (event) => {
      if (!ours && event.target.closest(".copy-legend__toggle")) chosen = true;
    });
    apply();
    if (foldQuery.addEventListener) foldQuery.addEventListener("change", apply);
    else if (foldQuery.addListener) foldQuery.addListener(apply);
  };

  const found = document.querySelector(".copy-legend");
  if (found) return adopt(found);
  const watch = new MutationObserver(() => {
    const el = document.querySelector("body > .copy-legend");
    if (!el) return;
    watch.disconnect();
    adopt(el);
  });
  watch.observe(document.body, { childList: true });
})();
