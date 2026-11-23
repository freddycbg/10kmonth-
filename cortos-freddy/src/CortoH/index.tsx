import { loadFont } from "@remotion/fonts";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Easing,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import face from "../Edit/face.json";
import data from "../Corto/corto.json";

// Diseño H (anuncio de campaña de Freddy, "Tres decisiones"): copia el estilo del vídeo de referencia.
// - Subtítulos blancos en Inter Tight semibold, cada palabra en mayúscula inicial, alineados a la izquierda a ~70 % de
//   la altura; cada palabra entra desde abajo como "fantasma" translúcido y sube a su sitio; se acumulan por frase.
// - B-roll a pantalla completa, rápido (0,5-1 s), sobre todo de la vida de Freddy en AIL; stock solo en
//   "vida común / la vida que tanto sueñas".
// - Transiciones: destello de luz cálido (light leak), fundido blanco-rosado, destello blanco total y zoom con
//   desenfoque. Zoom dinámico por golpes en el A-roll. Música Cocktail. Cierre con la marca 10K Month.

loadFont({ family: "Inter Tight", url: staticFile("fonts/inter-tight-latin-600-normal.woff2"), weight: "600" });

type CWord = { text: string; start: number; kind: string };
const D = data as unknown as {
  durationInFrames: number;
  aroll: string;
  arollFrames: number;
  segments: { from: number; dur: number }[];
  groups: { words: CWord[] }[];
  music: { src: string; volume: number; endVolume: number; trim: number };
  lastWordEnd: number;
  endVideo: { src: string; from: number; dur: number } | null;
};

const W = 1080;
const H = 1920;
const FACE_TARGET = { x: 540, y: 600 };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const WORDS = D.groups.flatMap((g) => g.words);
const T = (i: number) => WORDS[i].start;
const END = D.arollFrames / 30;

// ---------- subtítulos: [índice de la primera palabra, ...textos] ----------
const CAPS: [number, ...string[]][] = [
  [0, "Cuando", "Llegué"],
  [2, "A", "Este", "País,"],
  [5, "Hubo", "Tres", "Decisiones"],
  [8, "Que", "Cambiaron"],
  [10, "Mi", "Vida", "Profesional."],
  [13, "Uno:"],
  [14, "Aprender"],
  [15, "Habilidades", "De", "Ventas."],
  [18, "Dos:"],
  [19, "Juntarme", "Con", "Gente"],
  [22, "Que", "Piensa", "En", "Crecer"],
  [26, "Y", "No", "En", "Sobrevivir."],
  [30, "Y", "Tres:"],
  [32, "Entrar", "A", "La"],
  [35, "Industria", "De", "Los"],
  [38, "Seguros", "De", "Vida."],
  [41, "Si", "Quieres", "Empezar"],
  [44, "En", "Esta", "Industria,"],
  [47, "Te", "Doy", "La", "Asesoría"],
  [51, "Y", "El", "Acompañamiento,"],
  [54, "Paso", "A", "Paso,"],
  [57, "Para", "Que", "Al", "Igual"],
  [61, "Que", "Yo,"],
  [63, "Puedas", "Cambiar"],
  [65, "Tu", "Realidad."],
  [67, "Pases", "De", "Vivir"],
  [70, "Una", "Vida", "Común"],
  [73, "A", "La", "Vida"],
  [76, "Que", "Tanto", "Sueñas."],
  [79, "Si", "Quieres"],
  [81, "Saber", "Cómo,"],
  [83, "Da", "Clic"],
  [85, "En", "El", "Anuncio"],
  [88, "Aquí", "Abajo"],
  [90, "Y", "Te", "Cuento", "Cómo."],
];
const GROUPS = CAPS.map(([i0, ...txt], n) => {
  const words = txt.map((text, k) => ({ text, start: T(i0 + k) }));
  const nextStart = n + 1 < CAPS.length ? T(CAPS[n + 1][0]) - 0.2 : END;
  const lastStart = words[words.length - 1].start;
  return { words, from: words[0].start - 0.2, to: Math.min(nextStart, lastStart + 0.95) };
});

// ---------- b-roll (segundos de salida): seis tandas como en el vídeo de referencia ----------
type B = { src: string; from: number; to: number; photo?: boolean; pan?: boolean; fast?: boolean };
const M = "media/camp/";
// Tanda 1: 8 planos rapidísimos (5 fotogramas) de su vida profesional en la agencia.
const T1 = ["logo_oro.jpg", "oficina.mp4", "anillos.jpg", "convencion.mp4", "gala.jpg", "oficina_cbg.jpg", "colega.jpg", "vegas.jpg"];
const T1_START = T(8);
const T1_STEP = 5 / 30;
const BROLL: B[] = [
  ...T1.map((f, k) => ({
    src: M + f,
    from: T1_START + k * T1_STEP,
    to: k === T1.length - 1 ? T(13) : T1_START + (k + 1) * T1_STEP,
    photo: f.endsWith(".jpg"),
    fast: true,
  })),
  // Tanda 2: entrenando en la oficina
  { src: M + "entreno_a.mp4", from: T(14) - 0.05, to: T(16) },
  { src: M + "entreno_b.mp4", from: T(16), to: T(18) },
  // Tanda 3: rodeado de la gente de la agencia (el retiro de Idaho, grabado en horizontal, se recorre en vertical)
  { src: M + "selfie_equipo.mp4", from: T(19), to: T(22) },
  { src: M + "idaho.mp4", from: T(22), to: T(28), pan: true },
  { src: M + "fogata.mp4", from: T(28), to: T(30) },
  // Tanda 4: los equipos aprendiendo en la oficina
  ...["mesa_equipo.mp4", "sofa_equipo.mp4", "sala_equipo.jpg", "libretas.jpg"].map((f, k) => {
    const step = (T(41) - T(32)) / 4;
    return { src: M + f, from: T(32) + k * step, to: T(32) + (k + 1) * step, photo: f.endsWith(".jpg") };
  }),
  // Tanda 5: entrenando de nuevo
  { src: M + "ensenando.mp4", from: T(47), to: T(51) + 0.07 },
  { src: M + "escenario.mp4", from: T(51) + 0.07, to: T(54) },
  // Tanda 6: tres de vida común (stock) y tres de la vida soñada (suyos)
  { src: M + "cocina.mp4", from: T(67), to: T(70) - 0.12 },
  { src: M + "delivery.mp4", from: T(70) - 0.12, to: T(71) + 0.09 },
  { src: M + "avenida.mp4", from: T(71) + 0.09, to: T(73) },
  { src: M + "moto.mp4", from: T(73), to: T(76) },
  { src: M + "piscina.mp4", from: T(76), to: (T(76) + T(79)) / 2 },
  { src: M + "rolls.mp4", from: (T(76) + T(79)) / 2, to: T(79) },
];

// ---------- transiciones ----------
type Fx = { t: number; type: "leak" | "pink" | "white" | "blur" };
const FX: Fx[] = [
  { t: T(13), type: "leak" },
  { t: T(18), type: "pink" },
  { t: T(30), type: "blur" },
  { t: T(41), type: "blur" },
  { t: T(46), type: "leak" },
  { t: T(54), type: "white" },
  { t: T(67), type: "white" },
  { t: T(79), type: "blur" },
  { t: END, type: "blur" },
];

// ---------- golpes de obturador ----------
const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
const SHUTTERS: { t: number; v: number }[] = [
  ...BROLL.map((b, i) => ({ t: b.from, v: i > 0 && near(BROLL[i - 1].to, b.from) ? 0.45 : 0.7 })),
  ...BROLL.filter((b, i) => !(BROLL[i + 1] && near(BROLL[i + 1].from, b.to)))
    .filter((b) => !FX.some((f) => (f.type === "leak" || f.type === "pink") && Math.abs(f.t - b.to) < 0.1))
    .map((b) => ({ t: b.to, v: 0.7 })),
  { t: END, v: 0.7 },
];

// ---------- zoom dinámico del A-roll: golpes a una nueva escala ----------
const ZOOM: { t: number; s: number }[] = [
  { t: 0, s: 1.18 },
  { t: T(10) - 0.1, s: 1.38 },
  { t: T(13), s: 1.22 },
  { t: T(14), s: 1.45 },
  { t: T(18), s: 1.05 },
  { t: T(30), s: 1.3 },
  { t: T(41), s: 1.05 },
  { t: T(44), s: 1.3 },
  { t: T(54), s: 1.12 },
  { t: T(59), s: 1.62 },
  { t: T(63), s: 1.3 },
  { t: T(79), s: 1.18 },
  { t: T(83), s: 1.45 },
  { t: T(88), s: 1.25 },
  { t: T(90), s: 1.5 },
];
const zoomAt = (t: number) => {
  let k = 0;
  for (let i = 0; i < ZOOM.length; i++) if (t >= ZOOM[i].t) k = i;
  const prev = k > 0 ? ZOOM[k - 1].s : ZOOM[0].s;
  const p = interpolate(t - ZOOM[k].t, [0, 0.14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const drift = 1 + 0.03 * Math.min(4, t - ZOOM[k].t); // empuje lento
  return (prev + (ZOOM[k].s - prev) * p) * drift;
};

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  // el gancho entra con un empuje continuo desde el plano abierto
  const hook = t < T(10) - 0.1 ? interpolate(t, [0, 3], [1.0, 1.18], clamp) : 0;
  const scale = hook || zoomAt(t);
  const i = Math.min(frame, face.x.length - 1);
  const fx = face.x[i] ?? 0.5;
  const fy = face.y[i] ?? 0.3;
  const vw = W * scale;
  const vh = H * scale;
  const left = Math.min(0, Math.max(W - vw, FACE_TARGET.x - fx * vw));
  const top = Math.min(0, Math.max(H - vh, FACE_TARGET.y - fy * vh));
  return <OffthreadVideo src={staticFile(D.aroll)} style={{ position: "absolute", left, top, width: vw, height: vh }} />;
};

const BrollClip: React.FC<{ b: B }> = ({ b }) => {
  const frame = useCurrentFrame();
  const n = (b.to - b.from) * 30;
  const settle = b.fast ? 1.03 - 0.006 * frame : interpolate(frame, [0, 5], [1.14, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blur = b.fast ? 0 : interpolate(frame, [0, 3], [10, 0], clamp);
  const style: React.CSSProperties = { filter: blur > 0.3 ? `blur(${blur}px)` : undefined };
  if (b.pan && !b.photo) {
    // vídeo horizontal: zoom a toda la altura y pasada de izquierda a derecha por todo el grupo
    const hh = H * 1.06;
    const ww = (hh * 3444) / 1920;
    const x = interpolate(frame, [0, n], [0, W - ww], { ...clamp, easing: Easing.inOut(Easing.sin) });
    return (
      <AbsoluteFill style={{ ...style, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(b.src)} muted style={{ position: "absolute", height: hh, width: ww, top: (H - hh) / 2, left: x, transform: `scale(${settle})` }} />
      </AbsoluteFill>
    );
  }
  if (b.photo && b.pan) {
    // foto horizontal: recorrido lateral para que se vea el grupo entero
    const x = interpolate(frame, [0, n], [-0.12, -0.5], clamp);
    return (
      <AbsoluteFill style={{ ...style, overflow: "hidden" }}>
        <Img src={staticFile(b.src)} style={{ position: "absolute", height: H * 1.1, top: -H * 0.05, left: `${x * 100}%`, transform: `scale(${settle})` }} />
      </AbsoluteFill>
    );
  }
  const s = settle * (1 + 0.08 * (frame / n));
  return (
    <AbsoluteFill style={style}>
      {b.photo ? (
        <Img src={staticFile(b.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})` }} />
      ) : (
        <OffthreadVideo src={staticFile(b.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})` }} />
      )}
    </AbsoluteFill>
  );
};

// Desenfoque + zoom de las transiciones "blur" (afecta a toda la imagen).
const blurAmount = (t: number) => {
  let b = 0;
  for (const f of FX) {
    if (f.type !== "blur") continue;
    const d = (t - f.t) * 30;
    if (d >= -4 && d <= 5) b = Math.max(b, [0.15, 0.4, 0.75, 1, 1, 0.8, 0.5, 0.25, 0.1, 0.03][Math.round(d) + 4] ?? 0);
  }
  return b;
};

const LightLeak: React.FC<{ strong?: boolean }> = ({ strong }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 5, 9, 20], [0, strong ? 0.95 : 0.85, strong ? 0.9 : 0.7, 0], clamp);
  const x = interpolate(frame, [0, 20], [-30, 70], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        mixBlendMode: "screen",
        background: strong
          ? `radial-gradient(ellipse 90% 70% at ${x}% 45%, rgba(255,255,255,1) 0%, rgba(255,214,222,0.95) 35%, rgba(255,150,170,0.6) 70%, rgba(255,120,90,0.35) 100%)`
          : `radial-gradient(ellipse 70% 90% at ${x}% 40%, rgba(255,240,220,0.95) 0%, rgba(255,170,90,0.8) 30%, rgba(255,90,110,0.5) 60%, rgba(120,40,20,0) 100%)`,
      }}
    />
  );
};

const WhiteFlash: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: "white", opacity: interpolate(frame, [0, 2, 4, 10], [0, 1, 1, 0], clamp) }} />;
};

// Una palabra: aparece abajo como fantasma translúcido y sube a su sitio en 2-3 fotogramas.
const CapWord: React.FC<{ text: string; start: number; t: number }> = ({ text, start, t }) => {
  const d = t - start;
  if (d < -0.2) return <span style={{ opacity: 0 }}>{text}</span>;
  const ghost = d < -0.07;
  const p = ghost ? 0 : interpolate(d, [-0.07, 0.0], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const y = ghost ? interpolate(d, [-0.2, -0.07], [175, 150], clamp) : 150 * (1 - p);
  const o = ghost ? interpolate(d, [-0.2, -0.12], [0, 0.55], clamp) : 0.55 + 0.45 * p;
  const sc = ghost ? 0.9 : 0.9 + 0.1 * p;
  return (
    <span style={{ display: "inline-block", opacity: o, transform: `translateY(${y}px) scale(${sc})`, transformOrigin: "left bottom", filter: ghost ? "blur(0.6px)" : undefined }}>
      {text}
    </span>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const g = GROUPS.find((x) => t >= x.from && t < x.to);
  if (!g) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 118,
        top: 1290,
        width: 830,
        display: "flex",
        gap: "0 20px",
        fontFamily: "Inter Tight",
        fontWeight: 600,
        fontSize: 78,
        lineHeight: 1.05,
        letterSpacing: -1.5,
        color: "white",
        whiteSpace: "nowrap",
        textShadow: "0 2px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      {g.words.map((w, k) => (
        <CapWord key={k} text={w.text} start={w.start} t={t} />
      ))}
    </div>
  );
};

export const CortoH: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const endAt = D.endVideo ? Math.round(D.endVideo.from * fps) : durationInFrames;
  const bl = blurAmount(t);
  const fr = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill
        style={{
          filter: `saturate(1.08) contrast(1.05) brightness(1.02)${bl > 0.02 ? ` blur(${bl * 16}px)` : ""}`,
          transform: bl > 0.02 ? `scale(${1 + 0.1 * bl})` : undefined,
        }}
      >
        <Sequence durationInFrames={D.arollFrames}>
          <ARoll />
        </Sequence>
        {BROLL.map((b, i) => (
          <Sequence key={i} from={fr(b.from)} durationInFrames={Math.max(1, fr(b.to) - fr(b.from))}>
            <BrollClip b={b} />
          </Sequence>
        ))}
        {/* tono cálido suave como la referencia */}
        <AbsoluteFill style={{ background: "rgba(255,160,80,0.07)", mixBlendMode: "soft-light" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)" }} />
      <Sequence durationInFrames={D.arollFrames}>
        <Captions />
      </Sequence>
      {FX.map((f, i) =>
        f.type === "leak" || f.type === "pink" ? (
          <Sequence key={`fx${i}`} from={fr(f.t) - 6} durationInFrames={22}>
            <LightLeak strong={f.type === "pink"} />
          </Sequence>
        ) : f.type === "white" ? (
          <Sequence key={`fx${i}`} from={fr(f.t) - 2} durationInFrames={12}>
            <WhiteFlash />
          </Sequence>
        ) : null,
      )}
      {D.endVideo && (
        <Sequence from={endAt}>
          <EndBrand />
        </Sequence>
      )}
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(f, [0, 2, D.arollFrames - 6, D.arollFrames + 6, durationInFrames - 30, durationInFrames], [0, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume, 0], clamp)
        }
      />
      {/* sonido de la referencia (extraído de su vídeo): golpe suave al entrar y salir de cada tanda y en cada plano dentro de ella */}
      {SHUTTERS.map((h, i) => (
        <Sequence key={`sh${i}`} from={Math.max(0, fr(h.t) - 1)} durationInFrames={16}>
          <Audio src={staticFile("sfx/golpe_carol.wav")} volume={h.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Cierre: la animación 10K Month entra desde el desenfoque.
const EndBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const b = interpolate(frame, [0, 8], [18, 0], clamp);
  const s = interpolate(frame, [0, 8], [1.12, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ filter: b > 0.3 ? `blur(${b}px)` : undefined, transform: `scale(${s})` }}>
      <OffthreadVideo src={staticFile(D.endVideo!.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};
