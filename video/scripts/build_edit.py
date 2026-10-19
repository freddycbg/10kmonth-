"""Prepara la edición de mi-video siguiendo estilo.md.

Genera:
  public/media/aroll.mp4   A-roll con silencios cortados, color corregido y voz procesada
  public/media/bN.mp4      b-roll conformado a 1080x1920 30 fps, sin audio
  public/media/music.m4a   música ajustada a la duración final
  src/Edit/edit.json       planos, b-roll, subtítulos y duración, en fotogramas de salida

Uso:
  /opt/whisper-venv/bin/python scripts/build_edit.py <config.json>
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

FPS = 30
W, H = 1080, 1920

# --- Estilo (ver estilo.md) -------------------------------------------------
# Sin corrección de color: colores naturales de la cámara (preferencia aprobada, estilo.md).
GRADE = "null"
VOICE = "highpass=f=80,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=4"
TAIL_SECONDS = 1.2  # plano final que se conserva tras la última palabra
MUSIC_REF_LUFS = -9.3  # volumen de la pista con la que se aprobó el nivel de música (borrador 2)

# Encuadres (fracciones del cuadro). "cerrado" = recorte digital centrado en la cara.
FACE = {"x": 0.72, "y": 0.31}
CLOSE_SCALE = 1.45
MIN_SHOT = 1.8  # s: no se cambia de encuadre antes de este tiempo
BROLL_GUARD = 0.5  # s: margen sin cambios de encuadre alrededor de cada b-roll

# Subtítulos: bloques por frase, 1 línea.
MAX_CHARS = 30
MAX_WORDS = 6
WEAK_END = {
    "y", "de", "la", "el", "los", "las", "en", "que", "a", "mi", "con", "por",
    "para", "un", "una", "del", "al", "lo", "se", "me", "nos", "tu", "su", "o",
    "pero", "porque", "no", "como", "cuando", "donde", "sino", "ni", "e", "u",
}
# Conjunciones que abren bloque nuevo si el actual ya tiene >= BREAK_MIN_CHARS.
BREAK_BEFORE = {"y", "pero", "porque", "sino", "donde", "cuando"}
BREAK_MIN_CHARS = 14


def run(cmd):
    subprocess.run(cmd, check=True)


def snap(t):
    return round(t * FPS) / FPS


def main(cfg_path):
    cfg = json.load(open(cfg_path))
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    media = os.path.join(root, "public", "media")
    os.makedirs(media, exist_ok=True)

    transcript = json.load(open(cfg["transcript"]))
    keep = json.load(open(cfg["keep"]))
    # Último fotograma completo del original (la duración del contenedor puede pasarse 1 fotograma).
    src_dur = (int(keep["source_duration"] * FPS) - 1) / FPS

    # --- Palabras (con correcciones de texto) --------------------------------
    words = [
        {"w": w["word"].strip(), "s": w["start"], "e": w["end"]}
        for seg in transcript["segments"]
        for w in seg["words"]
    ]
    words = apply_fixes(words, cfg.get("fixes", []))

    # --- Tramos conservados, ajustados a fotogramas ---------------------------
    segs = [[snap(a), snap(b)] for a, b in keep["keep"]]
    last_end = words[-1]["e"]
    segs[-1][1] = snap(min(src_dur, max(segs[-1][1], last_end + TAIL_SECONDS)))
    segs = [s for s in segs if s[1] - s[0] >= 1 / FPS]

    out_starts, t = [], 0.0
    for a, b in segs:
        out_starts.append(t)
        t += b - a
    total = t
    total_frames = round(total * FPS)

    def to_out(ts):
        for (a, b), o in zip(segs, out_starts):
            if ts < a:
                return o  # cae en un silencio cortado: se pega al siguiente tramo
            if ts <= b:
                return o + (ts - a)
        return total

    for w in words:
        w["os"], w["oe"] = to_out(w["s"]), to_out(w["e"])

    # --- A-roll -------------------------------------------------------------
    aroll = os.path.join(media, "aroll.mp4")
    if cfg.get("rebuild_aroll", True) or not os.path.exists(aroll):
        build_aroll(cfg["source"], segs, aroll)
    got = int(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", aroll],
        capture_output=True, text=True, check=True).stdout)
    if got != total_frames:
        raise SystemExit(f"Desincronía: aroll.mp4 tiene {got} fotogramas y la línea de tiempo {total_frames}")

    # --- B-roll -------------------------------------------------------------
    broll_out = []
    for b in cfg["broll"]:
        first, last = find_phrase(words, b["phrase"])
        start = snap(words[first]["os"] - b.get("lead", 0.0))
        end = snap(words[last]["oe"] + b.get("hold", 0.15))
        dur = end - start
        item = {
            "name": f"B-roll {b['id']}: {b['phrase'][:40]}",
            "from": round(start * FPS),
            "durationInFrames": round(dur * FPS),
        }
        if "image" in b:
            # Foto: se reduce a 2400 px de alto y se anima en Remotion (paneo/zoom lento).
            name = f"{b['id']}.jpg"
            dst = os.path.join(media, name)
            if not os.path.exists(dst):
                run(["ffmpeg", "-v", "error", "-y", "-i", b["image"], "-vf", "scale=-2:2400",
                     "-q:v", "3", dst])
            iw, ih = map(int, subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", dst],
                capture_output=True, text=True, check=True).stdout.strip().split(","))
            item.update({"type": "image", "src": f"media/{name}", "imageWidth": iw, "imageHeight": ih,
                         "pan": b.get("pan", {"from": [0.5, 0.5, 1.0], "to": [0.5, 0.5, 1.06]})})
        else:
            # Vídeo: solo se convierte el trozo que se usa (los originales 4K pueden durar minutos).
            trim, speed = b.get("trim", 0.0), b.get("speed", 1.0)
            name = f"{b['id']}_{trim:g}.mp4"
            dst = os.path.join(media, name)
            if not os.path.exists(dst):
                conform_broll(b["file"], dst, speed, trim, dur * speed + 1.0)
            item.update({"type": "video", "src": f"media/{name}", "trimBefore": 0})
        broll_out.append(item)
    # Si dos b-roll quedan casi pegados, se unen sin hueco de entrevista intermedio.
    for a, b in zip(broll_out, broll_out[1:]):
        gap = b["from"] - (a["from"] + a["durationInFrames"])
        if 0 < gap <= round(0.6 * FPS):
            a["durationInFrames"] += gap
        elif gap < 0:  # se solapan: el primero termina donde empieza el siguiente
            a["durationInFrames"] += gap

    # --- Planos de entrevista (encuadre ancho/cerrado) ------------------------
    joins = [round(o * FPS) for o in out_starts[1:]]
    for b in broll_out:
        joins += [b["from"], b["from"] + b["durationInFrames"]]
    joins = sorted(set(j for j in joins if 0 < j < total_frames))
    # Sin cambios de encuadre a menos de BROLL_GUARD de la entrada o salida de un b-roll: si no, el plano
    # nuevo se ve unos fotogramas y parece un salto de zoom (p. ej. en "soy de Venezuela", segundo 3).
    guard = round(BROLL_GUARD * FPS)
    starts = [b["from"] for b in broll_out]
    ends = [b["from"] + b["durationInFrames"] for b in broll_out]
    joins = [
        j for j in joins
        if j in starts or j in ends
        or not (any(0 < s - j < guard for s in starts) or any(0 < j - e < guard for e in ends))
    ]
    shots, cur_start, framing = [], 0, "ancho"
    for j in joins:
        if (j - cur_start) / FPS >= MIN_SHOT:
            shots.append({"from": cur_start, "durationInFrames": j - cur_start, "framing": framing})
            cur_start = j
            framing = "cerrado" if framing == "ancho" else "ancho"
    shots.append({"from": cur_start, "durationInFrames": total_frames - cur_start, "framing": framing})

    # --- Subtítulos ---------------------------------------------------------
    blocks = chunk(words)
    captions = []
    for k, blk in enumerate(blocks):
        start = blk[0]["os"]
        end = blk[-1]["oe"] + 0.2
        if k + 1 < len(blocks):
            nxt = blocks[k + 1][0]["os"]
            end = nxt if nxt - blk[-1]["oe"] < 0.6 else min(end, nxt)
        f0, f1 = round(start * FPS), round(min(end, total) * FPS)
        if f1 > f0:
            captions.append(
                {"text": " ".join(w["w"] for w in blk), "from": f0, "durationInFrames": f1 - f0}
            )

    # --- Música -------------------------------------------------------------
    music_dst = os.path.join(media, "music.m4a")
    music_dur = float(
        subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", cfg["music"]],
            capture_output=True, text=True, check=True,
        ).stdout
    )
    # Si la pista es más corta que el vídeo se estira con atempo; si es más larga, se recorta.
    music_start = cfg.get("music_start", 0.0)  # salta la intro suave de la pista si hace falta
    music_dur -= music_start
    tempo = music_dur / total if music_dur < total else 1.0
    # Se normaliza a MUSIC_REF_LUFS para que los volúmenes aprobados (index.tsx) valgan con cualquier pista.
    stats = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", cfg["music"], "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    measured = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", stats)[-1])
    gain = MUSIC_REF_LUFS - measured
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{music_start:.3f}", "-i", cfg["music"],
        "-af", f"atempo={tempo:.5f},volume={gain:.2f}dB,alimiter=limit=0.89:level=false,"
        f"afade=t=in:d=0.25,afade=t=out:st={max(0, total - 1.5):.3f}:d=1.5",
        "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "192k", music_dst,
    ])

    edit = {
        "fps": FPS,
        "width": W,
        "height": H,
        "durationInFrames": total_frames,
        "lastWordFrame": round(words[-1]["oe"] * FPS),
        "face": FACE,
        "closeScale": CLOSE_SCALE,
        "shots": shots,
        "broll": broll_out,
        "captions": captions,
    }
    out = os.path.join(root, "src", "Edit", "edit.json")
    json.dump(edit, open(out, "w"), ensure_ascii=False, indent=1)
    print(
        f"duración {total:.2f}s ({total_frames} fotogramas) · {len(segs)} tramos · "
        f"{len(shots)} planos de entrevista · {len(broll_out)} b-roll · {len(captions)} subtítulos · "
        f"música atempo {tempo:.4f}, ganancia {gain:+.1f} dB"
    )


def apply_fixes(words, fixes):
    """fixes: [{"find": ["he","estado","en","Suátegui."], "replace": ["del","estado","Anzoátegui."]}]"""
    for fx in fixes:
        find = [f.lower() for f in fx["find"]]
        n = len(find)
        i = 0
        while i <= len(words) - n:
            if [w["w"].lower() for w in words[i:i + n]] == find:
                s, e = words[i]["s"], words[i + n - 1]["e"]
                rep = fx["replace"]
                step = (e - s) / len(rep)
                words[i:i + n] = [
                    {"w": r, "s": s + k * step, "e": s + (k + 1) * step} for k, r in enumerate(rep)
                ]
                i += len(rep)
            else:
                i += 1
    return words


def norm(s):
    return re.sub(r"[^\wáéíóúñü%]", "", s.lower())


def find_phrase(words, phrase):
    target = [norm(p) for p in phrase.split()]
    flat = [norm(w["w"]) for w in words]
    for i in range(len(flat) - len(target) + 1):
        if flat[i:i + len(target)] == target:
            return i, i + len(target) - 1
    raise SystemExit(f"No encuentro la frase en la transcripción: {phrase!r}")


def chunk(words):
    blocks, cur = [], []

    def length(ws):
        return len(" ".join(w["w"] for w in ws))

    for w in words:
        if cur and norm(w["w"]) in BREAK_BEFORE and length(cur) >= BREAK_MIN_CHARS:
            blocks.append(cur)
            cur = []
        if cur and (length(cur + [w]) > MAX_CHARS or len(cur) >= MAX_WORDS):
            # No terminar un bloque en palabra débil: pasarla al siguiente.
            carry = []
            while len(cur) > 1 and norm(cur[-1]["w"]) in WEAK_END:
                carry.insert(0, cur.pop())
            blocks.append(cur)
            cur = carry
        cur.append(w)
        if re.search(r"[.?!]$", w["w"]) or (re.search(r"[,;:]$", w["w"]) and length(cur) >= 8):
            blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)

    # Reequilibrio: una palabra huérfana se lleva palabras del bloque anterior de la misma frase
    # ("y llegamos aquí a los Estados / Unidos." -> "y llegamos aquí / a los Estados Unidos.").
    for k in range(1, len(blocks)):
        prev, nxt = blocks[k - 1], blocks[k]
        if len(nxt) != 1 or len(prev) < 3 or re.search(r"[.,;:?!]$", prev[-1]["w"]):
            continue
        nxt.insert(0, prev.pop())
        while len(prev) > 1 and norm(prev[-1]["w"]) in WEAK_END and length([prev[-1]] + nxt) <= MAX_CHARS:
            nxt.insert(0, prev.pop())
    return blocks


def build_aroll(src, segs, dst):
    """Vídeo exacto al fotograma y audio exacto a la muestra, montados por separado.

    Unir tramos con audio vía el demuxer concat adelantaba el audio ~4 ms por tramo
    (-293 ms al final de 69 tramos), así que el audio se monta en Python a partir del original.
    """
    tmp = os.path.join(os.path.dirname(dst), "aroll_parts")
    os.makedirs(tmp, exist_ok=True)

    # 1) Vídeo: cada tramo a su archivo (un solo filtro con 69 ramas agota la memoria).
    listing = []
    for k, (a, b) in enumerate(segs):
        part = os.path.join(tmp, f"p{k:03d}.mp4")
        run([
            "ffmpeg", "-v", "error", "-y", "-ss", f"{a:.4f}", "-i", src, "-an",
            "-vf", f"setpts=PTS-STARTPTS,fps={FPS}", "-frames:v", str(round((b - a) * FPS)),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", part,
        ])
        listing.append(f"file '{part}'")
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("\n".join(listing))
    video = os.path.join(tmp, "video.mp4")
    run([
        "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
        "-vf", f"setpts=N/({FPS}*TB),scale={W}:{H},{GRADE},format=yuv420p",
        "-r", str(FPS), "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
        "-g", "15", video,
    ])

    # 2) Audio: muestras exactas del original, con fundidos de 10 ms en cada unión.
    sr = 48000
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    pieces = []
    for a, b in segs:
        i0, n = round(a * sr), round((b - a) * sr)
        piece = np.zeros((n, 2), dtype=np.float32)
        chunk_ = x[i0:i0 + n]
        piece[: len(chunk_)] = chunk_
        f = min(int(0.01 * sr), n // 4)
        if f > 0:
            ramp = np.linspace(0, 1, f, dtype=np.float32)[:, None]
            piece[:f] *= ramp
            piece[-f:] *= ramp[::-1]
        pieces.append(piece)
    pcm = os.path.join(tmp, "audio.f32")
    np.concatenate(pieces).tofile(pcm)

    # 3) Mezcla final del A-roll: voz procesada + vídeo.
    run([
        "ffmpeg", "-v", "error", "-y", "-i", video,
        "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", pcm,
        "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-af", f"{VOICE},loudnorm=I=-16:TP=-1.5:LRA=7,aresample={sr}",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst,
    ])
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def conform_broll(src, dst, speed, start, length):
    vf = (
        f"setpts={1 / speed:.4f}*(PTS-STARTPTS),fps={FPS},"
        f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},format=yuv420p"
    )
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", src,
        "-an", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "15",
        "-movflags", "+faststart", dst,
    ])


if __name__ == "__main__":
    main(sys.argv[1])
