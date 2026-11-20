import { loadFont } from "@remotion/fonts";
import { Flame, Snowflake, Trophy } from "lucide-react";
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

// Diseño G (entrenamientos de Freddy, "El síndrome de Duolingo"): modo juego.
// - Contador de racha con fueguito arriba (zona segura de Instagram): sube con cada venta cuando habla de la racha
//   buena, se congela y cae a 0 cuando habla de la racha al contrario.
// - Tarjeta de app con "3.650 días de racha" y "idioma: 0%", barra de progreso que se llena al 30 %.
// - Subtítulos redondeados tipo videojuego (Nunito Black, contorno morado, palabra clave naranja) a media altura.
// - Tarjeta final de "lección completada" con la conclusión y cierre 10K Month (regla fija de Freddy).

loadFont({ family: "Nunito", url: staticFile("fonts/nunito-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: "Nunito", url: staticFile("fonts/nunito-latin-800-normal.woff2"), weight: "800" });

type Word = { text: string; start: number; kind: "n" | "em" | "big" };
type Group = { start: number; end: number; words: Word[] };
type Seg = { from: number; dur: number; scale: number };
type Sfx = { src: string; at: number; volume: number };

const D = data as unknown as {
  durationInFrames: number;
  aroll: string;
  arollFrames: number;
  segments: Seg[];
  groups: Group[];
  glitches: number[];
  sfx: Sfx[];
  music: { src: string; volume: number; endVolume: number; trim: number };
  marks: Record<string, number>;
  lastWordEnd: number;
  endCard: { from: number; dur: number };
  endVideo: { src: string; from: number; dur: number } | null;
};

const ORANGE = "#FF9600";
const PURPLE = "#2B1B5A";
const ICE = "#8ED1FF";
const M = D.marks;
const sec = (a: number, b: number, fps: number) => ({ from: Math.round(a * fps), durationInFrames: Math.max(1, Math.round((b - a) * fps)) });
const OUTLINE = `8px ${PURPLE}`;

const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = Math.max(0, D.segments.findIndex((s) => t >= s.from && t < s.from + s.dur));
  const seg = D.segments[idx];
  const local = t - seg.from;
  const punch = interpolate(local, [0, 0.16], [1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = (idx % 2 ? 1.32 : 1.12) * punch * (1 + 0.03 * (local / Math.max(0.1, seg.dur)));
  const i = Math.min(frame, face.x.length - 1);
  return (
    <OffthreadVideo
      src={staticFile(D.aroll)}
      style={{ width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: `${(face.x[i] ?? 0.5) * 100}% ${(face.y[i] ?? 0.3) * 100}%` }}
    />
  );
};

// Estado de la racha según lo que dice: sube 1→4 al hablar de vender, se congela y baja a 0 con la racha al contrario.
const streakState = (t: number) => {
  if (t < M.vendiendo) return { n: 1, frozen: false };
  if (t < M.contrario) return { n: Math.min(4, 1 + Math.floor(((t - M.vendiendo) / (M.contrario - M.vendiendo)) * 4)), frozen: false };
  if (t < M.miedo) return { n: Math.max(0, 4 - Math.floor(((t - M.contrario) / (M.miedo - M.contrario)) * 5)), frozen: true };
  return { n: 0, frozen: true };
};

const StreakHUD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps + M.racha;
  const st = streakState(t);
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // rebote cada vez que cambia el número (se busca hacia atrás el fotograma del último cambio)
  let since = 99;
  for (let k = 0; k < 15; k++) {
    if (streakState(t - (k + 1) / fps).n !== st.n) {
      since = k;
      break;
    }
  }
  const bump = interpolate(since, [0, 4, 10], [1.35, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = st.frozen && t < M.miedo ? Math.sin(frame * 2.2) * 6 : 0;
  const color = st.frozen ? ICE : ORANGE;
  const Icon = st.frozen ? Snowflake : Flame;
  return (
    <div style={{ position: "absolute", top: 290, right: 60, opacity: Math.min(1, s * 2) * out, transform: `translateX(${(1 - s) * 200 + shake}px)` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 30px 14px 20px",
          borderRadius: 26,
          background: "rgba(43,27,90,0.88)",
          border: `4px solid ${color}`,
          boxShadow: `0 8px 0 rgba(0,0,0,0.35), 0 0 30px ${color}66`,
        }}
      >
        <Icon size={70} color={color} fill={st.frozen ? "none" : color} strokeWidth={2.4} style={{ transform: `scale(${bump})` }} />
        <div>
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 76, lineHeight: 0.95, color: "white", transform: `scale(${bump})`, transformOrigin: "left center" }}>{st.n}</div>
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 24, letterSpacing: 2, color }}>{st.frozen ? "RACHA CONGELADA" : "VENTAS SEGUIDAS"}</div>
        </div>
      </div>
    </div>
  );
};

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", opacity: out, transform: `scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * -8}deg)` }}>
      <div
        style={{
          display: "inline-block",
          padding: "18px 40px 24px",
          borderRadius: 34,
          background: PURPLE,
          boxShadow: `0 12px 0 #160C33, 0 20px 40px rgba(0,0,0,0.4)`,
        }}
      >
        <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 40, letterSpacing: 6, color: "white" }}>EL SÍNDROME DE</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Flame size={92} color={ORANGE} fill={ORANGE} />
          <span style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 112, lineHeight: 1, color: ORANGE }}>DUOLINGO</span>
        </div>
      </div>
    </div>
  );
};

// Tarjeta de "app": la racha de años sin aprender el idioma.
const AppCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps + M.app;
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 190 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const days = Math.round(interpolate(t, [M.anos - 0.6, M.anos + 0.8], [1, 3650], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const showLang = t >= M.idioma;
  const langPop = spring({ frame: frame - Math.round((M.idioma - M.app) * fps), fps, config: { damping: 10, stiffness: 240 } });
  return (
    <div style={{ position: "absolute", top: 300, left: 140, right: 140, opacity: Math.min(1, s * 2) * out, transform: `translateY(${(1 - s) * -120}px)` }}>
      <div style={{ padding: "26px 30px", borderRadius: 36, background: "white", boxShadow: "0 12px 0 #D9D2EE, 0 22px 50px rgba(0,0,0,0.35)", textAlign: "center" }}>
        <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 30, letterSpacing: 3, color: "#7A6FA0" }}>TU RACHA</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Flame size={96} color={ORANGE} fill={ORANGE} />
          <span style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 104, color: ORANGE, lineHeight: 1 }}>{days >= 1000 ? `${Math.floor(days / 1000)}.${String(days % 1000).padStart(3, "0")}` : days}</span>
        </div>
        <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 36, color: PURPLE }}>días seguidos</div>
        {showLang && (
          <div
            style={{
              marginTop: 16,
              display: "inline-block",
              padding: "8px 26px",
              borderRadius: 999,
              background: "#FF4B4B",
              color: "white",
              fontFamily: "Nunito",
              fontWeight: 900,
              fontSize: 40,
              transform: `scale(${0.4 + 0.6 * langPop}) rotate(-3deg)`,
            }}
          >
            idioma aprendido: 0%
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 190 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p = interpolate(frame, [8, 30], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 300, left: 110, right: 110, opacity: Math.min(1, s * 2) * out, transform: `translateY(${(1 - s) * -120}px)` }}>
      <div style={{ padding: "24px 30px", borderRadius: 32, background: "white", boxShadow: "0 12px 0 #D9D2EE, 0 22px 50px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Nunito", fontWeight: 900, fontSize: 34, color: PURPLE }}>
          <span>Curso de japonés</span>
          <span style={{ color: ORANGE }}>{Math.round(p)}%</span>
        </div>
        <div style={{ marginTop: 14, height: 40, borderRadius: 20, background: "#E8E4F4", overflow: "hidden" }}>
          <div style={{ width: `${p}%`, height: "100%", borderRadius: 20, background: ORANGE, boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.15)" }} />
        </div>
      </div>
    </div>
  );
};

const BigWord: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - Math.round(w.start * fps);
  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, transform: `scale(${0.3 + 0.7 * s}) rotate(${(1 - s) * 10}deg)`, opacity: Math.min(1, s * 2) }}>
      <Flame size={190} color={ORANGE} fill={ORANGE} strokeWidth={1.6} style={{ filter: `drop-shadow(0 0 30px ${ORANGE})` }} />
      <span style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 210, color: "white", WebkitTextStroke: `14px ${PURPLE}`, paintOrder: "stroke fill", lineHeight: 1 }}>{w.text}</span>
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
      {big && t >= big.start && <BigWord w={big} />}
      <div style={{ position: "absolute", left: 80, right: 80, top: 1180, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 20px" }}>
        {g.words
          .filter((w) => w.kind !== "big")
          .map((w, i) => {
            const f = frame - Math.round(w.start * fps);
            if (f < 0) return null;
            const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 320 } });
            const em = w.kind === "em";
            return (
              <span
                key={i}
                style={{
                  fontFamily: "Nunito",
                  fontWeight: 900,
                  fontSize: em ? 92 : 80,
                  lineHeight: 1.12,
                  color: em ? ORANGE : "white",
                  WebkitTextStroke: OUTLINE,
                  paintOrder: "stroke fill",
                  textShadow: "0 8px 0 rgba(22,12,51,0.55)",
                  display: "inline-block",
                  transform: `translateY(${(1 - s) * 30}px) scale(${0.6 + 0.4 * s})`,
                }}
              >
                {w.text}
              </span>
            );
          })}
      </div>
    </AbsoluteFill>
  );
};

const LessonComplete: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = spring({ frame, fps, config: { damping: 20, stiffness: 160 } });
  const lines = ["Un día bueno no define a nadie.", "Un día malo no define a nadie.", "Todo depende del trabajo."];
  return (
    <AbsoluteFill style={{ background: PURPLE, clipPath: `circle(${bg * 120}% at 50% 50%)`, alignItems: "center", justifyContent: "center", padding: 50 }}>
      <Trophy size={130} color={ORANGE} fill={ORANGE} strokeWidth={1.8} style={{ transform: `scale(${spring({ frame: frame - 4, fps, config: { damping: 9 } })})` }} />
      <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 40, letterSpacing: 6, color: ORANGE, margin: "16px 0 26px" }}>LECCIÓN DEL DÍA</div>
      {lines.map((l, i) => {
        const s = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 13, stiffness: 200 } });
        return (
          <div
            key={i}
            style={{
              fontFamily: "Nunito",
              fontWeight: 900,
              fontSize: i === 2 ? 80 : 56,
              whiteSpace: "nowrap",
              lineHeight: 1.15,
              textAlign: "center",
              color: i === 2 ? ORANGE : "white",
              opacity: Math.min(1, s * 1.5),
              transform: `translateY(${(1 - s) * 40}px)`,
              marginTop: i === 2 ? 22 : 0,
            }}
          >
            {l}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const CortoG: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const endAt = D.endVideo ? Math.round(D.endVideo.from * fps) : durationInFrames;
  const cardFrom = Math.round(D.endCard.from * fps);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Sequence durationInFrames={D.arollFrames}>
        <ARoll />
      </Sequence>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)" }} />
      <Sequence {...sec(M.sindrome, M.racha + 0.6, fps)}>
        <TitleCard />
      </Sequence>
      <Sequence {...sec(M.racha + 0.6, M.controlar + 2.5, fps)}>
        <StreakHUD />
      </Sequence>
      <Sequence {...sec(M.app, M.broma + 0.3, fps)}>
        <AppCard />
      </Sequence>
      <Sequence {...sec(M.pct, M.japones, fps)}>
        <ProgressCard />
      </Sequence>
      <Sequence durationInFrames={D.arollFrames}>
        <Captions />
      </Sequence>
      <Sequence from={cardFrom} durationInFrames={endAt - cardFrom}>
        <LessonComplete />
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
      {/* sonidos de juego: "ding" con cada venta de la racha, error cuando se congela, pop en las tarjetas */}
      {[0, 1, 2, 3].map((k) => (
        <Sequence key={`d${k}`} from={Math.round((M.vendiendo + ((M.contrario - M.vendiendo) * k) / 4) * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.25} />
        </Sequence>
      ))}
      <Sequence from={Math.round(M.contrario * fps)} durationInFrames={40}>
        <Audio src={staticFile("sfx/error.wav")} volume={0.35} />
      </Sequence>
      {[M.sindrome, M.app, M.idioma, M.pct].map((t, i) => (
        <Sequence key={`p${i}`} from={Math.round(t * fps)} durationInFrames={30}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
        </Sequence>
      ))}
      {D.sfx
        .filter((x) => x.src.includes("impacto") || x.src.includes("whoosh_largo"))
        .map((x, i) => (
          <Sequence key={i} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={60}>
            <Audio src={staticFile(x.src)} volume={x.volume} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
