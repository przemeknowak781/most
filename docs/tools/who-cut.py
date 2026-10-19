# The top edge of Who we are on a light ground (?who=ivory|grey|latte): the
# navy of the band above comes down into the facade photo (arch-band-facade,
# 1800 x 900) between its members, so the section's edge is the photograph's
# own structure. Four cuts, each between two edges of the photo:
#
#   1, 2  a thin falling mullion and the thick rising one beside it, down to
#         where they meet
#   3     the X's falling beam (its outer, left edge) and the rising one (its
#         left edge), down to the X's left corner
#   4     right of the X: the rising beam's right edge and, under the
#         crossing, the falling beam's upper edge, out to the photo's side
#
# Each edge starts as a rough line (the client's sketch, 19.10) and is
# snapped to the photo: every angle within 6 degrees and every offset within
# the search band is tried, the photo is averaged along the line, and the
# sharpest step (an edge) or the darkest thin line (a mullion) wins.
#
#   python3 docs/tools/who-cut.py        prints the path's d
#
# Paste it into the .whoweare__cut path in index.html. The cut and the
# photo are laid out alike (object-fit: cover = preserveAspectRatio slice,
# both lifted by --who-lift), so they stay registered at every width.
import os

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
L = np.asarray(Image.open(os.path.join(ROOT, 'arch-band-facade.webp')).convert('L')).astype(np.float32)

# name: rough start, rough end, what to look for, search band (photo px)
EDGES = {
    'cut1_left': ((655, 40), (712, 195), 'dark', 40),
    'cut1_right': ((730, 200), (820, 75), 'edge', 40),
    'cut2_left': ((955, 30), (1020, 200), 'dark', 40),
    'cut2_right': ((1040, 200), (1150, 50), 'edge', 40),
    'cut3_left': ((1189.0, 50.7), (1333.0, 302.5), 'edge', 7),
    'cut3_right': ((1390, 340), (1580, 60), 'edge', 40),
    'cut4_left': ((1650, 60), (1510, 270), 'edge', 40),
    'cut4_low': ((1525, 300), (1700, 540), 'edge', 40),
}
TOP = -40     # above the photo, out of the section
SIDE = 1900   # past the photo's right side


def snap(p0, p1, kind, dmax):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    c, half = (p0 + p1) / 2, np.linalg.norm(p1 - p0) / 2
    th0 = np.arctan2(*(p1 - p0)[::-1])
    ts, ds = np.linspace(-half, half, 120), np.arange(-dmax, dmax + 0.5, 0.5)
    best = None
    for th in th0 + np.radians(np.arange(-6, 6.01, 0.2)):
        u = np.array([np.cos(th), np.sin(th)])
        n = np.array([-u[1], u[0]])
        X = c[0] + ts[None, :] * u[0] + ds[:, None] * n[0]
        Y = c[1] + ts[None, :] * u[1] + ds[:, None] * n[1]
        P = nd.map_coordinates(L, [Y, X], order=1, mode='nearest').mean(1)
        if kind == 'edge':
            r = np.abs(np.gradient(P))
        else:
            r = nd.uniform_filter1d(P, 25) - P
        i = int(np.argmax(r))
        if best is None or r[i] > best[0]:
            best = (r[i], c + ds[i] * n, u)
    return best[1], best[2]


def meet(a, b):
    (p, u), (q, v) = a, b
    t = np.linalg.solve(np.array([u, -v]).T, q - p)
    return p + u * t[0]


def at_y(e, y):
    p, u = e
    return p + u * (y - p[1]) / u[1]


def at_x(e, x):
    p, u = e
    return p + u * (x - p[0]) / u[0]


E = {k: snap(*v) for k, v in EDGES.items()}
cuts = [[at_y(E[f'cut{i}_left'], TOP), meet(E[f'cut{i}_left'], E[f'cut{i}_right']), at_y(E[f'cut{i}_right'], TOP)] for i in (1, 2, 3)]
cuts.append([at_y(E['cut4_left'], TOP), meet(E['cut4_left'], E['cut4_low']), at_x(E['cut4_low'], SIDE), np.array([SIDE, TOP])])
print(' '.join('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in c) + ' Z' for c in cuts))
