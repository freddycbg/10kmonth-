"""Prepara la edición del vídeo de reclutamiento siguiendo estilo.md.

Genera:
  public/media/aroll.mp4      A-roll con silencios cortados y voz procesada (colores originales)
  public/media/<id>_<t>.mp4   b-roll conformado a 1080x1920 30 fps, sin audio
  public/media/music.m4a      música alineada (el golpe cae en la palabra elegida)
  src/Edit/edit.json          planos, b-roll, subtítulos palabra a palabra, títulos, transiciones

Uso:
  /opt/whisper-venv/bin/python scripts/build_edit.py edit.config.json
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
VOICE = "highpass=f=80,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=4"
TAIL_SECONDS = 0.5   # plano del orador que se conserva tras la última palabra
END_CARD_SECONDS = 2.5  # tarjeta final con el logo (estilo.md §1)
MUSIC_REF_LUFS = -9.3  # la música se normaliza aquí; los volúmenes se fijan en index.tsx

MIN_SHOT = 1.0     # s: no se cambia de encuadre antes de este tiempo (ritmo dinámico)
MAX_SHOT = 2.0     # s: un tramo visible del orador más largo se parte con un punch-in
BROLL_GUARD = 0.5  # s: margen sin cambios de encuadre alrededor de cada b-roll

# Subtítulos palabra a palabra (estilo.md §2a): bloques de hasta 3 palabras / 22 caracteres.
MAX_CHARS = 22
MAX_WORDS = 3
WEAK_END = {
    "y", "de", "la", "el", "los", "las", "en", "que", "a", "mi", "con", "por",
    "para", "un", "una", "del", "al", "lo", "se", "me", "nos", "tu", "su", "o",
    "pero", "porque", "no", "como", "cuando", "donde", "sino", "ni", "e", "u",
    "este", "esta", "estos", "estas", "ese", "esa", "sus", "tus", "mis",
}
BREAK_BEFORE = {"y", "pero", "porque"}  # abren bloque nuevo si el actual ya tiene alguna palabra
TITLE_HOLD = 0.45  # s que el título cinético sigue en pantalla tras su última palabra
TITLE_BIG_MIN = 0.9  # s mínimos de la palabra gigante en pantalla (borrador 2: "MITO" duraba 0.3 s)
MIN_CAPTION_FRAMES = 8  # un bloque de subtítulo visible menos tiempo se une al siguiente
TITLE_FONT_FILE = "public/fonts/anton-latin-400-normal.woff2"
BIG_WIDTH = 0.85   # ancho máximo de la palabra gigante (fracción del cuadro)
BIG_MAX_SIZE = 330


def run(cmd):
    subprocess.run(cmd, check=True)


def snap(t):
    return round(t * FPS) / FPS


def probe_duration(path):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True).stdout)


def main(cfg_path):
    cfg = json.load(open(cfg_path))
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    media = os.path.join(root, "public", "media")
    os.makedirs(media, exist_ok=True)

    transcript = json.load(open(cfg["transcript"]))
    keep = json.load(open(cfg["keep"]))
    src_dur = (int(keep["source_duration"] * FPS) - 1) / FPS

    words = [
        {"w": w["word"].strip(), "s": w["start"], "e": w["end"]}
        for seg in transcript["segments"] for w in seg["words"]
    ]
    words = apply_fixes(words, cfg.get("fixes", []))

    # --- Tramos conservados, ajustados a fotogramas ---------------------------
    segs = [[snap(a), snap(b)] for a, b in keep["keep"]]
    segs[-1][1] = snap(min(src_dur, max(segs[-1][1], words[-1]["e"] + TAIL_SECONDS)))
    segs = [s for s in segs if s[1] - s[0] >= 1 / FPS]
    out_starts, t = [], 0.0
    for a, b in segs:
        out_starts.append(t)
        t += b - a
    aroll_total = t
    aroll_frames = round(aroll_total * FPS)
    total_frames = aroll_frames + round(END_CARD_SECONDS * FPS)
    total = total_frames / FPS

    def to_out(ts):
        for (a, b), o in zip(segs, out_starts):
            if ts < a:
                return o
            if ts <= b:
                return o + (ts - a)
        return aroll_total

    def to_src(ot):
        for (a, b), o in zip(segs, out_starts):
            if ot < o + (b - a):
                return a + (ot - o)
        return segs[-1][1]

    for w in words:
        w["os"], w["oe"] = to_out(w["s"]), to_out(w["e"])

    def frame(ts):
        return round(ts * FPS)

    # --- A-roll -------------------------------------------------------------
    aroll = os.path.join(media, "aroll.mp4")
    if cfg.get("rebuild_aroll", True) or not os.path.exists(aroll):
        build_aroll(cfg["source"], segs, aroll)
    got = int(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", aroll],
        capture_output=True, text=True, check=True).stdout)
    if got != aroll_frames:
        raise SystemExit(f"Desincronía: aroll.mp4 tiene {got} fotogramas y la línea de tiempo {aroll_frames}")

    # --- B-roll -------------------------------------------------------------
    broll_out = []
    for b in cfg["broll"]:
        first, last = find_phrase(words, b["phrase"])
        start = snap(words[first]["os"] - b.get("lead", 0.0))
        end = snap(words[last]["oe"] + b.get("hold", 0.1))
        dur = end - start
        trim, speed, cx = b.get("trim", 0.0), b.get("speed", 1.0), b.get("cx", 0.5)
        name = f"{b['id']}_{trim:g}.mp4"
        dst = os.path.join(media, name)
        if not os.path.exists(dst):
            conform_broll(b["file"], dst, speed, trim, dur * speed + 1.0, cx)
        broll_out.append({
            "name": f"B-roll {b['id']}: {b['phrase'][:40]}",
            "src": f"media/{name}", "from": frame(start), "durationInFrames": frame(dur),
            "leak": bool(b.get("leak", False)),
        })
    for a, b in zip(broll_out, broll_out[1:]):
        gap = b["from"] - (a["from"] + a["durationInFrames"])
        if gap < 0 or 0 < gap <= round(0.5 * FPS):
            a["durationInFrames"] += gap

    # --- Planos del orador (encuadre ancho / punch-in) ------------------------
    takes = cfg["takes"]  # [{"until": s_origen, "face": [x, y], "close": escala}, ...]

    def take_at(src_t):
        for tk in takes:
            if src_t < tk["until"]:
                return tk
        return takes[-1]

    joins = [frame(o) for o in out_starts[1:]]
    joins += [frame(to_out(tk["until"])) for tk in takes[:-1]]  # cambios de toma en el original
    for b in broll_out:
        joins += [b["from"], b["from"] + b["durationInFrames"]]
    joins = sorted(set(j for j in joins if 0 < j < aroll_frames))
    guard = round(BROLL_GUARD * FPS)
    starts = [b["from"] for b in broll_out]
    ends = [b["from"] + b["durationInFrames"] for b in broll_out]
    joins = [
        j for j in joins
        if j in starts or j in ends
        or not (any(0 < s - j < guard for s in starts) or any(0 < j - e < guard for e in ends))
    ]
    take_cuts = {frame(to_out(tk["until"])) for tk in takes[:-1]}
    shots, cur, framing = [], 0, "ancho"
    for j in joins + [aroll_frames]:
        # Un cambio de toma siempre corta; si no, se respeta la duración mínima de plano.
        if j == aroll_frames or j in take_cuts or (j - cur) / FPS >= MIN_SHOT:
            tk = take_at(to_src((cur + 1) / FPS))
            shots.append({"from": cur, "durationInFrames": j - cur, "framing": framing,
                          "face": {"x": tk["face"][0], "y": tk["face"][1]}, "closeScale": tk["close"]})
            cur = j
            framing = "cerrado" if framing == "ancho" else "ancho"
    shots = [s for s in shots if s["durationInFrames"] > 0]

    # Ritmo dinámico: ningún tramo visible del orador dura más de MAX_SHOT; se parte en el inicio de una palabra
    # cercana a la mitad y alterna ancho/punch-in (el punch-in entra animado, ver ARoll.tsx).
    covered = np.zeros(aroll_frames + 1, bool)
    for b in broll_out:
        covered[b["from"]:b["from"] + b["durationInFrames"]] = True
    word_frames = [frame(w["os"]) for w in words]
    split = []
    for sh in shots:
        a, z = sh["from"], sh["from"] + sh["durationInFrames"]
        vis = [f for f in range(a, z) if not covered[f]]
        if sh["from"] == 0 or len(vis) < MAX_SHOT * FPS or vis[-1] - vis[0] + 1 != len(vis):
            split.append(sh)
            continue
        v0, v1 = vis[0], vis[-1]
        cands = [f for f in word_frames if v0 + 0.8 * FPS <= f <= v1 - 0.8 * FPS]
        if not cands:
            split.append(sh)
            continue
        cut = min(cands, key=lambda f: abs(f - (v0 + v1) / 2))
        first = dict(sh, durationInFrames=cut - a)
        second = dict(sh, **{"from": cut, "durationInFrames": z - cut,
                             "framing": "cerrado" if sh["framing"] == "ancho" else "ancho"})
        split += [first, second]
    shots = split

    # --- Títulos cinéticos (estilo.md §2b) ----------------------------------
    titles, title_words = [], set()
    for tt in cfg.get("titles", []):
        first, last = find_phrase(words, tt["phrase"])
        ws = words[first:last + 1]
        title_words.update(range(first, last + 1))
        # La palabra gigante es "big" (por defecto la última); las palabras posteriores forman una línea inferior.
        big_i = next((k for k, w in enumerate(ws) if norm(w["w"]) == norm(tt["big"])), len(ws) - 1)
        after = ws[big_i + 1:]
        ws_main = ws[:big_i + 1]
        f0 = frame(ws[0]["os"])
        # Se mantiene TITLE_HOLD tras su última palabra, pero se retira cuando empieza la siguiente frase
        # hablada (si no, tapa el principio del subtítulo siguiente).
        hold_end = ws[-1]["oe"] + TITLE_HOLD
        if last + 1 < len(words):
            hold_end = min(hold_end, max(ws[-1]["oe"] + 0.12, words[last + 1]["os"]))
        # ...pero la palabra gigante se queda al menos TITLE_BIG_MIN (los subtítulos esperan).
        hold_end = max(hold_end, ws_main[-1]["os"] + TITLE_BIG_MIN)
        f1 = frame(hold_end)
        top = tt["top"].split()
        # Cada palabra de la línea superior aparece cuando se dice; la grande, con su palabra.
        top_words = [{"text": tx, "accent": tx in tt.get("accent", []),
                      "at": frame(ws_main[min(k, max(0, len(ws_main) - 2))]["os"]) - f0} for k, tx in enumerate(top)]
        bottom = [{"text": w["w"].upper().strip(".,"), "at": frame(w["os"]) - f0} for w in after]
        titles.append({"name": f"Título: {tt['top']} {tt['big']}", "from": f0, "durationInFrames": f1 - f0,
                       "top": top_words, "big": tt["big"], "bigAt": frame(ws_main[-1]["os"]) - f0,
                       "bottom": bottom,
                       "bigSize": big_font_size(tt["big"], root), "y": tt.get("y", 0.2)})

    # --- Subtítulos palabra a palabra (estilo.md §2a) -----------------------
    title_ranges = [(t["from"], t["from"] + t["durationInFrames"]) for t in titles]
    free = [w for i, w in enumerate(words) if i not in title_words]
    blocks = chunk(free)
    captions = []
    carry = []  # palabras de un bloque que quedó entero bajo un título: pasan al principio del siguiente
    for k, blk in enumerate(blocks):
        if carry and len(" ".join(w["w"] for w in carry + blk)) <= MAX_CHARS + 4:
            blk = carry + blk
        carry = []
        f0 = frame(blk[0]["os"])
        end = blk[-1]["oe"] + 0.3
        if k + 1 < len(blocks):
            end = min(end, blocks[k + 1][0]["os"])
        f1 = min(frame(end), aroll_frames)
        # Las palabras del título no llevan subtítulo, pero las que se dicen después sí, aunque la palabra
        # gigante siga en pantalla (va arriba y el subtítulo abajo): así no se pierde ninguna (borrador 3).
        for a, _b in title_ranges:
            if f0 < a < f1:  # un bloque no invade el comienzo de un título
                f1 = a
        if f1 <= f0:
            carry = blk
            continue
        if f1 > f0:
            captions.append({"from": f0, "durationInFrames": f1 - f0,
                             "words": [{"text": w["w"].upper().strip(".,"), "at": max(0, frame(w["os"]) - f0)}
                                       for w in blk]})
    # Un bloque que queda demasiado corto (lo recortó un título) se une al siguiente si cabe: "TRIUNFAR" +
    # "EN ESTE PAÍS" -> "TRIUNFAR EN ESTE PAÍS".
    merged = []
    for c in captions:
        if merged and merged[-1]["durationInFrames"] < MIN_CAPTION_FRAMES:
            p_ = merged[-1]
            text = " ".join(w["text"] for w in p_["words"] + c["words"])
            if c["from"] - (p_["from"] + p_["durationInFrames"]) <= 2 and len(text) <= MAX_CHARS + 4:
                shift = c["from"] - p_["from"]
                p_["words"] += [dict(w, at=w["at"] + shift) for w in c["words"]]
                p_["durationInFrames"] = c["from"] + c["durationInFrames"] - p_["from"]
                continue
            merged.pop()  # no cabe: se descarta (sus palabras ya se dijeron bajo el título)
        merged.append(c)
    if merged and merged[-1]["durationInFrames"] < MIN_CAPTION_FRAMES:
        merged.pop()
    captions = merged

    # --- Transiciones ---------------------------------------------------------
    flashes = [frame(words[find_phrase(words, p)[0]]["os"]) for p in cfg.get("flash_at", [])]
    flashes.append(aroll_frames)  # destello al entrar la tarjeta final

    # --- Música -------------------------------------------------------------
    music_dst = os.path.join(media, "music.m4a")
    anchor = words[find_phrase(words, cfg["music_drop_at"])[0]]["os"]
    music_start = max(0.0, cfg["music_drop"] - anchor)
    stats = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", cfg["music"], "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    gain = MUSIC_REF_LUFS - float(re.findall(r"I:\s+(-?[\d.]+) LUFS", stats)[-1])
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{music_start:.3f}", "-i", cfg["music"],
        "-af", f"volume={gain:.2f}dB,alimiter=limit=0.89:level=false,"
        f"afade=t=in:d=0.15,afade=t=out:st={max(0, total - 1.2):.3f}:d=1.2",
        "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "192k", music_dst,
    ])

    edit = {
        "fps": FPS, "width": W, "height": H,
        "durationInFrames": total_frames,
        "arollFrames": aroll_frames,
        "lastWordFrame": frame(words[-1]["oe"]),
        # Zoom fuerte del gancho: pega en la palabra del golpe de música (estilo.md, preferencias).
        "introDropFrame": frame(anchor),
        "shots": shots, "broll": broll_out, "captions": captions, "titles": titles,
        "flashes": flashes,
    }
    json.dump(edit, open(os.path.join(root, "src", "Edit", "edit.json"), "w"), ensure_ascii=False, indent=1)
    cover = sum(b["durationInFrames"] for b in broll_out) / aroll_frames * 100
    print(f"duración {total:.2f}s ({total_frames} fot.; orador {aroll_total:.2f}s + tarjeta {END_CARD_SECONDS}s) · "
          f"{len(segs)} tramos · {len(shots)} planos · {len(broll_out)} b-roll ({cover:.0f}%) · "
          f"{len(captions)} bloques de subtítulo · {len(titles)} títulos · música desde {music_start:.2f}s "
          f"(golpe en {anchor:.2f}s), ganancia {gain:+.1f} dB")


def big_font_size(text, root):
    """Tamaño de la palabra gigante calculado con las métricas reales de Anton (fontTools).

    Medirlo durante el render daba tamaños distintos según la pestaña (algunas medían antes de que cargara la
    fuente) y la palabra parpadeaba cambiando de tamaño (borrador 2). Aquí es fijo y determinista.
    """
    from fontTools.ttLib import TTFont

    font = TTFont(os.path.join(root, TITLE_FONT_FILE))
    cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
    em = sum(hmtx[cmap[ord(c)]][0] for c in text) / upm
    return round(min(BIG_MAX_SIZE, W * BIG_WIDTH / em), 1)


def apply_fixes(words, fixes):
    for fx in fixes:
        find = [f.lower() for f in fx["find"]]
        n, i = len(find), 0
        while i <= len(words) - n:
            if [w["w"].lower() for w in words[i:i + n]] == find:
                s, e = words[i]["s"], words[i + n - 1]["e"]
                rep = fx["replace"]
                step = (e - s) / len(rep)
                words[i:i + n] = [{"w": r, "s": s + k * step, "e": s + (k + 1) * step} for k, r in enumerate(rep)]
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
    """Bloques de hasta MAX_WORDS / MAX_CHARS; cortan en puntuación y huecos (títulos) y no terminan en
    palabra débil."""
    blocks, cur = [], []

    def length(ws):
        return len(" ".join(w["w"] for w in ws))

    for w in words:
        if cur and (w["os"] - cur[-1]["oe"] > 0.6 or norm(w["w"]) in BREAK_BEFORE):
            # hueco (había un título en medio) o conjunción: bloque nuevo
            blocks.append(cur)
            cur = []
        if cur and (length(cur + [w]) > MAX_CHARS or len(cur) >= MAX_WORDS):
            carry = []
            while len(cur) > 1 and norm(cur[-1]["w"]) in WEAK_END:
                carry.insert(0, cur.pop())
            blocks.append(cur)
            cur = carry
        cur.append(w)
        if re.search(r"[.?!,]$", w["w"]):
            blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)
    return blocks


def build_aroll(src, segs, dst):
    """Vídeo exacto al fotograma y audio exacto a la muestra, montados por separado."""
    tmp = os.path.join(os.path.dirname(dst), "aroll_parts")
    os.makedirs(tmp, exist_ok=True)
    listing = []
    for k, (a, b) in enumerate(segs):
        part = os.path.join(tmp, f"p{k:03d}.mp4")
        run([
            "ffmpeg", "-v", "error", "-y", "-ss", f"{a:.4f}", "-i", src, "-an",
            "-vf", f"setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H}:flags=lanczos",
            "-frames:v", str(round((b - a) * FPS)),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", part,
        ])
        listing.append(f"file '{part}'")
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("\n".join(listing))
    video = os.path.join(tmp, "video.mp4")
    run([
        "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
        "-vf", f"setpts=N/({FPS}*TB),format=yuv420p",
        "-r", str(FPS), "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
        "-g", "15", video,
    ])
    sr = 48000
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
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
    run([
        "ffmpeg", "-v", "error", "-y", "-i", video, "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", pcm,
        "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-af", f"{VOICE},loudnorm=I=-16:TP=-1.5:LRA=7,aresample={sr}",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst,
    ])
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def conform_broll(src, dst, speed, start, length, cx):
    """Recorta a vertical: escala a 1920 de alto (o 1080 de ancho) y toma la ventana en la posición cx."""
    vf = (
        f"setpts={1 / speed:.4f}*(PTS-STARTPTS),fps={FPS},"
        f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
        f"crop={W}:{H}:(iw-{W})*{cx}:(ih-{H})/2,format=yuv420p"
    )
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", src,
        "-an", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "15",
        "-movflags", "+faststart", dst,
    ])


if __name__ == "__main__":
    main(sys.argv[1])
