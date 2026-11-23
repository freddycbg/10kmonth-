"""Prepara los b-roll del vídeo de campaña: recorta, endereza (rotación del móvil), cubre 1080x1920 y guarda en
public/media/camp/. Fotos: orientación EXIF aplicada y 1440 px de ancho (margen para el zoom lento)."""
import os
import subprocess
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP = os.path.join(ROOT, "input/campana/bp")
OUT = os.path.join(ROOT, "public/media/camp")
os.makedirs(OUT, exist_ok=True)

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
}
PHOTOS = {
    "capitolio": "dji_mimo_20261020_134834_20261020134833_1792529161306_photo.JPG",
    "equipo": "697503d4-3403-41f5-bef2-33437a95037e.JPG",
    "globelife": "a16f9a98-ec1e-4a23-ac9b-58e72c69436d.JPG",
    "retiro": "IMG_8722.JPG",
    "vegas": "dji_mimo_20250507_184818_20250507184818_1746671778697_photo.JPG",
    "atardecer": "IMG_8682.JPG",
}

for name, (src, ss, dur, cx) in VIDEOS.items():
    vf = (f"scale=1080:1920:force_original_aspect_ratio=increase,"
          f"crop=1080:1920:(iw-1080)*{cx}:(ih-1920)/2,fps=30,format=yuv420p")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(dur), "-i", src, "-vf", vf, "-an",
                    "-c:v", "libx264", "-crf", "14", "-preset", "fast", f"{OUT}/{name}.mp4"], check=True)
    print("video", name)

for name, fn in PHOTOS.items():
    im = ImageOps.exif_transpose(Image.open(f"{BP}/{fn}")).convert("RGB")
    w, h = im.size
    tw, th = 1440, 2560
    s = max(tw / w, th / h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    x = (im.width - tw) // 2
    y = (im.height - th) // 2
    im.crop((x, y, x + tw, y + th)).save(f"{OUT}/{name}.jpg", quality=92)
    print("foto", name, (w, h))
