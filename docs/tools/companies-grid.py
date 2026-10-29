# The Companies hero's architecture as a pattern (29.10): the generated
# photograph of towers seen from below gave way to a pattern with the same
# angles - three fields of glass panels in three-point perspective, the
# mullions converging on one point above the frame (the left field leaning
# right, the right one leaning left, the middle one upright on a
# cylinder's curve) and the floors running to a vanishing point far out on
# each side, arched in the middle. Grey only: the page grades it in its own
# colours (styles.css, .hz-photo), as it did the photograph, and the light
# sits where the photograph's did - brightest down the middle, deep at the
# sides - so the copy keeps its contrast.
#
# One tall frame, 1920 x 2742: the top half is the hero, the bottom half
# How We Work, which continues it. Every pixel is worked out from where it
# lies on the grid (no polygons), so the panes meet without gaps and the
# lines are smooth at any angle.
#
#   python3 docs/tools/companies-grid.py <out dir>
#     companies-grid{,-1024,-640,-crop}.webp       the hero
#     companies-grid-band{,-1024,-640,-crop}.webp  How We Work
import os, sys

import numpy as np
from PIL import Image

W, H = 1920, 2742
VX, VY = 960.0, -450.0                 # where the mullions meet, above the frame
SIDE_VP = 3560.0, 3600.0               # the floors' vanishing points: VX -+ this x, this y
SEAM = 310.0                           # half the middle field's width at the frame's foot
PANE = 58.0                            # pane width at the seams, at the foot
GROW = 1.035                           # panes widen by this, pane by pane, away from the middle
FLOOR = 0.9825                         # floor to floor, in the perspective's terms
FINS = 22                              # panes across the middle's half-cylinder
ARCH = 0.16                            # how far the middle's floors arch

y, x = np.mgrid[0:H, 0:W].astype(np.float64) + 0.5
depth = (y - VY) / (H - VY)            # 1 at the foot, 0 at the vanishing point
xb = VX + (x - VX) / depth             # where a pixel's mullion meets the foot
off = xb - VX
mid = np.abs(off) < SEAM
sign = np.sign(off)


def seam_depth(sx):
    """Depth at which the line from the side's vanishing point through
    each pixel crosses that side's seam."""
    px, py = VX + sx * SIDE_VP[0], SIDE_VP[1]
    # seam: from (VX + sx*SEAM, H) towards (VX, VY); pixel line: (px, py) to (x, y)
    ax, ay = VX + sx * SEAM, float(H)
    dx, dy = VX - ax, VY - ay
    ex, ey = x - px, y - py
    den = dx * ey - dy * ex
    t = ((px - ax) * ey - (py - ay) * ex) / den
    ys = ay + t * dy
    return (ys - VY) / (H - VY)


# the side fields: mullion number from the seam outwards, floor number down
d = np.maximum(np.abs(off) - SEAM, 0)
u_side = np.log1p(d * (GROW - 1) / PANE) / np.log(GROW)
sd = np.where(sign < 0, seam_depth(-1), seam_depth(1))
# far up a side its floors would meet the seam beyond the vanishing point:
# there they are packed past seeing, so that corner keeps the mullions only
packed = (sd < 0.03) & ~mid
v_side = np.log(np.clip(sd, 0.03, None)) / np.log(FLOOR)

# the middle: fins on a half-cylinder, floors arched over it
s = np.clip(off / SEAM, -1, 1)
u_mid = (np.degrees(np.arcsin(s)) + 90) / (180 / FINS)
r = SEAM * depth
v_mid = np.log(np.clip((y + ARCH * r * np.sqrt(1 - s * s) - VY) / (H - VY), 1e-4, None)) / np.log(FLOOR)

u = np.where(mid, u_mid, u_side)
v = np.where(mid, v_mid, v_side)
field = np.where(mid, 0, np.where(sign < 0, 1, 2))


def spacing(c):
    """Pixels from one grid line of c to the next, at each pixel."""
    gy, gx = np.gradient(c)
    return 1 / (np.hypot(gx, gy) + 1e-9)


def edge(c, width):
    """1 on a grid line of coordinate c, smoothed over a pixel; where the
    lines crowd closer than a few pixels (towards the vanishing points)
    they fade out rather than fuse into a glare."""
    gap = spacing(c)
    dist = np.abs(c - np.round(c)) * gap
    return np.clip(width / 2 + 0.5 - dist, 0, 1) * np.clip((gap - 8) / 12, 0, 1)


def light(x, y):
    """The photograph's light, 0-255: a bright middle dimming down the
    frame, inner sides catching some of it, deep outer sides."""
    v = y / H
    md = 182 - 70 * v
    side = 120 - 80 * np.minimum(1, v * 1.6)
    outer = 104 - 64 * np.minimum(1, v * 2.2)
    dd = np.abs(x - VX) / (310 + 0.10 * (H - y))
    return np.where(dd < 1, md - 18 * dd * dd,
                    np.where(dd < 2.2, md - 18 + (side - md + 18) * (dd - 1) / 1.2,
                             side + (outer - side) * np.minimum(1, (dd - 2.2) / 1.6)))


# each pane its own shade: a hash of its field and grid numbers
cu, cv = np.floor(u), np.floor(v)
h = np.sin(cu * 12.9898 + cv * 78.233 + field * 37.719) * 43758.5453
rnd = h - np.floor(h)
calm = np.clip((np.minimum(spacing(u), spacing(v)) - 6) / 10, 0, 1) * ~packed
shade = 0.89 + calm * (0.1 * rnd - 0.05 + np.where(rnd > 0.94, 0.16, 0))
base = light(x, y) * shade

frame = np.maximum(edge(u, np.where(mid, 2.0, 2.4)) * np.where(mid, 0.93, 1.0), edge(v, 1.5) * 0.73 * ~packed)
lum = base + frame * (60 + 0.25 * base)
out = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8))

dst = sys.argv[1] if len(sys.argv) > 1 else '.'
for name, box in (('companies-grid', (0, 0, W, H // 2)), ('companies-grid-band', (0, H // 2, W, H))):
    part = out.crop(box).convert('RGB')
    part.save(os.path.join(dst, f'{name}.webp'), 'WEBP', quality=74, method=6)
    for w in (1024, 640):
        part.resize((w, round(w * part.height / part.width)), Image.LANCZOS).save(
            os.path.join(dst, f'{name}-{w}.webp'), 'WEBP', quality=74, method=6)
    part.crop((464, 0, 1456, part.height)).save(os.path.join(dst, f'{name}-crop.webp'), 'WEBP', quality=74, method=6)
    print(name, os.path.getsize(os.path.join(dst, f'{name}.webp')), 'B')
