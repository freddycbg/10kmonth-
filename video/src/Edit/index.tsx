import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { ARoll } from "./ARoll";
import { Caption } from "./Caption";
import { ImageBroll } from "./ImageBroll";
import edit from "./edit.json";

// La línea de tiempo se genera con scripts/build_edit.py (edit.json). Ver estilo.md.

// Música unos 11 dB por debajo de la voz; sube al terminar de hablar (estilo.md, preferencias).
const MUSIC_UNDER_VOICE = 0.13;
const MUSIC_END = 0.28;
// La pista crece: sus primeros ~40 s son 5–7 dB más suaves. Se compensa arrancando más alto y bajando
// al nivel aprobado mientras la canción sube sola, para que la música se oiga desde el primer segundo.
const MUSIC_INTRO = 0.22;
const MUSIC_INTRO_HOLD_S = 20;
const MUSIC_INTRO_SETTLE_S = 45;

export const Edit: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <ARoll />

      {edit.broll.map((b, i) => (
        <Sequence
          key={`${b.src}-${i}`}
          name={b.name}
          from={b.from}
          durationInFrames={b.durationInFrames}
          premountFor={fps}
        >
          {b.type === "image" && b.pan ? (
            <ImageBroll
              src={b.src}
              imageWidth={b.imageWidth ?? 0}
              imageHeight={b.imageHeight ?? 0}
              pan={b.pan}
            />
          ) : (
            <Video
              src={staticFile(b.src)}
              trimBefore={b.trimBefore ?? 0}
              muted
              objectFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </Sequence>
      ))}

      {edit.captions.map((c, i) => (
        <Sequence
          key={i}
          name={`Subtítulo: ${c.text}`}
          from={c.from}
          durationInFrames={c.durationInFrames}
          layout="none"
        >
          <Caption text={c.text} />
        </Sequence>
      ))}

      <Audio
        name="Música"
        src={staticFile("media/music.m4a")}
        volume={(f) =>
          interpolate(
            f,
            [
              0,
              10,
              MUSIC_INTRO_HOLD_S * fps,
              MUSIC_INTRO_SETTLE_S * fps,
              edit.lastWordFrame,
              edit.lastWordFrame + 15,
            ],
            [
              0.05,
              MUSIC_INTRO,
              MUSIC_INTRO,
              MUSIC_UNDER_VOICE,
              MUSIC_UNDER_VOICE,
              MUSIC_END,
            ],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    </AbsoluteFill>
  );
};
