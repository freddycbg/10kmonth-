import { loadFont } from "@remotion/fonts";
import { Clock, Search, User } from "lucide-react";
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

// Diseño E (David v2, "El techo del empleo"): vídeo a pantalla completa, sin franjas.
// - Arranque con la toma tal cual se grabó: David busca en la carpeta y abre la gaveta ("buscando dinero…" con lupa),
//   y desde la gaveta sale la toma de su cara diciendo el gancho.
// - Subtítulos en una cápsula de vidrio oscuro (Inter); cada palabra entra desenfocada y se enfoca; palabras clave en
//   Unbounded turquesa.
// - Gráficos en tarjetas de vidrio translúcido (gráfica con techo, reloj, cheque, fila) y etiquetas de color.
// - Transición de desenfoque con zoom en los cortes. Sin logo final.

loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Unbounded", url: staticFile("fonts/unbounded-latin-800-normal.woff2"), weight: "800" });

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; words: Word[] };
type Seg = { from: number; dur: number; scale: number };
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
};

const TEAL = "#1EE3CF";
const CORAL = "#FF5A5F";
const GLASS = "rgba(12, 16, 26, 0.55)";
const M = D.marks;
const sec = (a: number, b: number, fps: number) => ({ from: Math.round(a * fps), durationInFrames: Math.max(1, Math.round((b - a) * fps)) });

// Desenfoque con zoom en los cortes marcados (4 fotogramas).
const whip = (frame: number) => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= -2 && d <= 2) return [0.5, 1, 1, 0.55, 0.2][d + 2];
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
  // el arranque (búsqueda en la carpeta) va sin punch-in, con un empuje lento
  const intro = t < M.habla - 0.6;
  const scale = intro ? 1 + 0.06 * (t / M.habla) : (idx % 2 ? 1.15 : 1.02) * (1 + 0.035 * k);
  const i = Math.min(frame, face.x.length - 1);
  return (
    <OffthreadVideo
      src={staticFile(D.aroll)}
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        transformOrigin: intro ? "50% 45%" : `${(face.x[i] ?? 0.5) * 100}% ${(face.y[i] ?? 0.3) * 100}%`,
      }}
    />
  );
};

const BrollIn: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blur = interpolate(frame, [0, 5], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 + 0.06 * (frame / (b.dur * fps))})` }}
      />
    </AbsoluteFill>
  );
};

const Glass: React.FC<{ x: number; y: number; w: number; children: React.ReactNode }> = ({ x, y, w, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 210 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: "28px 34px",
        borderRadius: 34,
        background: GLASS,
        backdropFilter: "blur(18px)",
        border: "2px solid rgba(255,255,255,0.22)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        color: "white",
        fontFamily: "Inter",
        fontWeight: 800,
        transform: `translateY(${(1 - s) * 60}px)`,
        opacity: Math.min(1, s * 1.6) * out,
        filter: `blur(${(1 - Math.min(1, s * 1.3)) * 10}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Badge: React.FC<{ text: string; color: string; delay?: number; size?: number }> = ({ text, color, delay = 0, size = 64 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 240 } });
  if (frame < delay) return null;
  return (
    <div
      style={{
        display: "inline-block",
        padding: "14px 36px",
        borderRadius: 999,
        background: color,
        color: color === TEAL ? "#04221F" : "white",
        fontFamily: "Unbounded",
        fontWeight: 800,
        fontSize: size,
        whiteSpace: "nowrap",
        transform: `scale(${0.5 + 0.5 * s})`,
        opacity: Math.min(1, s * 2),
        boxShadow: `0 0 40px ${color}88`,
      }}
    >
      {text}
    </div>
  );
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 26, letterSpacing: 4, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>{children}</div>
);

const CeilingChart: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [6, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const W = 820, H = 280, ceil = 60;
  const pts: string[] = [];
  for (let k = 0; k <= 40 * p; k++) {
    const x = (k / 40) * W;
    const y = Math.max(ceil + 6, H - 10 - (k / 40) * 520 + Math.sin(k * 1.3) * 6);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <Glass x={95} y={930} w={890}>
      <Label>TUS INGRESOS EN UN EMPLEO</Label>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <line x1={0} y1={ceil} x2={W} y2={ceil} stroke={CORAL} strokeWidth={6} strokeDasharray="18 12" />
        <text x={W} y={ceil - 16} textAnchor="end" fill={CORAL} fontFamily="Unbounded" fontWeight={800} fontSize={40}>TECHO</text>
        <polyline points={pts.join(" ")} fill="none" stroke={TEAL} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </Glass>
  );
};

const Overtime: React.FC = () => {
  const frame = useCurrentFrame();
  const h = Math.round(interpolate(frame, [4, 40], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Glass x={260} y={1000} w={560}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Clock size={110} strokeWidth={2.4} color={TEAL} style={{ transform: `rotate(${frame * 12}deg)` }} />
        <div>
          <Label>HORAS EXTRA</Label>
          <div style={{ fontFamily: "Unbounded", fontSize: 96, lineHeight: 1 }}>+{h}h</div>
        </div>
      </div>
    </Glass>
  );
};

const Cheque: React.FC = () => {
  const frame = useCurrentFrame();
  const amount = Math.round(interpolate(frame, [4, 36], [2480, 2510], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Glass x={95} y={980} w={890}>
      <Label>TU CHEQUE · MES A MES</Label>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Unbounded", fontSize: 88, lineHeight: 1, marginRight: 24 }}>${amount.toLocaleString("en-US")}</span>
        <Badge text="CASI IGUAL" color={CORAL} delay={24} size={44} />
      </div>
    </Glass>
  );
};

const Queue: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Glass x={95} y={1000} w={890}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Label>PUESTOS ARRIBA: 1</Label>
        <Label>
          <span style={{ color: CORAL }}>EN FILA: 300+</span>
        </Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: 10, background: TEAL, borderRadius: 18, marginRight: 14 }}>
          <User size={64} color="#04221F" strokeWidth={2.6} />
        </div>
        {Array.from({ length: 9 }, (_, k) => {
          const a = interpolate(frame, [4 + k * 2.5, 10 + k * 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <User key={k} size={60} color="white" strokeWidth={2.4} style={{ opacity: a * 0.85 }} />;
        })}
      </div>
    </Glass>
  );
};

// Arranque: "buscando dinero…" con una lupa que barre mientras busca en la carpeta.
const Searching: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const dots = ".".repeat(1 + (Math.floor(frame / 8) % 3));
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        left: "50%",
        transform: `translateX(-50%) scale(${0.7 + 0.3 * s})`,
        opacity: Math.min(1, s * 2) * out,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 40px",
        borderRadius: 999,
        background: GLASS,
        backdropFilter: "blur(16px)",
        border: "2px solid rgba(255,255,255,0.25)",
        color: "white",
        fontFamily: "Inter",
        fontWeight: 800,
        fontSize: 54,
        whiteSpace: "nowrap",
      }}
    >
      <Search size={60} color={TEAL} strokeWidth={3} style={{ transform: `translateX(${Math.sin(frame / 5) * 10}px) rotate(${Math.sin(frame / 7) * 12}deg)` }} />
      buscando dinero<span style={{ width: 60, display: "inline-block" }}>{dots}</span>
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const pill = spring({ frame: frame - Math.round(g.start * fps), fps, config: { damping: 18, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 940,
          padding: "18px 34px 22px",
          borderRadius: 32,
          background: GLASS,
          backdropFilter: "blur(14px)",
          border: "2px solid rgba(255,255,255,0.18)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "4px 16px",
          transform: `scale(${0.92 + 0.08 * pill})`,
          opacity: Math.min(1, pill * 2),
        }}
      >
        {g.words.map((w, i) => {
          const f = frame - Math.round(w.start * fps);
          const a = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const em = w.kind !== "n";
          return (
            <span
              key={i}
              style={{
                fontFamily: em ? "Unbounded" : "Inter",
                fontWeight: 800,
                fontSize: em ? 60 : 58,
                lineHeight: 1.2,
                color: em ? TEAL : "white",
                opacity: f < 0 ? 0.18 : 0.25 + 0.75 * a,
                filter: f < 0 ? "blur(6px)" : `blur(${(1 - a) * 8}px)`,
                textShadow: em ? `0 0 24px ${TEAL}66` : "none",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const CortoE: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const w = whip(frame);
  const outro = D.lastWordEnd + 0.1;
  const fade = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ filter: w > 0 ? `blur(${w * 14}px)` : undefined, transform: `scale(${1 + w * 0.08})` }}>
        <ARoll />
        {D.brolls.map((b, i) => (
          <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
            <BrollIn b={b} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.45) 100%)" }} />
      <Sequence durationInFrames={Math.round((M.habla - 0.85) * fps)}>
        <Searching />
      </Sequence>
      <Sequence {...sec(M.techo, M.extras, fps)}>
        <CeilingChart />
      </Sequence>
      <Sequence {...sec(M.extras, M.cheque, fps)}>
        <Overtime />
      </Sequence>
      <Sequence {...sec(M.cheque, M.fila, fps)}>
        <Cheque />
      </Sequence>
      <Sequence {...sec(M.fila + 0.3, M.esfuerzo, fps)}>
        <Queue />
      </Sequence>
      <Sequence {...sec(M.esfuerzo, M.lugar + 2.6, fps)}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 1000, gap: 30, display: "flex", flexDirection: "column" }}>
          <Badge text="ESFUERZO ✓" color={TEAL} />
          <Badge text="LUGAR ✗" color={CORAL} delay={Math.round((M.lugar - M.esfuerzo) * fps)} />
        </AbsoluteFill>
      </Sequence>
      <Sequence {...sec(M.final + 2.4, outro, fps)}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 1080 }}>
          <Badge text="UN EMPLEO TE RETRASA" color={CORAL} size={50} />
        </AbsoluteFill>
      </Sequence>
      <Sequence durationInFrames={Math.round(outro * fps)}>
        <Captions />
      </Sequence>
      <Sequence from={Math.round(outro * fps)}>
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.3)" }} />
        <Glass x={90} y={700} w={900}>
          <Label>RECUERDA</Label>
          <div style={{ fontFamily: "Unbounded", fontSize: 76, lineHeight: 1.15 }}>
            Cambia el <span style={{ color: TEAL }}>lugar</span>,<br />no el esfuerzo.
          </div>
        </Glass>
      </Sequence>
      <AbsoluteFill style={{ background: "black", opacity: fade }} />
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(
            f,
            [0, 6, Math.round(M.habla * fps) - 6, Math.round(M.habla * fps), Math.round(outro * fps), Math.round(outro * fps) + 10, durationInFrames - 12, durationInFrames],
            [0, 0.25, 0.25, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {D.sfx
        .filter((s) => !s.src.includes("whoosh_largo"))
        .map((s, i) => (
          <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={60}>
            <Audio src={staticFile(s.src.replace("sfx/glitch.wav", "sfx/whoosh_corto.wav"))} volume={s.volume * 0.8} />
          </Sequence>
        ))}
      {[M.techo, M.extras, M.cheque, M.fila + 0.3, M.esfuerzo, M.lugar].map((t, i) => (
        <Sequence key={`p${i}`} from={Math.round(t * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={Math.round((M.habla - 0.9) * fps)} durationInFrames={40}>
        <Audio src={staticFile("sfx/whoosh_largo.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
