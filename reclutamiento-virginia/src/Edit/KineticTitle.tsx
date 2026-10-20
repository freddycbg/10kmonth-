import { fitText } from "@remotion/layout-utils";
import { useLayoutEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TITLE_FONT, TITLE_GOLD } from "./fonts";

// Título cinético de frase clave (estilo.md §2b): línea pequeña blanca (acento en dorado) que se construye
// palabra a palabra, y debajo una palabra gigante en dorado que entra con desenfoque y escala.
const MARGIN_X = 0.075; // margen izquierdo, fracción del ancho
const BIG_WIDTH = 0.85; // ancho máximo de la palabra gigante
const BIG_MAX_SIZE = 330;
const TOP_SIZE = 62;
const SHADOW = "0 4px 18px rgba(0,0,0,0.35)";

type TopWord = { text: string; accent: boolean; at: number };

const useBigFontSize = (text: string, width: number) => {
  const [size, setSize] = useState<number | null>(null);
  useLayoutEffect(() => {
    // Se mide cuando Anton ya está cargada; si no, el tamaño saldría con la fuente de reserva.
    const handle = delayRender(`Midiendo "${text}"`);
    document.fonts
      .load(`400 100px ${TITLE_FONT}`)
      .then(() => {
        const { fontSize } = fitText({
          text,
          withinWidth: width * BIG_WIDTH,
          fontFamily: TITLE_FONT,
          fontWeight: "400",
        });
        setSize(Math.min(fontSize, BIG_MAX_SIZE));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [text, width]);
  return size;
};

export const KineticTitle: React.FC<{
  top: TopWord[];
  big: string;
  bigAt: number;
  y: number;
}> = ({ top, big, bigAt, y }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const bigSize = useBigFontSize(big, width);

  // Salida rápida en los últimos 4 fotogramas.
  const out = interpolate(
    frame,
    [durationInFrames - 4, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const bigLocal = frame - bigAt;
  const bigIn = interpolate(bigLocal, [0, 6], [0, 1], {
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
        {bigSize !== null && bigLocal >= 0 ? (
          <div
            style={{
              fontSize: bigSize,
              lineHeight: 0.98,
              color: TITLE_GOLD,
              whiteSpace: "nowrap",
              transformOrigin: "left center",
              opacity: bigIn,
              filter: `blur(${(1 - bigIn) * 18}px)`,
              transform: `scale(${1.25 - 0.25 * bigIn}) translateX(${(1 - bigIn) * -30}px)`,
            }}
          >
            {big}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
