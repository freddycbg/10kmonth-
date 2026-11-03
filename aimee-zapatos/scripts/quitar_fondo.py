"""Quita el fondo de las dos imágenes de los zapatos (PNG con transparencia en public/media).

- IMG_2322 (pies dentro de zapatos sobre cemento): recorte con rembg (birefnet-general-lite) y, además, se
  conservan la flecha y el "VS" negros (componentes oscuros grandes), que el modelo descarta.
- IMG_2324 (siluetas de pies sobre blanco): se borra el blanco conectado con los bordes (relleno desde fuera);
  el interior claro de los pies queda porque está encerrado por el contorno oscuro.

Uso: /opt/whisper-venv/bin/python scripts/quitar_fondo.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "input", "drive")
OUT = os.path.join(ROOT, "public", "media")


def zapatos():
    im = Image.open(os.path.join(SRC, "IMG_2322.png")).convert("RGB")
    cut = remove(im, session=new_session("birefnet-general-lite"))
    alpha = np.array(cut)[:, :, 3].astype(np.float32) / 255
    rgb = np.array(im).astype(np.int32)
    dark = rgb.max(axis=2) < 70
    lab, n = ndimage.label(dark)
    sizes = ndimage.sum(dark, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 1500])
    keep = ndimage.binary_dilation(keep, iterations=2)
    alpha = np.maximum(alpha, keep.astype(np.float32))
    out = np.dstack([np.array(im), (alpha * 255).astype(np.uint8)])
    Image.fromarray(out, "RGBA").crop(Image.fromarray(out[:, :, 3]).getbbox()).save(
        os.path.join(OUT, "zapatos_dedos.png"))


def siluetas():
    im = Image.open(os.path.join(SRC, "IMG_2324.png")).convert("RGB")
    rgb = np.array(im).astype(np.int32)
    white = rgb.min(axis=2) > 225
    lab, _ = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out = np.dstack([np.array(im), np.array(alpha)])
    Image.fromarray(out, "RGBA").crop(alpha.getbbox()).save(os.path.join(OUT, "siluetas_pies.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    siluetas()
    zapatos()
    print("listo")
