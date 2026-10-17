import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  src: string;
  imageWidth: number;
  imageHeight: number;
  // [x, y, zoom]: punto de la foto (0–1) que queda en el centro del cuadro, y zoom sobre "cover".
  pan: { from: number[]; to: number[] };
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// Foto horizontal en un cuadro vertical: se recorta a "cover" y se pasea despacio por ella.
export const ImageBroll: React.FC<Props> = ({
  src,
  imageWidth,
  imageHeight,
  pan,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const [x, y, zoom] = pan.from.map((v, i) => v + (pan.to[i] - v) * t);

  const scale = Math.max(width / imageWidth, height / imageHeight) * zoom;
  const w = imageWidth * scale;
  const h = imageHeight * scale;
  const left = clamp(width / 2 - x * w, width - w, 0);
  const top = clamp(height / 2 - y * h, height - h, 0);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", left, top, width: w, height: h }}
      />
    </AbsoluteFill>
  );
};
