import { loadFont } from "@remotion/fonts";
import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import face from "../Edit/face.json";
import data from "../Corto/corto.json";

// Diseño G v2 (entrenamientos de Freddy, "El síndrome de Duolingo"): sobrio y profesional, muy dinámico.
// - Cámara: A-roll a la resolución del original (1440x2560) con plano medio y primer plano alternos centrados en la
//   cara, empuje lento, golpe de zoom en cada palabra clave (más fuerte y con sacudida en la palabra gigante) y
//   transición de zoom rápido con desenfoque de movimiento en los cortes. Ajuste de color y viñeta.
// - Subtítulos: Inter Black en mayúsculas, 2-4 palabras; la palabra que suena va dentro de una caja naranja.
// - Datos minimalistas sobre placa oscura con borde naranja: caída de citas/ventas/ALP, racha de ventas que sube y
//   se rompe, 3.650 días de racha con 0 % de idioma, progreso del curso al 30 %. Cierre 10K Month.

loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-500-normal.woff2"), weight: "500" });

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; words: Word[] };
type Seg = { from: number; dur: number };
type Broll = { src: string; from: number; dur: number; trim: number };
type Sfx = { src: string; at: number; volume: number };

const D = data as unknown as {
  durationInFrames: number;
  aroll: string;
  arollFrames: number;
  segments: Seg[];
  groups: Group[];
  brolls: Broll[];
  glitches: number[];
  sfx: Sfx[];
  music: { src: string; volume: number; endVolume: number; trim: number };
  marks: Record<string, number>;
  lastWordEnd: number;
  endCard: { from: number; dur: number };
  endVideo: { src: string; from: number; dur: number } | null;
};

const ORANGE = "#FF7A1A";
const RED = "#FF3B3B";
const M = D.marks;
const W = 1080;
const H = 1920;
const FACE_TARGET = { x: 540, y: 640 };
const sec = (a: number, b: number, fps: number) => ({ from: Math.round(a * fps), durationInFrames: Math.max(1, Math.round((b - a) * fps)) });
const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const EMPH = D.groups.flatMap((g) => g.words.filter((w) => w.kind !== "n"));

// Golpe de zoom en las palabras clave: sube rápido y vuelve en ~0.4 s.
const emphasisBoost = (t: number) => {
  let b = 0;
  for (const w of EMPH) {
    const d = t - w.start;
    if (d < 0 || d > 0.5) continue;
    const amp = w.kind === "big" ? 0.16 : 0.07;
    b = Math.max(b, amp * (d < 0.06 ? d / 0.06 : Math.exp(-(d - 0.06) * 7)));
  }
  return b;
};

// Transición de los cortes marcados: zoom rápido con desenfoque de movimiento.
const whip = (frame: number) => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= -2 && d <= 3) return [0.4, 1, 0.8, 0.45, 0.2, 0.05][d + 2];
  }
  return 0;
};

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, D.segments.findIndex((s) => t >= s.from && t < s.from + s.dur));
  const seg = D.segments[idx];
  const k = (t - seg.from) / Math.max(0.1, seg.dur);
  // plano medio y primer plano alternos; el gancho entra con un empuje desde un plano algo más abierto
  const base = idx === 0 ? interpolate(t, [0, seg.dur], [1.45, 1.8], clamp01) : idx % 2 ? 2.05 : 1.72;
  const big = EMPH.find((w) => w.kind === "big" && t - w.start >= 0 && t - w.start < 0.35);
  const shake = big ? Math.sin(frame * 2.7) * 9 * (1 - (t - big.start) / 0.35) : 0;
  const scale = (base * (1 + 0.035 * k) + emphasisBoost(t)) * (1 + 0.1 * whip(frame));
  const i = Math.min(frame, face.x.length - 1);
  const fx = face.x[i] ?? 0.5;
  const fy = face.y[i] ?? 0.41;
  const vw = W * scale;
  const vh = H * scale;
  const left = Math.min(0, Math.max(W - vw, FACE_TARGET.x - fx * vw)) + shake;
  const top = Math.min(0, Math.max(H - vh, FACE_TARGET.y - fy * vh));
  return <OffthreadVideo src={staticFile(D.aroll)} style={{ position: "absolute", left, top, width: vw, height: vh }} />;
};

const BrollClip: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = b.dur * fps;
  const s = interpolate(frame, [0, 6], [1.25, 1.1], clamp01) + 0.06 * (frame / n);
  const blur = interpolate(frame, [0, 4], [14, 0], clamp01);
  return (
    <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      <OffthreadVideo src={staticFile(b.src)} muted startFrom={Math.round(b.trim * fps)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})` }} />
    </AbsoluteFill>
  );
};

// Placa de datos sobria: fondo oscuro translúcido, borde izquierdo naranja, entra deslizándose.
const Plate: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 980 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 220 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp01);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top,
        minWidth: 520,
        padding: "22px 34px 24px 30px",
        background: "rgba(10,10,12,0.62)",
        backdropFilter: "blur(14px)",
        borderLeft: `8px solid ${ORANGE}`,
        borderRadius: 6,
        color: "white",
        fontFamily: "Inter",
        transform: `translateX(${(1 - s) * -140}px)`,
        opacity: Math.min(1, s * 1.6) * out,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "rgba(255,255,255,0.72)" }) => (
  <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 6, color, textTransform: "uppercase" }}>{children}</div>
);

// 1. Caída de citas, ventas y ALP a medida que lo dice.
const DropChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items = [
    { k: "CITAS", at: 0.84 },
    { k: "VENTAS", at: 1.94 },
    { k: "ALP", at: 2.88 },
  ];
  const p = interpolate(t, [0.2, 3.2], [0, 1], clamp01);
  const Wc = 520, Hc = 150;
  const pts = Array.from({ length: 31 }, (_, j) => {
    const x = (j / 30) * Wc;
    const y = 20 + (j / 30) ** 1.6 * (Hc - 30) + Math.sin(j * 1.7) * 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).slice(0, Math.max(2, Math.round(31 * p)));
  return (
    <Plate>
      <Label>Cuando pierdes el ritmo</Label>
      <svg width={Wc} height={Hc} style={{ marginTop: 10, overflow: "visible" }}>
        <polyline points={pts.join(" ")} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", gap: 26, marginTop: 8 }}>
        {items.map((it) => {
          const a = interpolate(t, [it.at, it.at + 0.15], [0, 1], clamp01);
          return (
            <div key={it.k} style={{ display: "flex", alignItems: "center", gap: 8, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
              <TrendingDown size={34} color={RED} strokeWidth={2.6} />
              <span style={{ fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>{it.k}</span>
            </div>
          );
        })}
      </div>
    </Plate>
  );
};

// 2. Racha de ventas: sube 1→4 y luego se rompe.
const streakAt = (t: number) => {
  if (t < M.contrario) return { n: Math.min(4, 1 + Math.floor(((t - M.vendiendo) / (M.contrario - M.vendiendo)) * 4)), broken: false };
  return { n: Math.max(0, 4 - Math.floor(((t - M.contrario) / 2.4) * 5)), broken: true };
};
const Streak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + M.vendiendo;
  const st = streakAt(t);
  let since = 99;
  for (let k = 0; k < 12; k++) {
    if (streakAt(t - (k + 1) / fps).n !== st.n) {
      since = k;
      break;
    }
  }
  const bump = interpolate(since, [0, 3, 9], [1.25, 1.06, 1], clamp01);
  const color = st.broken ? RED : ORANGE;
  const Icon = st.broken ? TrendingDown : TrendingUp;
  return (
    <Plate>
      <Label color={color}>{st.broken ? "Racha rota" : "Racha de ventas"}</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 6 }}>
        <span style={{ fontWeight: 900, fontSize: 150, lineHeight: 1, letterSpacing: -6, transform: `scale(${bump})`, transformOrigin: "left center", color: st.broken ? "rgba(255,255,255,0.55)" : "white" }}>
          {st.n}
        </span>
        <Icon size={84} color={color} strokeWidth={2.4} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {[0, 1, 2, 3].map((j) => (
          <div key={j} style={{ width: 90, height: 10, borderRadius: 5, background: j < st.n ? color : "rgba(255,255,255,0.18)" }} />
        ))}
      </div>
    </Plate>
  );
};

// 3. 3.650 días de racha… y 0 % del idioma.
const AppStat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + (M.anos - 0.4);
  const days = Math.round(interpolate(t, [M.anos - 0.5, M.anos + 0.9], [0, 3650], clamp01));
  const fmt = days >= 1000 ? `${Math.floor(days / 1000)}.${String(days % 1000).padStart(3, "0")}` : String(days);
  const lang = interpolate(t, [M.idioma, M.idioma + 0.2], [0, 1], clamp01);
  return (
    <Plate>
      <Label>Racha en la app</Label>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontWeight: 900, fontSize: 140, lineHeight: 1.05, letterSpacing: -5 }}>{fmt}</span>
        <span style={{ fontWeight: 700, fontSize: 36, color: "rgba(255,255,255,0.8)" }}>días</span>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.2)", margin: "12px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: lang, transform: `translateY(${(1 - lang) * 10}px)` }}>
        <Label>Idioma aprendido</Label>
        <span style={{ fontWeight: 900, fontSize: 64, color: RED, marginLeft: 30 }}>0%</span>
      </div>
    </Plate>
  );
};

// 4. Progreso del curso al 30 %.
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [6, 26], [0, 30], clamp01);
  return (
    <Plate>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: 560 }}>
        <Label>Progreso del curso</Label>
        <span style={{ fontWeight: 900, fontSize: 72, color: ORANGE }}>{Math.round(p)}%</span>
      </div>
      <div style={{ marginTop: 12, width: 560, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.18)" }}>
        <div style={{ width: `${(p / 100) * 100}%`, height: "100%", borderRadius: 6, background: ORANGE }} />
      </div>
    </Plate>
  );
};

// Título: "EL SÍNDROME DE" fino y espaciado + "DUOLINGO" en negra; una línea naranja barre por debajo.
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const line = interpolate(frame, [4, 16], [0, 1], clamp01);
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp01);
  return (
    <div style={{ position: "absolute", left: 70, top: 960, opacity: out, color: "white", fontFamily: "Inter" }}>
      <div style={{ fontWeight: 500, fontSize: 40, letterSpacing: 14, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>EL SÍNDROME DE</div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontWeight: 900, fontSize: 150, lineHeight: 1, letterSpacing: -5, transform: `translateY(${(1 - s) * 100}%)`, textShadow: "0 10px 40px rgba(0,0,0,0.45)" }}>DUOLINGO</div>
      </div>
      <div style={{ height: 10, width: `${line * 100}%`, background: ORANGE, marginTop: 10 }} />
    </div>
  );
};

const BigWord: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(w.start * fps);
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 240 } });
  const track = interpolate(f, [0, 12], [60, -4], clamp01);
  return (
    <div style={{ position: "absolute", top: 960, left: 0, right: 0, textAlign: "center", opacity: Math.min(1, s * 2) }}>
      <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 220, lineHeight: 1, letterSpacing: track, color: "white", textShadow: "0 12px 50px rgba(0,0,0,0.5)", transform: `scale(${1.3 - 0.3 * s})` }}>{w.text}</div>
      <div style={{ height: 12, width: `${s * 58}%`, background: ORANGE, margin: "8px auto 0" }} />
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const big = g.words.find((w) => w.kind === "big");
  const words = g.words.filter((w) => w.kind !== "big");
  const enter = spring({ frame: frame - Math.round(g.start * fps), fps, config: { damping: 20, stiffness: 300 } });
  return (
    <AbsoluteFill>
      {big && t >= big.start && <BigWord w={big} />}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1320,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 14px",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 18}px)`,
        }}
      >
        {words.map((w, i) => {
          const next = words[i + 1];
          const active = t >= w.start && (!next || t < next.start);
          const said = t >= w.start;
          return (
            <span
              key={i}
              style={{
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: 66,
                lineHeight: 1.1,
                letterSpacing: -1,
                textTransform: "uppercase",
                color: "white",
                padding: "2px 14px 6px",
                borderRadius: 10,
                background: active ? ORANGE : "transparent",
                opacity: said ? 1 : 0.5,
                textShadow: active ? "none" : "0 4px 18px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.6)",
                transform: `scale(${active ? 1.04 : 1})`,
              }}
            >
              {w.text.replace(/[¿?¡!.,]/g, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const CortoG: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const endAt = D.endVideo ? Math.round(D.endVideo.from * fps) : durationInFrames;
  const w = whip(frame);
  const fadeOut = interpolate(frame, [D.arollFrames - 4, D.arollFrames + 10], [0, 1], clamp01);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ filter: `contrast(1.08) saturate(1.08) brightness(1.02)${w > 0 ? ` blur(${w * 9}px)` : ""}` }}>
        <Sequence durationInFrames={D.arollFrames}>
          <ARoll />
        </Sequence>
        {D.brolls.map((b, i) => (
          <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
            <BrollClip b={b} />
          </Sequence>
        ))}
      </AbsoluteFill>
      {/* viñeta y degradado inferior para que se lean los textos */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)" }} />
      <Sequence {...sec(M.citas, M.sindrome, fps)}>
        <DropChart />
      </Sequence>
      <Sequence {...sec(M.sindrome, M.racha, fps)}>
        <Title />
      </Sequence>
      <Sequence {...sec(M.vendiendo, M.miedo, fps)}>
        <Streak />
      </Sequence>
      <Sequence {...sec(M.anos - 0.4, M.broma + 0.3, fps)}>
        <AppStat />
      </Sequence>
      <Sequence {...sec(M.pct, M.japones, fps)}>
        <Progress />
      </Sequence>
      <Sequence durationInFrames={D.arollFrames}>
        <Captions />
      </Sequence>
      <Sequence from={D.arollFrames - 4} durationInFrames={endAt - D.arollFrames + 4}>
        <AbsoluteFill style={{ background: "black", opacity: fadeOut }} />
      </Sequence>
      {D.endVideo && (
        <Sequence from={endAt}>
          <OffthreadVideo src={staticFile(D.endVideo.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      )}
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(f, [0, 8, D.arollFrames - 6, D.arollFrames + 6, endAt + 90, endAt + 120], [0, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume * 0.6, 0], clamp01)
        }
      />
      {/* diseño de sonido: whoosh en las transiciones y en cada placa, golpe en la palabra gigante */}
      {D.glitches.map((g, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, g - 3)} durationInFrames={30}>
          <Audio src={staticFile("sfx/whoosh_corto.wav")} volume={0.22} />
        </Sequence>
      ))}
      {[M.citas, M.sindrome, M.vendiendo, M.app, M.pct].map((t, i) => (
        <Sequence key={`s${i}`} from={Math.round(t * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/swoosh.wav")} volume={0.3} />
        </Sequence>
      ))}
      {EMPH.filter((x) => x.kind === "big").map((x, i) => (
        <Sequence key={`b${i}`} from={Math.round(x.start * fps)} durationInFrames={40}>
          <Audio src={staticFile("sfx/impacto.wav")} volume={0.45} />
        </Sequence>
      ))}
      {D.brolls.map((b, i) => (
        <Sequence key={`r${i}`} from={Math.max(0, Math.round((b.from - 0.1) * fps))} durationInFrames={30}>
          <Audio src={staticFile("sfx/whoosh_corto.wav")} volume={0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
