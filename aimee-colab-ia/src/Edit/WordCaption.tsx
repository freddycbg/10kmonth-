import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CAPTION_COLOR, CAPTION_FONT } from "./fonts";

// Subtítulos estilo influencer (referencia 1 de Aimee): pequeños, limpios, en mayúsculas normales, blancos con
// sombra suave, centrados en el tercio inferior. Cada palabra aparece cuando se dice con un fundido corto.
const FONT_SIZE = 50;
const CENTER_Y = 0.76;
const SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)";

type Word = { text: string; at: number; em?: boolean };

const Word: React.FC<{ word: Word }> = ({ word }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - word.at;
  if (local < 0) {
    return null;
  }
  const s = spring({ frame: local, fps, config: { damping: 16, stiffness: 220, mass: 0.6 }, durationInFrames: 5 });
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.12em",
        opacity: interpolate(local, [0, 2], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${(1 - s) * 10}px)`,
      }}
    >
      {word.text}
    </span>
  );
};

export const WordCaption: React.FC<{ words: Word[] }> = ({ words }) => {
  const { height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: height * CENTER_Y,
          left: 110,
          right: 110,
          transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: CAPTION_FONT,
          fontWeight: 600,
          fontSize: FONT_SIZE,
          lineHeight: 1.2,
          color: CAPTION_COLOR,
          textShadow: SHADOW,
        }}
      >
        {/* Fondo oscuro translúcido: sobre la pantalla blanca del móvil el texto blanco no se leía. */}
        <span
          style={{
            display: "inline",
            background: "rgba(0, 0, 0, 0.32)",
            borderRadius: 18,
            padding: "4px 14px",
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            lineHeight: 1.45,
          }}
        >
          {words.map((w, i) => (
            <Word key={i} word={w} />
          ))}
        </span>
      </div>
    </AbsoluteFill>
  );
};
