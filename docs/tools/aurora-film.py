# The aurora heroes' film (Our Team, Our Expertise; styles.css AURORA HEROES).
#
# One generated clip (ElevenLabs, FLUX 3 video, 16:9 1080p, 10 s, start and
# end frame the Team sky's source still) of the curtains swaying is graded
# onto the Home palette frame by frame - the ramps of aurora-grade.py, the
# luminance stretch fixed from the start still so it never flickers - its
# last 1.2 s crossfaded into its start so it loops without a seam, and
# encoded as VP9 WebM and H.264 MP4 at 1920 and 1280 wide (aurora-*-loop).
# The loop's first frame, at 2560, is the picture in the markup
# (aurora-*.webp at 2560, 1440 and 960, saved from <out-base>-poster.png).
#
# For Our Expertise the clip is graded in browns and sand and laid into the
# sky of the Expertise scene (a generated still of sharp peaks, graded with
# aurora-grade.py): the scene's skyline is found column by column, the clip
# is drawn up so its curtains' feet meet the skyline, and over the skyline
# the scene's sky, dimmed, takes the clip's light (screen); the peaks and
# the mist stay the still's.
#
# usage (numpy, scipy, Pillow, imageio-ffmpeg):
#   python3 -I docs/tools/aurora-film.py <clip.mp4> <start.png> team <out-base>
#   python3 -I docs/tools/aurora-film.py <clip.mp4> <start.png> expertise <out-base> <scene-graded.png>
import importlib.util
import os
import re
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter

spec = importlib.util.spec_from_file_location('aurora_grade', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aurora-grade.py'))
aurora_grade = importlib.util.module_from_spec(spec)
spec.loader.exec_module(aurora_grade)
RAMPS, hexrgb = aurora_grade.RAMPS, aurora_grade.hexrgb

FADE_S = 1.2  # the loop's crossfade
KEEP = 0.15  # the clip's own colour kept, as the stills
LIFT, SCALE = 0.2, 1.0  # Expertise: the clip drawn up a fifth of its height
DIM, GAIN = 0.55, 1.0  # Expertise: the scene's sky dimmed to, the clip's light


def skyline(scene):
    """per column, the first strong drop in brightness under the sky; the
    search starts lower on the left, where the foothills stand in mist, and
    narrow spikes (a curtain's foot taken for a peak) go to the median"""
    H, W = scene.shape[:2]
    L = gaussian_filter(0.2126 * scene[..., 0] + 0.7152 * scene[..., 1] + 0.0722 * scene[..., 2], 2)
    gy = np.diff(L, axis=0)
    ys = np.empty(W, np.float32)
    for x in range(W):
        f = x / W
        y0 = int(H * (0.71 if f < 0.47 else 0.68 if f < 0.68 else 0.55))
        idx = np.where(gy[y0:, x] < -0.006)[0]
        ys[x] = y0 + (idx[0] if len(idx) else H - y0 - 1)
    med = median_filter(ys, size=round(61 * W / 2736), mode='nearest')
    return np.where(ys < med - 24 * H / 1536, med, ys)


def matte(hz, W, H):
    """1 over the skyline, 0 under it: soft in the mist on the left, sharp
    along the peaks on the right"""
    feather = np.interp(np.arange(W) / W, [0, 0.45, 0.6, 0.68, 1], [26, 26, 10, 3, 3]) * W / 2736
    m = np.clip((hz[None, :] - np.arange(H)[:, None]) / feather[None, :], 0, 1)
    return gaussian_filter(m, 1.2 * W / 2736)


def place(sky, W, H):
    """the clip's frame, scaled to the scene and drawn up"""
    s = np.asarray(Image.fromarray(sky).resize((int(W * SCALE), int(H * SCALE)), Image.LANCZOS)).astype(np.float32) / 255
    out = np.zeros((H, W, 3), np.float32)
    x0, y0 = (s.shape[1] - W) // 2, int(H * LIFT)
    part = s[y0:y0 + H, x0:x0 + W]
    out[:part.shape[0]] = part
    return out


def compose(scene, sky, M):
    base = scene * (1 - M[..., None] * (1 - DIM))
    return 1 - (1 - base) * (1 - np.clip(sky * GAIN, 0, 1) * M[..., None])


def u8(a):
    return (np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)


src, start, kind, base = sys.argv[1:5]
FF = imageio_ffmpeg.get_ffmpeg_exe()
probe = subprocess.run([FF, '-hide_banner', '-i', src], capture_output=True, text=True).stderr
m = re.search(r'(\d{3,5})x(\d{3,5})', probe.split('Video:')[1])
W, H = int(m.group(1)), int(m.group(2))
fps = float(re.search(r'([\d.]+) fps', probe).group(1))
raw = subprocess.run([FF, '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
N = len(frames)

r = np.asarray(Image.open(start).convert('RGB').resize((W, H))).astype(np.float32) / 255
rl = 0.2126 * r[..., 0] + 0.7152 * r[..., 1] + 0.0722 * r[..., 2]
lo, hi = np.percentile(rl, 1), np.percentile(rl, 99.7)
xs = np.array([s[0] for s in RAMPS[kind]])
cols = np.array([hexrgb(s[1]) for s in RAMPS[kind]], dtype=np.float32) / 255


def grade(f):
    f = f.astype(np.float32) / 255
    t = np.clip((0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2] - lo) / (hi - lo), 0, 1)
    return np.stack([np.interp(t, xs, cols[:, k]) for k in range(3)], axis=-1) * (1 - KEEP) + f * KEEP


if kind == 'expertise':
    scene_full = np.asarray(Image.open(sys.argv[5]).convert('RGB')).astype(np.float32) / 255
    SH, SW = scene_full.shape[:2]
    hz_full = skyline(scene_full)
    OW, OH = W, round(W * SH / SW / 2) * 2  # the film takes the scene's shape
    scene = np.asarray(Image.fromarray(u8(scene_full)).resize((OW, OH), Image.LANCZOS)).astype(np.float32) / 255
    M = matte(np.interp((np.arange(OW) + 0.5) * SW / OW - 0.5, np.arange(SW), hz_full) * OH / SH, OW, OH)
else:
    OW, OH = W, H

K = max(1, int(round(FADE_S * fps)))
out = np.empty((N - K, OH, OW, 3), np.uint8)
first = None
for j in range(K, N):
    g = grade(frames[j])
    i = j - (N - K)
    if i >= 0:  # the last K frames melt into the first K
        a = (i + 1) / K
        g = g * (1 - a) + grade(frames[i]) * a
    if first is None:
        first = g
    out[j - K] = u8(compose(scene, place(u8(g), OW, OH), M) if kind == 'expertise' else g)

if kind == 'expertise':  # the peaks at the scene's full sharpness
    poster = Image.fromarray(u8(compose(scene_full, place(u8(first), SW, SH), matte(hz_full, SW, SH))))
else:
    poster = Image.fromarray(out[0])
poster.resize((2560, round(2560 * poster.height / poster.width)), Image.LANCZOS).save(base + '-poster.png')

for w, suf in [(1920, ''), (1280, '-720')]:
    h = round(OH * w / OW / 2) * 2
    for args, ext in [(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38' if w > 1500 else '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2'], 'webm'),
                      (['-c:v', 'libx264', '-crf', '26' if w > 1500 else '27', '-preset', 'slow', '-movflags', '+faststart'], 'mp4')]:
        path = f'{base}{suf}.{ext}'
        p = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(fps), '-i', '-',
                              '-vf', f'scale={w}:{h}:flags=lanczos'] + args + ['-pix_fmt', 'yuv420p', '-an', path], stdin=subprocess.PIPE)
        p.stdin.write(out.tobytes())
        p.stdin.close()
        p.wait()
        print(path, os.path.getsize(path))
