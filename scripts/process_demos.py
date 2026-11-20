#!/usr/bin/env python3
"""Turns the exercise photos in demo-src/ into matching app frames in public/demo/.

For every photo it cuts the person out (two ONNX segmentation models), evens out their brightness
and colour, scales both frames of an exercise to the same body size, stands them on the same
floor line, and puts them on one shared studio background with a soft floor shadow. Alternating
moves get mirrored frames so the other side shows too.

Usage:  python3 scripts/process_demos.py [models_dir]
Needs:  pip install onnxruntime mediapipe pillow numpy   (mediapipe needs libegl1 on Linux)
Models (downloaded into models_dir on first run, about 380 MB):
  u2net_human_seg.onnx, isnet-general-use.onnx from github.com/danielgatis/rembg releases,
  pose_landmarker_heavy.task from MediaPipe (to measure body size from limb lengths)
Writes: public/demo/<id>-<n>.webp and src/data/demos.json ({ id: frame count })
"""
import json, os, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, 'demo-src'), os.path.join(ROOT, 'public', 'demo')
MODELS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '.models')
URL = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/'
S = 960                 # output size (square)
FLOOR = 0.885 * S       # where feet touch the floor
BODY = 0.80 * S         # standing body height, the same in every exercise
FILL = (0.86, 0.92)     # shrink an exercise only if a frame would pass 86% of the height or 92% of the width

# Frames per exercise: (source exercise, source frame, mirrored). Default is a, then b if it exists.
# Mirrored frames show the other side for moves that alternate left and right.
SEQ = {
    'march':         [('march', 'a', 0), ('march', 'a', 1)],
    'high_knees':    [('high_knees', 'a', 0), ('high_knees', 'a', 1)],
    'side_bend':     [('side_bend', 'a', 0), ('side_bend', 'a', 1)],
    'knee_drive':    [('knee_drive', 'a', 0), ('knee_drive', 'b', 0), ('knee_drive', 'a', 0), ('knee_drive', 'b', 1)],
    'cossack_squat': [('cossack_squat', 'a', 0), ('cossack_squat', 'b', 0), ('cossack_squat', 'a', 0), ('cossack_squat', 'b', 1)],
    'torso_twist':   [('torso_twist', 'a', 0), ('torso_twist', 'b', 0), ('torso_twist', 'a', 0), ('torso_twist', 'b', 1)],
    # No step-jack photos yet: the jumping-jack pair is the closest match.
    'step_jacks':    [('jumping_jacks', 'a', 0), ('jumping_jacks', 'b', 0)],
}
PROPS = {'chair_sit_stand', 'incline_pushup', 'decline_pushup'}   # keep the chair in the cut-out
WALL = {'wall_pushup': 'right', 'wall_sit': 'left'}                 # draw a wall on this side
SHADOW = {'forward_fold', 'breathing'}                            # the cut-out kept a floor shadow: trim below the feet
AIR = {('jump_squat', 'b'): 0.07, ('burpee', 'b'): 0.07}           # airborne frames sit above the floor


# ---------- segmentation ----------
def model(name):
    import onnxruntime as ort
    path = os.path.join(MODELS, name)
    if not os.path.exists(path):
        os.makedirs(MODELS, exist_ok=True)
        print('downloading', name)
        urllib.request.urlretrieve(URL + name, path)
    return ort.InferenceSession(path, providers=['CPUExecutionProvider'])


def predict(sess, im, size, std):
    x = np.asarray(im.resize((size, size), Image.LANCZOS)).astype(np.float32) / 255
    x = ((x - (0.485, 0.456, 0.406)) / std).transpose(2, 0, 1)[None].astype(np.float32)
    m = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS)).astype(np.float32) / 255


POSE_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task'
# Limb lengths as a share of standing height (Drillis and Contini). Foreshortening only makes a
# limb look shorter, so the upper estimates are the reliable ones.
SEGMENTS = [((11, 23), 0.30), ((12, 24), 0.30), ((23, 25), 0.245), ((24, 26), 0.245), ((25, 27), 0.246),
            ((26, 28), 0.246), ((11, 13), 0.186), ((12, 14), 0.186), ((13, 15), 0.146), ((14, 16), 0.146)]


def pose_model():
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    path = os.path.join(MODELS, 'pose_landmarker_heavy.task')
    if not os.path.exists(path):
        print('downloading pose model')
        urllib.request.urlretrieve(POSE_URL, path)
    det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=path), running_mode=vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.2))
    def height(im):
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(im).copy()))
        if not r.pose_landmarks: return None, None
        L, (w, h) = r.pose_landmarks[0], im.size
        est = [np.hypot((L[i].x - L[j].x) * w, (L[i].y - L[j].y) * h) / q
               for (i, j), q in SEGMENTS if min(L[i].visibility, L[j].visibility) >= 0.3]
        low = max(L[i].y for i in range(27, 33) if L[i].visibility >= 0.3) * h if any(L[i].visibility >= 0.3 for i in range(27, 33)) else None
        return (float(np.percentile(est, 75)) if len(est) >= 3 else None), low
    return height


def lifted(im):
    # The photos are dark; the models find the body far better on a brightened copy.
    a = (np.asarray(im).astype(np.float32) / 255) ** 0.55
    return ImageOps.autocontrast(Image.fromarray((a * 255).astype(np.uint8)), cutoff=1)


# ---------- look ----------
def background():
    y = np.linspace(0, 1, S)[:, None]
    x = np.linspace(-1, 1, S)[None, :]
    top, horizon, floor_hi, floor_lo = np.array([27, 32, 62]), np.array([17, 21, 44]), np.array([24, 28, 56]), np.array([12, 14, 30])
    f = FLOOR / S
    wall = top + (horizon - top) * np.clip(y / f, 0, 1)[..., None]
    flo = floor_hi + (floor_lo - floor_hi) * np.clip((y - f) / (1 - f), 0, 1)[..., None]
    t = np.clip((y - f + 0.012) / 0.024, 0, 1)[..., None]           # soft horizon
    img = wall * (1 - t) + flo * t
    glow = np.exp(-((x / 0.75) ** 2 + ((y - 0.45) / 0.55) ** 2))[..., None]
    img = img + glow * np.array([10, 11, 20])
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def bbox(alpha, t=0.5):
    ys, xs = np.where(alpha > t)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    os.makedirs(OUT, exist_ok=True)
    files = {os.path.splitext(f)[0]: os.path.join(SRC, f) for f in os.listdir(SRC) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))}
    ids = sorted({k.rsplit('-', 1)[0] for k in files} | set(SEQ))
    seqs = {i: SEQ.get(i) or [(i, 'a', 0)] + ([(i, 'b', 0)] if f'{i}-b' in files else []) for i in ids}
    needed = sorted({(src, fr) for s in seqs.values() for src, fr, _ in s})

    human, general, measure = model('u2net_human_seg.onnx'), model('isnet-general-use.onnx'), pose_model()
    cut, tall = {}, {}
    for src, fr in needed:
        im = Image.open(files[f'{src}-{fr}']).convert('RGB')
        im.thumbnail((1400, 1400), Image.LANCZOS)
        lit = lifted(im)
        a = predict(human, lit, 320, (0.229, 0.224, 0.225))
        if src in PROPS:
            a = np.maximum(a, predict(general, lit, 1024, (1, 1, 1)))
        a = np.clip((a - 0.15) / 0.7, 0, 1)
        tall[(src, fr)], low = measure(im)
        x0, y0, x1, y1 = bbox(a)
        # A body stretched out (arms overhead) is at most ~1.3x its standing height.
        if tall[(src, fr)]: tall[(src, fr)] = max(tall[(src, fr)], max(x1 - x0, y1 - y0) / 1.32)
        if src in SHADOW and low:
            a[int(low + 0.02 * (tall[(src, fr)] or (y1 - y0))):] = 0
        cut[(src, fr)] = (im, a)
        print('cut out', src, fr, 'body height', tall[(src, fr)] and round(tall[(src, fr)]))

    # Even out exposure and colour: pull every person towards the median person colour.
    means = {k: np.asarray(im).reshape(-1, 3)[a.reshape(-1) > 0.6].mean(0) for k, (im, a) in cut.items()}
    target = np.median(np.array(list(means.values())), 0)
    for k, (im, a) in cut.items():
        gain = np.clip((target / np.maximum(means[k], 1)) ** 0.8, 0.7, 1.7)
        cut[k] = (Image.fromarray(np.clip(np.asarray(im) * gain, 0, 255).astype(np.uint8)), a)

    bg = background()
    manifest = {}
    for eid, seq in seqs.items():
        frames = sorted({(s, f) for s, f, _ in seq})
        # Same body size in every frame and every exercise, measured from limb lengths.
        # If the pose model misses a frame, use the other frame's body area to match it.
        boxes = {k: bbox(cut[k][1]) for k in frames}
        area = {k: np.sqrt((cut[k][1] > 0.5).sum()) for k in frames}
        known = [k for k in frames if tall[k]]
        if known:
            per_area = np.mean([tall[k] / area[k] for k in known])
            rel = {k: BODY / (tall[k] or area[k] * per_area) for k in frames}
        else:
            rel = {k: BODY * 0.42 / area[k] for k in frames}
        h = max((boxes[k][3] - boxes[k][1]) * rel[k] + AIR.get(k, 0) * S for k in frames)
        w = max((boxes[k][2] - boxes[k][0]) * rel[k] for k in frames)
        scale = min(1, FILL[0] * FLOOR / h, FILL[1] * S / w)

        rendered = {}
        for k in frames:
            im, a = cut[k]
            x0, y0, x1, y1 = boxes[k]
            s = scale * rel[k]
            pw, ph = round((x1 - x0) * s), round((y1 - y0) * s)
            person = im.crop((x0, y0, x1, y1)).resize((pw, ph), Image.LANCZOS)
            alpha = Image.fromarray((a[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((pw, ph), Image.LANCZOS)
            left, top = round((S - pw) / 2), round(FLOOR - ph - AIR.get(k, 0) * S)
            canvas = bg.copy()
            if eid in WALL:
                d = ImageDraw.Draw(canvas)
                ar = np.asarray(alpha) > 128
                cols = np.where(ar.any(0))[0]
                if WALL[eid] == 'right':
                    wx = left + cols.max() + 2
                    d.rectangle((wx, 0, S, FLOOR), fill=(33, 38, 72)); d.line((wx, 0, wx, FLOOR), fill=(52, 58, 100), width=3)
                else:
                    wx = left + cols.min() - 2
                    d.rectangle((0, 0, wx, FLOOR), fill=(33, 38, 72)); d.line((wx, 0, wx, FLOOR), fill=(52, 58, 100), width=3)
            # Soft shadow where the body meets the floor.
            ar = np.asarray(alpha) > 128
            low = np.where(ar[max(0, ph - max(6, ph // 12)):].any(0))[0]
            if len(low):
                sh = Image.new('L', (S, S), 0)
                lift = AIR.get(k, 0)
                cx0, cx1 = left + low.min(), left + low.max()
                pad = (cx1 - cx0) * 0.12 + 10
                ImageDraw.Draw(sh).ellipse((cx0 - pad, FLOOR - 9, cx1 + pad, FLOOR + 11), fill=int(150 * (0.45 if lift else 1)))
                sh = sh.filter(ImageFilter.GaussianBlur(10))
                canvas = Image.composite(Image.new('RGB', (S, S), (4, 5, 12)), canvas, sh)
            canvas.paste(person, (left, top), alpha)
            rendered[k] = canvas

        for n, (src, fr, flip) in enumerate(seq):
            out = rendered[(src, fr)]
            if flip: out = ImageOps.mirror(out)
            out.save(os.path.join(OUT, f'{eid}-{n}.webp'), 'WEBP', quality=80, method=6)
        manifest[eid] = len(seq)
        print(eid, len(seq), 'frames')

    for f in os.listdir(OUT):
        stem = os.path.splitext(f)[0]
        if f.endswith('.webp') and (stem.rsplit('-', 1)[0] not in manifest or not stem.rsplit('-', 1)[1].isdigit()):
            os.remove(os.path.join(OUT, f))
    old = os.path.join(OUT, 'manifest.json')
    if os.path.exists(old): os.remove(old)
    with open(os.path.join(ROOT, 'src', 'data', 'demos.json'), 'w') as fh:
        json.dump(dict(sorted(manifest.items())), fh, indent=0)
    print('done:', len(manifest), 'exercises')


if __name__ == '__main__':
    main()
