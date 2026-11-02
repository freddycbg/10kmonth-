"""Sigue la cara del orador fotograma a fotograma para que el encuadre (punch-ins, zoom del gancho) la acompañe
cuando camina. Con la cara fija por toma, en las tomas en movimiento el plano cerrado la dejaba fuera.

Genera src/Edit/face.json: {"x": [...], "y": [...]} (fracción del cuadro, un valor por fotograma del A-roll).
La cara se estima con la silueta de u2net_human_seg: centro de la cabeza en x, y en y la parte alta de la
cabeza más 0.7 veces su anchura. Se suaviza dentro de cada tramo continuo (no a través de cortes).

Uso (después de build_edit.py): /opt/whisper-venv/bin/python scripts/facetrack.py
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from rembg import new_session, remove

W, H = 1080, 1920
SW, SH = 360, 640    # tamaño de análisis
SMOOTH = 15          # fotogramas a cada lado en el suavizado
JUMP = 0.04          # salto entre fotogramas (fracción) que se considera un corte


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    aroll = os.path.join(root, "public", "media", "aroll.mp4")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", aroll, "-vf", f"scale={SW}:{SH}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, SH, SW, 3)
    sess = new_session("u2net_human_seg")
    xs, ys = [], []
    for i, fr in enumerate(frames):
        m = np.array(remove(Image.fromarray(fr), session=sess, only_mask=True)) > 128
        yy, xx = np.where(m)
        if len(xx) == 0:
            xs.append(xs[-1] if xs else 0.5)
            ys.append(ys[-1] if ys else 0.4)
            continue
        top = yy.min()
        band = xx[(yy > top + 0.01 * SH) & (yy < top + 0.045 * SH)]
        if len(band) == 0:
            band = xx[yy < top + 0.05 * SH]
        w = band.max() - band.min()
        xs.append((band.min() + band.max()) / 2 / SW)
        ys.append(min(1.0, (top + 0.7 * w) / SH))
        if i % 100 == 0:
            print(f"  {i}/{len(frames)}", flush=True)
    xs, ys = np.array(xs), np.array(ys)

    # Tramos continuos: se corta donde la cara salta (cambio de toma o corte de silencio).
    jumps = np.where((np.abs(np.diff(xs)) > JUMP) | (np.abs(np.diff(ys)) > JUMP))[0] + 1
    bounds = [0] + [int(j) for j in jumps] + [len(xs)]
    out_x, out_y = xs.copy(), ys.copy()
    for a, b in zip(bounds, bounds[1:]):
        for arr, out in ((xs, out_x), (ys, out_y)):
            seg = arr[a:b]
            # Mediana (quita picos de la segmentación) y media móvil.
            med = np.array([np.median(seg[max(0, k - 4):k + 5]) for k in range(len(seg))])
            out[a:b] = [med[max(0, k - SMOOTH):k + SMOOTH + 1].mean() for k in range(len(seg))]
    json.dump({"x": [round(float(v), 4) for v in out_x], "y": [round(float(v), 4) for v in out_y]},
              open(os.path.join(root, "src", "Edit", "face.json"), "w"))
    print(f"{len(xs)} fotogramas, {len(bounds) - 1} tramos")


if __name__ == "__main__":
    main()
