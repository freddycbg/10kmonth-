import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TITLE_FONT, TITLE_GOLD } from "./fonts";

// Título cinético de frase clave (estilo.md §2b): línea pequeña blanca (acento en dorado) que se construye
// palabra a palabra, y debajo una palabra gigante en dorado que entra con desenfoque y escala.
// El tamaño de la palabra gigante (bigSize) viene calculado de build_edit.py con las métricas de Anton:
// medirlo en el render daba tamaños distintos entre fotogramas y la palabra parpadeaba (borrador 2).
const MARGIN_X = 0.075; // margen izquierdo, fracción del ancho
const TOP_SIZE = 62;
const BIG_IN_FRAMES = 8;
const SHADOW = "0 4px 18px rgba(0,0,0,0.35)";

type TopWord = { text: string; accent: boolean; at: number };

export const KineticTitle: React.FC<{
  top: TopWord[];
  big: string;
  bigAt: number;
  bigSize: number;
  bottom: { text: string; at: number }[];
  y: number;
}> = ({ top, big, bigAt, bigSize, bottom, y }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Salida rápida en los últimos 4 fotogramas.
  const out = interpolate(
    frame,
    [durationInFrames - 4, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const bigLocal = frame - bigAt;
  const bigIn = interpolate(bigLocal, [0, BIG_IN_FRAMES], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          position: "absolute",
          top: height * y,
          left: width * MARGIN_X,
          right: width * MARGIN_X,
          fontFamily: TITLE_FONT,
          textTransform: "uppercase",
          textShadow: SHADOW,
        }}
      >
        <div style={{ fontSize: TOP_SIZE, lineHeight: 1.05 }}>
          {top.map((w, i) => {
            const local = frame - w.at;
            if (local < 0) {
              return null;
            }
            const k = interpolate(local, [0, 3], [0, 1], {
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.22em",
                  color: w.accent ? TITLE_GOLD : "#FFFFFF",
                  opacity: k,
                  transform: `translateY(${(1 - k) * 14}px)`,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
        {bigLocal >= 0 ? (
          <div
            style={{
              fontSize: bigSize,
              lineHeight: 0.98,
              color: TITLE_GOLD,
              whiteSpace: "nowrap",
              transformOrigin: "left center",
              opacity: bigIn,
              filter: bigIn < 1 ? `blur(${(1 - bigIn) * 16}px)` : undefined,
              transform: `scale(${1.18 - 0.18 * bigIn})`,
            }}
          >
            {big}
          </div>
        ) : null}
        {/* Línea inferior opcional (p. ej. "AQUÍ ABAJO" bajo "10K"), palabra a palabra como la superior. */}
        <div style={{ fontSize: TOP_SIZE, lineHeight: 1.05, color: "#FFFFFF" }}>
          {bottom.map((w, i) => {
            const local = frame - w.at;
            if (local < 0) {
              return null;
            }
            const k = interpolate(local, [0, 3], [0, 1], {
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.22em",
                  opacity: k,
                  transform: `translateY(${(1 - k) * -14}px)`,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
