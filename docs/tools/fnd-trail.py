# The Founders hero route (.fnd-trail): the growth line of the other pages
# (Home, Companies, Investors), here starting at the founder - from his feet
# on the outcrop, down the saddle in the land's rhythm and up the far slope
# to the frame's top right (the meeting of 25.10). The art is 1443 x 658,
# in screen coordinates (the ridge itself is drawn mirrored). Built as the
# Companies / Investors trail is (docs/tools/hz-trail.py): cubic pieces
# through anchors (x, y, slope) carrying the shared ridge texture, which
# fades out at each marker so the markers sit on the line.
#
#   python3 docs/tools/fnd-trail.py      prints the path's d and the markers' styles
#
# Paste both into for-founders.html. The line keeps at least 10 units under
# the skyline (the land, never the sky): 12-20 under it through the saddle,
# then sinking to 40-75 under the steep far slope, so the climb is gentler
# than the rock's; the first marker stands just ahead of the founder's feet.
import math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEX = [float(v) for v in re.search(r'const RIDGE_TEXTURE = "([^"]+)"', open(os.path.join(ROOT, 'script.js')).read()).group(1).split(',')]
RIDGE_PX = 0.72

ANCHORS = [(746, 366.0, 0.34), (800, 396.0, 0.52), (860, 429.0, 0.36), (920, 445.0, 0.0), (980, 433.0, -0.42),
           (1040, 400.0, -0.72), (1100, 358.0, -0.85), (1160, 306.0, -0.92), (1220, 248.0, -0.9), (1280, 196.0, -0.8),
           (1340, 151.0, -0.68), (1400, 113.0, -0.58), (1443, 89.0, -0.54)]
MARKS = [760, 1182, 1362]


def tex(u):
    last = len(TEX) - 1
    span = last * 2
    v = ((u % (2 * span)) + 2 * span) % (2 * span)
    if v > span:
        v = 2 * span - v
    x = v / 2
    i = min(int(x), last - 1)
    return TEX[i] + (TEX[i + 1] - TEX[i]) * (x - i)


def build(anchors, offset=37.0, amp=0.8):
    pts = []
    for i in range(len(anchors) - 1):
        (x0, y0, s0), (x1, y1, s1) = anchors[i], anchors[i + 1]
        t3 = (x1 - x0) / 3
        c1 = (x0 + t3, y0 + s0 * t3)
        c2 = (x1 - t3, y1 - s1 * t3)
        steps = max(2, math.ceil((x1 - x0) / 3))
        for n in range(0 if i == 0 else 1, steps + 1):
            t = n / steps
            u = 1 - t
            x = u ** 3 * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * x1
            y = u ** 3 * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * y1
            w = 1
            for fx in MARKS:
                q = abs(x - fx) / 18
                if q < 1:
                    w = min(w, q * q * (3 - 2 * q))
            y += amp * RIDGE_PX * tex(offset + x / RIDGE_PX) * w
            pts.append((x, y))
    return pts


def at(pts, X):
    for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
        if xa <= X <= xb:
            return ya + (yb - ya) * (X - xa) / (xb - xa)
    return pts[-1][1]


pts = build(ANCHORS, offset=211.0, amp=0.7)
print('d="M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + '"')
for x in MARKS:
    print(f'style="--x: {x / 1443 * 100:.2f}%; --y: {at(pts, x) / 658 * 100:.2f}%"')
