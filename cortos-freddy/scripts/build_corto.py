"""Arma un corto de Freddy (estilo "Así mejoras tu negocio") a partir de un trozo de entrenamiento.

Lee corto.config.json y la transcripción del vídeo fuente (scripts/transcribe.py), recorta las frases elegidas,
quita silencios largos, limpia la voz (DeepFilterNet), y escribe public/media/aroll.mp4 y src/Corto/corto.json.

Uso: python3 scripts/build_corto.py [corto.config.json]
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
W, H = 1080, 1920
BAND_Y, BAND_H = 555, 810  # franja 4:3 de la referencia (370..910 de 1280)
MIN_GAP = 0.3  # silencios más largos se quitan
HDR = (
    "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,"
    "zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
)


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]", "", s).strip()


def run(cmd):
    subprocess.run(cmd, check=True)


def probe(path, entries):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "json", path],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def find_phrase(words, phrase, after=0):
    toks = norm(phrase).split()
    keys = [norm(w["word"]) for w in words]
    for i in range(after, len(words) - len(toks) + 1):
        if keys[i:i + len(toks)] == toks:
            return i, i + len(toks) - 1
    raise SystemExit(f"no encuentro la frase: {phrase!r}")


def main(cfg_path):
    cfg = json.load(open(os.path.join(ROOT, cfg_path)))  # ruta relativa a la raíz o absoluta
    tr = json.load(open(os.path.join(ROOT, cfg["transcript"])))
    words = [w for s in tr["segments"] for w in s["words"]]
    src = os.path.join(ROOT, cfg["source"])

    # 1. Frases elegidas -> rangos de palabras, y dentro de cada frase se cortan los silencios > MIN_GAP.
    pieces = []  # (indice_primera, indice_ultima, tramo)
    for k, item in enumerate(cfg["keep"]):
        a, _ = find_phrase(words, item["from"])
        _, b = find_phrase(words, item["to"], a)
        start = a
        for i in range(a, b):
            if words[i + 1]["start"] - words[i]["end"] > MIN_GAP:
                pieces.append((start, i, k))
                start = i + 1
        pieces.append((start, b, k))
    ranges = []
    first_piece = set()
    for n, (a, b, k) in enumerate(pieces):
        if n == 0 or pieces[n - 1][2] != k:
            first_piece.add(n)
    for n, (a, b, k) in enumerate(pieces):
        s = max(0.0, words[a]["start"] - 0.06)
        if n in first_piece and "start_at" in cfg["keep"][k]:
            s = cfg["keep"][k]["start_at"]  # corte manual en el silencio real (Whisper a veces adelanta la palabra)
        e = words[b]["end"] + 0.12
        if ranges and ranges[-1][0] <= s < ranges[-1][1]:  # solo si van en orden (el gancho puede ir antes)
            s = ranges[-1][1]
        ranges.append((s, e, a, b, k))

    # 2. A-roll: tramos recortados al fotograma, convertidos a SDR si el original es HDR, voz limpia.
    info = probe(src, "stream=width,height,color_transfer")["streams"][0]
    hdr = info.get("color_transfer") in ("arib-std-b67", "smpte2084")
    tmp = tempfile.mkdtemp(dir=os.path.join(ROOT, "input"))
    parts = []
    for i, (s, e, *_r) in enumerate(ranges):
        p = os.path.join(tmp, f"p{i:03d}.mp4")
        vf = (HDR if hdr else "") + f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-to", f"{e:.3f}", "-i", src, "-vf", vf,
             "-af", "aresample=48000", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p",
             "-c:a", "pcm_s16le", p.replace(".mp4", ".mov")])
        parts.append(p.replace(".mp4", ".mov"))
    lst = os.path.join(tmp, "l.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    joined = os.path.join(tmp, "joined.mov")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined])
    wav = os.path.join(tmp, "voz.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", joined, "-ac", "1", "-ar", "48000", wav])
    if cfg.get("denoise", True):
        run(["/opt/deepfilter/deep-filter", "-D", "-o", os.path.join(tmp, "dn"), wav])
        wav = os.path.join(tmp, "dn", "voz.wav")
    os.makedirs(os.path.join(ROOT, "public/media"), exist_ok=True)
    aroll = os.path.join(ROOT, "public/media/aroll.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", joined, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "256k", aroll])
    shutil.rmtree(tmp)

    # 3. Tiempos de salida de cada palabra.
    out_t, acc, seg_out = {}, 0.0, []
    for s, e, a, b, k in ranges:
        for i in range(a, b + 1):
            out_t[i] = (acc + words[i]["start"] - s, acc + words[i]["end"] - s)
        seg_out.append((acc, e - s, k))
        acc += e - s
    total = acc

    # Encuadre por frase: alterna plano abierto y punch-in (sin repetir en dos frases seguidas).
    frames = cfg.get("framing", [{"scale": 1.0, "x": 0.5, "y": 0.3}, {"scale": 1.3, "x": 0.5, "y": 0.28}])
    segments = []
    for start, dur, k in seg_out:
        f = frames[k % len(frames)]
        if segments and segments[-1]["k"] == k:
            segments[-1]["dur"] += dur
            continue
        segments.append({"from": round(start, 3), "dur": round(dur, 3), "k": k, **f})

    # 4. Grupos de subtítulos: hasta 3 palabras normales, cortan en puntuación; acentos y palabra gigante solos.
    em = {norm(x) for x in cfg.get("emphasis", [])}
    big = {norm(x) for x in cfg.get("big", [])}
    anchors = cfg.get("anchors", ["tl", "tr", "ct"])
    groups, cur = [], []
    used = sorted(out_t, key=lambda i: out_t[i][0])

    def flush():
        if cur:
            groups.append(cur.copy())
            cur.clear()

    for i in used:
        txt = words[i]["word"].strip()
        key = norm(txt)
        kind = "big" if key in big else "em" if key in em else "n"
        if kind == "big":
            if len(cur) > 1:  # una palabra suelta antes de la gigante va encima de ella, en pequeño
                flush()
            cur.append((i, kind))
            flush()
            continue
        cur.append((i, kind))
        if re.search(r"[.,!?;:]$", txt) or sum(1 for _, kd in cur if kd == "n") >= cfg.get("max_words", 4) or kind == "em":
            flush()
    flush()
    gout = []
    for n, g in enumerate(groups):
        start = out_t[g[0][0]][0]
        nxt = out_t[groups[n + 1][0][0]][0] if n + 1 < len(groups) else total
        end = min(nxt, out_t[g[-1][0]][1] + 0.6)
        ws = []
        for i, kind in g:
            txt = re.sub(r"[,;:]$", "", words[i]["word"].strip())
            fx = cfg.get("fixes", {}).get(norm(txt))
            if fx:
                txt = fx + (txt[-1] if txt[-1] in ".!?" else "")
            if kind != "n":
                txt = re.sub(r"[.,!?¿¡]", "", txt)
            if kind == "big":
                txt = txt.upper()
            ws.append({"text": txt, "start": round(out_t[i][0], 3), "kind": kind})
        anchor = "c" if any(kd == "big" for _, kd in g) else anchors[n % len(anchors)]
        gout.append({"start": round(start, 3), "end": round(end, 3), "anchor": anchor, "words": ws})

    def phrase_time(p):
        a, _ = find_phrase(words, p)
        if a not in out_t:
            raise SystemExit(f"la frase del b-roll no está en el corte: {p!r}")
        return out_t[a][0]

    # 5. B-roll, glitches y efectos de sonido.
    brolls, sfx = [], []
    for b in cfg.get("broll", []):
        t = phrase_time(b["phrase"]) + b.get("delay", 0)
        brolls.append({"src": b["src"], "from": round(t, 3), "dur": b["dur"], "trim": b.get("trim", 0),
                       "x": b.get("x", 0.5), "y": b.get("y", 0.5), "zoom": b.get("zoom", 1.0)})
        sfx.append({"src": "sfx/whoosh_corto.wav", "at": round(t - 0.1, 3), "volume": 0.35})
    glitches = []
    cut_times = [s["from"] for s in segments[1:]]
    for n, t in enumerate(cut_times):
        if n % cfg.get("glitch_every", 3) == 0:
            glitches.append(round(t * FPS))
            sfx.append({"src": "sfx/glitch.wav", "at": round(t - 0.05, 3), "volume": 0.3})
    for g in gout:
        for w in g["words"]:
            if w["kind"] == "big":
                sfx.append({"src": "sfx/impacto.wav", "at": w["start"], "volume": 0.45})
    card = cfg["end_card"]
    card_from = total
    sfx.append({"src": "sfx/whoosh_largo.wav", "at": round(card_from - 0.15, 3), "volume": 0.4})
    end_video = None
    end_from = card_from + card["dur"]
    if cfg.get("end_video"):
        end_video = {"src": cfg["end_video"]["src"], "from": round(end_from, 3), "dur": cfg["end_video"]["dur"]}
        end_from += cfg["end_video"]["dur"]

    out = {
        "fps": FPS, "width": W, "height": H,
        "durationInFrames": int(round(end_from * FPS)),
        "aroll": "media/aroll.mp4", "arollFrames": int(round(total * FPS)),
        "band": {"y": BAND_Y, "h": BAND_H},
        "accent": cfg.get("accent", "#F26B2B"),
        "headline": [[{"text": t.strip("*"), "accent": t.startswith("*")} for t in re.split(r"(\*[^*]+\*)", ln) if t]
                     for ln in cfg["headline"]],
        "segments": [{k: v for k, v in s.items() if k != "k"} for s in segments],
        "groups": gout, "brolls": brolls, "glitches": glitches, "sfx": sorted(sfx, key=lambda x: x["at"]),
        "music": cfg["music"],
        "endCard": {"from": round(card_from, 3), "dur": card["dur"], "lines": card["lines"]},
        "endVideo": end_video,
    }
    json.dump(out, open(os.path.join(ROOT, "src/Corto/corto.json"), "w"), ensure_ascii=False, indent=1)
    print(f"corto: {total:.1f} s de voz + {card['dur']} s tarjeta, {len(ranges)} tramos, {len(gout)} grupos")
    for g in gout:
        print(f"  {g['start']:6.2f} [{g['anchor']}] " + " ".join(w["text"] for w in g["words"]))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "corto.config.json")
