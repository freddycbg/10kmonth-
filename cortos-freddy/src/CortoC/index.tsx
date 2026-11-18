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

// Diseño C (agentes, vídeo de mentalidad de Jorge Moreno): pantalla completa y muy dinámico.
// - La parte de las "semanas malas" va desaturada y fría con viñeta; en "Pero hay otras semanas" vuelve el color con
//   un destello y un golpe de zoom (coincide con el drop de la música).
// - Subtítulos en Poppins: la palabra clave va dentro de una caja azul eléctrico que entra deslizándose.
// - Palabra gigante en bloque 3D (sombra azul escalonada) con sacudida.
// - Rótulo de sección arriba (semana débil / semana fuerte) con icono, y golpe de zoom en cada corte.
// - Sin cierre de 10K: termina con él saliendo de la oficina y "CUIDA TU MENTE".

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });

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

const BLUE = "#2F7BFF";
const DEEP = "#0A2A6B";
const M = D.marks;

const bwAmount = (t: number) => {
  if (t < M.mala) return 0;
  const on = interpolate(t, [M.mala, M.mala + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const off = interpolate(t, [M.buena - 0.05, M.buena + 0.15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(on, off);
};

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = D.segments.findIndex((s) => t >= s.from && t < s.from + s.dur);
  const seg = D.segments[Math.max(0, idx)];
  const local = t - seg.from;
  // golpe de zoom al empezar cada tramo, luego empuje lento; tramos alternos más cerrados
  const punch = interpolate(local, [0, 0.18], [1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const base = idx % 2 === 1 ? 1.18 : 1.04;
  const scale = base * punch * (1 + 0.03 * (local / Math.max(0.1, seg.dur)));
  const i = Math.min(frame, face.x.length - 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(D.aroll)}
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: `${(face.x[i] ?? 0.5) * 100}% ${(face.y[i] ?? 0.35) * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
};

// B-roll que entra subiendo desde abajo con un poco de giro y sale con un corte seco.
const BrollPop: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ overflow: "hidden", transform: `translateY(${(1 - s) * 260}px) rotate(${(1 - s) * 4}deg)` }}>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.12 + 0.05 * (frame / (b.dur * fps))})` }}
      />
    </AbsoluteFill>
  );
};

const SectionTag: React.FC<{ good: boolean }> = ({ good }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const Icon = good ? TrendingUp : TrendingDown;
  return (
    <div
      style={{
        position: "absolute",
        top: 170,
        left: "50%",
        transform: `translateX(-50%) scale(${0.6 + 0.4 * s})`,
        opacity: Math.min(1, s * 2),
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 30px",
        borderRadius: 999,
        background: good ? BLUE : "rgba(20,20,20,0.75)",
        border: good ? "none" : "3px solid rgba(255,255,255,0.35)",
        color: "white",
        fontFamily: "Montserrat",
        fontWeight: 800,
        fontSize: 38,
        letterSpacing: 2,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={46} strokeWidth={3} />
      {good ? "SEMANA FUERTE" : "SEMANA DÉBIL"}
    </div>
  );
};

const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 13, stiffness: 180 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center", opacity: out }}>
      <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 40, letterSpacing: 6, color: "white", opacity: a, textShadow: "0 3px 12px rgba(0,0,0,0.5)" }}>
        TU MENTE
      </div>
      <div
        style={{
          display: "inline-block",
          marginTop: 10,
          padding: "6px 26px 10px",
          background: BLUE,
          borderRadius: 18,
          fontFamily: "Poppins",
          fontWeight: 800,
          fontSize: 80,
          lineHeight: 1.05,
          color: "white",
          transform: `scale(${0.4 + 0.6 * a}) rotate(${(1 - a) * -8}deg)`,
          boxShadow: `0 10px 0 ${DEEP}, 0 18px 40px rgba(0,0,0,0.4)`,
        }}
      >
        = TUS RESULTADOS
      </div>
    </div>
  );
};

const BigBlock: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(w.start * fps);
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 220 } });
  const shake = f < 9 ? Math.sin(f * 2.6) * (9 - f) * 1.8 : 0;
  const size = Math.min(160, Math.round(1250 / Math.max(5, w.text.length)));
  const layers = Array.from({ length: 10 }, (_, k) => `${k + 1}px ${k + 1}px 0 ${DEEP}`).join(", ");
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 880,
        textAlign: "center",
        fontFamily: "Poppins",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        color: "white",
        textShadow: `${layers.replace(new RegExp(DEEP, "g"), BLUE)}, 12px 18px 30px rgba(0,0,0,0.45)`,
        transform: `translateX(${shake}px) scale(${0.3 + 0.7 * s})`,
        opacity: Math.min(1, s * 2),
      }}
    >
      {w.text}
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
  return (
    <AbsoluteFill>
      {big && t >= big.start && <BigBlock w={big} />}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1270,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px 16px",
        }}
      >
        {g.words
          .filter((w) => w.kind !== "big")
          .map((w, i) => {
            const f = frame - Math.round(w.start * fps);
            if (f < 0) return null;
            const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 300 } });
            const em = w.kind === "em";
            const box = interpolate(f, [0, 5], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontFamily: "Poppins",
                  fontWeight: 800,
                  fontSize: em ? 78 : 66,
                  lineHeight: 1.15,
                  color: "white",
                  padding: em ? "0 18px 4px" : 0,
                  textShadow: em ? "none" : "0 4px 14px rgba(0,0,0,0.75), 0 2px 3px rgba(0,0,0,0.6)",
                  transform: `translateY(${(1 - s) * 26}px) scale(${0.8 + 0.2 * s})`,
                  opacity: Math.min(1, s * 1.8),
                }}
              >
                {em && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: BLUE,
                      borderRadius: 14,
                      clipPath: `inset(0 ${100 - box}% 0 0)`,
                      boxShadow: `0 6px 0 ${DEEP}`,
                      zIndex: -1,
                    }}
                  />
                )}
                <span style={{ position: "relative" }}>{w.text}</span>
              </span>
            );
          })}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const b = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 170 } });
  const fade = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,42,107,0.0) 30%, rgba(10,42,107,0.75) 100%)`, opacity: a }} />
      <div style={{ position: "absolute", bottom: 330, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Poppins",
            fontWeight: 800,
            fontSize: 130,
            lineHeight: 1,
            color: "white",
            transform: `translateY(${(1 - a) * 80}px)`,
            opacity: a,
            textShadow: `${Array.from({ length: 8 }, (_, k) => `${k + 1}px ${k + 1}px 0 ${BLUE}`).join(", ")}`,
          }}
        >
          CUIDA TU
          <br />
          MENTE
        </div>
        <div style={{ marginTop: 26, fontFamily: "Montserrat", fontWeight: 800, fontSize: 40, letterSpacing: 3, color: "white", opacity: b }}>
          CONSTRUYE LA VIDA QUE QUIERES
        </div>
      </div>
      <AbsoluteFill style={{ background: "black", opacity: fade }} />
    </AbsoluteFill>
  );
};

export const CortoC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const bw = bwAmount(t);
  const turnFlash = interpolate(t, [M.buena, M.buena + 0.05, M.buena + 0.3], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cutFlash = D.glitches.some((g) => frame - g >= 0 && frame - g < 3) ? 0.25 : 0;
  const outroFrom = Math.round((D.lastWordEnd + 0.15) * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ filter: bw > 0 ? `grayscale(${bw}) contrast(${1 + 0.15 * bw}) brightness(${1 - 0.12 * bw})` : undefined }}>
        <ARoll />
        {D.brolls.map((b, i) => (
          <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
            <BrollPop b={b} />
          </Sequence>
        ))}
        {/* tinte frío y viñeta en las semanas malas */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,10,30,0.75) 100%)", opacity: bw }} />
        <AbsoluteFill style={{ background: "rgba(40,80,160,0.18)", mixBlendMode: "multiply", opacity: bw }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "white", opacity: Math.max(turnFlash, cutFlash) }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)" }} />
      <Sequence durationInFrames={Math.round(M.mala * fps)}>
        <HookTitle />
      </Sequence>
      <Sequence from={Math.round(M.mala * fps)} durationInFrames={Math.round((M.buena - M.mala) * fps)}>
        <SectionTag good={false} />
      </Sequence>
      <Sequence from={Math.round(M.buena * fps)} durationInFrames={Math.round((M.leccion - M.buena) * fps)}>
        <SectionTag good />
      </Sequence>
      <Sequence durationInFrames={outroFrom}>
        <Captions />
      </Sequence>
      <Sequence from={outroFrom}>
        <Outro />
      </Sequence>
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(
            f,
            [0, 6, Math.round(M.buena * fps) - 4, Math.round(M.buena * fps) + 2, outroFrom, outroFrom + 10, durationInFrames - 12, durationInFrames],
            [0, D.music.volume * 0.8, D.music.volume * 0.8, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {D.sfx
        .filter((s) => !s.src.includes("whoosh_largo"))
        .map((s, i) => (
          <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={90}>
            <Audio src={staticFile(s.src.replace("sfx/glitch.wav", "sfx/whoosh_corto.wav"))} volume={s.volume} />
          </Sequence>
        ))}
      <Sequence from={Math.round(M.buena * fps) - 3} durationInFrames={60}>
        <Audio src={staticFile("sfx/impacto.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
