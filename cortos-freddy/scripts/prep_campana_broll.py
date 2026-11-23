"""Prepara los b-roll del vídeo de campaña: recorta, endereza (rotación del móvil), cubre 1080x1920 y guarda en
public/media/camp/. Fotos: orientación EXIF aplicada y 1440 px de ancho (margen para el zoom lento)."""
import os
import subprocess
import sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP = os.path.join(ROOT, "input/campana/bp")
OUT = os.path.join(ROOT, "public/media/camp")
os.makedirs(OUT, exist_ok=True)

ONLY = set(sys.argv[1:])  # nombres a regenerar (vacío: todos)
VIDEOS = {  # nombre: (archivo, desde, duración, centro x 0..1)
    "manejando": (f"{BP}/IMG_8662.MOV", 1.0, 1.5, 0.5),
    "ensenando": (f"{BP}/copy_F9566760-E596-47F8-AD35-E6E21E0B4CF4.MOV", 30.0, 1.5, 0.5),
    "convencion": (f"{BP}/IMG_6045.MOV", 4.5, 1.5, 0.5),
    "oficina": (f"{BP}/IMG_7385.MOV", 0.5, 1.5, 0.5),
    "coaching": (f"{BP}/IMG_8667.MOV", 4.0, 1.5, 0.5),
    "escenario": (f"{BP}/8782ccd0-aaf0-40a2-b461-1be8c5d6d29a.MP4", 16.5, 1.5, 0.5),
    "deportivo": (f"{BP}/IMG_6107.MOV", 9.5, 1.5, 0.5),
    "fabrica": (f"{ROOT}/public/media/trabajar_1.mp4", 1.0, 1.5, 0.5),
    "delivery": (f"{ROOT}/input/material/hacer_delivery.mp4", 0.6, 1.5, 0.5),
    "yate": (f"{ROOT}/public/media/lujo_1.mp4", 1.5, 1.5, 0.5),
    # v2: tandas como el vídeo de referencia
    "presentando": (f"{BP}/8782ccd0-aaf0-40a2-b461-1be8c5d6d29a.MP4", 2.2, 1.5, 0.5),
    "presentando2": (f"{BP}/be5364b7-0cd6-4612-a63d-ded7352006d3.MP4", 10.0, 1.5, 0.5),
    "selfie_equipo": (f"{BP}/IMG_3895.MOV", 2.0, 1.5, 0.5),
    "fogata": (f"{BP}/IMG_8707.MOV", 0.2, 1.5, 0.5),
    "mesa_equipo": (f"{BP}/IMG_3411.MOV", 0.2, 1.5, 0.5),
    "sofa_equipo": (f"{BP}/IMG_8667.MOV", 0.3, 1.5, 0.5),
    "freddy_lounge": (f"{BP}/IMG_8667.MOV", 8.9, 1.5, 0.5),
    "moto": (f"{BP}/IMG_3968.MOV", 25.5, 1.5, 0.5),
    "fiesta": (f"{BP}/dde01fd5.MP4", 7.5, 1.5, 0.5),
    "entreno_a": (f"{BP}/copy_F9566760-E596-47F8-AD35-E6E21E0B4CF4.MOV", 53.6, 1.5, 0.22, 1.55, 0.3),
    "entreno_b": (f"{BP}/copy_F9566760-E596-47F8-AD35-E6E21E0B4CF4.MOV", 76.6, 1.5, 0.52, 1.3, 0.35),
    "rolls": (f"{BP}/IMG_8662.MOV", 15.8, 1.5, 0.5),
    "piscina": (f"{BP}/IMG_6110.mov", 0.1, 1.4, 0.5),
    "cocina": (f"{ROOT}/input/material/trabajar_cocina.mp4", 2.0, 1.5, 0.5),
    "avenida": (f"{ROOT}/input/material/avenida_eeuu.mp4", 2.0, 1.5, 0.5),
}
PHOTOS = {
    "capitolio": "dji_mimo_20261020_134834_20261020134833_1792529161306_photo.JPG",
    "equipo": "697503d4-3403-41f5-bef2-33437a95037e.JPG",
    "globelife": "a16f9a98-ec1e-4a23-ac9b-58e72c69436d.JPG",
    "retiro": "IMG_8722.JPG",
    "vegas": "dji_mimo_20250507_184818_20250507184818_1746671778697_photo.JPG",
    "atardecer": "IMG_8682.JPG",
    "logo_oro": ("08A17742-B73C-489A-89CB-713CC761CF47.PNG", 0.5),
    "anillos": ("IMG_4321.PNG", 0.5),
    "gala": ("IMG_6089.JPG", 0.62),
    "oficina_cbg": ("IMG_3054.JPG", 0.5),
    "colega": ("IMG_4463.PNG", 0.1),
    "sala_equipo": ("IMG_8725.JPG", 0.5),
    "libretas": ("IMG_8692.JPG", 0.42),
}

for name, spec in VIDEOS.items():
    src, ss, dur, cx = spec[:4]
    z, cy = (spec[4], spec[5]) if len(spec) > 4 else (1.0, 0.5)  # zoom y centro vertical del recorte
    if ONLY and name not in ONLY:
        continue
    vf = (f"scale={round(1080 * z / 2) * 2}:{round(1920 * z / 2) * 2}:force_original_aspect_ratio=increase,"
          f"crop=1080:1920:(iw-1080)*{cx}:(ih-1920)*{cy},fps=30,format=yuv420p")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(dur), "-i", src, "-vf", vf, "-an",
                    "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/{name}.mp4"], check=True)
    print("video", name)

ONLY = set(sys.argv[1:])
for name, fn in PHOTOS.items():
    if ONLY and name not in ONLY:
        continue
    fn, cx = fn if isinstance(fn, tuple) else (fn, 0.5)
    im = ImageOps.exif_transpose(Image.open(f"{BP}/{fn}")).convert("RGB")
    w, h = im.size
    tw, th = 1440, 2560
    s = max(tw / w, th / h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    x = round((im.width - tw) * cx)
    y = (im.height - th) // 2
    im.crop((x, y, x + tw, y + th)).save(f"{OUT}/{name}.jpg", quality=92)
    print("foto", name, (w, h))

# Retiro de Idaho (horizontal 832x464): se escala a 1920 de alto entero para recorrerlo en vertical.
if not ONLY or "idaho" in ONLY:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.0", "-t", "2.0", "-i", f"{BP}/Foto_equipo_retiro_IDAHO_1.MP4",
                    "-vf", "scale=-2:1920:flags=lanczos,unsharp=5:5:0.8,fps=30,format=yuv420p", "-an",
                    "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/idaho.mp4"], check=True)
    print("video idaho")
