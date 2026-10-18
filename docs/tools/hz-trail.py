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

# the skyline's rhythm, some way into the land (the client, 18.10: the
# line that kept climbing straight over the valley was cut loose from the
# scene - "not along the ridge, but in its rhythm, and no leap over the
# hollow"): the skyline smoothed over about 300 units, 40 under it on the
# plateau and the valley, sinking to 150 under the steep far peak so the
# climb there is gentler than the rock's. Always at least 16 under the
# skyline, so it never crosses into the photograph.
ANCHORS = [(0, 396.4, -0.078), (90, 387.8, -0.116), (180, 377.4, -0.093), (270, 372.0, -0.056), (360, 362.8, -0.149), (450, 352.7, -0.01), (540, 358.0, 0.098), (630, 366.8, 0.123), (720, 389.4, 0.388), (810, 428.3, 0.415), (900, 451.0, 0.058), (990, 435.1, -0.389), (1080, 390.1, -0.589), (1170, 330.8, -0.653), (1260, 274.4, -0.6), (1350, 228.2, -0.421), (1440, 195.5, -0.327), (1443, 194.5, -0.324)]
MARKS = [289, 640, 1120, 1300]


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
