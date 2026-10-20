import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { ARoll } from "./ARoll";
import edit from "./edit.json";
import { EndCard } from "./EndCard";
import "./fonts";
import { KineticTitle } from "./KineticTitle";
import { Flash, LightLeakOverlay } from "./Transitions";
import { WordCaption } from "./WordCaption";

// La línea de tiempo se genera con scripts/build_edit.py (edit.json). Ver estilo.md.

// Música unos 7 dB por debajo de la voz (R1) y a primer plano en la tarjeta final (estilo.md §7).
const MUSIC_UNDER_VOICE = 0.2;
const MUSIC_END = 0.55;
const LEAK_FRAMES = 18;

export const Edit: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence name="Orador" durationInFrames={edit.arollFrames} premountFor={fps}>
        <ARoll />
      </Sequence>

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
            muted
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </Sequence>
      ))}

      {edit.broll
        .filter((b) => b.leak)
        .map((b, i) => (
          <Sequence
            key={`leak-${i}`}
            name={`Fuga de luz ${i + 1}`}
            from={Math.max(0, b.from - LEAK_FRAMES / 2)}
            durationInFrames={LEAK_FRAMES}
            layout="none"
          >
            <LightLeakOverlay seed={i * 3 + 1} />
          </Sequence>
        ))}

      {edit.captions.map((c, i) => (
        <Sequence
          key={`cap-${i}`}
          name={`Subtítulo: ${c.words.map((w) => w.text).join(" ")}`}
          from={c.from}
          durationInFrames={c.durationInFrames}
          layout="none"
        >
          <WordCaption words={c.words} />
        </Sequence>
      ))}

      {edit.titles.map((t, i) => (
        <Sequence
          key={`title-${i}`}
          name={t.name}
          from={t.from}
          durationInFrames={t.durationInFrames}
          layout="none"
        >
          <KineticTitle
            top={t.top}
            big={t.big}
            bigAt={t.bigAt}
            bigSize={t.bigSize}
            bottom={t.bottom}
            y={t.y}
          />
        </Sequence>
      ))}

      <Sequence
        name="Tarjeta final"
        from={edit.arollFrames}
        durationInFrames={edit.durationInFrames - edit.arollFrames}
      >
        <EndCard />
      </Sequence>

      {edit.flashes.map((f, i) => (
        <Sequence
          key={`flash-${i}`}
          name={`Destello ${i + 1}`}
          from={Math.max(0, f - 3)}
          durationInFrames={7}
          layout="none"
        >
          <Flash />
        </Sequence>
      ))}

      <Audio
        name="Música"
        src={staticFile("media/music.m4a")}
        volume={(f) =>
          interpolate(
            f,
            [edit.lastWordFrame, edit.lastWordFrame + 12],
            [MUSIC_UNDER_VOICE, MUSIC_END],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    </AbsoluteFill>
  );
};
