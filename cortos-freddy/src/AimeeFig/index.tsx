import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import subs from "./subs.json";

// Colaboración de Aimee con JuJuBit (figura 3D personalizada y cómo pedirla). El vídeo ya viene montado con su voz y
// música; aquí van los títulos con letra bonita (Cormorant Garamond cursiva + Great Vibes), los pasos de la página y
// subtítulos pequeños abajo (Inter en una cápsula translúcida, que se lean sin ocupar mucho).

loadFont({ family: "Cormorant Garamond", url: staticFile("fonts/cormorant-garamond-latin-700-italic.woff2"), weight: "700", style: "italic" });
loadFont({ family: "Cormorant Garamond", url: staticFile("fonts/cormorant-garamond-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Great Vibes", url: staticFile("fonts/great-vibes-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });

const RED = "#E8452C"; // naranja rojizo de JuJuBit
const CREAM = "#FFF7EE";
const SOFT = "0 4px 18px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.35)";

type G = { start: number; end: number; words: { t: string; s: number }[] };
const GROUPS = (subs as { groups: G[] }).groups;

const useInOut = (inFrames = 10, outFrames = 8) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 150 }, durationInFrames: inFrames * 2 });
  const out = interpolate(frame, [durationInFrames - outFrames, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { s, out };
};

const TopShade: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, opacity, background: "linear-gradient(180deg, rgba(40,20,14,0.55) 0%, rgba(40,20,14,0.35) 55%, rgba(40,20,14,0) 100%)" }} />
);

// Título del gancho: "Tu recuerdo," en cursiva elegante y "para siempre" en caligrafía.
const Hook: React.FC = () => {
  const { s, out } = useInOut();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s2 = spring({ frame: frame - 8, fps, config: { damping: 15, stiffness: 140 } });
  return (
    <>
    <TopShade opacity={Math.min(1, s * 1.5) * out} />
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center", opacity: out }}>
      <div style={{ fontFamily: "Cormorant Garamond", fontStyle: "italic", fontWeight: 700, fontSize: 92, lineHeight: 0.95, color: CREAM, textShadow: SOFT, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
        Tu recuerdo,
      </div>
      <div style={{ fontFamily: "Great Vibes", fontSize: 150, lineHeight: 0.78, marginTop: -6, color: CREAM, textShadow: `0 4px 22px ${RED}AA, ${SOFT}`, opacity: s2, transform: `scale(${0.85 + 0.15 * s2})` }}>
        para siempre
      </div>
      <div style={{ marginTop: 0, fontFamily: "Inter", fontWeight: 700, fontSize: 30, letterSpacing: 8, color: CREAM, opacity: s2 * 0.95, textShadow: SOFT }}>
        EN FIGURA 3D
      </div>
    </div>
    </>
  );
};

// Paso de la página: número en caligrafía dentro de un círculo rojo y texto en cursiva elegante.
const Step: React.FC<{ n: number; text: string; top?: number }> = ({ n, text, top = 215 }) => {
  const { s, out } = useInOut(8, 6);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: "50%",
        transform: `translateX(-50%) translateY(${(1 - s) * -30}px)`,
        opacity: Math.min(1, s * 1.5) * out,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "12px 36px 14px 14px",
        borderRadius: 999,
        background: "rgba(255,247,238,0.94)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ width: 78, height: 78, borderRadius: 39, background: RED, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Great Vibes", fontSize: 62, paddingTop: 6 }}>
        {n}
      </div>
      <div style={{ fontFamily: "Cormorant Garamond", fontStyle: "italic", fontWeight: 700, fontSize: 62, color: "#3A2219" }}>{text}</div>
    </div>
  );
};

// Rótulo elegante en el centro superior (detalles, protección).
const Note: React.FC<{ kicker: string; text: string }> = ({ kicker, text }) => {
  const { s, out } = useInOut();
  return (
    <>
    <TopShade opacity={s * out} />
    <div style={{ position: "absolute", top: 220, left: 0, right: 0, textAlign: "center", opacity: s * out }}>
      <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 28, letterSpacing: 8, color: CREAM, textShadow: SOFT }}>{kicker}</div>
      <div style={{ fontFamily: "Great Vibes", fontSize: 128, lineHeight: 1, color: CREAM, textShadow: `0 4px 22px ${RED}99, ${SOFT}`, transform: `scale(${0.85 + 0.15 * s})` }}>{text}</div>
    </div>
    </>
  );
};

// Tarjeta final compacta, abajo sobre la mesa (encima de los subtítulos) para no tapar su cara ni la figura.
const Offer: React.FC = () => {
  const { s } = useInOut(12, 1);
  return (
    <div style={{ position: "absolute", bottom: 250, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, s * 1.5) }}>
      <div
        style={{
          width: 640,
          padding: "14px 30px 18px",
          borderRadius: 26,
          background: "rgba(255,247,238,0.95)",
          boxShadow: "0 14px 32px rgba(0,0,0,0.3)",
          textAlign: "center",
          transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`,
          border: `3px solid ${RED}`,
        }}
      >
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 22, letterSpacing: 8, color: RED }}>BLACK FRIDAY</div>
        <div style={{ fontFamily: "Great Vibes", fontSize: 66, lineHeight: 1.05, color: "#3A2219" }}>crea la tuya</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 14 }}>
          <span style={{ fontFamily: "Cormorant Garamond", fontStyle: "italic", fontWeight: 700, fontSize: 38, color: "#3A2219" }}>usa mi código</span>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 44, letterSpacing: 3, color: RED }}>AIMEE20</span>
        </div>
        <div style={{ marginTop: 8, display: "inline-block", padding: "6px 20px", borderRadius: 999, background: RED, color: "white", fontFamily: "Inter", fontWeight: 700, fontSize: 26, letterSpacing: 1 }}>
          Link en mi bio ✨
        </div>
      </div>
    </div>
  );
};

// Señalador: recuadro que late alrededor de lo que hay que tocar, flecha que apunta y un toque (onda) al final.
type Box = { x: number; y: number; w: number; h: number };
const Pointer: React.FC<{ box: Box; from: "left" | "right" | "above" | "below"; label?: string; labelBelow?: boolean; tap?: boolean }> = ({
  box,
  from,
  label,
  labelBelow,
  tap = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(frame, [durationInFrames - 4, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + 0.04 * Math.sin(frame / 3.2);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const L = 170; // largo de la flecha
  const gap = 26;
  const bob = Math.sin(frame / 4) * 10;
  // punta de la flecha en el borde del recuadro y cola hacia fuera
  const tip =
    from === "left" ? { x: box.x - gap + bob, y: cy } : from === "right" ? { x: box.x + box.w + gap - bob, y: cy } : from === "above" ? { x: cx, y: box.y - gap + bob } : { x: cx, y: box.y + box.h + gap - bob };
  const angle = from === "left" ? 0 : from === "right" ? 180 : from === "above" ? 90 : -90;
  const tapF = frame - 10;
  const ripple = tap && tapF > 0 ? (tapF % 24) / 24 : -1;
  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: box.x - 10,
          top: box.y - 10,
          width: box.w + 20,
          height: box.h + 20,
          borderRadius: 24,
          border: `7px solid ${RED}`,
          boxShadow: `0 0 0 5px ${CREAM}, 0 0 30px ${RED}AA`,
          transform: `scale(${(0.6 + 0.4 * s) * pulse})`,
          opacity: Math.min(1, s * 2),
        }}
      />
      {ripple >= 0 && (
        <div
          style={{
            position: "absolute",
            left: cx - 40,
            top: cy - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            border: `6px solid ${CREAM}`,
            background: "rgba(255,247,238,0.35)",
            transform: `scale(${0.4 + ripple * 1.6})`,
            opacity: 1 - ripple,
          }}
        />
      )}
      <svg
        width={L}
        height={90}
        viewBox={`0 0 ${L} 90`}
        style={{
          position: "absolute",
          left: tip.x - L,
          top: tip.y - 45,
          transformOrigin: `${L}px 45px`,
          transform: `rotate(${angle}deg) scale(${s})`,
          overflow: "visible",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))",
        }}
      >
        <path d={`M 4 33 L ${L - 62} 33 L ${L - 62} 8 L ${L - 4} 45 L ${L - 62} 82 L ${L - 62} 57 L 4 57 Z`} fill={CREAM} stroke={RED} strokeWidth={7} strokeLinejoin="round" />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: Math.min(1080 - 480, Math.max(20, cx - 240)),
            width: 480,
            top: from === "below" ? box.y + box.h + gap + 110 : labelBelow ? box.y + box.h + 34 : box.y - gap - 150 - (from === "above" ? 120 : 0),
            textAlign: "center",
            opacity: Math.min(1, s * 1.5),
          }}
        >
          <span style={{ display: "inline-block", whiteSpace: "nowrap", padding: "8px 22px", borderRadius: 999, background: RED, color: "white", fontFamily: "Inter", fontWeight: 700, fontSize: 34, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
            {label}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Código de descuento fijo arriba (desde el paso 1 hasta el final, 16 s).
const CodeBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 180 } });
  const pulse = 1 + 0.025 * Math.sin(frame / 9);
  return (
    <div style={{ position: "absolute", top: 46, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "12px 34px 14px",
          borderRadius: 999,
          background: RED,
          boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
          border: `4px solid ${CREAM}`,
          transform: `translateY(${(1 - s) * -80}px) scale(${pulse})`,
          opacity: Math.min(1, s * 1.5),
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: "Cormorant Garamond", fontStyle: "italic", fontWeight: 700, fontSize: 48, color: CREAM }}>código</span>
        <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 62, letterSpacing: 4, color: "white" }}>AIMEE20</span>
      </div>
    </div>
  );
};

// Subtítulos pequeños abajo.
const Subs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = GROUPS.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const a = interpolate(frame - Math.round(g.start * fps), [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", opacity: a }}>
      <div
        style={{
          maxWidth: 860,
          padding: "10px 24px 12px",
          borderRadius: 16,
          background: "rgba(20,12,10,0.66)",
          fontFamily: "Inter",
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.25,
          color: "white",
          textAlign: "center",
        }}
      >
        {g.words.map((w, i) => (
          <span key={i} style={{ opacity: t >= w.s ? 1 : 0.6 }}>
            {w.t}
            {i < g.words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const s = (t: number) => Math.round(t * 30);

export const AimeeFig: React.FC = () => (
  <AbsoluteFill style={{ background: "black" }}>
    <OffthreadVideo src={staticFile("media/aimee_fig.mp4")} style={{ width: "100%", height: "100%" }} />
    <Sequence from={s(0.1)} durationInFrames={s(2.45)}>
      <Hook />
    </Sequence>
    <Sequence from={s(2.67)} durationInFrames={s(0.85)}>
      <Step n={1} text="Entra a jujubit.ai" top={360} />
    </Sequence>
    <Sequence from={s(3.52)} durationInFrames={s(0.85)}>
      <Step n={2} text="Sube tu foto" />
    </Sequence>
    <Sequence from={s(4.4)} durationInFrames={s(0.8)}>
      <Step n={3} text="Toca “Generate”" />
    </Sequence>
    <Sequence from={s(5.2)} durationInFrames={s(4.5)}>
      <Step n={4} text="¡Mira tu figura en 3D!" />
    </Sequence>
    <Sequence from={s(10.0)} durationInFrames={s(1.6)}>
      <Note kicker="CALIDAD Y DETALLE" text="me encantó" />
    </Sequence>
    <Sequence from={s(11.65)} durationInFrames={s(1.7)}>
      <Note kicker="LLEGA" text="súper protegida" />
    </Sequence>
    <Sequence from={s(2.72)} durationInFrames={s(0.42)}>
      <Pointer box={{ x: 420, y: 112, w: 240, h: 46 }} from="below" tap={false} />
    </Sequence>
    <Sequence from={s(3.12)} durationInFrames={s(0.16)}>
      <Pointer box={{ x: 399, y: 1259, w: 285, h: 278 }} from="left" tap={false} />
    </Sequence>
    <Sequence from={s(3.28)} durationInFrames={s(0.24)}>
      <Pointer box={{ x: 370, y: 1285, w: 345, h: 72 }} from="left" />
    </Sequence>
    <Sequence from={s(3.55)} durationInFrames={s(0.82)}>
      <Pointer box={{ x: 102, y: 273, w: 207, h: 286 }} from="right" label="la primera foto" labelBelow />
    </Sequence>
    <Sequence from={s(4.42)} durationInFrames={s(0.78)}>
      <Pointer box={{ x: 163, y: 1508, w: 749, h: 93 }} from="above" />
    </Sequence>
    <Sequence from={s(5.25)} durationInFrames={s(0.85)}>
      <Pointer box={{ x: 230, y: 540, w: 560, h: 70 }} from="below" tap={false} label="creando tu figura…" />
    </Sequence>
    <Sequence from={s(6.15)} durationInFrames={s(3.5)}>
      <Pointer box={{ x: 245, y: 495, w: 90, h: 58 }} from="right" label="vista 3D" labelBelow />
    </Sequence>
    <Sequence from={s(13.4)} durationInFrames={s(5.2)}>
      <Offer />
    </Sequence>
    <Sequence from={s(3.5)}>
      <CodeBadge />
    </Sequence>
    <Subs />
  </AbsoluteFill>
);
