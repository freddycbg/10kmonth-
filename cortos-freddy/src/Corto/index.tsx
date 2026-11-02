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
import data from "./corto.json";

// Cortos de Freddy sacados de entrenamientos (estilo de la referencia "Así mejoras tu negocio"):
// fondo negro, el vídeo en una franja 4:3 en el centro, titular fijo arriba entre comillas con una palabra de
// acento, palabras animadas sobre el vídeo (sans gruesa blanca + serif itálica de acento + palabra gigante con
// tiradores de selección), cortes con glitch RGB, b-roll rápido, tarjeta de texto y cierre 10K Month.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });
loadFont({
  family: "Playfair Display",
  url: staticFile("fonts/playfair-display-latin-900-italic.woff2"),
  weight: "900",
  style: "italic",
});

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; anchor: string; words: Word[] };
type Seg = { from: number; dur: number; scale: number; x: number; y: number };
type Broll = { src: string; from: number; dur: number; trim: number; x: number; y: number; zoom: number };
type Sfx = { src: string; at: number; volume: number };

const D = data as unknown as {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  aroll: string;
  arollFrames: number;
  band: { y: number; h: number };
  accent: string;
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

const ACCENT = D.accent;
const SHADOW = "0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.6)";

const Headline: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: D.band.y - 210,
      width: "100%",
      height: 190,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Poppins",
      fontWeight: 800,
      fontSize: 66,
      lineHeight: 1.08,
      color: "white",
      letterSpacing: -1,
    }}
  >
    {D.headline.map((line, i) => (
      <div key={i}>
        {line.map((p, j) => (
          <span key={j} style={{ color: p.accent ? ACCENT : "white" }}>
            {p.text}
          </span>
        ))}
      </div>
    ))}
  </div>
);

// Plano del orador dentro de la franja: cada tramo con su zoom (plano abierto o punch-in) y un empuje lento; el
// encuadre sigue la cara (src/Edit/face.json, scripts/facetrack.py) y la deja a un tercio de la altura de la franja.
const FACE_Y = 0.36;
const ARollBand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const seg = D.segments.find((s) => t >= s.from && t < s.from + s.dur) ?? D.segments[D.segments.length - 1];
  const k = (t - seg.from) / Math.max(0.1, seg.dur);
  const scale = seg.scale * (1 + 0.04 * k);
  const i = Math.min(frame, face.x.length - 1);
  const fx = face.x[i] ?? seg.x;
  const fy = face.y[i] ?? seg.y;
  const vw = width * scale;
  const vh = (width * 16 / 9) * scale;
  const left = Math.min(0, Math.max(width - vw, width / 2 - fx * vw));
  const top = Math.min(0, Math.max(D.band.h - vh, FACE_Y * D.band.h - fy * vh));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(D.aroll)}
        style={{ position: "absolute", left, top, width: vw, height: vh }}
      />
    </AbsoluteFill>
  );
};

const BrollClip: React.FC<{ b: Broll }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = b.dur * fps;
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 220 } });
  const scale = b.zoom * (1.12 - 0.12 * enter) * (1 + 0.05 * (frame / n));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(b.src)}
        muted
        startFrom={Math.round(b.trim * fps)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${b.x * 100}% ${b.y * 100}%`,
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Glitch RGB en los cortes: canales separados y franjas desplazadas durante 5 fotogramas.
const GlitchFilter: React.FC<{ amount: number; seed: number }> = ({ amount, seed }) => {
  const dx = Math.round(18 * amount);
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id="rgb" x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={dx} dy={0} result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-dx} dy={Math.round(4 * amount * (seed % 2 ? 1 : -1))} result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </svg>
  );
};

const glitchAmount = (frame: number): number => {
  for (const g of D.glitches) {
    const d = frame - g;
    if (d >= -2 && d <= 3) return [0.6, 1, 0.9, 0.6, 0.35, 0.15][d + 2];
  }
  return 0;
};

// Palabra gigante con caja y tiradores de selección (como en un editor), entra con rebote.
const BigWord: React.FC<{ w: Word; frame: number; fps: number }> = ({ w, frame, fps }) => {
  const f = frame - Math.round(w.start * fps);
  const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 180 } });
  const handles = interpolate(f, [4, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const len = w.text.length;
  const size = Math.min(230, Math.round(1500 / Math.max(3, len)));
  return (
    <div style={{ position: "relative", display: "inline-block", transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 2) }}>
      <div
        style={{
          fontFamily: "Poppins",
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          color: "white",
          letterSpacing: -4,
          textShadow: SHADOW,
          padding: "6px 18px",
        }}
      >
        {w.text}
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: handles }}>
        <div style={{ position: "absolute", left: 0, top: -10, bottom: -10, width: 3, background: "#1E7BFF" }} />
        <div style={{ position: "absolute", right: 0, top: -10, bottom: -10, width: 3, background: "#1E7BFF" }} />
        <div style={{ position: "absolute", left: -11, top: -26, width: 25, height: 25, borderRadius: 13, background: "#1E7BFF" }} />
        <div style={{ position: "absolute", right: -11, bottom: -26, width: 25, height: 25, borderRadius: 13, background: "#1E7BFF" }} />
      </div>
    </div>
  );
};

const ANCHORS: Record<string, React.CSSProperties> = {
  tl: { left: 60, top: 70, alignItems: "flex-start", textAlign: "left" },
  tr: { right: 60, top: 70, alignItems: "flex-end", textAlign: "right" },
  bl: { left: 60, bottom: 80, alignItems: "flex-start", textAlign: "left" },
  br: { right: 60, bottom: 80, alignItems: "flex-end", textAlign: "right" },
  c: { left: 0, right: 0, top: 50, alignItems: "center", textAlign: "center" },
  ct: { left: 0, right: 0, top: 60, alignItems: "center", textAlign: "center" },
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = D.groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const lines: Word[][] = [];
  let cur: Word[] = [];
  for (const w of g.words) {
    if (w.kind !== "n") {
      if (cur.length) lines.push(cur);
      lines.push([w]);
      cur = [];
    } else cur.push(w);
  }
  if (cur.length) lines.push(cur);
  const out = interpolate(t, [g.end - 0.08, g.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", position: "absolute", opacity: out, ...ANCHORS[g.anchor] }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ lineHeight: 1 }}>
          {ln.map((w, j) => {
            const f = frame - Math.round(w.start * fps);
            if (f < 0) return null;
            if (w.kind === "big") return <BigWord key={j} w={w} frame={frame} fps={fps} />;
            const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 260 } });
            const em = w.kind === "em";
            return (
              <span
                key={j}
                style={{
                  display: "inline-block",
                  marginRight: em ? 0 : 16,
                  fontFamily: em ? "Playfair Display" : "Montserrat",
                  fontStyle: em ? "italic" : "normal",
                  fontWeight: em ? 900 : 800,
                  fontSize: em ? 112 : 60,
                  color: em ? ACCENT : "white",
                  textShadow: SHADOW,
                  transform: `translateY(${(1 - s) * 22}px) scale(${0.85 + 0.15 * s})`,
                  opacity: Math.min(1, s * 1.6),
                  letterSpacing: em ? -1 : 0,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "black", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {D.endCard.lines.map((l, i) => {
        const s = spring({ frame: frame - i * 4, fps, config: { damping: 14, stiffness: 200 } });
        return (
          <div
            key={i}
            style={{
              fontFamily: l.big ? "Poppins" : "Montserrat",
              fontWeight: 800,
              fontSize: l.big ? 104 : 46,
              lineHeight: l.big ? 1.05 : 1.2,
              color: "white",
              opacity: Math.min(1, s * 1.5),
              transform: `translateY(${(1 - s) * 30}px)`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Corto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const amount = glitchAmount(frame);
  const endAt = D.endVideo ? Math.round(D.endVideo.from * fps) : D.durationInFrames;
  const cardFrom = Math.round(D.endCard.from * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <GlitchFilter amount={amount} seed={frame} />
      {frame < endAt && <Headline />}
      <div
        style={{
          position: "absolute",
          top: D.band.y,
          left: 0,
          width: D.width,
          height: D.band.h,
          overflow: "hidden",
          filter: amount > 0 ? "url(#rgb)" : undefined,
        }}
      >
        <Sequence durationInFrames={D.arollFrames}>
          <ARollBand />
        </Sequence>
        {D.brolls.map((b, i) => (
          <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}>
            <BrollClip b={b} />
          </Sequence>
        ))}
        <Sequence durationInFrames={D.arollFrames}>
          <Captions />
        </Sequence>
        <Sequence from={cardFrom} durationInFrames={Math.round(D.endCard.dur * fps)}>
          <EndCard />
        </Sequence>
      </div>
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
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
