import { Video } from "@remotion/media";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import edit from "./edit.json";
import track from "./face.json";

type Shot = (typeof edit.shots)[number];

// Movimiento suave continuo por plano (estilo.md §5).
const PUSH = 0.05;
// Posición de la cara en el punch-in (fracción del cuadro de salida).
const CLOSE_FACE_TARGET = { x: 0.5, y: 0.34 };
// Punch-in animado: el zoom entra en PUNCH_FRAMES desde el 80 % de su escala (más dinámico que un corte seco).
const PUNCH_FRAMES = 5;

// Zoom fuerte del gancho: los fotogramas clave vienen de build_edit.py (edit.intro); el último golpe cae en la
// palabra del golpe de música, con rebote y sacudida corta. La cabeza queda delante del título gigante.
const INTRO_FACE_TARGET = { x: 0.5, y: 0.42 };
const INTRO_SCALE = edit.intro.scales[edit.intro.scales.length - 1];

// Golpes: fotogramas de edit.impacts (build_edit.py).
const impacts = (edit as { impacts?: number[] }).impacts ?? [];
const IMPACT_FRAMES = 9;

const findShot = (frame: number): Shot => {
  for (const shot of edit.shots) {
    if (frame < shot.from + shot.durationInFrames) {
      return shot;
    }
  }
  return edit.shots[edit.shots.length - 1];
};

// Cara seguida fotograma a fotograma (scripts/facetrack.py); si no hay seguimiento, la de la toma.
const faceAt = (frame: number, shot: Shot) =>
  frame < track.x.length ? { x: track.x[frame], y: track.y[frame] } : shot.face;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const introScale = (frame: number) =>
  interpolate(
    frame,
    edit.intro.frames,
    edit.intro.scales,
    {
      easing: Easing.bezier(0.55, 0, 0.45, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

// Transformación del A-roll en el fotograma actual. La comparten el vídeo base y el recorte del orador
// (Foreground.tsx), que tiene que coincidir píxel a píxel. scripts/mattes.py lleva una copia en Python.
// offset: inicio de la Sequence que lo usa, para trabajar siempre con el fotograma global.
export const useArollStyle = (offset = 0): React.CSSProperties => {
  const frame = useCurrentFrame() + offset;
  const { width, height } = useVideoConfig();
  if (edit.static) {
    return { width, height };
  }
  const shot = findShot(frame);
  const face = faceAt(frame, shot);
  const local = frame - shot.from;
  const progress = clamp(local / Math.max(1, shot.durationInFrames - 1), 0, 1);
  const drop = edit.introDropFrame;
  const isIntro = shot.from === 0;

  let scale: number;
  let target: { x: number; y: number };
  let blur = 0;
  let shakeX = 0;
  let shakeY = 0;

  if (isIntro) {
    scale = introScale(frame);
    // Desenfoque de movimiento proporcional a la velocidad del zoom.
    const speed = Math.abs(introScale(frame + 1) - scale);
    blur = clamp(speed * 40, 0, 7);
    target = {
      x: interpolate(scale, [1, INTRO_SCALE], [face.x, INTRO_FACE_TARGET.x], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      y: interpolate(scale, [1, INTRO_SCALE], [face.y, INTRO_FACE_TARGET.y], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    };
    // Sacudida corta (3 fotogramas) en el golpe.
    const k = frame - drop;
    if (k >= 0 && k < 4) {
      const amp = (4 - k) * 5;
      shakeX = (k % 2 === 0 ? 1 : -1) * amp;
      shakeY = (k % 2 === 0 ? -1 : 1) * amp * 0.6;
    }
  } else {
    const close = shot.framing === "cerrado";
    const punch = close
      ? interpolate(local, [0, PUNCH_FRAMES], [0.8, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
    if (close && local < PUNCH_FRAMES) {
      blur = (1 - local / PUNCH_FRAMES) * 4;
    }
    scale = Math.max(1, (close ? shot.closeScale * punch : 1) * (1 + PUSH * progress));
    target = close ? CLOSE_FACE_TARGET : face;
  }

  // Golpes (Claudia 2: "me golpea, me atropella"): acercón y sacudida que se apaga en IMPACT_FRAMES.
  for (const f of impacts) {
    const k = frame - f;
    if (k >= 0 && k < IMPACT_FRAMES) {
      const decay = 1 - k / IMPACT_FRAMES;
      scale *= 1 + 0.1 * decay;
      shakeX += (k % 2 === 0 ? 1 : -1) * 34 * decay;
      shakeY += (k % 2 === 0 ? -1 : 1) * 20 * decay;
      blur = Math.max(blur, 3 * decay);
    }
  }

  const viewW = width / scale;
  const viewH = height / scale;
  const x0 = clamp(face.x * width - target.x * viewW, 0, width - viewW);
  const y0 = clamp(face.y * height - target.y * viewH, 0, height - viewH);

  return {
    width,
    height,
    transformOrigin: "0 0",
    transform: `translate(${shakeX}px, ${shakeY}px) scale(${scale}) translate(${-x0}px, ${-y0}px)`,
    filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
  };
};

export const ARoll: React.FC = () => {
  const style = useArollStyle();
  return (
    <Video name="Orador (A-roll)" src={staticFile("media/aroll.mp4")} style={style} />
  );
};
