"""Audio final sin tocar la voz (vídeos de Aimee): el audio del vídeo base tal cual + los efectos de sonido.

El render de Remotion se hace sin audio (--muted). Aquí se construye la pista de efectos con los tiempos y
volúmenes de edit.json y se suma (amix sin normalizar) al audio original decodificado una sola vez, a su
frecuencia original. Fuera de los efectos la señal es la del original; se codifica una sola vez en AAC 320 kbps.
Con --sin-efectos, el audio original se copia bit a bit (-c:a copy), sin recodificar.

Uso: python scripts/mezcla_audio_original.py <video_sin_audio.mp4> <salida.mp4> [--sin-efectos]
"""
import json
import os
import subprocess
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
video, out = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(root, "edit.config.json")))
edit = json.load(open(os.path.join(root, "src", "Edit", "edit.json")))
source = os.path.join(root, cfg["source"])
fps = edit["fps"]
total = edit["durationInFrames"] / fps

if "--sin-efectos" in sys.argv:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", source, "-map", "0:v", "-map", "1:a",
                    "-c", "copy", "-movflags", "+faststart", out], check=True)
    sys.exit(0)

sr = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
                         "-of", "csv=p=0", source], capture_output=True, text=True, check=True).stdout)
inputs, chains, labels = ["-i", video, "-i", source], [], []
for k, x in enumerate(edit["sfx"]):
    inputs += ["-i", os.path.join(root, "public", "sfx", f"{x['sound']}.wav")]
    delay = round(x["from"] / fps * 1000)
    chains.append(f"[{k + 2}:a]atrim=start={x['trim'] / fps:.4f},asetpts=PTS-STARTPTS,aresample={sr},"
                  f"volume={x['vol']},adelay={delay}|{delay}[s{k}]")
    labels.append(f"[s{k}]")
# La voz entra sin ningún filtro salvo el relleno de silencio al final (la tarjeta de cierre).
chains.append(f"[1:a]apad=whole_dur={total:.3f}[voz]")
chains.append(f"[voz]{''.join(labels)}amix=inputs={len(labels) + 1}:normalize=0:duration=first[a]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chains),
                "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", str(sr),
                "-movflags", "+faststart", out], check=True)
