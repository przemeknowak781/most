# The Companies / Investors hero trail (.hz-trail__path and its four
# .hz-trail__point markers). The art is 1443 x 658, in screen coordinates
# (the ridge itself is drawn mirrored). Built like the Home trail in
# script.js: cubic pieces through anchors (x, y, slope), carrying the shared
# ridge texture (RIDGE_TEXTURE), which fades out within 18 units of each
# marker so the markers sit on the line.
#
#   python3 docs/tools/hz-trail.py            prints the path's d and the markers' styles
#
# Paste both into for-companies.html and for-investors.html (same trail on
# both). Keep the line under the skyline and clear of the intro's copy:
# check at every width before publishing.
import json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEX = [float(v) for v in re.search(r'const RIDGE_TEXTURE = "([^"]+)"', open(os.path.join(ROOT, 'script.js')).read()).group(1).split(',')]
RIDGE_PX = 0.72

# flatter than the plateau, a wider dip under the valley floor, a gentler
# climb deep in the far slope
ANCHORS = [(0, 388, -0.06), (150, 368, -0.06), (289, 362, -0.03), (450, 356, -0.04), (600, 352, 0.02),
           (668, 356, 0.25), (760, 392, 0.45), (860, 446, 0.12), (930, 452, -0.05), (1020, 420, -0.5),
           (1100, 372, -0.55), (1165, 334, -0.5), (1240, 296, -0.5), (1310, 262, -0.45), (1443, 196, -0.5)]
MARKS = [289, 668, 1165, 1310]


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


pts = build(ANCHORS)
print('d="M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + '"')
for x in MARKS:
    print(f'style="--x: {x / 1443 * 100:.2f}%; --y: {at(pts, x) / 658 * 100:.2f}%"')
