"""Recorta la silueta del orador para que los títulos cinéticos queden detrás de él (estilo.md, preferencias).

Para cada fotograma en que un título está en pantalla sobre el orador (no sobre b-roll) y toca su silueta,
genera una máscara con BiRefNet-portrait (rembg) y la guarda como PNG con alfa. En Remotion se dibuja encima
del título una segunda copia del A-roll con esa máscara (mask-image), así los píxeles son idénticos al vídeo base.

Genera:
  public/media/fg/m<frame>.png   máscara recortada (alfa = orador)
  src/Edit/fg.json               {"masks": {frame: [x, y, w, h]}, "runs": [[desde, hasta], ...]}

Uso (después de build_edit.py):
  /opt/whisper-venv/bin/python scripts/mattes.py [--force] [--model birefnet-general-lite]
  (con fondo limpio, p. ej. cielo, el modelo lite recorta igual de bien en la mitad de tiempo)
"""
import json
import os
import subprocess
import sys
import tempfile
import time

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter
from rembg import new_session, remove

W, H = 1080, 1920
TOP_SIZE = 62        # KineticTitle.tsx
MARGIN_X = 0.075     # KineticTitle.tsx
SAFE = 30            # px de margen alrededor del título al comprobar si toca la silueta
GAP_FILL = 3         # huecos de hasta 3 fotogramas se rellenan (menos tramos de máscara)

# Encuadre del A-roll: copia de ARoll.tsx (si cambia allí, cambiar aquí).
PUSH = 0.05
CLOSE_FACE_TARGET = (0.5, 0.34)
PUNCH_FRAMES = 5
INTRO_FACE_TARGET = (0.5, 0.42)


def bezier(x1, y1, x2, y2):
    def f(t):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            s = (lo + hi) / 2
            x = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
            lo, hi = (s, hi) if x < t else (lo, s)
        s = (lo + hi) / 2
        return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3
    return f


def interp(v, xs, ys, ease=lambda t: t):
    if v <= xs[0]:
        return ys[0]
    for i in range(len(xs) - 1):
        if v <= xs[i + 1]:
            t = (v - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] + (ys[i + 1] - ys[i]) * ease(t)
    return ys[-1]


INTRO_EASE = bezier(0.55, 0, 0.45, 1)


def view(edit, frame):
    """Escala y origen (x0, y0) del recorte del A-roll en este fotograma, como en ARoll.tsx."""
    shot = next((s for s in edit["shots"] if frame < s["from"] + s["durationInFrames"]), edit["shots"][-1])
    local = frame - shot["from"]
    progress = min(1, max(0, local / max(1, shot["durationInFrames"] - 1)))
    track = edit.get("_face")
    if track and frame < len(track["x"]):
        fx, fy = track["x"][frame], track["y"][frame]  # face.json (facetrack.py), como ARoll.tsx
    else:
        fx, fy = shot["face"]["x"], shot["face"]["y"]
    if shot["from"] == 0:
        keys = edit["intro"]
        scale = interp(frame, keys["frames"], keys["scales"], INTRO_EASE)
        k = min(1, max(0, (scale - 1) / (keys["scales"][-1] - 1)))
        tx, ty = fx + (INTRO_FACE_TARGET[0] - fx) * k, fy + (INTRO_FACE_TARGET[1] - fy) * k
    else:
        close = shot["framing"] == "cerrado"
        punch = interp(local, [0, PUNCH_FRAMES], [0.8, 1], lambda t: 1 - (1 - t) ** 3) if close else 1
        scale = max(1, (shot["closeScale"] * punch if close else 1) * (1 + PUSH * progress))
        tx, ty = CLOSE_FACE_TARGET if close else (fx, fy)
    vw, vh = W / scale, H / scale
    x0 = min(W - vw, max(0, fx * W - tx * vw))
    y0 = min(H - vh, max(0, fy * H - ty * vh))
    return scale, x0, y0


def title_box(t, local):
    """Zona que ocupa el título; antes de que entre la palabra gigante solo está la línea superior."""
    top = t["y"] * H
    bottom = top + TOP_SIZE * 1.05
    if local >= t["bigAt"]:
        accent = 0.2 if any(ch in "ÁÉÍÓÚÑÜ" for ch in t["big"]) else 0  # ACCENT_PAD en KineticTitle.tsx
        bottom += t["bigSize"] * (0.98 + accent) + (TOP_SIZE * 1.05 if t["bottom"] else 0)
    return (MARGIN_X * W - SAFE, top - SAFE, (1 - MARGIN_X) * W + SAFE, bottom + SAFE)


def candidates(edit):
    covered = set()
    for b in edit["broll"]:
        covered.update(range(b["from"], b["from"] + b["durationInFrames"]))
    out = {}
    for t in edit["titles"]:
        for f in range(t["from"], min(t["from"] + t["durationInFrames"], edit["arollFrames"])):
            if f not in covered:
                out[f] = title_box(t, f - t["from"])
    return out


def extract(src, frames, dst):
    """Extrae los fotogramas exactos (por número) como PNG RGB al tamaño del cuadro, con la matriz BT.709."""
    expr = "+".join(f"eq(n\\,{f})" for f in frames)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf",
                    f"select='{expr}',scale={W}:{H}:flags=lanczos:in_color_matrix=bt709:in_range=tv,format=rgb24",
                    "-vsync", "0", os.path.join(dst, "%05d.png")], check=True)
    return {f: os.path.join(dst, f"{i + 1:05d}.png") for i, f in enumerate(sorted(frames))}


def main(force, model):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    edit = json.load(open(os.path.join(root, "src", "Edit", "edit.json")))
    face_path = os.path.join(root, "src", "Edit", "face.json")
    if os.path.exists(face_path):
        edit["_face"] = json.load(open(face_path))
    fg_dir = os.path.join(root, "public", "media", "fg")
    os.makedirs(fg_dir, exist_ok=True)
    cand = candidates(edit)
    coarse = new_session("u2net_human_seg")
    fine = None

    with tempfile.TemporaryDirectory() as tmp:
        pngs = extract(os.path.join(root, "public", "media", "aroll.mp4"), sorted(cand), tmp)

        # 1) Máscara rápida para saber dónde está el orador y si el título lo toca.
        boxes, hits = {}, set()
        for f in sorted(cand):
            im = Image.open(pngs[f]).convert("RGB")
            m = np.array(remove(im, session=coarse, only_mask=True)) > 128
            ys, xs = np.where(m)
            if len(xs) == 0:
                continue
            x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
            mx, my = int((x1 - x0) * 0.12), int((y1 - y0) * 0.06)
            boxes[f] = (max(0, x0 - mx), max(0, y0 - my), min(W, x1 + mx), min(H, y1 + my))
            scale, vx, vy = view(edit, f)
            bx0, by0, bx1, by1 = cand[f]
            sx0, sx1 = int(max(0, bx0 / scale + vx)), int(min(W, bx1 / scale + vx + 1))
            sy0, sy1 = int(max(0, by0 / scale + vy)), int(min(H, by1 / scale + vy + 1))
            if m[sy0:sy1, sx0:sx1].any():
                hits.add(f)
        # Rellenar huecos cortos para que los tramos sean continuos.
        hs = sorted(hits)
        for a, b in zip(hs, hs[1:]):
            if 1 < b - a <= GAP_FILL + 1:
                hits.update(f for f in range(a + 1, b) if f in boxes)
        print(f"{len(cand)} fotogramas con título sobre el orador, {len(hits)} tocan su silueta", flush=True)

        # 2) Máscara fina (BiRefNet-portrait) sobre el recorte del orador.
        masks = {}
        t0 = time.time()
        for i, f in enumerate(sorted(hits)):
            path = os.path.join(fg_dir, f"m{f}.png")
            meta = path + ".json"
            if not force and os.path.exists(path) and os.path.exists(meta):
                masks[f] = json.load(open(meta))
                continue
            if fine is None:
                # Sin arena de memoria: con ella cada inferencia la hace crecer y el proceso se queda sin RAM.
                opts = ort.SessionOptions()
                opts.enable_cpu_mem_arena = False
                opts.enable_mem_pattern = False
                fine = new_session(model, sess_opts=opts)
            box = boxes[f]
            im = Image.open(pngs[f]).convert("RGB").crop(box)
            a = remove(im, session=fine, only_mask=True).filter(ImageFilter.GaussianBlur(0.6))
            arr = np.array(a)
            arr[arr < 6] = 0
            ys, xs = np.where(arr > 0)
            if len(xs) == 0:
                continue
            cx0, cy0, cx1, cy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            alpha = arr[cy0:cy1, cx0:cx1]
            rgba = np.zeros(alpha.shape + (4,), np.uint8)
            rgba[..., 3] = alpha
            Image.fromarray(rgba, "RGBA").save(path, optimize=True)
            rect = [int(box[0] + cx0), int(box[1] + cy0), int(cx1 - cx0), int(cy1 - cy0)]
            json.dump(rect, open(meta, "w"))
            masks[f] = rect
            el = time.time() - t0
            print(f"  {i + 1}/{len(hits)} fotograma {f} ({el / (i + 1):.0f} s/fot.)", flush=True)

    runs = []
    for f in sorted(masks):
        if runs and f == runs[-1][1] + 1:
            runs[-1][1] = f
        else:
            runs.append([f, f])
    json.dump({"masks": {str(f): r for f, r in sorted(masks.items())}, "runs": runs},
              open(os.path.join(root, "src", "Edit", "fg.json"), "w"), indent=1)
    print("tramos:", runs)


if __name__ == "__main__":
    args = sys.argv[1:]
    main("--force" in args, args[args.index("--model") + 1] if "--model" in args else "birefnet-portrait")
