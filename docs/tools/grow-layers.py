# The mountain ranges behind the closing band's ridge (?footer=layers), as
# in the team's reference of 29.10: four ranges in haze, the farther ones
# higher, each with sharp peaks and a broken crest, and each fading into
# mist towards its foot, where the next range rises in front of it. Drawn
# in the overlay's own box (footer.svg, 1440 x 437, bottom-aligned with it)
# so they show where the walkers' ridge dips and hide behind it elsewhere.
# Peaks keep below the band's title and button (y 100 under them, in these
# units; the title's foot is at 54-72 from 1024px up).
#
#   python3 docs/tools/grow-layers.py      writes grow-layer-1..4.svg
#
# Each file is a white silhouette used as a mask (styles.css paints it in
# the page's colours): opaque along the crest and thinning to a trace
# below it, so the mist is the sky showing through. One set serves every
# page.
import math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 1440, 437


def fractal(seed, n, rough=0.62):
    """Midpoint displacement on n + 1 points, scaled to -1..1."""
    rnd = random.Random(seed)
    size = 1
    while size < n:
        size *= 2
    v = [0.0] * (size + 1)
    v[0], v[size] = rnd.uniform(-1, 1), rnd.uniform(-1, 1)
    step, amp = size, 1.0
    while step > 1:
        half = step // 2
        for i in range(half, size, step):
            v[i] = (v[i - half] + v[i + half]) / 2 + rnd.uniform(-amp, amp)
        step, amp = half, amp * rough
    v = v[:n + 1]
    lo, hi = min(v), max(v)
    return [2 * (x - lo) / (hi - lo) - 1 for x in v]


def crest(peaks, base, grain, seed):
    """Upper outline: the highest of the peaks at each x, on a gentle base,
    with a broken edge. A peak is (x, top, reach left, reach right, shape):
    shape 1 is a sharp tip on concave flanks, more is rounder. Each peak
    gets two or three lower shoulders on its flanks, so no slope is a
    clean curve."""
    rnd = random.Random(seed)
    big = fractal(seed, W, 0.55)
    small = fractal(seed + 1, W, 0.74)
    shaped = []
    for cx, top, wl, wr, q in peaks:
        shaped.append((cx, base - top, wl, wr, q))
        for _ in range(rnd.choice((2, 3))):
            side = rnd.choice((-1, 1))
            reach = wl if side < 0 else wr
            shaped.append((cx + side * rnd.uniform(0.35, 0.85) * reach,
                           (base - top) * rnd.uniform(0.42, 0.72),
                           reach * rnd.uniform(0.28, 0.45), reach * rnd.uniform(0.28, 0.45), 1.0))
    pts = []
    for x in range(W + 1):
        lift = 0.0
        for cx, h, wl, wr, q in shaped:
            d = abs(x - cx) / (wl if x < cx else wr)
            lift = max(lift, h * math.exp(-d ** q))
        y = base - lift + grain * (0.5 * big[x] + 0.5 * small[x])
        pts.append(y)
    return pts


# x, top, reach left, reach right, shape - placed after the reference: a
# peak at the left edge, one in the middle and a long massif on the right
# in the far range; lower ranges in front; one pointed peak right of the
# middle in the third range. The haze runs from the range's crest down to
# where it is gone (y from - to).
LAYERS = [
    # (name, peaks, base, grain, seed, haze from - to)
    ('1', [(40, 100, 150, 170, 1.0), (330, 146, 120, 120, 1.1), (590, 150, 140, 130, 1.1),
           (815, 84, 180, 220, 0.95), (1125, 100, 130, 250, 0.95), (1290, 108, 100, 150, 1.0),
           (1420, 96, 130, 160, 1.0)],
     196, 4.5, 11, (96, 200)),
    ('2', [(140, 150, 120, 120, 1.05), (350, 160, 110, 120, 1.1), (560, 168, 120, 110, 1.15),
           (720, 160, 100, 130, 1.1), (1020, 150, 130, 120, 1.05), (1240, 142, 120, 150, 1.0)],
     222, 3.4, 23, (142, 232)),
    ('3', [(240, 186, 120, 130, 1.2), (470, 192, 110, 120, 1.2), (660, 190, 100, 90, 1.2),
           (890, 146, 160, 180, 0.95), (1190, 178, 130, 150, 1.15)],
     246, 2.8, 37, (150, 262)),
    ('4', [(420, 226, 90, 110, 1.25), (600, 232, 120, 100, 1.25), (770, 222, 100, 90, 1.2),
           (990, 218, 110, 120, 1.2), (1170, 210, 100, 120, 1.2)],
     272, 2.2, 53, (208, 292)),
]

for name, peaks, base, grain, seed, (h0, h1) in LAYERS:
    ys = crest(peaks, base, grain, seed)
    d = 'M0 437 L' + ' L'.join(f'{x} {ys[x]:.1f}' for x in range(0, W + 1, 2)) + f' L{W} 437Z'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">'
           f'<linearGradient id="m" gradientUnits="userSpaceOnUse" x1="0" y1="{h0}" x2="0" y2="{h1}">'
           '<stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#fff" stop-opacity=".78"/>'
           '<stop offset=".65" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>'
           '</linearGradient>'
           f'<path d="{d}" fill="url(#m)"/></svg>\n')
    open(os.path.join(ROOT, f'grow-layer-{name}.svg'), 'w').write(svg)
    print(name, 'crest', round(min(ys)), '-', round(max(ys)), len(svg), 'B')
