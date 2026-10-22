import { Instagram } from "lucide-react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CREAM, SCRIPT_FONT, TITLE_FONT } from "./fonts";

// Cierre de los vídeos de Aimee (como en su referencia 1): último plano desenfocado y oscurecido, el icono de
// Instagram con un pop y su usuario debajo.
export const HandleOutro: React.FC<{ handle: string; kicker?: string }> = ({ handle, kicker = "Sígueme" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blur = interpolate(frame, [0, 10], [0, 22], { extrapolateRight: "clamp" });
  const dim = interpolate(frame, [0, 10], [0, 0.45], { extrapolateRight: "clamp" });
  const icon = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 180, mass: 0.7 } });
  const text = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Img
        src={staticFile("media/last.png")}
        style={{ width: "100%", height: "100%", filter: `blur(${blur}px)`, transform: "scale(1.06)" }}
      />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 60,
            background: "linear-gradient(45deg, #F9CE34, #EE2A7B 50%, #6228D7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${frame < 6 ? 0 : icon}) rotate(${(1 - icon) * -20}deg)`,
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          }}
        >
          <Instagram size={140} color="#FFFFFF" strokeWidth={2} />
        </div>
        <div style={{ textAlign: "center", opacity: frame < 12 ? 0 : text, transform: `translateY(${(1 - text) * 30}px)` }}>
          <div style={{ fontFamily: SCRIPT_FONT, fontStyle: "italic", fontWeight: 500, fontSize: 80, color: "#FFFFFF" }}>
            {kicker}
          </div>
          <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 62, color: CREAM, letterSpacing: "0.03em" }}>
            {handle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
