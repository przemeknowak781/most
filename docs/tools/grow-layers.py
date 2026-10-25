# The mountain layers behind the closing band's ridge (?footer=layers): three
# ranges, farther ones higher and paler, drawn in the overlay's own box
# (footer.svg, 1440 x 437, bottom-aligned with it) so they rise behind the
# walkers' ridge where it dips - the valley between the walkers and the
# right-hand slope - and hide behind it elsewhere. Smooth, stylised ranges
# (a few broad peaks, a little roughness), not a photograph: the meeting of
# 25.10 asked for depth that is restrained and not too realistic.
#
#   python3 docs/tools/grow-layers.py      writes grow-layer-far|mid|near.svg
#
# Each file is a white silhouette used as a mask (styles.css paints it in
# the page's colours), so one set serves every page.
import math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 1440, 437

def ridge(seed, base, peaks, rough, step=6):
    rnd = random.Random(seed)
    bumps = [(rnd.uniform(-100, W + 100), rnd.uniform(90, 260), rnd.uniform(0.6, 1.0) * peaks) for _ in range(9)]
    phases = [rnd.uniform(0, 2 * math.pi) for _ in range(3)]
    pts = []
    for x in range(0, W + step, step):
        x = min(x, W)
        y = base
        for cx, wdt, amp in bumps:
            y -= amp * math.exp(-((x - cx) / wdt) ** 2)
        y += rough * (math.sin(x / 23 + phases[0]) + 0.6 * math.sin(x / 9.7 + phases[1]) + 0.35 * math.sin(x / 4.3 + phases[2]))
        # overlapping peaks flatten out softly under the cap
        if y < 150:
            y = 150 - 20 * math.tanh((150 - y) / 20)
        pts.append((x, y))
    return pts

# base line and peak height in the overlay's units; the far range keeps
# under y = 130, clear of the band's title, which stands higher at the left
LAYERS = {
    'far': ridge(7, 214, 50, 1.4),
    'mid': ridge(21, 246, 42, 1.8),
    'near': ridge(42, 280, 36, 2.4),
}

for name, pts in LAYERS.items():
    d = 'M0 437 L' + ' L'.join(f'{x} {y:.1f}' for x, y in pts) + f' L{W} 437 Z'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none"><path d="{d}" fill="#fff"/></svg>\n'
    open(os.path.join(ROOT, f'grow-layer-{name}.svg'), 'w').write(svg)
    print(name, 'crest', round(min(y for _, y in pts)), '-', round(max(y for _, y in pts)), len(svg), 'B')
