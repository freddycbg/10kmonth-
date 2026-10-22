import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Destello blanco (estilo.md §4): sube a blanco en 2 fotogramas, 1 blanco, baja en 3.
export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 3, 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

// Fuga de luz cálida (naranja/rosa/amarillo) superpuesta al entrar un b-roll (estilo.md §4).
// Hecha con degradados CSS: el efecto WebGL de @remotion/effects no se dibuja en el render sin GPU.
export const LightLeakOverlay: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames - 1);
  const opacity = interpolate(t, [0, 0.45, 1], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const side = seed % 2 === 0 ? 1 : -1;
  const x = 50 + side * interpolate(t, [0, 1], [-35, 35]);
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: "screen",
        background: [
          `radial-gradient(ellipse 70% 55% at ${x}% 30%, rgba(255,214,107,0.95), rgba(255,214,107,0) 70%)`,
          `radial-gradient(ellipse 60% 70% at ${100 - x}% 65%, rgba(255,120,60,0.85), rgba(255,120,60,0) 70%)`,
          `radial-gradient(ellipse 50% 45% at ${x + side * 15}% 85%, rgba(255,80,130,0.6), rgba(255,80,130,0) 70%)`,
        ].join(", "),
      }}
    />
  );
};
