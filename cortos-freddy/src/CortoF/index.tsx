import { loadFont } from "@remotion/fonts";
import { Clock, Factory, MapPin } from "lucide-react";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
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

// Diseño F (Andrés López, "De dónde vengo"): documental de antes y ahora.
// - El pasado (sus vídeos de la fábrica de reciclaje) con look de cámara casera antigua: tono cálido, grano, líneas,
//   viñeta y fecha "▶ PLAY JUL 2025" en letra VHS. El presente (la entrevista y la familia) con color limpio.
// - Subtítulos de cine: DM Serif Display centrada, la frase entra con un fundido hacia arriba; palabra clave en cursiva
//   melocotón.
// - Rótulos de capítulo "ANTES" / "AHORA", etiquetas de dato (EE. UU., fábrica, 12 h) y fotos de la familia como
//   polaroids que caen sobre la propia foto desenfocada.
// - Destello cálido de película en los cambios. Cierre con la frase final y su nombre. Sin logo.

loadFont({ family: "DM Serif Display", url: staticFile("fonts/dm-serif-display-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "DM Serif Display", url: staticFile("fonts/dm-serif-display-latin-400-italic.woff2"), weight: "400", style: "italic" });
loadFont({ family: "VT323", url: staticFile("fonts/vt323-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; words: Word[] };
type Seg = { from: number; dur: number; scale: number };
type Broll = { src: string; from: number; dur: number; trim: number; look: string; image: boolean };
type Sfx = { src: string; at: number; volume: number };

const D = data as unknown as {
  durationInFrames: number;
  aroll: string;
  segments: Seg[];
  groups: Group[];
  brolls: Broll[];
  glitches: number[];
  sfx: Sfx[];
  music: { src: string; volume: number; endVolume: number; trim: number };
  marks: Record<string, number>;
  lastWordEnd: number;
};

const PEACH = "#FFB38A";
const M = D.marks;
const sec = (a: number, b: number, fps: number) => ({ from: Math.round(a * fps), durationInFrames: Math.max(1, Math.round((b - a) * fps)) });

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, D.segments.findIndex((s) => t >= s.from && t < s.from + s.dur));
  const seg = D.segments[idx];
  const k = (t - seg.from) / Math.max(0.1, seg.dur);
  const scale = (idx % 2 ? 1.14 : 1.02) * (1 + 0.03 * k);
  const i = Math.min(frame, face.x.length - 1);
  return (
    <OffthreadVideo
      src={staticFile(D.aroll)}
      style={{ width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: `${(face.x[i] ?? 0.5) * 100}% ${(face.y[i] ?? 0.3) * 100}%` }}
    />
  );
};

// Grano animado y líneas de vídeo casero.
const Grain: React.FC<{ seed: number; opacity: number }> = ({ seed, opacity }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "overlay" }}>
    <svg width="100%" height="100%">
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${seed})`} />
    </svg>
  </AbsoluteFill>
);

const PastLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Grain seed={frame % 7} opacity={0.55} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 5px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(20,8,0,0.7) 100%)" }} />
      <div style={{ position: "absolute", left: 60, top: 150, fontFamily: "VT323", fontSize: 64, color: "white", textShadow: "3px 0 0 rgba(255,0,60,0.6), -3px 0 0 rgba(0,200,255,0.6)" }}>
        ▶ PLAY
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 220, fontFamily: "VT323", fontSize: 58, color: "white", textShadow: "3px 0 0 rgba(255,0,60,0.6), -3px 0 0 rgba(0,200,255,0.6)" }}>
        JUL 24 2025
      </div>
    </>
  );
};

const BrollClip: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const past = b.look === "past";
  const n = b.dur * fps;
  if (b.image) {
    // polaroid que cae sobre la misma foto desenfocada
    const s = spring({ frame, fps, config: { damping: 13, stiffness: 190 } });
    const rot = (b.src.length % 2 ? -1 : 1) * (4 - 3 * s);
    return (
      <AbsoluteFill>
        <Img src={staticFile(b.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.7)", transform: "scale(1.2)" }} />
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 90,
            top: 450,
            padding: "24px 24px 96px",
            background: "#FBF8F2",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            transform: `translateY(${(1 - s) * -500}px) rotate(${rot}deg)`,
          }}
        >
          <Img src={staticFile(b.src)} style={{ width: "100%", height: 640, objectFit: "cover" }} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ filter: past ? "sepia(0.55) saturate(0.75) contrast(1.12) brightness(0.95)" : undefined }}>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.06 + 0.05 * (frame / n)})` }}
      />
      {past && <PastLook />}
    </AbsoluteFill>
  );
};

// Destello cálido de película en los cortes marcados.
const leak = (frame: number) => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= -3 && d <= 5) return [0.25, 0.55, 0.8, 0.9, 0.7, 0.5, 0.3, 0.15, 0.05][d + 3];
  }
  return 0;
};

const Chapter: React.FC<{ label: string; title: string }> = ({ label, title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", opacity: s * out }}>
      <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 30, letterSpacing: 14, color: PEACH }}>{label}</div>
      <div style={{ width: `${s * 220}px`, height: 3, background: PEACH, margin: "16px auto" }} />
      <div style={{ fontFamily: "DM Serif Display", fontStyle: "italic", fontSize: 92, color: "white", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>{title}</div>
    </div>
  );
};

const Tag: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 1060,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 30px",
        background: "rgba(255,255,255,0.92)",
        color: "#2A1A10",
        borderRadius: 8,
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: 1,
        transform: `translateX(${(1 - s) * -400}px)`,
        opacity: out,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        borderLeft: `10px solid ${PEACH}`,
      }}
    >
      {icon}
      {text}
    </div>
  );
};

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const f = frame - Math.round(g.start * fps);
  const a = interpolate(f, [0, 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 1360,
        textAlign: "center",
        fontFamily: "DM Serif Display",
        fontSize: 78,
        lineHeight: 1.12,
        color: "white",
        textShadow: "0 4px 22px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.7)",
        opacity: a,
        transform: `translateY(${(1 - a) * 24}px)`,
        filter: `blur(${(1 - a) * 6}px)`,
      }}
    >
      {g.words.map((w, i) => (
        <span key={i} style={w.kind !== "n" ? { color: PEACH, fontStyle: "italic" } : undefined}>
          {w.text}
          {i < g.words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const NameTag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 150 } });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 70, bottom: 360, opacity: out }}>
      <div style={{ width: s * 140, height: 4, background: PEACH, marginBottom: 14 }} />
      <div style={{ fontFamily: "DM Serif Display", fontSize: 84, color: "white", opacity: s, textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>Andrés López</div>
    </div>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const fade = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(20,10,4,0.55)", opacity: a }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 80 }}>
        <div style={{ fontFamily: "DM Serif Display", fontSize: 104, lineHeight: 1.08, color: "white", opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
          No importa <span style={{ fontStyle: "italic", color: PEACH }}>dónde</span> empieces.
        </div>
        <div style={{ marginTop: 30, fontFamily: "Inter", fontWeight: 700, fontSize: 34, letterSpacing: 8, color: PEACH, opacity: a }}>— ANDRÉS LÓPEZ</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "black", opacity: fade }} />
    </AbsoluteFill>
  );
};

export const CortoF: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const l = leak(frame);
  const outro = D.lastWordEnd + 0.1;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <ARoll />
      {D.brolls.map((b, i) => (
        <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
          <BrollClip b={b} />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          opacity: l,
          mixBlendMode: "screen",
          background: "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255,150,80,0.95), rgba(255,150,80,0) 70%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(255,90,60,0.7), rgba(255,90,60,0) 70%)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)" }} />
      <Sequence {...sec(0.4, M.habla + 1.0, fps)}>
        <NameTag />
      </Sequence>
      <Sequence {...sec(M.vengo, M.llegue, fps)}>
        <Chapter label="ANTES" title="de dónde vengo" />
      </Sequence>
      <Sequence {...sec(M.llegue, M.llegue + 1.2, fps)}>
        <Tag icon={<MapPin size={44} color="#C2532B" strokeWidth={2.6} />} text="Llegada a EE. UU." />
      </Sequence>
      <Sequence {...sec(M.llegue + 1.25, M.llegue + 3.0, fps)}>
        <Tag icon={<Factory size={44} color="#C2532B" strokeWidth={2.6} />} text="Fábrica de reciclaje" />
      </Sequence>
      <Sequence {...sec(M.doce, M.doce + 2.6, fps)}>
        <Tag icon={<Clock size={44} color="#C2532B" strokeWidth={2.6} />} text="12 h diarias · Lun – Sáb" />
      </Sequence>
      <Sequence {...sec(M.hoy, M.final, fps)}>
        <Chapter label="AHORA" title="dónde estoy" />
      </Sequence>
      <Sequence durationInFrames={Math.round(outro * fps)}>
        <Subtitles />
      </Sequence>
      <Sequence from={Math.round(outro * fps)}>
        <Outro />
      </Sequence>
      <Audio
        src={staticFile(D.music.src)}
        startFrom={Math.round(D.music.trim * fps)}
        volume={(f) =>
          interpolate(
            f,
            [0, 6, Math.round(M.habla * fps) - 6, Math.round(M.habla * fps), Math.round(outro * fps), Math.round(outro * fps) + 10, durationInFrames - 12, durationInFrames],
            [0, 0.3, 0.3, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {D.sfx
        .filter((s) => !s.src.includes("whoosh_largo") && !s.src.includes("glitch"))
        .map((s, i) => (
          <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={60}>
            <Audio src={staticFile(s.src)} volume={s.volume * 0.7} />
          </Sequence>
        ))}
      {D.brolls
        .filter((b) => b.image)
        .map((b, i) => (
          <Sequence key={`c${i}`} from={Math.round(b.from * fps)} durationInFrames={30}>
            <Audio src={staticFile("sfx/camara.wav")} volume={0.35} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
