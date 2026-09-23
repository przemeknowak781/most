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

function buildTrailPath(trail) {
  const anchors = [
    trail.start,
    ...trail.curve,
    trail.end,
  ].map((point) => getTrailPoint(point));
  let d = `M${anchors[0].x} ${anchors[0].y}`;
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const dx = b.x - a.x;
    const t = dx / 3;
    const cp1x = a.x + t;
    const cp1y = a.y + a.slope * t;
    const cp2x = b.x - t;
    const cp2y = b.y - b.slope * t;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${b.x} ${b.y}`;
  }
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

function positionTrailOverlay() {
  syncTrailContainersToRidge();

  const trailSvg = document.querySelector(".hero-trail");
  const pointsHost = document.querySelector(".hero-trail-points");
  const labelsHost = document.querySelector(".hero-trail-labels");
  if (!trailSvg || !pointsHost || !labelsHost) return;

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
  if (climberWrite) {
    climberWrite.el.style.width = `${climberWrite.width}px`;
    climberWrite.el.style.left = `${climberWrite.left}px`;
    climberWrite.el.style.top = `${climberWrite.top}px`;
  }
  if (sunWrite) {
    sunWrite.el.style.width = `${sunWrite.width}px`;
    sunWrite.el.style.left = `${sunWrite.left}px`;
    sunWrite.el.style.top = `${sunWrite.top}px`;
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
    [917, 28], [1058, 24], [1164, 6], [1200, 1],
  ];
  const trailSamples = [];
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const a = trailPoints[i - 1] || trailPoints[i];
    const b = trailPoints[i];
    const c = trailPoints[i + 1];
    const e = trailPoints[i + 2] || c;
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    for (let step = 0; step < 24; step++) {
      const t = step / 24;
      const u = 1 - t;
      trailSamples.push([
        u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0],
        u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1],
      ]);
    }
  }
  trailSamples.push(trailPoints[trailPoints.length - 1]);

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
    if (compactQuery.matches) return;
    const sectionRect = section.getBoundingClientRect();
    if (!sectionRect.width) return;

    const { cutOffset, cutDepth } = getPseudoMetrics();

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
  const root = document.documentElement;
  const hashed = window.location.hash.match(/^#portraits-([ab])$/);
  const asked = new URLSearchParams(window.location.search).get("portraits") || (hashed && hashed[1]);
  if (asked === "a" || asked === "b") root.dataset.portraits = asked;
  if (!root.dataset.portraits) return;
  document.querySelectorAll(".member__portrait[data-photo]").forEach((img) => {
    img.src = img.dataset.photo;
    img.closest(".member")?.classList.add("has-photo");
  });
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
    ["", "copy-legend--bl", "copy-legend--br"].forEach((corner) => {
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
  const images = Array.from(document.querySelectorAll(".photo-break img, .aud-bleed img"));
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
      const parent = img.parentElement;
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
setupPortraitProposal();
setupCopyReview();

window.addEventListener("load", () => scheduleTrailOverlay(true));

/* Expertise "Our Areas": the list walks itself as you scroll.

   The two columns pin and the scroll that would have carried them past the
   viewport advances the topic instead - so reading the section top to bottom
   is reading all eight areas, in order, without clicking anything.

   Scroll is the single source of truth for which topic is showing. A click or
   an arrow key does not set the state directly; it scrolls to that topic's
   band and the scroll handler picks it up. That keeps one writer, so the rail
   fill, the dot and the panel can never disagree. The exception is the short
   window while a smooth scroll is in flight: the target is held so the reader
   does not watch eight panels flick past on the way there.

   Without JS the markup is what it always was - topic one, the rest hidden.
   The stacking that makes the sticky column a constant height is applied
   here, on the way in, so that fallback stays intact.

   Below 1024px none of this runs: see "compact" at the end. */
(() => {
  const track = document.querySelector(".ex-areas__track");
  const stage = document.querySelector(".ex-areas__body");
  const wrap = document.querySelector(".ex-areas__panels");
  const tabs = Array.from(document.querySelectorAll('.ex-areas__nav [role="tab"]'));
  const panels = Array.from(document.querySelectorAll(".ex-areas__panel"));
  if (!track || !stage || !wrap || tabs.length !== panels.length || !tabs.length) return;

  track.style.setProperty("--ex-count", String(tabs.length));
  wrap.classList.add("is-stacked");
  panels.forEach((p) => {
    p.hidden = false;
  });

  let index = -1;
  let held = -1;
  let holdTimer = 0;

  const armHold = () => {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      held = -1;
      read();
    }, 400);
  };

  /* Each icon is one unbroken stroke, so the length of that stroke is the
     length of thread. Measured once - getTotalLength is not free and the
     paths never change. */
  const art = stage.querySelector(".ex-art");
  const threads = art ? Array.from(art.querySelectorAll(".ex-art__thread")) : [];
  threads.forEach((svg) =>
    svg.querySelectorAll("path").forEach((path) => {
      let len = 1200;
      try {
        len = Math.ceil(path.getTotalLength());
      } catch {}
      svg.style.setProperty("--len", len);
    })
  );

  let frame = 0;

  const apply = (i) => {
    if (i === index) return;
    /* Which way the reader is going decides which side the outgoing thread
       winds back to, so the two always pass each other rather than stacking. */
    const from = index;
    index = i;
    /* a panel that goes inert while it has focus would drop focus to <body>,
       so it is handed on to the panel taking its place */
    const hadFocus = from >= 0 && panels[from].contains(document.activeElement);
    tabs.forEach((t, n) => {
      t.setAttribute("aria-selected", String(n === i));
      t.tabIndex = n === i ? 0 : -1;
    });
    threads.forEach((t, n) => {
      t.classList.toggle("is-leaving", n === from);
      t.classList.toggle("is-current", n === i);
    });
    panels.forEach((p, n) => {
      p.classList.toggle("is-current", n === i);
      p.setAttribute("aria-hidden", String(n !== i));
      if (n === i) p.removeAttribute("inert");
      else p.setAttribute("inert", "");
    });
    if (hadFocus) panels[i].focus({ preventScroll: true });
  };

  /* Where the column is pinned, and for how long. Both come out of layout, so
     a font swap or a resize just changes the answer.

     The pin offset is read off the column's own `top`, which is a real
     property and so comes back resolved - reading --ex-pin-top would hand
     back the unresolved calc() token. Once JS is carrying the column its
     `top` is zero, so the last good value is kept; a resize drops the class
     and the reading refreshes. */
  let pinTop = 0;
  const geometry = () => {
    const travel = track.offsetHeight - stage.offsetHeight;
    if (travel <= 1) return null;
    if (pinState === "") pinTop = parseFloat(getComputedStyle(stage).top) || 0;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    return { travel, pinTop, start: trackTop - pinTop };
  };

  /* Which mechanism holds the column.

     Decided up front rather than by watching what happens, because watching
     costs a few frames and those frames are visible: the column slips before
     it catches. What breaks sticky is knowable without scrolling - a scroll
     container anywhere between here and the viewport - so the chain is read
     once instead. html and body are the exception: their overflow propagates
     to the viewport, which is the scrollport sticky wants anyway, and `clip`
     never makes a scroll container at all.

     The reading is still checked once scrolling starts, because being wrong
     here is worse than being slow: a section that does not pin is a tall
     empty gap. Two bad frames in a row, so that one measurement taken mid
     scroll cannot flip it. */
  /* Sticky does the pinning. It is the right mechanism - the compositor holds
     the column and script does nothing at all - and the section is built
     around it.

     What sticky cannot do is fail loudly: when something disables it the
     section becomes a tall empty gap. So the column is watched, and if it is
     not actually holding, `fixed` takes over. The test is proportional - a
     column that is not holding has drifted by exactly the distance scrolled -
     so it needs no threshold guessing and fires within a couple of frames.
     Two readings, so a single measurement taken mid-scroll cannot flip it. */
  let carry = "sticky";
  let strikes = 0;
  let pinState = "";

  /* Only ever called on a state change, so the fixed box is set up twice per
     section rather than every frame. The height has to be read while the
     column is still in flow, which is why it is taken here and not later. */
  const setPin = (next, g) => {
    if (next === pinState) return;
    if (pinState === "") {
      /* Fractional, not offsetHeight: the padding that gives the column's
         space back has to match its height exactly, or the page grows or
         shrinks by a pixel at the moment it is pinned. */
      const box = stage.getBoundingClientRect();
      track.style.setProperty("--ex-stage-h", box.height + "px");
      track.style.setProperty("--ex-stage-w", box.width + "px");
      track.style.setProperty("--ex-stage-x", box.left + "px");
    }
    pinState = next;
    track.style.setProperty("--ex-parked-top", g.travel + "px");
    track.classList.toggle("is-pinning", next !== "");
    stage.classList.toggle("is-pinned", next === "pinned");
    stage.classList.toggle("is-parked", next === "parked");
  };

  const hold = (g, scrolled) => {
    if (carry === "sticky") {
      if (scrolled > 12 && scrolled < g.travel - 12) {
        if (Math.abs(stage.getBoundingClientRect().top - g.pinTop) < Math.max(4, scrolled * 0.5)) {
          strikes = 0;
        } else {
          if (++strikes >= 2) carry = "js";
          /* Carry the check forward a frame at a time. Arriving mid track in
             one jump - an anchor link, a restored scroll position - fires a
             single scroll event, and one event can neither finish a test that
             wants two readings nor apply the pin the decision calls for. */
          schedule();
        }
      }
      return;
    }
    setPin(scrolled <= 0 ? "" : scrolled >= g.travel ? "parked" : "pinned", g);
  };

  const read = () => {
    syncMode();
    if (compactMode) return;
    const g = geometry();
    if (!g) {
      track.style.setProperty("--ex-progress", "0");
      if (carry === "js") setPin("", { travel: 0 });
      if (index < 0) apply(0);
      return;
    }
    const scrolled = window.scrollY - g.start;
    hold(g, scrolled);
    const progress = Math.min(1, Math.max(0, scrolled / g.travel));
    track.style.setProperty("--ex-progress", progress.toFixed(4));
    const at = Math.min(tabs.length - 1, Math.floor(progress * tabs.length));
    if (held >= 0) {
      if (at !== held) {
        /* Still travelling. Push the deadline out on every frame of the
           scroll, so the hold ends when scrolling stops rather than after a
           fixed time - a long glide on a tall window used to outlast a fixed
           timeout and drop the reader on whatever topic it had reached. */
        armHold();
        return;
      }
      held = -1;
      clearTimeout(holdTimer);
    }
    apply(at);
  };

  /* Centre of topic i's band, in page coordinates. */
  const go = (i) => {
    const g = geometry();
    if (!g) {
      apply(i);
      return;
    }
    held = i;
    apply(i);
    armHold();
    window.scrollTo({
      top: g.start + ((i + 0.5) / tabs.length) * g.travel,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => go(i));
    tab.addEventListener("keydown", (e) => {
      if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        const n = e.key === "Home" ? 0 : tabs.length - 1;
        tabs[n].focus();
        go(n);
        return;
      }
      const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = (i + step + tabs.length) % tabs.length;
      tabs[next].focus();
      go(next);
    });
  });

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      read();
    });
  };

  addEventListener("scroll", () => {
    if (!compactMode) schedule();
  }, { passive: true });
  /* A new layout can change the answer, so the test is run again from
     scratch - including putting the column back in flow so its pin offset
     and height can be measured afresh. */
  /* A new layout can change the answer, so the column goes back in flow and
     sticky gets another chance before the test runs again. */
  addEventListener("resize", () => {
    setPin("", { travel: 0 });
    carry = "sticky";
    strikes = 0;
    schedule();
  });
  /* The column is as tall as its tallest topic, so once it parks on the
     last, shorter one the difference shows as a blank before How We Work.
     The next section is pulled up over that blank - never by more than one
     topic's worth of scroll, so it cannot reach a taller panel that is
     still pinned above it. Measured from layout, so fonts and resizes just
     change the answer; without a track (short windows, reduced motion) it
     is zero. */
  const section = track.closest(".ex-areas");
  const nav = stage.querySelector(".ex-areas__nav");
  const lastPanel = panels[panels.length - 1];
  const slack = () => {
    if (!section) return;
    if (compactMode) {
      setCssVar(section, "--ex-park-slack", "0px");
      return;
    }
    const g = geometry();
    let px = 0;
    if (g) {
      const end = lastPanel.lastElementChild;
      const floor = Math.max(
        end ? end.getBoundingClientRect().bottom : 0,
        nav ? nav.getBoundingClientRect().bottom : 0
      );
      px = Math.min(stage.getBoundingClientRect().bottom - floor, g.travel / tabs.length - 24);
    }
    section.style.setProperty("--ex-park-slack", Math.max(0, Math.round(px)) + "px");
  };

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => {
      schedule();
      slack();
    }).observe(stage);
  }
  if (document.fonts) document.fonts.ready.then(slack);

  /* ---------- compact ----------
     Below 1024px there is no pinned column and the scroll chooses nothing.
     The eight areas are read one after another, each under its own drawing
     (the stylesheet lays them out), and the tab list becomes what a reader
     on a phone needs from it: links down to the areas. The widget's ARIA
     leaves with the widget - the links sit in a plain navigation list, the
     panels are plain blocks under their own headings, and none of them is
     inert, hidden or a tab stop. Growing past 1023px puts the tabs, their
     roles and the stacking back, and the scroll picks the topic again, as a
     fresh load at that position would.

     The tab buttons keep their listeners while they are out of the page, so
     putting them back is all the restoring they need. */
  const tabItems = tabs.map((tab) => tab.parentElement);
  const tabList = tabItems[0] ? tabItems[0].parentElement : null;
  const tabListAttrs = tabList
    ? ["role", "aria-orientation", "aria-labelledby"].map((name) => [name, tabList.getAttribute(name)])
    : [];
  const jumps = tabs.map((tab, i) => {
    const link = document.createElement("a");
    const label = document.createElement("span");
    link.className = "ex-areas__jump";
    link.href = `#${panels[i].id}`;
    label.className = "ex-areas__jump-label";
    tab.childNodes.forEach((node) => label.appendChild(node.cloneNode(true)));
    link.appendChild(label);
    return link;
  });
  const titleId = tabList ? tabList.getAttribute("aria-labelledby") : null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let compactMode = null;
  let drawIo = null;

  /* A drawing below the fold waits undrawn and unwinds as it arrives, the
     same single stroke the desktop threads draw; one already on screen is
     simply there. Without this (no observer, less motion) all are drawn. */
  const drawOnArrival = () => {
    if (!threads.length || !("IntersectionObserver" in window) || reduceMotion.matches) return;
    const fold = window.innerHeight * 0.85;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("is-pending");
          io.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -15% 0px" }
    );
    threads.forEach((thread) => {
      if (thread.getBoundingClientRect().top < fold) return;
      thread.classList.add("is-pending");
      io.observe(thread);
    });
    drawIo = io;
  };

  function syncMode() {
    const compact = compactQuery.matches;
    if (compact === compactMode) return;
    compactMode = compact;
    const focused = document.activeElement;

    if (compact) {
      clearTimeout(holdTimer);
      held = -1;
      index = -1;
      setPin("", { travel: 0 });
      carry = "sticky";
      strikes = 0;
      track.style.setProperty("--ex-progress", "0");
      setCssVar(section, "--ex-park-slack", "0px");
      wrap.classList.remove("is-stacked");
      tabListAttrs.forEach(([name]) => tabList.removeAttribute(name));
      if (nav) {
        nav.classList.add("is-jump-list");
        nav.setAttribute("role", "navigation");
        if (titleId) nav.setAttribute("aria-labelledby", titleId);
      }
      tabs.forEach((tab, i) => {
        tabItems[i].removeAttribute("role");
        tab.replaceWith(jumps[i]);
        if (focused === tab) jumps[i].focus({ preventScroll: true });
      });
      panels.forEach((panel) => {
        panel.hidden = false;
        panel.classList.remove("is-current");
        ["role", "aria-labelledby", "aria-hidden", "tabindex", "inert"].forEach((name) => panel.removeAttribute(name));
      });
      threads.forEach((thread) => thread.classList.remove("is-current", "is-leaving"));
      drawOnArrival();
      return;
    }

    if (drawIo) drawIo.disconnect();
    drawIo = null;
    threads.forEach((thread) => thread.classList.remove("is-pending"));
    if (nav) {
      nav.classList.remove("is-jump-list");
      nav.removeAttribute("role");
      nav.removeAttribute("aria-labelledby");
    }
    tabListAttrs.forEach(([name, value]) => {
      if (value !== null) tabList.setAttribute(name, value);
    });
    jumps.forEach((link, i) => {
      tabItems[i].setAttribute("role", "presentation");
      if (link.isConnected) link.replaceWith(tabs[i]);
      if (focused === link) tabs[i].focus({ preventScroll: true });
    });
    panels.forEach((panel, i) => {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabs[i].id);
      panel.setAttribute("tabindex", "0");
    });
    wrap.classList.add("is-stacked");
    /* apply() runs from here on the next read, with nothing to wind back */
    index = -1;
  }

  syncMode();
  onCompactChange(() => {
    syncMode();
    schedule();
    slack();
  });
  read();
  slack();
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
  const icons = Array.from(document.querySelectorAll(".ex-icon, .js-draw"));
  if (!pending.size && !icons.length) return;

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
    icons.forEach((svg) => svg.querySelectorAll("path").forEach(measure));
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

  if (icons.length) {
    if ("IntersectionObserver" in window) {
      const drawIo = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            drawIo.unobserve(entry.target);
            startDraw(entry.target);
          }),
        { rootMargin: `-${BAND_TOP * 100}% 0px -${(1 - BAND_BOTTOM) * 100}% 0px` }
      );
      icons.forEach((svg) => drawIo.observe(svg));
    } else {
      icons.forEach((svg) => svg.classList.add("is-drawn"));
    }
  }

  /* ---------- layout reveals ---------- */
  const reveal = (el) => {
    el.classList.add("is-in");
    pending.delete(el);
    if (!pending.size) teardown();
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
    });
  };

  function teardown() {
    io?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }

  if (pending.size) {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
        { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
      );
      pending.forEach((el) => io.observe(el));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    sweep();
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

/* Team (our-team.html), compact only (<=1023px): width-appropriate files for
   the portrait proposal. With ?portraits=a|b, setupPortraitProposal
   (script.js) swaps each member's silhouette for the photo named in its
   data-photo (1200x1400) and marks the card .has-photo. Below 1024px that
   frame is 230-420px wide, so each swapped portrait also gets
   srcset (-640 / -1024 / the original) and sizes = the width it is drawn at,
   measured, and re-measured when the window is resized. At 1024px and up
   srcset and sizes are taken off again, so the desktop image is chosen by
   src exactly as before. Without the proposal (the default page) there are
   no swapped portraits and nothing happens. The script cannot set srcset in
   the markup: a srcset would replace the silhouette the page shows by
   default.

   INTEGRATION: this must run in the same task as setupPortraitProposal(),
   directly after it - append this file to the end of script.js (after the
   init calls there), or set srcset/sizes inside setupPortraitProposal
   before it assigns src. Do NOT load it as its own <script defer>: the
   browser picks the image at the microtask checkpoint between the two
   scripts, so portraits near the fold fetch the full 1200px file first and
   then the -640 one as well (seen in 2 of 3 runs at 768x1024, DPR 2).
   Appended to script.js it requests only the -640 files (5 of 5 runs). */
(() => {
  if (!document.body || !document.body.classList.contains("page--team")) return;
  const compact = window.matchMedia("(max-width: 1023px)");
  const FULL_WIDTH = 1200;

  const portraits = () =>
    Array.from(document.querySelectorAll(".member.has-photo .member__portrait[data-photo]"));

  const variants = (file) => {
    const stem = file.replace(/\.webp$/, "");
    return `${stem}-640.webp 640w, ${stem}-1024.webp 1024w, ${file} ${FULL_WIDTH}w`;
  };

  const measure = (img) => {
    const width = Math.ceil(img.getBoundingClientRect().width);
    if (width > 0) img.sizes = `${width}px`;
  };

  const apply = () => {
    portraits().forEach((img) => {
      if (compact.matches) {
        if (!/\.webp$/.test(img.dataset.photo)) return;
        measure(img); /* sizes first, so the pick is made with it */
        if (!img.hasAttribute("srcset")) img.srcset = variants(img.dataset.photo);
      } else {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
      }
    });
  };

  let frame = 0;
  const onResize = () => {
    if (frame || !compact.matches) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      portraits().forEach((img) => { if (img.hasAttribute("srcset")) measure(img); });
    });
  };

  const start = () => {
    if (!portraits().length) return;
    apply();
    if (compact.addEventListener) compact.addEventListener("change", apply);
    else if (compact.addListener) compact.addListener(apply);
    window.addEventListener("resize", onResize, { passive: true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

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
