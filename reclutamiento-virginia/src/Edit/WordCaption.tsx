import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CAPTION_FONT, GOLD } from "./fonts";

// Subtítulo palabra a palabra (estilo.md §2a): Poppins ExtraBold en mayúsculas, dorado, centrado al 74 %
// del alto. Cada palabra entra cuando se dice: aparece más pequeña y algo más abajo y sube en ~4 fotogramas.
const FONT_SIZE = 66;
const CENTER_Y = 0.74;

type Word = { text: string; at: number };

const PopWord: React.FC<{ word: Word }> = ({ word }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - word.at;
  if (local < 0) {
    return null;
  }
  const s = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 260, mass: 0.6 },
    durationInFrames: 6,
  });
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.14em",
        opacity: interpolate(local, [0, 2], [0, 1], {
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${(1 - s) * 22}px) scale(${0.7 + 0.3 * s})`,
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
          left: 60,
          right: 60,
          transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: CAPTION_FONT,
          fontWeight: 800,
          fontSize: FONT_SIZE,
          lineHeight: 1.15,
          color: GOLD,
          // Sombra reforzada para que el dorado se lea también sobre fondos claros o amarillos.
          textShadow:
            "0 3px 14px rgba(0,0,0,0.65), 0 0 4px rgba(0,0,0,0.55), 0 1px 1px rgba(0,0,0,0.4)",
        }}
      >
        {words.map((w, i) => (
          <PopWord key={i} word={w} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
