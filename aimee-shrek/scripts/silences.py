"""Detecta silencios por energía y devuelve los tramos a conservar.

Uso: python scripts/silences.py <audio16k.wav> <salida.json> [umbral_db=-40] [min_silencio=0.3]
Silencio = RMS (ventanas de 10 ms) por debajo del umbral durante >= min_silencio.
De cada silencio se conserva PAD_AFTER tras la voz y PAD_BEFORE antes de la siguiente frase.
"""
import json
import subprocess
import sys

import numpy as np

PAD_AFTER = 0.08
PAD_BEFORE = 0.10

src, out = sys.argv[1], sys.argv[2]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else -40.0
min_sil = float(sys.argv[4]) if len(sys.argv) > 4 else 0.3

sr, hop = 16000, 160
a = np.frombuffer(
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True,
        check=True,
    ).stdout,
    dtype=np.float32,
)
n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9)
silent = db < thr

# Rellena "huecos" de voz de 10 ms dentro de un silencio (clics, respiraciones cortas).
i = 0
while i < n:
    if not silent[i]:
        j = i
        while j < n and not silent[j]:
            j += 1
        if j - i < 2 and i > 0 and j < n:
            silent[i:j] = True
        i = j
    else:
        i += 1

dur = len(a) / sr
cuts = []
i = 0
while i < n:
    if silent[i]:
        j = i
        while j < n and silent[j]:
            j += 1
        s, e = i / 100, j / 100
        if e - s >= min_sil:
            cs = 0.0 if s == 0 else s + PAD_AFTER
            ce = dur if j >= n else e - PAD_BEFORE
            if ce > cs:
                cuts.append((cs, ce))
        i = j
    else:
        i += 1

keep, t = [], 0.0
for cs, ce in cuts:
    if cs > t:
        keep.append([round(t, 3), round(cs, 3)])
    t = ce
if t < dur:
    keep.append([round(t, 3), round(dur, 3)])

removed = sum(ce - cs for cs, ce in cuts)
json.dump({"source_duration": dur, "keep": keep, "cuts": cuts}, open(out, "w"), indent=1)
print(f"silencios cortados: {len(cuts)}  tiempo quitado: {removed:.1f}s  "
      f"duración: {dur:.1f}s -> {dur - removed:.1f}s  tramos: {len(keep)}")
