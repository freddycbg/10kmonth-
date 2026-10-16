import { Video } from "@remotion/media";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import edit from "./edit.json";

type Shot = (typeof edit.shots)[number];

// Acercamiento lento continuo por plano (imita el slider de la referencia).
const PUSH = 0.04;
// Posición de la cara en el encuadre cerrado (fracción del cuadro de salida).
const CLOSE_FACE_TARGET = { x: 0.6, y: 0.3 };

const findShot = (frame: number): Shot => {
  for (const shot of edit.shots) {
    if (frame < shot.from + shot.durationInFrames) {
      return shot;
    }
  }
  return edit.shots[edit.shots.length - 1];
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const ARoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = findShot(frame);
  const progress = clamp(
    (frame - shot.from) / Math.max(1, shot.durationInFrames - 1),
    0,
    1,
  );

  const close = shot.framing === "cerrado";
  const scale = (close ? edit.closeScale : 1) * (1 + PUSH * progress);
  const target = close ? CLOSE_FACE_TARGET : edit.face;
  const viewW = width / scale;
  const viewH = height / scale;
  const x0 = clamp(edit.face.x * width - target.x * viewW, 0, width - viewW);
  const y0 = clamp(edit.face.y * height - target.y * viewH, 0, height - viewH);

  return (
    <Video
      name="Entrevista (A-roll)"
      src={staticFile("media/aroll.mp4")}
      style={{
        width,
        height,
        transformOrigin: "0 0",
        transform: `scale(${scale}) translate(${-x0}px, ${-y0}px)`,
      }}
    />
  );
};
