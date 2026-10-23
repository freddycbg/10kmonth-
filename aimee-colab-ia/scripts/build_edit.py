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
AROLL_W, AROLL_H = 1440, 2560  # A-roll a la resolución del original: los zooms fuertes salen más nítidos

# --- Estilo (ver estilo.md) -------------------------------------------------
VOICE = "highpass=f=80,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=4"
TAIL_SECONDS = 0.5   # plano del orador que se conserva tras la última palabra
END_CARD_SECONDS = 2.5  # tarjeta final por defecto; con "end_video" dura lo que el vídeo de cierre
MUSIC_REF_LUFS = -9.3
DEEP_FILTER = "/opt/deepfilter/deep-filter"  # DeepFilterNet 0.5.6 (GitHub releases, x86_64-unknown-linux-musl)  # la música se normaliza aquí; los volúmenes se fijan en index.tsx

MIN_SHOT = 1.0     # s: no se cambia de encuadre antes de este tiempo (ritmo dinámico)
MAX_SHOT = 2.0     # s: un tramo visible del orador más largo se parte con un punch-in
BROLL_GUARD = 0.5  # s: margen sin cambios de encuadre alrededor de cada b-roll

# Subtítulos palabra a palabra (estilo.md §2a): bloques de hasta 3 palabras / 22 caracteres.
MAX_CHARS = 30  # estilo influencer (Aimee): frases cortas en una o dos líneas
MAX_WORDS = 5
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
TITLE_FONT_FILE = "public/fonts/anton-latin-400-normal.woff2"  # fonts.ts
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
    # Palabras que Whisper no recoge (p. ej. un "¡Gracias!" de la niña): se añaden con su tiempo en el original.
    words = sorted(words + [{"w": x["w"], "s": x["s"], "e": x["e"]} for x in cfg.get("insert_words", [])],
                   key=lambda w: w["s"])

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
    end_seconds = END_CARD_SECONDS
    if cfg.get("end_video"):
        end_seconds = int(probe_duration(cfg["end_video"]) * FPS) / FPS
    total_frames = aroll_frames + round(end_seconds * FPS)
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
        global LEVEL_VOICE
        LEVEL_VOICE = bool(cfg.get("level_voice"))
        audio_src = denoise(cfg["source"], root) if cfg.get("denoise") else cfg["source"]
        build_aroll(cfg["source"], segs, aroll, audio_src, cfg.get("raw_ranges", []),
                    original_audio=bool(cfg.get("original_audio")))
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
            conform_broll(b["file"], dst, speed, trim, dur * speed + 1.0, cx, b.get("transpose"))
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
    # El gancho es un único plano con su zoom hasta el primer b-roll (los cortes de silencio quedan dentro).
    # (y hasta el primer cambio de toma, que siempre corta: el encuadre depende de la toma).
    intro_end = min([b["from"] for b in broll_out[:1]] + [frame(to_out(tk["until"])) for tk in takes[:-1]] + [aroll_frames])
    joins = sorted(set(j for j in joins if max(0, intro_end - 1) < j < aroll_frames))
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
                       "bigSize": big_font_size(tt["big"], root), "y": tt.get("y", 0.2),
                       "align": tt.get("align", "left")})

    # Cada título cae en un solo plano cerrado: sin cortes de encuadre mientras está en pantalla (la cabeza no salta
    # detrás del texto) y con la cabeza grande para que el título quede detrás de ella.
    title_shots = []
    for t in titles:
        a, z = t["from"], t["from"] + t["durationInFrames"]
        idx = [i for i, sh in enumerate(shots) if sh["from"] < z and sh["from"] + sh["durationInFrames"] > a]
        if not idx:
            continue
        first = shots[idx[0]]
        first["durationInFrames"] = shots[idx[-1]]["from"] + shots[idx[-1]]["durationInFrames"] - first["from"]
        del shots[idx[0] + 1:idx[-1] + 1]
        if first["from"] != 0:
            first["framing"] = "cerrado"
        title_shots.append(first)
    # Un plano vecino de la misma toma no repite el cerrado (sería un salto sin cambio de encuadre); los planos
    # con título no se tocan.
    for i, sh in enumerate(shots):
        if sh in title_shots or sh["from"] == 0:
            continue
        for j in (i - 1, i + 1):
            if 0 <= j < len(shots) and shots[j] in title_shots and shots[j]["framing"] == sh["framing"] == "cerrado" \
                    and shots[j]["face"] == sh["face"]:
                sh["framing"] = "ancho"

    # --- Subtítulos palabra a palabra (estilo.md §2a) -----------------------
    # Palabras clave que salen grandes y en color en los subtítulos (estilo de Freddy).
    emphasis = {norm(x) for e in cfg.get("emphasis", []) for x in e.split()}
    title_ranges = [(t["from"], t["from"] + t["durationInFrames"]) for t in titles]
    for ov in cfg.get("overlays", []):  # frases que ya salen como gráfico no se repiten en los subtítulos
        if ov.get("hide_caption"):
            a_, z_ = find_phrase(words, ov["phrase"])
            title_words.update(range(a_, z_ + 1))
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
                             "words": [{"text": w["w"].strip(".,") if cfg.get("caption_case") == "natural" else w["w"].upper().strip(".,"), "at": max(0, frame(w["os"]) - f0),
                                        "em": norm(w["w"]) in emphasis}
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
    if cfg.get("caption_lines"):
        captions = caption_lines(json.load(open(cfg["caption_lines"])), to_out, frame)

    # --- Transiciones ---------------------------------------------------------
    flashes = [frame(words[find_phrase(words, p)[0]]["os"]) for p in cfg.get("flash_at", [])]

    # --- Iconos animados (para mostrar algo: candado, gráfica que sube, flecha a los comentarios...) ---------
    icons = []
    for ic in cfg.get("icons", []):
        first, last = find_phrase(words, ic["phrase"])
        f0 = frame(words[first]["os"])
        f1 = max(f0 + round(ic.get("hold", 1.2) * FPS), frame(words[last]["oe"]) + round(0.3 * FPS))
        icons.append({"name": f"Icono {ic['icon']}: {ic['phrase'][:30]}", "icon": ic["icon"], "from": f0,
                      "durationInFrames": f1 - f0, "x": ic.get("x", 0.78), "y": ic.get("y", 0.3),
                      "size": ic.get("size", 190), "anim": ic.get("anim", "pop"), "label": ic.get("label", "")})
    flashes.append(aroll_frames)  # destello al entrar la tarjeta final

    # --- Cierre -------------------------------------------------------------
    end_src = None
    if cfg.get("end_video"):
        end_src = "media/end.mp4"
        run([
            "ffmpeg", "-v", "error", "-y", "-i", cfg["end_video"], "-t", f"{end_seconds:.3f}",
            "-vf", f"fps={FPS},scale={W}:{H}:flags=lanczos,format=yuv420p",
            "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart", os.path.join(media, "end.mp4"),
        ])

    # --- Música -------------------------------------------------------------
    # La música es opcional (los vídeos de colaboración de Aimee van sin música: solo voz y efectos). Sin música,
    # el golpe del zoom del gancho cae en "intro_drop_at".
    music_dst = os.path.join(media, "music.m4a")
    anchor = words[find_phrase(words, cfg.get("intro_drop_at") or cfg["music_drop_at"])[0]]["os"]
    music_start, gain = 0.0, 0.0
    if cfg.get("music"):
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

    # --- Gráficos generados (Aimee): frases clave, tarjetas, capturas, insignias... ver Overlay.tsx ------------
    overlays = []
    for ov in cfg.get("overlays", []):
        first, last = find_phrase(words, ov["phrase"])
        f0 = frame(words[first]["os"]) + round(ov.get("delay", 0) * FPS)
        f1 = max(f0 + round(ov.get("hold", 1.5) * FPS), frame(words[last]["oe"]) + round(0.35 * FPS))
        if ov.get("until"):
            f1 = frame(words[find_phrase(words, ov["until"])[1]]["oe"]) + round(0.3 * FPS)
        overlays.append(dict({k: v for k, v in ov.items() if k not in ("phrase", "delay", "hold", "until")},
                             name=f"Gráfico {ov['type']}: {ov['phrase'][:30]}", **{"from": f0},
                             durationInFrames=min(f1, aroll_frames) - f0))
    take_cuts_out = sorted({frame(to_out(tk["until"])) for tk in takes[:-1]} - {0})

    # Cierre con el usuario de redes (Aimee): último fotograma del A-roll desenfocado de fondo.
    end_card = cfg.get("end_card")
    if end_card:
        run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.1", "-i", aroll, "-frames:v", "1",
             "-vf", f"scale={W}:{H}", os.path.join(media, "last.png")])

    sfx = sound_effects(cfg, root, words, frame, find_phrase, titles, broll_out, flashes, icons, captions,
                        frame(anchor), aroll_frames, overlays, take_cuts_out, bool(cfg.get("music")))

    edit = {
        "fps": FPS, "width": W, "height": H,
        "durationInFrames": total_frames,
        "arollFrames": aroll_frames,
        "lastWordFrame": frame(words[-1]["oe"]),
        # Zoom fuerte del gancho: pega en la palabra del golpe de música (estilo.md, preferencias).
        "introDropFrame": frame(anchor),
        "intro": intro_keys(cfg.get("intro"), frame(anchor), shots[0]["durationInFrames"] - 1),
        "endSrc": end_src,
        "endCard": end_card,
        # Cámara fija: sin zoom del gancho, sin punch-ins ni empuje (Aimee, borrador 2).
        "static": bool(cfg.get("static_camera")),
        "music": bool(cfg.get("music")),
        "overlays": overlays,
        "shots": shots, "broll": broll_out, "captions": captions, "titles": titles, "icons": icons, "sfx": sfx,
        "flashes": flashes,
    }
    json.dump(edit, open(os.path.join(root, "src", "Edit", "edit.json"), "w"), ensure_ascii=False, indent=1)
    cover = sum(b["durationInFrames"] for b in broll_out) / aroll_frames * 100
    print(f"duración {total:.2f}s ({total_frames} fot.; orador {aroll_total:.2f}s + cierre {end_seconds:.2f}s) · "
          f"{len(segs)} tramos · {len(shots)} planos · {len(broll_out)} b-roll ({cover:.0f}%) · "
          f"{len(captions)} bloques de subtítulo · {len(titles)} títulos · música desde {music_start:.2f}s "
          f"(golpe en {anchor:.2f}s), ganancia {gain:+.1f} dB")


# Efectos de sonido (librería sfx/ del repositorio, sintetizados con sfx/generar_sfx.py). Volumen de cada uno
# bajo la voz; el máster final normaliza el conjunto.
SFX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sfx")
SFX_VOL = {"whoosh_corto": 0.3, "whoosh_largo": 0.35, "swoosh": 0.4, "pop": 0.5, "click": 0.45, "impacto": 0.55,
           "sub_drop": 0.45, "riser": 0.3, "ding": 0.35, "kaching": 0.4, "camara": 0.4, "glitch": 0.35,
           "error": 0.35, "braam": 0.45}
# Sonido de cada icono animado.
ICON_SFX = {"ArrowDown": "ding", "Send": "swoosh", "TrendingUp": "kaching", "Lightbulb": "ding", "Lock": "click",
            "DoorOpen": "whoosh_corto", "CalendarDays": "pop"}


def sound_effects(cfg, root, words, frame, find_phrase, titles, broll, flashes, icons, captions, drop, aroll_frames,
                  overlays=(), take_cuts=(), music=True):
    """Coloca los efectos típicos de vídeo viral: riser e impacto en el gancho, whoosh en cada b-roll y destello,
    caída de graves en cada palabra gigante, pop/ding/kaching/swoosh en los iconos y un clic suave en las palabras
    clave de los subtítulos. "sfx": false en la configuración los quita; "sfx_extra" añade los que se pidan."""
    if cfg.get("sfx") is False:
        return []
    import shutil
    import wave

    dst = os.path.join(root, "public", "sfx")
    os.makedirs(dst, exist_ok=True)
    length = {}
    for f in os.listdir(SFX_DIR):
        if f.endswith(".wav"):
            shutil.copy(os.path.join(SFX_DIR, f), os.path.join(dst, f))
            with wave.open(os.path.join(SFX_DIR, f)) as w:
                length[f[:-4]] = int(np.ceil(w.getnframes() / w.getframerate() * FPS))
    # Fotograma en que cada efecto "pega" (pico del whoosh, final del riser).
    peak = {"whoosh_corto": 8, "whoosh_largo": 16, "swoosh": 5, "riser": length["riser"]}
    ev = []

    def add(sound, at, vol=None):
        ev.append({"sound": sound, "at": at, "vol": vol if vol is not None else SFX_VOL[sound]})

    if music:  # el riser y el impacto acompañan al golpe de música del gancho
        add("riser", drop)
        add("impacto", drop)
    for f in take_cuts:  # cambio de escena
        add("whoosh_corto", f, 0.28)
    for ov in overlays:  # cada gráfico entra con su sonido
        if ov.get("sfx", "pop") != "none":
            add(ov.get("sfx", "pop"), ov["from"], ov.get("sfx_vol"))
        if ov["type"] == "code":  # la palomita se dibuja a los 10 fotogramas (Overlay.tsx)
            add("click", ov["from"] + 12, 0.5)
    for t in titles:
        if t["from"] + t["bigAt"] != drop:
            add("sub_drop", t["from"] + t["bigAt"])
    for k, b in enumerate(broll):
        add("whoosh_corto" if k % 2 == 0 else "whoosh_largo", b["from"], SFX_VOL["whoosh_corto"])
    for f in flashes:
        add("whoosh_largo", f)
    for ic in icons:
        sound = ICON_SFX.get(ic["icon"], "pop")
        at = ic["from"] + ic["durationInFrames"] - 10 if ic["anim"] == "fly" else ic["from"]
        add(sound, at)
    for c in captions:
        for w in c["words"]:
            if w.get("em"):
                add("click", c["from"] + w["at"], 0.18)
    if cfg.get("end_card"):  # cierre con el usuario: whoosh al entrar y pop del icono
        add("whoosh_largo", aroll_frames)
        add("pop", aroll_frames + 6, 0.45)
    for x in cfg.get("sfx_extra", []):
        add(x["sound"], frame(words[find_phrase(words, x["phrase"])[0]]["os"]), x.get("vol"))

    # Uno por sitio: si dos efectos caen a menos de 4 fotogramas, se queda el más fuerte (salvo riser+impacto).
    ev.sort(key=lambda e: (e["at"], -e["vol"]))
    out = []
    for e in ev:
        clash = [o for o in out if abs(o["at"] - e["at"]) < 4 and "riser" not in (o["sound"], e["sound"])]
        if clash and clash[0]["vol"] >= e["vol"]:
            continue
        out = [o for o in out if o not in clash] + [e]
    gain = cfg.get("sfx_gain", 1.0)  # Aimee: efectos más bajos (borrador 5: la mitad)
    for e in out:
        e["vol"] = round(e["vol"] * gain, 3)
    result = []
    for e in sorted(out, key=lambda e: e["at"]):
        start = e["at"] - peak.get(e["sound"], 0)
        result.append({"sound": e["sound"], "from": max(0, start), "trim": max(0, -start),
                       "durationInFrames": length[e["sound"]] - max(0, -start), "vol": e["vol"]})
    return [r for r in result if r["durationInFrames"] > 0]


def intro_keys(cfg, drop, end):
    """Fotogramas clave del zoom del gancho (ARoll.tsx y mattes.py los leen de edit.json).

    Sin "intro" en la configuración: acercamiento lento, aceleración que pega en el golpe y rebote (Virginia).
    Con "intro": golpe de zoom inicial en punch_frames, empuje lento y segundo golpe más cerrado en el golpe.
    """
    if not cfg:
        return {"frames": [0, drop - 7, drop, drop + 4, end], "scales": [1.0, 1.14, 2.05, 1.9, 2.0]}
    return {
        "frames": [0, cfg["punch_frames"], drop - cfg["ramp_frames"], drop, drop + 4, end],
        "scales": [1.0, cfg["punch_scale"], cfg["pre_drop_scale"], cfg["drop_scale"],
                   cfg["drop_scale"] - 0.12, cfg["settle_scale"]],
    }


def caption_lines(lines, to_out, frame):
    """Subtítulos con un texto dado (p. ej. copiado de un vídeo de referencia), cada línea en su tiempo del vídeo
    base (base_start/base_end). Las palabras de la línea van apareciendo repartidas en el primer 70 % del tramo."""
    out = []
    for ln in lines:
        f0, f1 = frame(to_out(ln["base_start"])), frame(to_out(ln["base_end"]))
        ws = ln["text"].split()
        step = (f1 - f0) * 0.7 / max(1, len(ws))
        out.append({"from": f0, "durationInFrames": f1 - f0,
                    "words": [{"text": w, "at": round(k * step), "em": False} for k, w in enumerate(ws)]})
    return out


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
                if not rep:  # palabras dudosas que no se subtitulan (p. ej. frases de una niña poco claras)
                    del words[i:i + n]
                    continue
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
        if cur and (w["os"] - cur[-1]["oe"] > 0.6 or norm(w["w"]) in BREAK_BEFORE or w["w"][:1] in "¡¿"):
            # hueco (había un título en medio), conjunción o frase nueva (¡ ¿): bloque nuevo
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


def denoise(src, root):
    """Quita el ruido de fondo de la voz con DeepFilterNet3 (binario deep-filter); el resultado se reutiliza.

    En exteriores (viento, tráfico) baja el ruido de las pausas unos 37 dB sin cambiar el nivel de la voz, y
    Whisper la entiende incluso mejor que el original (confianza media 0.98 frente a 0.96).
    """
    out = os.path.join(root, "input", os.path.splitext(os.path.basename(src))[0] + "_denoised.wav")
    if os.path.exists(out):
        return out
    tmp = os.path.join(root, "input", "denoise_tmp")
    os.makedirs(tmp, exist_ok=True)
    wav = os.path.join(tmp, "voz.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "48000", wav])
    run([DEEP_FILTER, "-D", "-o", os.path.join(tmp, "out"), wav])
    os.replace(os.path.join(tmp, "out", "voz.wav"), out)
    for d, _, files in os.walk(tmp, topdown=False):
        for f in files:
            os.remove(os.path.join(d, f))
        os.rmdir(d)
    return out


# Nivelador de voz (Aimee: la voz de la app sale del altavoz del móvil unos 20 dB más baja que la suya). Se activa
# con "level_voice": true; build_aroll lo aplica tras quitar el ruido.
LEVELER = "dynaudnorm=f=200:g=11:p=0.9:m=18"
LEVEL_VOICE = False


def restore_ranges(x, src, sr, ranges, target_db=-30.0, max_gain_db=24.0):
    """En los tramos [desde, hasta] (s del original) vuelve al audio sin limpiar y lo sube hasta target_db RMS.

    DeepFilterNet trata como ruido una voz lejana que sale del altavoz de un móvil (la app Anna en el vídeo de
    Aimee: de -50 a -72 dB). En esos tramos se usa el original, subido de volumen, con fundidos de 20 ms.
    """
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    orig = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    x = x.copy()
    f = int(0.02 * sr)
    for a, b in ranges:
        i0, i1 = int(a * sr), min(int(b * sr), len(x), len(orig))
        seg = orig[i0:i1]
        rms = np.sqrt((seg ** 2).mean()) + 1e-9
        g = 10 ** (min(max_gain_db, target_db - 20 * np.log10(rms)) / 20)
        w = np.ones(i1 - i0, dtype=np.float32)
        w[:f] = np.linspace(0, 1, f)
        w[-f:] = np.linspace(1, 0, f)
        x[i0:i1] = x[i0:i1] * (1 - w[:, None]) + seg * g * w[:, None]
        print(f"  voz sin limpiar {a:.2f}-{b:.2f} s: {20 * np.log10(rms):.1f} dB, +{20 * np.log10(g):.1f} dB")
    return x


def build_aroll(src, segs, dst, audio_src=None, raw_ranges=(), original_audio=False):
    """Vídeo exacto al fotograma y audio exacto a la muestra, montados por separado."""
    tmp = os.path.join(os.path.dirname(dst), "aroll_parts")
    os.makedirs(tmp, exist_ok=True)
    listing = []
    for k, (a, b) in enumerate(segs):
        part = os.path.join(tmp, f"p{k:03d}.mp4")
        run([
            "ffmpeg", "-v", "error", "-y", "-ss", f"{a:.4f}", "-i", src, "-an",
            "-vf", f"setpts=PTS-STARTPTS,fps={FPS},scale={AROLL_W}:{AROLL_H}:flags=lanczos",
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
        ["ffmpeg", "-v", "error", "-i", audio_src or src, "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    if raw_ranges and audio_src and audio_src != src:
        x = restore_ranges(x, src, sr, raw_ranges)
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
        # original_audio: la voz tal cual se grabó, sin procesar (lo pidió Aimee: que se oiga como en el original).
        *([] if original_audio else
          ["-af", f"{VOICE},{LEVELER + ',' if LEVEL_VOICE else ''}loudnorm=I=-16:TP=-1.5:LRA=7,aresample={sr}"]),
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst,
    ])
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def conform_broll(src, dst, speed, start, length, cx, transpose=None):
    """Recorta a vertical: escala a 1920 de alto (o 1080 de ancho) y toma la ventana en la posición cx.

    transpose: giro para clips grabados en vertical sin metadato de rotación (1 = 90° horario).
    """
    vf = (
        (f"transpose={transpose}," if transpose is not None else "")
        + f"setpts={1 / speed:.4f}*(PTS-STARTPTS),fps={FPS},"
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
