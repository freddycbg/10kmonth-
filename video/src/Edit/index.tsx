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
import edit from "./edit.json";

// La línea de tiempo se genera con scripts/build_edit.py (edit.json). Ver estilo.md.

// Música unos 11 dB por debajo de la voz; sube al terminar de hablar (estilo.md, preferencias).
const MUSIC_UNDER_VOICE = 0.13;
const MUSIC_END = 0.28;

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
          <Video
            src={staticFile(b.src)}
            trimBefore={b.trimBefore}
            muted
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
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
            [0, 10, edit.lastWordFrame, edit.lastWordFrame + 15],
            [0.05, MUSIC_UNDER_VOICE, MUSIC_UNDER_VOICE, MUSIC_END],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    </AbsoluteFill>
  );
};
