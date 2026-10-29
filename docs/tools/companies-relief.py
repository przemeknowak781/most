# Two more backgrounds for the Companies hero (29.10, ?companies=fins and
# ?companies=facets): a relief lit by two lights, so the orange is in the
# picture itself - wherever a surface turns to a low evening sun on the
# right it glows copper, and everything else takes the cool slate light
# from above. Nothing is laid over it but the shade behind the copy.
#   fins    corrugated fins converging upwards, at the old towers' angles,
#           each a smooth half-pipe whose depth changes slowly along it
#   facets  a folded surface of triangles: a few broad folds, sampled at
#           the triangles' corners, so whole groups of facets catch the
#           sun together
# The sun reaches the lower right of the hero and the top of How We Work,
# never the copy at the upper left.
#
# One tall frame, 1920 x 2742: the top half is the hero, the bottom half
# How We Work.
#
#   python3 docs/tools/companies-relief.py <out dir>
#     companies-{fins,facets}{,-band}{,-1024,-crop}.webp
import os, sys

import numpy as np
from PIL import Image

W, H = 1920, 2742
y, x = np.mgrid[0:H, 0:W].astype(np.float64) + 0.5


def smooth(e0, e1, t):
    t = np.clip((t - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def h01(a, b, salt):
    """A steady random number for each pair of grid numbers."""
    h = np.sin(a * 12.9898 + b * 78.233 + salt) * 43758.5453
    return h - np.floor(h)


# where the evening reaches: low and right in the hero, softer at the top
# of How We Work, and never behind the copy at the upper left
sun = np.clip(1.15 * np.exp(-((x - 1450) / 650) ** 2 - ((y - 1150) / 520) ** 2)
              + 0.45 * np.exp(-((x - 1300) / 620) ** 2 - ((y - 1750) / 420) ** 2), 0, 1)
sun *= 1 - 0.85 * np.exp(-((x - 380) / 520) ** 2 - ((y - 560) / 420) ** 2)

COOL = np.array([-0.35, -0.55, 0.76]) / np.linalg.norm([-0.35, -0.55, 0.76])   # sky, from above left
WARM = np.array([0.82, 0.28, 0.5]) / np.linalg.norm([0.82, 0.28, 0.5])         # low sun, from the right


def light(nx, ny, nz):
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / n, ny / n, nz / n
    cool = np.clip(nx * COOL[0] + ny * COOL[1] + nz * COOL[2], 0, 1)
    warm = np.clip(nx * WARM[0] + ny * WARM[1] + nz * WARM[2], 0, 1)
    base = np.array([20, 22, 30.0]) + np.array([46, 50, 64.0]) * cool[..., None]
    return base + np.array([235, 128, 72.0]) * ((warm ** 3) * sun)[..., None]


def fins():
    vx, vy, step = 960.0, -1300.0, 0.019          # the fins meet far above the frame
    u = np.arctan2(x - vx, y - vy) / step
    fin = np.floor(u)
    f = u - fin
    # each fin's depth drifts along it, from one stretch to the next
    run = np.log(y - vy) / 0.16 + h01(fin, 0, 3.3)
    k = np.floor(run)
    blend = smooth(0.35, 0.65, run - k)
    amp = 26 * (0.45 + 0.9 * ((1 - blend) * h01(fin, k, 2.2) + blend * h01(fin, k + 1, 2.2)))
    r2 = (x - vx) ** 2 + (y - vy) ** 2
    dudx, dudy = (y - vy) / r2 / step, -(x - vx) / r2 / step
    slope = np.pi * np.sin(2 * np.pi * f)          # the half-pipe's profile, (1 - cos) / 2
    col = light(-amp * slope * dudx, -amp * slope * dudy, np.ones_like(x))
    gap = np.abs(f - np.round(f)) / np.hypot(dudx, dudy)
    return col * (0.7 + 0.3 * smooth(0, 1.6, gap))[..., None]


def facets():
    side = 150.0
    t1, t2 = np.radians(64), np.radians(126)
    e1 = np.array([np.cos(t1), np.sin(t1)]) * side
    e2 = np.array([np.cos(t2), np.sin(t2)]) * side
    m = np.linalg.inv(np.array([[e1[0], e2[0]], [e1[1], e2[1]]]))
    a1, a2 = m[0, 0] * x + m[0, 1] * y, m[1, 0] * x + m[1, 1] * y
    i, j = np.floor(a1), np.floor(a2)
    up = (a1 - i) + (a2 - j) > 1

    def corner(ii, jj):
        px, py = ii * e1[0] + jj * e2[0], ii * e1[1] + jj * e2[1]
        h = (82 * np.sin(px * 0.0042 + py * 0.0019 + 0.7) + 57 * np.sin(-px * 0.0021 + py * 0.0047 + 2.1)
             + 33 * np.sin(px * 0.009 - py * 0.004 + 4.0) + 24 * (h01(ii, jj, 7.7) - 0.5))
        return px, py, h

    x0, y0, h0 = corner(np.where(up, i + 1, i), np.where(up, j + 1, j))
    xa, ya, ha = corner(i + 1, j)
    xb, yb, hb = corner(i, j + 1)
    ux, uy, uz = xa - x0, ya - y0, ha - h0
    vx, vy, vz = xb - x0, yb - y0, hb - h0
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    s = np.sign(nz)
    col = light(nx * s, ny * s, nz * s)
    fa, fb = a1 - i, a2 - j
    edge = np.minimum.reduce([fa, 1 - fa, fb, 1 - fb, np.abs(fa + fb - 1)]) * side
    return col * (0.84 + 0.16 * smooth(0, 1.2, edge))[..., None]


dst = sys.argv[1] if len(sys.argv) > 1 else '.'
for stem, make in (('companies-fins', fins), ('companies-facets', facets)):
    img = Image.fromarray(np.clip(make(), 0, 255).astype(np.uint8), 'RGB')
    for name, box in ((stem, (0, 0, W, H // 2)), (f'{stem}-band', (0, H // 2, W, H))):
        part = img.crop(box)
        part.save(os.path.join(dst, f'{name}.webp'), 'WEBP', quality=76, method=6)
        part.resize((1024, round(1024 * part.height / part.width)), Image.LANCZOS).save(
            os.path.join(dst, f'{name}-1024.webp'), 'WEBP', quality=76, method=6)
        part.crop((464, 0, 1456, part.height)).save(os.path.join(dst, f'{name}-crop.webp'), 'WEBP', quality=76, method=6)
        print(name, os.path.getsize(os.path.join(dst, f'{name}.webp')), 'B')
