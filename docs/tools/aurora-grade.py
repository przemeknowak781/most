# Gradient-map a generated aurora onto the Home hero's palette: each pixel's
# luminance picks a colour on the ramp; a little of the original colour is
# kept for life. The Our Team and Our Expertise skies were generated images
# (ElevenLabs, FLUX 3, 16:9 2K) passed through this; since 13.10 they are
# the first frame of their film (aurora-film.py, which grades with these
# ramps), saved as WebP at 2560, 1440 and 960 wide.
# usage: python3 -I docs/tools/aurora-grade.py <in.png> <out.png> <team|expertise> [keep]
import sys
import numpy as np
from PIL import Image

RAMPS = {
    'team': [(0.0, '#070b15'), (0.12, '#0d1421'), (0.24, '#161c2a'), (0.36, '#2b2a34'), (0.48, '#53494d'),
             (0.58, '#6d463a'), (0.68, '#9a654b'), (0.78, '#b57353'), (0.88, '#cf9268'), (1.0, '#ecc6a0')],
    'expertise': [(0.0, '#0b0807'), (0.14, '#1a1414'), (0.28, '#2a1f1e'), (0.4, '#412f2f'), (0.52, '#6d463a'),
                  (0.64, '#9a654b'), (0.76, '#b57f62'), (0.88, '#cfa888'), (1.0, '#efdcc4')],
}

def hexrgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]

if __name__ == '__main__':
    src, dst, kind = sys.argv[1], sys.argv[2], sys.argv[3]
    keep = float(sys.argv[4]) if len(sys.argv) > 4 else 0.15
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255.0
    lum = 0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2]
    # stretch the luminance so the ramp is used end to end
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99.7)
    t = np.clip((lum - lo) / (hi - lo), 0, 1)
    stops = RAMPS[kind]
    xs = np.array([s[0] for s in stops])
    cols = np.array([hexrgb(s[1]) for s in stops], dtype=np.float32) / 255.0
    mapped = np.stack([np.interp(t, xs, cols[:, k]) for k in range(3)], axis=-1)
    out = mapped * (1 - keep) + im * keep
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst)
    print(dst)
