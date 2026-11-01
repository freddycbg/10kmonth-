import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CAPTION_FONT } from "./fonts";

// Tarjeta final (estilo.md §1, como en R2): logo de Carta Business Group sobre blanco.
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [2, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sub = interpolate(frame, [12, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile("media/logo_carta.png")}
        style={{
          width: 820,
          opacity: k,
          filter: `blur(${(1 - k) * 10}px)`,
          transform: `scale(${0.92 + 0.08 * k})`,
        }}
      />
      <div
        style={{
          marginTop: 56,
          fontFamily: CAPTION_FONT,
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: "0.32em",
          color: "#1B5E9B",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 16}px)`,
        }}
      >
        VIRGINIA
      </div>
    </AbsoluteFill>
  );
};
