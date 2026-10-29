# The architecture behind the Companies and Investors heroes (29.10): a
# relief lit by two lights, so the light is in the picture itself - a low
# key light from the right catches every surface turned to it, and the
# rest takes the cool slate light from above. Nothing is laid over it but
# the shade behind the copy. The key light reaches the lower right of the
# hero and the top of How We Work, never the copy at the upper left.
#   companies-fins     corrugated fins converging upwards, at the old
#                      towers' angles, each a smooth half-pipe whose depth
#                      drifts along it; the key light an evening copper
#   investors-flutes   the same relief as fluted glass - narrower flutes,
#                      upright, in the page's slate blue; the key light a
#                      cool silver blue, the page's own
#
# One tall frame, 1920 x 2742: the top half is the hero, the bottom half
# How We Work.
#
#   python3 docs/tools/hz-relief.py <out dir>
#     companies-fins{,-band}{,-640,-1024,-crop}.webp
#     investors-flutes{,-band}{,-640,-1024,-crop}.webp
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


# where the key light reaches: low and right in the hero, softer at the
# top of How We Work, and never behind the copy at the upper left
sun = np.clip(1.15 * np.exp(-((x - 1450) / 650) ** 2 - ((y - 1150) / 520) ** 2)
              + 0.45 * np.exp(-((x - 1300) / 620) ** 2 - ((y - 1750) / 420) ** 2), 0, 1)
sun *= 1 - 0.85 * np.exp(-((x - 380) / 520) ** 2 - ((y - 560) / 420) ** 2)

SKY = np.array([-0.35, -0.55, 0.76]) / np.linalg.norm([-0.35, -0.55, 0.76])   # from above left
KEY = np.array([0.82, 0.28, 0.5]) / np.linalg.norm([0.82, 0.28, 0.5])         # low, from the right

# (dark, sky light, key light) for each page
COMPANIES = (np.array([20, 22, 30.0]), np.array([46, 50, 64.0]), np.array([235, 128, 72.0]))
INVESTORS = (np.array([14, 18, 28.0]), np.array([34, 44, 66.0]), np.array([150, 176, 218.0]))


def light(nx, ny, nz, colours):
    dark, sky_col, key_col = colours
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / n, ny / n, nz / n
    sky = np.clip(nx * SKY[0] + ny * SKY[1] + nz * SKY[2], 0, 1)
    key = np.clip(nx * KEY[0] + ny * KEY[1] + nz * KEY[2], 0, 1)
    return dark + sky_col * sky[..., None] + key_col * ((key ** 3) * sun)[..., None]


def relief(vx, vy, step, depth, colours):
    """Fins on lines from (vx, vy), step radians apart; depth in pixels."""
    u = np.arctan2(x - vx, y - vy) / step
    fin = np.floor(u)
    f = u - fin
    # each fin's depth drifts along it, from one stretch to the next
    run = np.log(y - vy) / 0.16 + h01(fin, 0, 3.3)
    k = np.floor(run)
    blend = smooth(0.35, 0.65, run - k)
    amp = depth * (0.45 + 0.9 * ((1 - blend) * h01(fin, k, 2.2) + blend * h01(fin, k + 1, 2.2)))
    r2 = (x - vx) ** 2 + (y - vy) ** 2
    dudx, dudy = (y - vy) / r2 / step, -(x - vx) / r2 / step
    slope = np.pi * np.sin(2 * np.pi * f)          # the half-pipe's profile, (1 - cos) / 2
    col = light(-amp * slope * dudx, -amp * slope * dudy, np.ones_like(x), colours)
    gap = np.abs(f - np.round(f)) / np.hypot(dudx, dudy)
    return col * (0.7 + 0.3 * smooth(0, 1.6, gap))[..., None]


dst = sys.argv[1] if len(sys.argv) > 1 else '.'
# companies: the fins meet far above the frame; investors: nearly upright
for stem, make in (('companies-fins', lambda: relief(960.0, -1300.0, 0.019, 26, COMPANIES)),
                   ('investors-flutes', lambda: relief(960.0, -7000.0, 0.0052, 22, INVESTORS))):
    img = Image.fromarray(np.clip(make(), 0, 255).astype(np.uint8), 'RGB')
    for name, box in ((stem, (0, 0, W, H // 2)), (f'{stem}-band', (0, H // 2, W, H))):
        part = img.crop(box)
        part.save(os.path.join(dst, f'{name}.webp'), 'WEBP', quality=76, method=6)
        for w in (1024, 640):
            part.resize((w, round(w * part.height / part.width)), Image.LANCZOS).save(
                os.path.join(dst, f'{name}-{w}.webp'), 'WEBP', quality=76, method=6)
        part.crop((464, 0, 1456, part.height)).save(os.path.join(dst, f'{name}-crop.webp'), 'WEBP', quality=76, method=6)
        print(name, os.path.getsize(os.path.join(dst, f'{name}.webp')), 'B')
