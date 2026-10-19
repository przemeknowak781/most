# The top edge of Who we are on a light ground (?who=ivory|grey|latte): the
# navy of the band above comes down into the facade photo (arch-band-facade,
# 1800 x 900) through every cell of its structure along the top, so the
# section's edge is the facade's own silhouette - the light members (the
# building's edge and mullions, the pilasters, the diagrid, the X's beams)
# rise into the navy between the cuts.
#
#   1  the structure's edges: Sobel edges of the photo, thinned, and a Hough
#      vote over angle and offset; each peak keeps the runs of edge it is
#      made of (gaps under 40px, runs of 90px or more)
#   2  the cells: the edges (2px wide, run 30px on at each end, and on out
#      of the photo's top when they reach near it) cut the photo's upper
#      part into cells; the floor of the left building, which the vote
#      misses, is added (snapped to the photo, 24.6 degrees)
#   3  the cuts: the cells that open on the photo's top and close above
#      y = 470, less the narrow ones (under 38px across: those are members
#      seen by both their edges - mullions, flanges, bars - and stay light);
#      the deep corner cell of the left building, which would stand in the
#      title, stays light; the dark right of the X is added (out to the
#      photo's side, along the beams' far edges), and the X's rising member
#      is kept whole and light; hairline gaps under 3px close
#
#   python3 docs/tools/who-cut.py        prints the path's d (needs shapely)
#
# Paste it into the .whoweare__cut path in index.html. The cut and the
# photo are laid out alike (object-fit: cover = preserveAspectRatio slice,
# both moved by --who-lift), so they stay registered at every width.
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as nd
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
L = np.asarray(Image.open(os.path.join(ROOT, 'arch-band-facade.webp')).convert('L')).astype(np.float32) / 255

# ---------- 1. the structure's straight edges ----------
Ls = nd.gaussian_filter(L, 1.2)
gx, gy = nd.sobel(Ls, 1), nd.sobel(Ls, 0)
mag = np.hypot(gx, gy)
ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
thin = np.zeros_like(mag)
for a0, (dy, dx) in [(0, (0, 1)), (45, (1, 1)), (90, (1, 0)), (135, (1, -1))]:
    sel = np.abs(((ang - a0 + 90) % 180) - 90) <= 22.5
    peak = sel & (mag >= np.roll(mag, (dy, dx), (0, 1))) & (mag >= np.roll(mag, (-dy, -dx), (0, 1)))
    thin[peak] = mag[peak]
ys, xs = np.nonzero(thin > 0.12)
thetas = np.radians(np.arange(0, 180, 0.25))
diag = int(np.hypot(*L.shape)) + 1
acc = np.zeros((len(thetas), 2 * diag), np.int32)
for i, th in enumerate(thetas):
    np.add.at(acc[i], np.round(xs * np.cos(th) + ys * np.sin(th)).astype(int) + diag, 1)

segments = []
for _ in range(80):
    i, r = np.unravel_index(np.argmax(acc), acc.shape)
    if acc[i, r] < 90:
        break
    th, rho = thetas[i], r - diag
    n = np.array([np.cos(th), np.sin(th)])
    u = np.array([-n[1], n[0]])
    on = np.abs(xs * n[0] + ys * n[1] - rho) <= 1.5
    t = np.sort(xs[on] * u[0] + ys[on] * u[1])
    runs, start = [], None
    for k, v in enumerate(t):
        if start is None:
            start = v
        elif v - t[k - 1] > 40:
            if t[k - 1] - start >= 90:
                runs.append((start, t[k - 1]))
            start = v
    if start is not None and t[-1] - start >= 90:
        runs.append((start, t[-1]))
    for a, b in runs:
        A, B = n * rho + u * (a - 30), n * rho + u * (b + 30)
        # a member that comes near the photo's top runs on out of it
        for P, Q in ((A, B), (B, A)):
            if P[1] < 90 and P[1] < Q[1] and abs(u[1]) > 0.2:
                d = (P - Q) / np.linalg.norm(P - Q)
                P[:] = P + d * (-20 - P[1]) / d[1]
        segments.append(LineString([tuple(A), tuple(B)]))
    acc[max(0, i - 8):i + 9, max(0, r - 10):r + 11] = 0

# the left building's floor, which the vote misses
floor = lambda x: (x, 209.1 + (x - 208.55) * 0.45735)
segments.append(LineString([floor(20), floor(420)]))

# ---------- 2. the cells ----------
YMAX = 470
edges = unary_union([s.buffer(1.0, cap_style=2) for s in segments])
cells = box(-60, 0, 1860, YMAX).difference(edges)

# ---------- 3. the cuts ----------
def across(p):
    r = p.minimum_rotated_rectangle
    cx, cy = r.exterior.coords.xy
    return min(np.hypot(cx[k + 1] - cx[k], cy[k + 1] - cy[k]) for k in range(2))

cuts = [p for p in cells.geoms
        if p.bounds[1] <= 0.5 and p.bounds[3] < YMAX - 1 and p.area >= 1200 and across(p) >= 38
        and not (p.centroid.x < 430 and p.bounds[3] > 250)]

def line_at_y(pt, d, y):
    return (pt[0] + d[0] * (y - pt[1]) / d[1], y)

# the X: its rising member's left and right edges (snapped to the photo)
RISE_L = ((1483.73, 199.2), (0.53228, -0.84657))
RISE_R = ((1586.81, 169.2), (-0.52532, 0.8509))
right_of_x = Polygon([(1716.0, -40.0), (1516.4, 283.2), (1900.0, 885.3), (1900.0, -40.0)])
rising = Polygon([line_at_y(*RISE_L, -60), line_at_y(*RISE_R, -60), line_at_y(*RISE_R, 420), line_at_y(*RISE_L, 420)])

navy = unary_union(cuts + [right_of_x]).difference(rising)
navy = navy.buffer(1.6, join_style=2).buffer(-1.6, join_style=2).simplify(0.5)

# up out of the photo's top, into the band
parts = []
for p in getattr(navy, 'geoms', [navy]):
    top = [x for x, y in p.exterior.coords if y <= 0.6]
    parts.append(unary_union([p, box(min(top), -40, max(top), 0.6)]) if top else p)
navy = unary_union(parts)

print(' '.join('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in list(p.exterior.coords)[:-1]) + ' Z'
               for p in getattr(navy, 'geoms', [navy])))
