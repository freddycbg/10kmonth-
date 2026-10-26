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
import { HandleOutro } from "./HandleOutro";
import { Overlay, type OverlayProps } from "./Overlay";
import fg from "./fg.json";
import { Foreground } from "./Foreground";
import { IconPop } from "./IconPop";
import "./fonts";
import { KineticTitle } from "./KineticTitle";
import { Flash, LightLeakOverlay } from "./Transitions";
import { WordCaption } from "./WordCaption";

// La línea de tiempo se genera con scripts/build_edit.py (edit.json). Ver estilo.md.

// Tipos de las listas que pueden venir vacías en edit.json (TypeScript las deduciría como never[]).
type BRoll = { name: string; src: string; from: number; durationInFrames: number; leak: boolean };
type IconItem = { name: string; icon: string; from: number; durationInFrames: number; x: number; y: number; size: number; anim: string; label: string };
const brolls = edit.broll as BRoll[];
const icons = edit.icons as IconItem[];
type Title = { name: string; from: number; durationInFrames: number; top: { text: string; accent: boolean; at: number }[]; big: string; bigAt: number; bigSize: number; bottom: { text: string; at: number }[]; y: number; align: string };
const titles = edit.titles as Title[];

// Música unos 7 dB por debajo de la voz (R1) y a primer plano en la tarjeta final (estilo.md §7).
const MUSIC_UNDER_VOICE = 0.2;
// En el cierre suena la animación del logo (10K Month): la música sube, pero menos que con la tarjeta muda.
const MUSIC_END = edit.endSrc ? 0.35 : 0.55;
const LEAK_FRAMES = 18;

export const Edit: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence name="Orador" durationInFrames={edit.arollFrames} premountFor={fps}>
        <ARoll />
      </Sequence>

      {brolls.map((b, i) => (
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

      {brolls
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

      {titles.map((t, i) => (
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
            align={t.align}
          />
        </Sequence>
      ))}

      {/* El orador recortado tapa los títulos: quedan detrás de su cabeza. Los subtítulos van delante. */}
      {(fg.runs as number[][]).map(([a, b]) => (
        <Sequence
          key={`fg-${a}`}
          name={`Recorte del orador ${a}-${b}`}
          from={a}
          durationInFrames={b - a + 1}
          premountFor={fps}
        >
          <Foreground from={a} to={b} />
        </Sequence>
      ))}

      {(edit.overlays as (OverlayProps & { name: string; from: number; durationInFrames: number })[]).map((ov, i) => (
        <Sequence
          key={`ov-${i}`}
          name={ov.name}
          from={ov.from}
          durationInFrames={ov.durationInFrames}
          layout="none"
        >
          <Overlay {...ov} />
        </Sequence>
      ))}

      {icons.map((ic, i) => (
        <Sequence
          key={`icon-${i}`}
          name={ic.name}
          from={ic.from}
          durationInFrames={ic.durationInFrames}
          layout="none"
        >
          <IconPop icon={ic.icon} x={ic.x} y={ic.y} size={ic.size} anim={ic.anim} label={ic.label} />
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

      {edit.durationInFrames > edit.arollFrames ? (
        <Sequence
          name="Cierre"
          from={edit.arollFrames}
          durationInFrames={edit.durationInFrames - edit.arollFrames}
        >
          {edit.endSrc ? (
            <Video src={staticFile(edit.endSrc)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
          ) : edit.endCard ? (
            <HandleOutro handle={edit.endCard.handle} kicker={edit.endCard.kicker} />
          ) : (
            <EndCard />
          )}
        </Sequence>
      ) : null}

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

      {/* Efectos de sonido (sfx/ del repositorio): whoosh, impactos, pops... colocados por build_edit.py. */}
      {edit.sfx.map((x, i) => (
        <Sequence
          key={`sfx-${i}`}
          name={`Efecto ${x.sound}`}
          from={x.from}
          durationInFrames={x.durationInFrames}
          layout="none"
        >
          <Audio src={staticFile(`sfx/${x.sound}.wav`)} volume={x.vol} trimBefore={x.trim} />
        </Sequence>
      ))}

      {edit.music ? (
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
      ) : null}
    </AbsoluteFill>
  );
};
