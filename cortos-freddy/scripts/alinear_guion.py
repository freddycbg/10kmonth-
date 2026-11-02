"""Subtítulos con un guion corregido a mano, sincronizados palabra a palabra con la transcripción de Whisper.

Cada palabra del guion que coincide con una de Whisper toma su tiempo; las corregidas o añadidas se reparten en el
hueco de las de Whisper que sustituyen (alineación con difflib). Las que Whisper no oyó llevan su tiempo en el guion
como "palabra@inicio-fin". Resultado en el formato de transcribe.py, para build_edit.py.

Uso: python scripts/alinear_guion.py <guion.txt> <transcript_whisper.json> <salida.json>
  guion.txt: una frase por línea (una persona por frase).
"""
import difflib
import json
import re
import sys

guion, whisper_path, out = sys.argv[1:4]
ww = [w for s in json.load(open(whisper_path))["segments"] for w in s["words"]]


def norm(s):
    return re.sub(r"[^\wáéíóúñü%]", "", s.lower())


lines = [ln.split() for ln in open(guion, encoding="utf-8").read().splitlines() if ln.strip()]
toks = []  # (texto, línea, tiempo fijo o None)
for k, ln in enumerate(lines):
    for t in ln:
        m = re.match(r"^(.*)@([\d.]+)-([\d.]+)$", t)
        toks.append((m.group(1), k, (float(m.group(2)), float(m.group(3)))) if m else (t.replace("_", " "), k, None))

a = [norm(w["word"]) for w in ww]
b = [norm(t[0]) if t[2] is None else "\0" for t in toks]
times = [None] * len(toks)
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if op == "equal":
        for i, j in zip(range(i1, i2), range(j1, j2)):
            times[j] = (ww[i]["start"], ww[i]["end"])
    elif op == "replace" or (op == "insert" and i1 == i2):
        if i2 > i1:
            s, e = ww[i1]["start"], ww[i2 - 1]["end"]
        else:  # inserción pura: entre la palabra anterior y la siguiente
            s = ww[i1 - 1]["end"] if i1 > 0 else 0.0
            e = ww[i1]["start"] if i1 < len(ww) else s + 0.4
        js = [j for j in range(j1, j2) if toks[j][2] is None]
        lens = [max(1, len(toks[j][0])) for j in js]
        tot, acc = sum(lens), 0
        for j, ln in zip(js, lens):
            times[j] = (s + (e - s) * acc / tot, s + (e - s) * (acc + ln) / tot)
            acc += ln
for j, t in enumerate(toks):
    if t[2] is not None:
        times[j] = t[2]
missing = [toks[j][0] for j in range(len(toks)) if times[j] is None]
if missing:
    raise SystemExit(f"Sin tiempo: {missing}")

segments = []
for k in range(len(lines)):
    words = [{"word": " " + toks[j][0], "start": round(times[j][0], 3), "end": round(times[j][1], 3), "prob": 1.0}
             for j in range(len(toks)) if toks[j][1] == k]
    segments.append({"start": words[0]["start"], "end": words[-1]["end"],
                     "text": " ".join(w["word"].strip() for w in words), "words": words})
json.dump({"language": "es", "segments": segments}, open(out, "w"), ensure_ascii=False, indent=1)
for s in segments:
    print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['text']}")
