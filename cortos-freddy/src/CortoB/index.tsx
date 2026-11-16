import { loadFont } from "@remotion/fonts";
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

// Diseño B de los cortos de Freddy (distinto al de "El placebo del latino"): vídeo a pantalla completa, paleta
// 10K Month (negro, blanco y verde neón), cabecera arriba a la izquierda con etiqueta, subtítulos tipo karaoke en
// Anton mayúsculas abajo (la palabra que suena se resalta en verde), palabra gigante verde con contorno, cortinilla
// verde en la entrada de cada b-roll, golpe de zoom con destello en los cortes, barra de progreso y cierre verde.

loadFont({ family: "Anton", url: staticFile("fonts/anton-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; words: Word[] };
type Seg = { from: number; dur: number; scale: number; x: number; y: number };
type Broll = { src: string; from: number; dur: number; trim: number; x: number; y: number; zoom: number };
type Sfx = { src: string; at: number; volume: number };

const D = data as unknown as {
  durationInFrames: number;
  aroll: string;
  arollFrames: number;
  headline: { text: string; accent: boolean }[][];
  segments: Seg[];
  groups: Group[];
  brolls: Broll[];
  glitches: number[];
  sfx: Sfx[];
  music: { src: string; volume: number; endVolume: number; trim: number };
  endCard: { from: number; dur: number; lines: { text: string; big: boolean }[] };
  endVideo: { src: string; from: number; dur: number } | null;
};

const GREEN = "#35F2A0";
const INK = "#07130D";
const SHADOW = "0 6px 24px rgba(0,0,0,0.55)";
const STROKE = "6px #000";

// Orador a pantalla completa: plano normal o punch-in centrado en la cara, con empuje lento.
const ARollFull: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const seg = D.segments.find((s) => t >= s.from && t < s.from + s.dur) ?? D.segments[D.segments.length - 1];
  const k = (t - seg.from) / Math.max(0.1, seg.dur);
  const i = Math.min(frame, face.x.length - 1);
  const fx = face.x[i] ?? 0.5;
  const fy = face.y[i] ?? 0.35;
  const scale = (seg.scale > 1 ? 1.22 : 1.04) * (1 + 0.035 * k);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(D.aroll)}
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
};

// B-roll que entra con una cortinilla verde de derecha a izquierda.
const BrollWipe: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = b.dur * fps;
  const wipe = interpolate(frame, [0, 7], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [n - 5, n], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1.08 + 0.06 * (frame / n);
  return (
    <AbsoluteFill style={{ clipPath: `inset(0 ${out}% 0 ${wipe}%)` }}>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
      />
      {/* borde verde que guía la cortinilla */}
      {frame < 8 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${wipe}%`, width: 26, marginLeft: -13, background: GREEN }} />}
      {frame > n - 6 && <div style={{ position: "absolute", top: 0, bottom: 0, right: `${out}%`, width: 26, marginRight: -13, background: GREEN }} />}
    </AbsoluteFill>
  );
};

// Golpe en los cortes marcados: destello blanco corto.
const cutFlash = (frame: number): number => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= 0 && d <= 4) return [0.55, 0.35, 0.2, 0.1, 0][d];
  }
  return 0;
};

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  const words = D.headline.flat();
  return (
    <div style={{ position: "absolute", left: 64, top: 150, transform: `translateX(${(1 - a) * -120}px)`, opacity: a }}>
      <div
        style={{
          display: "inline-block",
          background: GREEN,
          color: INK,
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 3,
          padding: "8px 16px",
          borderRadius: 8,
        }}
      >
        ENTRENAMIENTO · 10K MONTH
      </div>
      <div style={{ marginTop: 14, fontFamily: "Anton", fontSize: 84, lineHeight: 1.0, textShadow: SHADOW, textTransform: "uppercase" }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: w.accent ? GREEN : "white" }}>
            {w.text.replace(/"/g, "").trim()}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

// Subtítulos karaoke: un grupo por pantalla; la palabra que suena se resalta en verde y crece.
const Karaoke: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const big = g.words.find((w) => w.kind === "big");
  const enter = spring({ frame: frame - Math.round(g.start * fps), fps, config: { damping: 14, stiffness: 240 } });
  return (
    <AbsoluteFill>
      {big && t >= big.start && <BigWord w={big} />}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1230,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 30px",
          transform: `translateY(${(1 - enter) * 40}px)`,
          opacity: enter,
        }}
      >
        {g.words
          .filter((w) => w.kind !== "big")
          .map((w, i) => {
            const next = g.words[g.words.indexOf(w) + 1];
            const active = t >= w.start && (!next || t < next.start);
            const said = t >= w.start;
            const em = w.kind === "em";
            return (
              <span
                key={i}
                style={{
                  fontFamily: "Anton",
                  fontSize: em ? 112 : 96,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  color: em || active ? GREEN : "white",
                  opacity: said ? 1 : 0.55,
                  WebkitTextStroke: STROKE,
                  paintOrder: "stroke fill",
                  textShadow: SHADOW,
                  transform: `scale(${active ? 1.08 : 1})`,
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

const BigWord: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(w.start * fps);
  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 200 } });
  const shake = f < 8 ? Math.sin(f * 2.4) * (8 - f) * 1.6 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 930,
        textAlign: "center",
        fontFamily: "Anton",
        fontSize: Math.min(300, Math.round(1900 / Math.max(4, w.text.length))),
        lineHeight: 1,
        color: GREEN,
        WebkitTextStroke: "10px #000",
        paintOrder: "stroke fill",
        textShadow: "0 12px 40px rgba(0,0,0,0.6)",
        transform: `translateX(${shake}px) scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -6}deg)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      {w.text}
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: GREEN, clipPath: `circle(${bg * 120}% at 50% 50%)`, alignItems: "center", justifyContent: "center" }}>
      {D.endCard.lines.map((l, i) => {
        const s = spring({ frame: frame - 4 - i * 4, fps, config: { damping: 13, stiffness: 200 } });
        return (
          <div
            key={i}
            style={{
              fontFamily: l.big ? "Anton" : "Montserrat",
              fontWeight: 800,
              fontSize: l.big ? 150 : 50,
              lineHeight: l.big ? 1.0 : 1.4,
              textTransform: "uppercase",
              color: INK,
              opacity: Math.min(1, s * 1.5),
              transform: `translateY(${(1 - s) * 40}px)`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const CortoB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const endAt = D.endVideo ? Math.round(D.endVideo.from * fps) : durationInFrames;
  const cardFrom = Math.round(D.endCard.from * fps);
  const flash = cutFlash(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={D.arollFrames}>
        <ARollFull />
      </Sequence>
      {D.brolls.map((b, i) => (
        <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
          <BrollWipe b={b} />
        </Sequence>
      ))}
      {flash > 0 && <AbsoluteFill style={{ background: "white", opacity: flash }} />}
      {/* degradados para que se lean la cabecera y los subtítulos */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <Sequence durationInFrames={cardFrom}>
        <Header />
      </Sequence>
      <Sequence durationInFrames={D.arollFrames}>
        <Karaoke />
      </Sequence>
      {/* barra de progreso */}
      {frame < cardFrom && (
        <div style={{ position: "absolute", left: 0, bottom: 0, height: 12, width: `${(frame / cardFrom) * 100}%`, background: GREEN }} />
      )}
      <Sequence from={cardFrom} durationInFrames={Math.round(D.endCard.dur * fps)}>
        <EndCard />
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
          interpolate(f, [0, 8, cardFrom - 6, cardFrom + 6, endAt + 90, endAt + 120], [0, D.music.volume, D.music.volume, D.music.endVolume, D.music.endVolume * 0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {D.sfx.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={90}>
          <Audio src={staticFile(s.src.replace("sfx/glitch.wav", "sfx/swoosh.wav"))} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
