"""Transcribe un audio/vídeo con faster-whisper y guarda tiempos por palabra en JSON.

Uso: /opt/whisper-venv/bin/python scripts/transcribe.py <entrada> <salida.json> [idioma]
"""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel

MODEL = "/opt/whisper-models/models--mobiuslabsgmbh--faster-whisper-large-v3-turbo/snapshots/0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf"

src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else "es"

model = WhisperModel(MODEL, device="cpu", compute_type="int8", cpu_threads=4)
# El audio se decodifica con ffmpeg: la versión de PyAV que instala pip no acepta las opciones que usa faster-whisper.
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
segments, info = model.transcribe(
    audio, language=lang, word_timestamps=True, vad_filter=False, beam_size=5
)

result = {"language": info.language, "duration": info.duration, "segments": []}
for s in segments:
    result["segments"].append(
        {
            "start": s.start,
            "end": s.end,
            "text": s.text.strip(),
            "words": [
                {"word": w.word, "start": w.start, "end": w.end, "prob": w.probability}
                for w in s.words
            ],
        }
    )
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}", flush=True)

with open(out, "w") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)
