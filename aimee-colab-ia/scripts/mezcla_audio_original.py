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
# Sonidos propios del vídeo ("audio_extra": p. ej. el "FAAA" de Aimee) en su segundo exacto.
n = len(edit["sfx"]) + 2
for x in cfg.get("audio_extra", []):
    inputs += ["-i", os.path.join(root, x["file"])]
    delay = round(x["at"] * 1000)
    chains.append(f"[{n}:a]aresample={sr},volume={x['gain_db']}dB,adelay={delay}|{delay}[x{n}]")
    labels.append(f"[x{n}]")
    n += 1
# Música de fondo ("music_bed"): bajo la voz y más alta en el cierre, con fundidos.
mb = cfg.get("music_bed")
if mb:
    inputs += ["-i", os.path.join(root, mb["file"])]
    t_end = edit["arollFrames"] / fps
    g1, g2 = 10 ** (mb["gain_db"] / 20), 10 ** (mb["end_gain_db"] / 20)
    chains.append(f"[{n}:a]aresample={sr},atrim=0:{total:.3f},"
                  f"volume=eval=frame:volume='{g1:.5f}+({g2:.5f}-{g1:.5f})*clip((t-{t_end - 0.3:.3f})/0.6,0,1)',"
                  f"afade=t=in:d=0.4,afade=t=out:st={total - 1.5:.3f}:d=1.5[musica]")
    labels.append("[musica]")
    n += 1
# La voz entra sin ningún filtro salvo el relleno de silencio al final (la tarjeta de cierre).
chains.append(f"[1:a]apad=whole_dur={total:.3f}[voz]")
chains.append(f"[voz]{''.join(labels)}amix=inputs={len(labels) + 1}:normalize=0:duration=first[a]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chains),
                "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", str(sr),
                "-movflags", "+faststart", out], check=True)
