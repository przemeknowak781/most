const root = document.documentElement;

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
    setupHeroTrail._observer = new ResizeObserver(() => scheduleTrailOverlay(true));
    setupHeroTrail._observer.observe(trailSvg);
    if (labelsHost) setupHeroTrail._observer.observe(labelsHost);
    const ridgesImg = document.querySelector(".hero-ridges__img");
    const ridges = document.querySelector(".hero-ridges");
    if (ridges) setupHeroTrail._observer.observe(ridges);
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

  for (const el of [trailSvg, pointsHost]) {
    if (!el) continue;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.width = `${imgRect.width}px`;
    el.style.height = `${imgRect.height}px`;
  }
}

function positionTrailOverlay() {
  syncTrailContainersToRidge();

  const trailSvg = document.querySelector(".hero-trail");
  const pointsHost = document.querySelector(".hero-trail-points");
  const labelsHost = document.querySelector(".hero-trail-labels");
  if (!trailSvg || !pointsHost || !labelsHost) return;

  const ctm = trailSvg.getScreenCTM();
  if (!ctm) return;
  const pointsRect = pointsHost.getBoundingClientRect();
  const labelsRect = labelsHost.getBoundingClientRect();
  const pt = trailSvg.createSVGPoint();

  trailDots.forEach(({ el, cp }) => {
    pt.x = cp.x;
    pt.y = cp.y;
    const screen = pt.matrixTransform(ctm);
    el.style.left = `${screen.x - pointsRect.left}px`;
    el.style.top = `${screen.y - pointsRect.top}px`;
  });

  trailLabels.forEach(({ el, cp }) => {
    pt.x = cp.x;
    pt.y = cp.y;
    const screen = pt.matrixTransform(ctm);
    el.style.left = `${screen.x - labelsRect.left}px`;
  });

  const climbers = document.querySelector(".hero-climbers");
  const climbersSun = document.querySelector(".hero-climbers-sun");
  if (TRAIL.climbers) {
    const ridgesImg = document.querySelector(".hero-ridges__img");
    if (!ridgesImg) return;

    const imgRect = ridgesImg.getBoundingClientRect();
    if (imgRect.width === 0 || imgRect.height === 0) return;

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
      climbers.style.width = `${widthPx}px`;
      climbers.style.left = `${screen.x - climbersHostRect.left - anchor.x * climberScale}px`;
      climbers.style.top = `${screen.y - climbersHostRect.top - anchor.y * climberScale}px`;
    }

    if (climbersSun) {
      const sunScreen = {
        x: imgRect.left + ((TRAIL.climbers.x + TRAIL.climbers.sunOffset.x) / TRAIL.viewBox.width) * imgRect.width,
        y: imgRect.top + ((TRAIL.climbers.y + TRAIL.climbers.sunOffset.y) / TRAIL.viewBox.height) * imgRect.height,
      };
      const sunHostRect = climbersSun.parentElement.getBoundingClientRect();
      climbersSun.style.width = `${widthPx * 5.6}px`;
      climbersSun.style.left = `${sunScreen.x - sunHostRect.left}px`;
      climbersSun.style.top = `${sunScreen.y - sunHostRect.top}px`;
    }
  }
}

const topNav = document.querySelector(".top-nav");
const heroEl = document.querySelector(".hero");
const ridgeEdgeEl = document.querySelector(".ridge-edge");

function updateScroll() {
  const scrollY = window.scrollY || 0;
  const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);

  root.style.setProperty("--scroll-y", `${scrollY}px`);
  root.style.setProperty("--scroll-progress", Math.min(1, scrollY / maxScroll).toFixed(4));

  if (heroEl) {
    const heroHeight = heroEl.offsetHeight || window.innerHeight;
    const heroProgress = Math.min(1, Math.max(0, scrollY / heroHeight));
    root.style.setProperty("--hero-progress", heroProgress.toFixed(4));
  }

  if (ridgeEdgeEl) {
    const rect = ridgeEdgeEl.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const total = rect.height + vh;
    const offset = vh - rect.top;
    const ridgeProgress = Math.min(1, Math.max(0, offset / total));
    root.style.setProperty("--ridge-progress", ridgeProgress.toFixed(4));
  }

  if (topNav) topNav.classList.toggle("is-scrolled", scrollY > 12);
}

function revealOnScroll() {
  const groups = [
    { selector: ".expertise-strip article", stagger: 70 },
    { selector: ".stage-card", stagger: 0 },
  ];

  if (!("IntersectionObserver" in window)) {
    groups.forEach(({ selector }) =>
      document.querySelectorAll(selector).forEach((item) => item.classList.add("is-visible"))
    );
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  groups.forEach(({ selector, stagger }) => {
    const items = document.querySelectorAll(selector);
    items.forEach((item, index) => {
      if (stagger) item.style.transitionDelay = `${index * stagger}ms`;
      observer.observe(item);
    });
  });
}

function setupMobileMenu() {
  const menu = document.querySelector(".mobile-menu");
  const openButton = document.querySelector(".icon-button");
  const closeButton = document.querySelector(".close-button");
  const links = document.querySelectorAll(".mobile-menu a");

  if (!menu || !openButton || !closeButton) return;

  function setOpen(isOpen) {
    menu.hidden = !isOpen;
    document.body.classList.toggle("menu-open", isOpen);
    openButton.setAttribute("aria-expanded", String(isOpen));
  }

  openButton.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  links.forEach((link) => link.addEventListener("click", () => setOpen(false)));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

let ticking = false;

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      updateScroll();
      scheduleTrailOverlay();
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

updateScroll();
revealOnScroll();
setupMobileMenu();
setupHeroTrail();
window.addEventListener("load", () => scheduleTrailOverlay(true));
