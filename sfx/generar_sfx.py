"""Genera la librería de efectos de sonido de los vídeos (los típicos de vídeos virales), sintetizados con numpy.

Uso: /opt/whisper-venv/bin/python sfx/generar_sfx.py   ->   sfx/*.wav (48 kHz, estéreo, pico a -1 dBFS)

Efectos:
  whoosh_corto, whoosh_largo  aire que pasa: transiciones, entrada de b-roll
  swoosh                      barrido rápido y agudo: algo que sale volando, deslizar
  pop                         burbuja: aparece un icono o un texto
  click                       toque seco de interfaz: palabra clave, candado
  impacto                     golpe grave cinematográfico: zoom fuerte, palabra gigante
  sub_drop                    caída de graves: después de una frase fuerte
  riser                       sube la tensión hasta el golpe
  ding                        campanita de notificación: idea, comenta abajo
  kaching                     caja registradora: dinero, oportunidades
  camara                      obturador de cámara: foto, destello
  glitch                      corte digital entrecortado
  error                       zumbido de "incorrecto"
  braam                       golpe grave de tráiler, tenso
"""
import os

import numpy as np
from scipy import signal

SR = 48000
OUT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(10)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, d, s, r, sustain=0.6):
    """Envolvente en segundos (ataque, caída, sostenido, final)."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    s = max(0, n - a - d - r)
    e = np.concatenate([
        np.linspace(0, 1, a, endpoint=False) ** 2,
        np.linspace(1, sustain, d, endpoint=False),
        np.full(s, sustain),
        np.linspace(sustain, 0, r) ** 2,
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def bandpass_sweep(x, f0, f1, q=2.5, steps=64):
    """Filtro paso banda cuyo centro va de f0 a f1 (en bloques, con solape)."""
    n = len(x)
    out = np.zeros(n)
    win = n // steps * 2
    hop = win // 2
    w = np.hanning(win)
    for k in range(0, n - hop, hop):
        fc = f0 * (f1 / f0) ** (k / n)
        lo, hi = fc / (1 + 1 / q), min(SR / 2 * 0.95, fc * (1 + 1 / q))
        b, a = signal.butter(2, [lo, hi], btype="band", fs=SR)
        seg = x[k:k + win]
        y = signal.lfilter(b, a, seg)
        out[k:k + len(y)] += y * w[:len(y)]
    return out


def lowpass(x, fc, order=4):
    b, a = signal.butter(order, fc, btype="low", fs=SR)
    return signal.lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = signal.butter(order, fc, btype="high", fs=SR)
    return signal.lfilter(b, a, x)


def reverb(x, decay=0.5, mix=0.25):
    """Reverberación simple: cola de ruido con decaimiento exponencial (convolución)."""
    n = int(decay * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 6, n))
    ir = lowpass(ir, 6000)
    ir /= np.abs(ir).sum() ** 0.5 * 4
    x = x.copy()
    f = min(len(x) // 4, int(0.03 * SR))
    x[-f:] *= np.linspace(1, 0, f)  # sin escalón al terminar la señal seca (daba un clic)
    dry = np.pad(x, (0, n))
    wet = np.pad(signal.fftconvolve(x, ir), (0, 1))[: len(dry)]
    return dry * (1 - mix) + wet * mix


def pan_sweep(x, p0, p1):
    """Estéreo con paneo que se mueve de p0 a p1 (-1 izquierda, 1 derecha)."""
    p = np.linspace(p0, p1, len(x))
    ang = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1)


def stereo(x, width=0.0):
    if width <= 0:
        return np.stack([x, x], axis=1)
    d = int(0.012 * SR)
    r = np.concatenate([np.zeros(d), x])[: len(x)]
    return np.stack([x, x * (1 - width) + r * width], axis=1)


def save(name, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = stereo(x)
    fade = int(0.004 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    # Pico a -1 dBFS, pero sin pasar de -16 dBFS RMS: así todos suenan parecido de fuertes (el zumbido de
    # "error", una onda cuadrada, quedaba muchísimo más alto que el resto).
    rms = np.sqrt((x ** 2).mean()) + 1e-9
    x *= min(10 ** (-1 / 20) / (np.abs(x).max() + 1e-9), 10 ** (-16 / 20) / rms)
    pcm = (x * 32767).astype("<i2")
    import wave

    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {name}.wav  {len(x) / SR:.2f} s")


# --- Efectos ------------------------------------------------------------------

def whoosh(dur, f0, f1, p0, p1):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    x = bandpass_sweep(noise, f0, f1, q=1.8)
    # El aire sube y baja: pico a ~60 % del recorrido.
    tt = np.linspace(0, 1, n)
    e = np.exp(-((tt - 0.6) / 0.22) ** 2)
    x = x * e
    x += 0.15 * lowpass(noise, 300) * e  # cuerpo grave
    return pan_sweep(x, p0, p1)


def pop():
    t = t_axis(0.16)
    f = 220 + 900 * np.exp(-t * 55)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 30)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.4
    return reverb(x + highpass(click, 2000), 0.25, 0.12)


def click():
    t = t_axis(0.06)
    x = highpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 260)
    x += np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 180) * 0.5
    return x


def impacto():
    t = t_axis(1.6)
    f = 42 + 120 * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    body = lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 9) * 0.9
    crack = highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 70) * 0.35
    x = np.tanh((sub * 1.4 + body + crack) * 1.6)
    return stereo(reverb(x, 1.2, 0.3), 0.4)


def sub_drop():
    t = t_axis(1.5)
    f = 30 + 130 * np.exp(-t * 3.2)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_adsr(len(t), 0.01, 0.2, 0, 1.2, 0.8)
    return np.tanh(x * 1.5)


def riser(dur=2.0):
    t = t_axis(dur)
    tt = t / dur
    noise = rng.standard_normal(len(t))
    air = bandpass_sweep(noise, 300, 9000, q=1.5)
    f = 110 * 2 ** (tt * 3)  # sube tres octavas
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.25
    saw += signal.sawtooth(2 * np.pi * np.cumsum(f * 1.007) / SR) * 0.25
    x = (air + lowpass(saw, 4000)) * tt ** 2.2
    return pan_sweep(x, -0.3, 0.3)


def ding():
    t = t_axis(1.1)
    x = np.zeros(len(t))
    for ratio, amp, dec in ((1, 1, 3.2), (2.76, 0.45, 5), (5.4, 0.25, 8), (8.93, 0.12, 12)):
        x += amp * np.sin(2 * np.pi * 1320 * ratio * t) * np.exp(-t * dec)
    x *= 1 - np.exp(-t * 900)
    return stereo(reverb(x, 0.6, 0.18), 0.3)


def kaching():
    t = t_axis(1.2)
    x = np.zeros(len(t))
    # "ka": golpe metálico del cajón
    ka = highpass(rng.standard_normal(len(t)), 1800) * np.exp(-t * 60) * 0.8
    x += ka
    # "ching": monedas, varias campanitas agudas escalonadas
    for k, (f, d0) in enumerate(((2637, 0.09), (3136, 0.13), (3951, 0.17), (2349, 0.21))):
        tk = np.clip(t - d0, 0, None)
        on = (t >= d0).astype(float)
        for ratio, amp in ((1, 1), (2.4, 0.35), (4.1, 0.15)):
            x += on * amp * 0.5 * np.sin(2 * np.pi * f * ratio * tk) * np.exp(-tk * 6)
    return stereo(reverb(x, 0.5, 0.15), 0.35)


def camara():
    t = t_axis(0.35)
    x = np.zeros(len(t))
    for d0, a in ((0.0, 1.0), (0.11, 0.7)):
        tk = np.clip(t - d0, 0, None)
        on = (t >= d0).astype(float)
        x += on * a * highpass(rng.standard_normal(len(t)), 1200) * np.exp(-tk * 120)
        x += on * a * 0.4 * np.sin(2 * np.pi * 900 * tk) * np.exp(-tk * 90)
    return stereo(x, 0.2)


def glitch():
    t = t_axis(0.4)
    base = signal.square(2 * np.pi * 180 * t) * 0.4 + rng.standard_normal(len(t)) * 0.5
    gate = (np.floor(t * 38) % 3 != 1).astype(float)
    crushed = np.round(base * 6) / 6
    hold = crushed.copy()
    step = 12
    for i in range(0, len(hold), step):
        hold[i:i + step] = hold[i]
    x = hold * gate * env_adsr(len(t), 0.005, 0.05, 0, 0.12, 0.8)
    return stereo(bandpass_sweep(x, 600, 3000, q=1.2) * 3, 0.5)


def error():
    t = t_axis(0.55)
    f = np.where(t < 0.26, 196, 147)
    x = signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.6
    x = lowpass(x, 2200) * env_adsr(len(t), 0.005, 0.05, 0, 0.08, 0.9)
    gap = ((t > 0.24) & (t < 0.28)).astype(float)
    return x * (1 - gap)


def braam():
    t = t_axis(2.2)
    x = np.zeros(len(t))
    for det in (0.995, 1.0, 1.006, 2.0, 0.5):
        x += signal.sawtooth(2 * np.pi * 55 * det * t) * (0.5 if det != 2.0 else 0.25)
    # Filtro que se cierra: de brillante a oscuro (mezcla de dos paso bajo).
    k = np.exp(-t * 2)
    x = lowpass(x, 3200) * k + lowpass(x, 700) * (1 - k)
    x = np.tanh(x * 1.2) * env_adsr(len(t), 0.02, 0.4, 0, 1.6, 0.7)
    return stereo(reverb(x, 1.5, 0.35), 0.5)


def main():
    print("Generando efectos en", OUT)
    save("whoosh_corto", whoosh(0.45, 400, 3500, -0.7, 0.7))
    save("whoosh_largo", whoosh(0.9, 250, 4500, 0.8, -0.8))
    save("swoosh", whoosh(0.28, 1500, 8000, -0.9, 0.9))
    save("pop", pop())
    save("click", click())
    save("impacto", impacto())
    save("sub_drop", sub_drop())
    save("riser", riser())
    save("ding", ding())
    save("kaching", kaching())
    save("camara", camara())
    save("glitch", glitch())
    save("error", error())
    save("braam", braam())


if __name__ == "__main__":
    main()
