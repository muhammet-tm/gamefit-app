"""Measures where each athlete's head sits in all 40 cast pictures.

    python scripts/measure-athlete-anchors.py <sourceDir> > src/components/avatar/anchors.json

The relaxed (idle) picture of each athlete was measured by hand on a 25 px
grid (IDLE below, source pixels of the 1664x2496 originals): the face's
centre line, the top of the head, the eye line, the chin, and the face width.
For the other three pictures of the same person, the face from the idle
picture is found by normalised cross-correlation over a small range of
scales, and the idle measurements are carried across with the match's
offset and scale. The result drives where Kit Bag wear items sit.

Needs Python 3 with numpy and Pillow. Run it again only if a cast picture
changes, then check the overlays on /avatar-gallery.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

# cx, top of head (hair, hijab or visor; not a bun), eye line, chin, face width
IDLE = {
    'omar':   (860, 256, 403, 531, 190),
    'aisha':  (819, 190, 365, 494, 170),
    'nadia':  (831, 175, 365, 477, 190),
    'daniel': (831, 140, 304, 469, 200),
    'kofi':   (827, 156, 371, 500, 190),
    'yara':   (819, 206, 406, 512, 185),
    'mei':    (837, 150, 290, 440, 185),
    'rami':   (837, 231, 371, 512, 200),
    'sara':   (831, 106, 306, 444, 165),
    'arjun':  (831, 246, 375, 512, 185),
}
POSES = ['idle', 'celebrate', 'elite', 'rest']

# Matches that scored low or landed on the eyebrows instead of the eyes,
# corrected by hand on the same grid (15 Nov 2026). Only the listed keys
# replace the matched values.
OVERRIDES = {
    ('omar', 'celebrate'): dict(cx=812),
    ('omar', 'rest'): dict(top=165, eyes=338),
    ('nadia', 'celebrate'): dict(cx=845),
    ('nadia', 'rest'): dict(cx=800, top=118, eyes=300, chin=480, faceW=175),
    ('aisha', 'rest'): dict(cx=824, top=198, eyes=384, chin=496, faceW=175),
    ('rami', 'rest'): dict(top=322, eyes=480),
}

# Where a wear item must not be drawn, because the picture already has
# something there: headwear (hijab, visor, cap, beanie, headphones), hands
# or arms over the head, a medal of its own, or hands joined at the chest.
HEAD_BUSY = {
    'aisha': POSES,
    'nadia': ['idle', 'celebrate', 'elite'],
    'daniel': ['rest'], 'kofi': ['rest'], 'rami': ['rest'], 'yara': ['rest'],
    'omar': ['celebrate'], 'sara': ['celebrate'], 'arjun': ['celebrate'],
}
# Single items that look wrong on someone in every picture: Yara's bun pokes
# up through the top of a cap.
ITEM_BUSY = {
    'yara': {'training_cap': POSES},
}
CHEST_BUSY = {
    'daniel': ['elite'], 'aisha': ['celebrate'], 'yara': ['celebrate'],
    'sara': ['elite', 'rest'], 'arjun': ['elite'],
    'nadia': ['rest'], 'omar': ['rest'],  # phones held at the chest
}
DOWN = 4  # match at quarter resolution
SCALES = [0.90, 0.93, 0.96, 1.0, 1.04, 1.08, 1.12]


def gray(path):
    im = Image.open(path).convert('L')
    return im.resize((im.width // DOWN, im.height // DOWN), Image.LANCZOS)


def ncc_map(search, tmpl):
    """Normalised cross-correlation of tmpl over every position in search."""
    th, tw = tmpl.shape
    t = tmpl - tmpl.mean()
    tn = np.sqrt((t * t).sum())
    H, W = search.shape
    F = np.fft.rfft2(search, s=(H + th, W + tw))
    T = np.fft.rfft2(t[::-1, ::-1], s=(H + th, W + tw))
    corr = np.fft.irfft2(F * T, s=(H + th, W + tw))[th - 1:H, tw - 1:W]
    c1 = np.cumsum(np.cumsum(np.pad(search, ((1, 0), (1, 0))), 0), 1)
    c2 = np.cumsum(np.cumsum(np.pad(search ** 2, ((1, 0), (1, 0))), 0), 1)
    s1 = c1[th:, tw:] - c1[:-th, tw:] - c1[th:, :-tw] + c1[:-th, :-tw]
    s2 = c2[th:, tw:] - c2[:-th, tw:] - c2[th:, :-tw] + c2[:-th, :-tw]
    var = np.maximum(s2 - s1 ** 2 / (th * tw), 1e-6)
    return corr / (np.sqrt(var) * tn)


def main(src):
    out = {}
    for who, (cx, top, eyes, chin, fw) in IDLE.items():
        idle = np.asarray(gray(os.path.join(src, f'GameFit_athlete_{who}_idle.png')), dtype=np.float64)
        # template: the face from just above the eyes to just below the chin
        x0, x1 = (cx - 120) // DOWN, (cx + 120) // DOWN
        y0, y1 = (eyes - 70) // DOWN, (chin + 15) // DOWN
        tmpl = idle[y0:y1, x0:x1]
        out[who] = {}
        for pose in POSES:
            m = dict(cx=cx, top=top, eyes=eyes, chin=chin, faceW=fw, score=1.0)
            if pose != 'idle':
                img = gray(os.path.join(src, f'GameFit_athlete_{who}_{pose}.png'))
                best = None
                for s in SCALES:
                    t = np.asarray(Image.fromarray(tmpl).resize(
                        (max(8, round(tmpl.shape[1] * s)), max(8, round(tmpl.shape[0] * s))), Image.LANCZOS),
                        dtype=np.float64)
                    # search the upper part of the frame, where heads are
                    area = np.asarray(img, dtype=np.float64)[: 1100 // DOWN, 300 // DOWN: 1364 // DOWN]
                    r = ncc_map(area, t)
                    v, u = np.unravel_index(np.argmax(r), r.shape)
                    if best is None or r[v, u] > best[0]:
                        best = (r[v, u], s, (u + 300 // DOWN) * DOWN, v * DOWN)
                score, s, ux, vy = best
                ox, oy = x0 * DOWN, y0 * DOWN
                tr = lambda val, o, n: round((val - o) * s + n)
                m = dict(cx=tr(cx, ox, ux), top=tr(top, oy, vy), eyes=tr(eyes, oy, vy),
                         chin=tr(chin, oy, vy), faceW=round(fw * s), score=round(float(score), 3))
            if (who, pose) in OVERRIDES:
                m.update(OVERRIDES[(who, pose)])
                m['score'] = 'hand'
            m['hide'] = ([] + (['head'] if pose in HEAD_BUSY.get(who, []) else [])
                         + (['chest'] if pose in CHEST_BUSY.get(who, []) else [])
                         + [item for item, poses in ITEM_BUSY.get(who, {}).items() if pose in poses])
            out[who][pose] = m
            print(f'{who:7s} {pose:9s} {m}', file=sys.stderr)
    json.dump(out, sys.stdout, indent=1)


if __name__ == '__main__':
    main(sys.argv[1])
