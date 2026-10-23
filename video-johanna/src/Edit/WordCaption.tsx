import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, CAPTION_COLOR, CAPTION_EM_FONT, CAPTION_FONT } from "./fonts";

// Subtítulo palabra a palabra al estilo de las referencias de Freddy: las palabras normales en Montserrat
// ExtraBold blanca y pequeña; las palabras clave (em, de "emphasis" en edit.config.json) en su propia línea,
// grandes, en Poppins coral (fonts.ts). Cada palabra entra cuando se dice con un pop desde abajo.
const FONT_SIZE = 56;
const EM_SIZE = 108;
const CENTER_Y = 0.66;
const SHADOW =
  "0 3px 14px rgba(0,0,0,0.65), 0 0 4px rgba(0,0,0,0.55), 0 1px 1px rgba(0,0,0,0.4)";

type Word = { text: string; at: number; em?: boolean };

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
    config: { damping: 12, stiffness: 240, mass: 0.6 },
    durationInFrames: word.em ? 8 : 6,
  });
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.12em",
        opacity: interpolate(local, [0, 2], [0, 1], {
          extrapolateRight: "clamp",
        }),
        // La palabra clave entra con más fuerza (desde el 50 %) que las normales.
        transform: `translateY(${(1 - s) * 22}px) scale(${(word.em ? 0.5 : 0.7) + (word.em ? 0.5 : 0.3) * s})`,
      }}
    >
      {word.text}
    </span>
  );
};

export const WordCaption: React.FC<{ words: Word[] }> = ({ words }) => {
  const { height } = useVideoConfig();
  // Líneas: las palabras normales seguidas comparten línea; cada grupo de palabras clave va en la suya.
  const lines: { em: boolean; words: Word[] }[] = [];
  for (const w of words) {
    const em = Boolean(w.em);
    const last = lines[lines.length - 1];
    if (last && last.em === em) {
      last.words.push(w);
    } else {
      lines.push({ em, words: [w] });
    }
  }
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: height * CENTER_Y,
          left: 50,
          right: 50,
          transform: "translateY(-50%)",
          textAlign: "center",
          textTransform: "uppercase",
          textShadow: SHADOW,
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={
              line.em
                ? { fontFamily: CAPTION_EM_FONT, fontWeight: 800, fontSize: EM_SIZE, lineHeight: 1.0, color: ACCENT }
                : { fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: FONT_SIZE, lineHeight: 1.15, color: CAPTION_COLOR }
            }
          >
            {line.words.map((w, k) => (
              <PopWord key={k} word={w} />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
