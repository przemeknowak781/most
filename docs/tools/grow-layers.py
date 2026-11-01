# The mountain ranges behind the closing band's ridge on the audience pages
# (shipped since 31.10; ?mountains=none hides them), after the team's
# reference of 29.10: three ranges in haze - a far one with a sharp peak in
# the middle and a high massif to the right of it, a lower hill on the left
# and a long low ridge in front - each one flat in colour along its crest and
# paling into mist towards its foot, where the next one stands out against
# it. The ridgelines are traced from the reference itself (its edges where
# the tone steps darker, simplified to a pixel or two), so the slopes run
# long and straight to sharp tops with the small breaks of real rock, rather
# than rounded humps. They are in the reference's pixels (1750 wide, the
# massif's top at y 295).
#
# Drawn in the overlay's own box (footer.svg, 1440 x 437, bottom-aligned
# with it). The reference has far more sky over its walkers than the band
# has over ours, so the ranges come in at two thirds of its size, both ways
# (the slopes keep its angles), with the massif's top at y 50: it rises in
# the band's open middle, between the title's last word and the button
# (from 1024px the title ends by x 670 and the button starts at x 1089, both
# down to y 75). Past the massif the reference's slope falls more steeply
# here, to clear the button, and the ranges run on to the box's right edge
# low behind the walkers' ridge. Where the reference's own ranges hide one
# another the line is carried on with a little midpoint displacement.
#
#   python3 docs/tools/grow-layers.py      writes grow-layer-1..3.svg
#
# Each file is a white silhouette used as a mask (styles.css paints it in
# the page's colours): opaque along the crest and thinning towards its foot,
# so the mist is the sky showing through. One set serves every page.
import os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 1440, 437
SCALE, TOP = 0.67, 50          # the reference at two thirds; its y 295 here

FAR = [
    (0, 395), (25, 382), (43, 377), (44, 374), (51, 371), (60, 370),
    (88, 386), (100, 396), (116, 403), (155, 427), (166, 430), (681, 460),
    (684, 462), (701, 460), (706, 457), (764, 462), (775, 454), (776, 467),
    (780, 467), (781, 465), (792, 465), (797, 459), (811, 457), (815, 452),
    (848, 442), (851, 438), (861, 435), (886, 419), (901, 417), (917, 406),
    (922, 406), (938, 397), (964, 378), (972, 379), (979, 382), (980, 385),
    (1016, 398), (1032, 396), (1056, 405), (1092, 414), (1102, 414),
    (1105, 410), (1124, 411), (1127, 409), (1149, 413), (1173, 395),
    (1192, 397), (1196, 394), (1215, 392), (1217, 395), (1225, 396),
    (1244, 387), (1260, 375), (1268, 373), (1275, 366), (1293, 358),
    (1327, 367), (1334, 364), (1355, 367), (1386, 365), (1395, 361),
    (1416, 361), (1420, 357), (1428, 358), (1460, 334), (1479, 333),
    (1492, 323), (1506, 321), (1541, 296), (1548, 294), (1558, 301),
    (1568, 302), (1588, 314), (1594, 314), (1616, 329), (1624, 328),
    (1638, 331), (1650, 327), (1662, 327), (1731, 357), (1749, 358),
]
HILL = [
    (166, 430), (189, 427), (193, 422), (197, 422), (206, 414), (219, 408),
    (232, 411), (238, 417), (248, 417), (279, 430), (288, 430), (290, 433),
    (296, 433), (297, 430), (316, 430), (323, 426), (342, 427), (355, 422),
    (356, 425), (362, 425), (367, 430), (374, 430),
]
FRONT = [
    (56, 465), (72, 468), (75, 465), (90, 465), (94, 462), (110, 462),
    (115, 459), (165, 457), (173, 460), (247, 467), (258, 470), (259, 473),
    (268, 472), (272, 475), (282, 475), (307, 483), (329, 484), (338, 489),
    (357, 486), (373, 493), (388, 490), (430, 495), (437, 494), (439, 491),
    (471, 492), (476, 486), (532, 491), (565, 476), (583, 489), (587, 489),
    (591, 494), (602, 494), (603, 492), (636, 494), (661, 484), (728, 489),
    (734, 484), (755, 484), (758, 481), (885, 481), (889, 484), (912, 483),
    (935, 486), (936, 489), (938, 486), (941, 489), (949, 488), (958, 492),
    (973, 493), (987, 489), (993, 484), (999, 484), (1026, 469), (1031, 469),
    (1040, 460), (1056, 461), (1076, 454), (1077, 457), (1085, 456),
    (1090, 461), (1117, 457), (1152, 475), (1155, 479), (1212, 493),
    (1230, 502), (1241, 502), (1242, 505), (1260, 510), (1266, 515),
    (1307, 524), (1312, 522), (1339, 524), (1373, 522), (1378, 523),
    (1381, 529), (1405, 534),
]


def rough(pts, seed):
    """Break any run longer than 24 units with a little midpoint
    displacement, so that no stretch of slope is ruled."""
    rnd = random.Random(seed)
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        seg = [a, b]
        while max(q[0] - p[0] for p, q in zip(seg, seg[1:])) > 24:
            nxt = [seg[0]]
            for p, q in zip(seg, seg[1:]):
                if q[0] - p[0] > 24:
                    amp = (q[0] - p[0]) * 0.035
                    nxt.append(((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + rnd.uniform(-amp, amp)))
                nxt.append(q)
            seg = nxt
        out += seg[1:]
    return out


# the far range falls more steeply past the massif's top (x 1545), to clear
# the button; the hill and the front ridge run on where the reference hides
# them
FAR = [(x, y if x <= 1545 else 295 + (y - 295) * 2.2) for x, y in FAR]
HILL = [(96, 468), (130, 452)] + HILL + [(420, 442), (470, 452), (520, 466), (570, 486), (640, 530)]
FRONT = [(0, 455)] + FRONT + [(1480, 548), (1600, 566), (1750, 580)]

# past the reference's right edge, in this box: (share of the way to x 1440,
# rise or fall from the last point)
RUN_ON = {'1': [(0.3, 6), (0.55, -4), (0.8, 8), (1.0, 4)], '2': [(1.0, 60)], '3': [(0.4, 14), (1.0, 34)]}

# name, ridgeline, seed, mist (y where it starts, y where it is thickest,
# the opacity left there)
LAYERS = [
    ('1', FAR, 11, (TOP, TOP + 160, 0.22)),
    ('2', HILL, 23, (TOP + 70, TOP + 175, 0.28)),
    ('3', FRONT, 37, (TOP + 105, TOP + 200, 0.3)),
]

for name, pts, seed, (g0, g1, gend) in LAYERS:
    p = [(x * SCALE, TOP + (y - 295) * SCALE) for x, y in rough(pts, seed)]
    if p[0][0] > 0:
        p = [(0, p[0][1] + 40)] + p
    if p[-1][0] < W:
        x0, y0 = p[-1]
        p += rough([(x0, y0)] + [(x0 + (W - x0) * f, y0 + dy) for f, dy in RUN_ON[name]], seed + 1)[1:]
    d = f'M0 {H} L' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in p) + f' L{W} {H}Z'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">'
           f'<linearGradient id="m" gradientUnits="userSpaceOnUse" x1="0" y1="{g0:.0f}" x2="0" y2="{g1:.0f}">'
           f'<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="{gend}"/>'
           '</linearGradient>'
           f'<path d="{d}" fill="url(#m)"/></svg>\n')
    open(os.path.join(ROOT, f'grow-layer-{name}.svg'), 'w').write(svg)
    print(name, 'crest', round(min(y for _, y in p)), '-', round(max(y for _, y in p)), len(svg), 'B')
