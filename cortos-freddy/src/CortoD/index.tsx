import { loadFont } from "@remotion/fonts";
import { Clock, User } from "lucide-react";
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

// Diseño D (David, "El techo del empleo"): marco de foto instantánea sobre papel; el vídeo va arriba y los
// subtítulos se escriben a máquina en la franja de papel de abajo (Space Mono, palabra clave en rojo subrayada).
// Encima del vídeo aparecen notas de papel con gráficos que explican lo que dice: la gráfica que choca con el techo,
// el reloj de horas extra, el cheque que casi no sube, la fila de gente y los sellos ESFUERZO / LUGAR.
// Transición de obturador de cámara en los cortes. Sin logo final.

loadFont({ family: "Space Mono", url: staticFile("fonts/space-mono-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Anton", url: staticFile("fonts/anton-latin-400-normal.woff2"), weight: "400" });

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

const PAPER = "#F4EFE6";
const INK = "#1B1B1B";
const RED = "#E63A2E";
const M = D.marks;
const FRAME = { x: 30, y: 30, w: 1020, h: 1480 }; // ventana del vídeo dentro del papel
const sec = (a: number, b: number, fps: number) => ({ from: Math.round(a * fps), durationInFrames: Math.max(1, Math.round((b - a) * fps)) });

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, D.segments.findIndex((s) => t >= s.from && t < s.from + s.dur));
  const seg = D.segments[idx];
  const k = (t - seg.from) / Math.max(0.1, seg.dur);
  const scale = (idx % 2 ? 1.16 : 1.0) * (1 + 0.035 * k);
  const i = Math.min(frame, face.x.length - 1);
  return (
    <OffthreadVideo
      src={staticFile(D.aroll)}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: `50% ${(face.y[i] ?? 0.3) * 100}%`,
        transform: `scale(${scale})`,
        transformOrigin: `${(face.x[i] ?? 0.5) * 100}% ${(face.y[i] ?? 0.3) * 100}%`,
      }}
    />
  );
};

const BrollIn: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.1 + 0.06 * (frame / (b.dur * fps))})` }}
      />
    </AbsoluteFill>
  );
};

// Obturador: dos cortinillas negras que se cierran y se abren en 4 fotogramas.
const shutter = (frame: number) => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= -2 && d <= 2) return [0.35, 0.5, 0.5, 0.3, 0.1][d + 2];
  }
  return 0;
};

// Nota de papel con sombra, ligeramente girada, que entra con rebote.
const Note: React.FC<{ x: number; y: number; w: number; rot: number; children: React.ReactNode }> = ({ x, y, w, rot, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: 28,
        background: PAPER,
        borderRadius: 6,
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        transform: `rotate(${rot}deg) scale(${(0.6 + 0.4 * s) * (0.9 + 0.1 * out)})`,
        opacity: Math.min(1, s * 2) * out,
        fontFamily: "Space Mono",
        fontWeight: 700,
        color: INK,
      }}
    >
      {/* cinta adhesiva */}
      <div style={{ position: "absolute", top: -16, left: "50%", width: 120, height: 34, marginLeft: -60, background: "rgba(255,255,255,0.55)", transform: "rotate(-3deg)" }} />
      {children}
    </div>
  );
};

const Stamp: React.FC<{ text: string; color: string; rot: number; delay?: number; size?: number }> = ({ text, color, rot, delay = 0, size = 88 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 260 } });
  if (frame < delay) return null;
  return (
    <div
      style={{
        display: "inline-block",
        padding: "8px 24px",
        border: `8px solid ${color}`,
        borderRadius: 14,
        color,
        fontFamily: "Anton",
        fontSize: size,
        letterSpacing: 4,
        whiteSpace: "nowrap",
        lineHeight: 1.05,
        transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * s})`,
        opacity: Math.min(1, s * 1.5) * 0.92,
        mixBlendMode: "multiply",
        background: "rgba(244,239,230,0.85)",
      }}
    >
      {text}
    </div>
  );
};

// 1. "En un empleo el techo llega rápido": la línea de ingresos sube y se aplasta contra el techo rojo.
const CeilingChart: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [6, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const W = 560, H = 300, ceil = 70;
  const pts: string[] = [];
  for (let k = 0; k <= 40 * p; k++) {
    const x = (k / 40) * W;
    const y = Math.max(ceil + 4, H - 20 - (k / 40) * 520 + Math.sin(k * 1.3) * 6);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <Note x={190} y={900} w={640} rot={-2}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>TUS INGRESOS EN UN EMPLEO</div>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <line x1={0} y1={ceil} x2={W} y2={ceil} stroke={RED} strokeWidth={6} strokeDasharray="18 12" />
        <text x={W} y={ceil - 14} textAnchor="end" fill={RED} fontFamily="Anton" fontSize={48}>TECHO</text>
        <line x1={0} y1={H} x2={W} y2={H} stroke={INK} strokeWidth={4} />
        <polyline points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </Note>
  );
};

// 2. Horas extra que suben.
const OvertimeClock: React.FC = () => {
  const frame = useCurrentFrame();
  const h = Math.round(interpolate(frame, [4, 40], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Note x={560} y={980} w={420} rot={3}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Clock size={90} strokeWidth={2.6} color={INK} style={{ transform: `rotate(${frame * 12}deg)` }} />
        <div>
          <div style={{ fontSize: 28 }}>HORAS EXTRA</div>
          <div style={{ fontFamily: "Anton", fontSize: 96, lineHeight: 1, color: RED }}>+{h}h</div>
        </div>
      </div>
    </Note>
  );
};

// 3. El cheque que casi no cambia.
const Cheque: React.FC = () => {
  const frame = useCurrentFrame();
  const amount = Math.round(interpolate(frame, [4, 36], [2480, 2510], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <Note x={100} y={1000} w={820} rot={-3}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <span>CHEQUE DE PAGO</span>
        <span>N.º 0427</span>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `4px solid ${INK}`, paddingBottom: 8 }}>
        <span style={{ fontSize: 28 }}>PÁGUESE A: TÚ</span>
        <span style={{ fontFamily: "Anton", fontSize: 92, lineHeight: 1 }}>${amount.toLocaleString("en-US")}</span>
      </div>
      <div style={{ position: "absolute", right: 30, bottom: -50 }}>
        <Stamp text="CASI IGUAL" color={RED} rot={-8} delay={26} />
      </div>
    </Note>
  );
};

// 4. Pocos puestos arriba y una fila muy larga.
const Queue: React.FC = () => {
  const frame = useCurrentFrame();
  const n = 9;
  return (
    <Note x={60} y={1050} w={900} rot={1.5}>
      <div style={{ fontSize: 28, display: "flex", justifyContent: "space-between" }}>
        <span>PUESTOS ARRIBA: 1</span>
        <span style={{ color: RED }}>EN FILA: 300+</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", marginTop: 18, gap: 6 }}>
        <div style={{ padding: "6px 10px", background: RED, borderRadius: 10, marginRight: 14 }}>
          <User size={70} color="white" strokeWidth={2.6} />
        </div>
        {Array.from({ length: n }, (_, k) => {
          const a = interpolate(frame, [4 + k * 2.5, 10 + k * 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <User key={k} size={64} color={INK} strokeWidth={2.4} style={{ opacity: a, transform: `translateY(${(1 - a) * 20}px)` }} />;
        })}
        <span style={{ fontFamily: "Anton", fontSize: 54, marginLeft: 6, opacity: interpolate(frame, [30, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>…</span>
      </div>
    </Note>
  );
};

// Subtítulos a máquina en la franja de papel.
const Typewriter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const cps = 34; // letras por segundo
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: FRAME.y + FRAME.h + 70, fontFamily: "Space Mono", fontWeight: 700, fontSize: 56, lineHeight: 1.3, color: INK }}>
      {g.words.map((w, i) => {
        const shown = Math.max(0, Math.floor((t - w.start) * cps));
        if (shown === 0) return null;
        const txt = w.text.slice(0, shown);
        const em = w.kind !== "n";
        const done = shown >= w.text.length;
        return (
          <span key={i} style={{ position: "relative", color: em ? RED : INK, marginRight: 18, display: "inline-block" }}>
            {txt}
            {em && done && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 2,
                  height: 8,
                  width: `${interpolate(t - w.start - w.text.length / cps, [0, 0.15], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                  background: RED,
                }}
              />
            )}
          </span>
        );
      })}
      <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: RED }}>▍</span>
    </div>
  );
};

const RecLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = Math.floor(frame / fps);
  return (
    <div style={{ position: "absolute", left: 70, top: FRAME.y + FRAME.h + 18, fontFamily: "Space Mono", fontWeight: 700, fontSize: 26, color: "#8A8378", letterSpacing: 2 }}>
      <span style={{ color: RED, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.3 }}>●</span> NOTA DE DAVID · 00:{String(s).padStart(2, "0")}
    </div>
  );
};

export const CortoD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sh = shutter(frame);
  const outro = D.lastWordEnd + 0.1;
  const fade = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: FRAME.w, height: FRAME.h, overflow: "hidden", borderRadius: 18, background: "black" }}>
        <ARoll />
        {D.brolls.map((b, i) => (
          <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
            <BrollIn b={b} />
          </Sequence>
        ))}
        {/* obturador */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${sh * 100}%`, background: "black" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${sh * 100}%`, background: "black" }} />
        {/* gráficos sobre el vídeo */}
        <Sequence {...sec(M.techo, M.extras, fps)}>
          <CeilingChart />
        </Sequence>
        <Sequence {...sec(M.extras, M.cheque, fps)}>
          <OvertimeClock />
        </Sequence>
        <Sequence {...sec(M.cheque, M.fila, fps)}>
          <Cheque />
        </Sequence>
        <Sequence {...sec(M.fila + 0.3, M.esfuerzo, fps)}>
          <Queue />
        </Sequence>
        <Sequence {...sec(M.esfuerzo, M.lugar + 2.6, fps)}>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 900, gap: 40, display: "flex", flexDirection: "column" }}>
            <Stamp text="ESFUERZO ✓" color={INK} rot={-6} />
            <Stamp text="LUGAR ✗" color={RED} rot={5} delay={Math.round((M.lugar - M.esfuerzo) * fps)} />
          </AbsoluteFill>
        </Sequence>
        <Sequence {...sec(M.final, outro, fps)}>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 1000 }}>
            <Stamp text="UN EMPLEO TE RETRASA" color={RED} rot={-4} size={66} delay={Math.round(2.4 * fps)} />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={Math.round(outro * fps)}>
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
            <Note x={110} y={820} w={800} rot={-2}>
              <div style={{ fontSize: 34 }}>APUNTA ESTO:</div>
              <div style={{ fontFamily: "Anton", fontSize: 100, lineHeight: 1.05, marginTop: 10 }}>
                CAMBIA EL <span style={{ color: RED }}>LUGAR</span>,<br />NO EL ESFUERZO.
              </div>
            </Note>
          </AbsoluteFill>
        </Sequence>
      </div>
      <RecLabel />
      <Sequence durationInFrames={Math.round(outro * fps)}>
        <Typewriter />
      </Sequence>
      <AbsoluteFill style={{ background: "black", opacity: fade }} />
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(f, [0, 6, Math.round(outro * fps), Math.round(outro * fps) + 10, durationInFrames - 12, durationInFrames], [0, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {D.sfx
        .filter((s) => !s.src.includes("whoosh"))
        .map((s, i) => (
          <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={60}>
            <Audio src={staticFile(s.src.replace("sfx/glitch.wav", "sfx/camara.wav"))} volume={s.volume * 0.8} />
          </Sequence>
        ))}
      {[M.techo, M.extras, M.cheque, M.fila + 0.3].map((t, i) => (
        <Sequence key={`p${i}`} from={Math.round(t * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
        </Sequence>
      ))}
      {[M.esfuerzo, M.lugar, M.final + 2.4].map((t, i) => (
        <Sequence key={`s${i}`} from={Math.round(t * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/impacto.wav")} volume={0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
