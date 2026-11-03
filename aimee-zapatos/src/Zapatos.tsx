import { loadFont } from "@remotion/fonts";
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

// Colaboración de Aimee (zapatos Wide Toe Box para los niños). Mismos textos, fuentes, tiempos y música que el vídeo
// de referencia; las dos imágenes (pies en zapatos y siluetas de pies) van sin fondo.

loadFont({ family: "Gluten", url: staticFile("fonts/gluten-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: "Libre Caslon Text", url: staticFile("fonts/libre-caslon-text-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Young Serif", url: staticFile("fonts/young-serif-latin-400-normal.woff2"), weight: "400" });

const FPS = 30;
const s = (t: number) => Math.round(t * FPS);

// Tiempos medidos en la referencia (fotograma a fotograma contra el vídeo sin editar).
const TITLE = { from: 0, to: 4.87 };
const IMG_ZAPATOS = { from: 2.2, to: 3.23 };
const IMG_SILUETAS = { from: 4.9, to: 5.97 };
const LIST = { from: 6.13, typedBy: 7.3, to: 8.57 };

const TITLE_COLOR = "#F1D7A9";
const SUB_COLOR = "#E4506C";
const LIST_COLOR = "#ECE9A3";
const SOFT_SHADOW = "0 2px 10px rgba(0,0,0,0.18)";

const Title: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center" }}>
    <div
      style={{
        position: "absolute",
        top: 266,
        fontFamily: "Gluten",
        fontWeight: 900,
        fontSize: 56,
        color: TITLE_COLOR,
        WebkitTextStroke: `5px ${TITLE_COLOR}`, // Gluten Black es algo más fina que la letra de la referencia
        textShadow: SOFT_SHADOW,
        whiteSpace: "nowrap",
      }}
    >
      POV: Descubres el beneficio
    </div>
    <div
      style={{
        position: "absolute",
        top: 333,
        fontFamily: "Libre Caslon Text",
        fontSize: 50,
        color: SUB_COLOR,
        textShadow: SOFT_SHADOW,
        whiteSpace: "nowrap",
      }}
    >
      de los Wide Toe Box
    </div>
  </AbsoluteFill>
);

// Imagen recortada que entra con un pequeño rebote y sale con un fundido corto.
const Sticker: React.FC<{ src: string; left: number; top: number; width: number; dur: number }> = ({
  src,
  left,
  top,
  width,
  dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(frame, [dur * fps - 4, dur * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left,
        top,
        width,
        transform: `scale(${0.7 + 0.3 * pop})`,
        opacity: Math.min(1, pop * 2) * out,
        filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))",
      }}
    />
  );
};

// Lista en arco (como en la referencia) que se escribe letra a letra.
const LINES = [
  { text: "1. Más espacio para los dedos", y: 272, sag: 40, size: 68 },
  { text: "2. Movimiento natural", y: 352, sag: 12, size: 68 },
  { text: "3. Mayor comodidad", y: 428, sag: 6, size: 68 },
];

const List: React.FC = () => {
  const frame = useCurrentFrame();
  const total = LINES.reduce((a, l) => a + l.text.length, 0);
  const shown = Math.floor(
    interpolate(frame, [0, s(LIST.typedBy - LIST.from)], [0, total], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  let left = shown;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {LINES.map((l, i) => {
          // Arco que sube en el centro: extremos `sag` px más abajo que el centro, sobre 1000 px de ancho.
          const half = 520;
          const r = (half * half + l.sag * l.sag) / (2 * l.sag);
          return <path key={i} id={`arc${i}`} d={`M ${540 - half} ${l.y + l.sag} A ${r} ${r} 0 0 1 ${540 + half} ${l.y + l.sag}`} />;
        })}
        <filter id="sombra" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>
      {LINES.map((l, i) => {
        const n = Math.max(0, Math.min(l.text.length, left));
        left -= l.text.length;
        if (n === 0) return null;
        return (
          <text
            key={i}
            fontFamily="Young Serif"
            fontSize={l.size}
            fill={LIST_COLOR}
            stroke={LIST_COLOR}
            strokeWidth={2.2}
            filter="url(#sombra)"
          >
            <textPath href={`#arc${i}`} startOffset="50%" textAnchor="middle">
              <tspan>{l.text.slice(0, n)}</tspan>
              <tspan fillOpacity={0} strokeOpacity={0}>{l.text.slice(n)}</tspan>
            </textPath>
          </text>
        );
      })}
    </svg>
  );
};

export const Zapatos: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile("media/base.mp4")} muted style={{ width: "100%", height: "100%" }} />
      <Sequence from={s(TITLE.from)} durationInFrames={s(TITLE.to - TITLE.from)}>
        <Title />
      </Sequence>
      <Sequence from={s(IMG_ZAPATOS.from)} durationInFrames={s(IMG_ZAPATOS.to - IMG_ZAPATOS.from)}>
        <Sticker src="media/zapatos_dedos.png" left={600} top={1290} width={450} dur={IMG_ZAPATOS.to - IMG_ZAPATOS.from} />
      </Sequence>
      <Sequence from={s(IMG_SILUETAS.from)} durationInFrames={s(IMG_SILUETAS.to - IMG_SILUETAS.from)}>
        <Sticker src="media/siluetas_pies.png" left={290} top={1320} width={560} dur={IMG_SILUETAS.to - IMG_SILUETAS.from} />
      </Sequence>
      <Sequence from={s(LIST.from)} durationInFrames={s(LIST.to - LIST.from)}>
        <List />
      </Sequence>
      <Audio
        src={staticFile("media/musica.mp3")}
        volume={(f) => interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </AbsoluteFill>
  );
};
