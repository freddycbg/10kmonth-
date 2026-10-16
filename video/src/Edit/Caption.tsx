import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";

// Subtítulos como la referencia (ver estilo.md §2): Open Sans SemiBold Italic, blanco,
// sombra difusa, sin caja, 1 línea centrada, sin animación ni palabra destacada.
const FAMILY = "Open Sans";

loadFont({
  family: FAMILY,
  url: staticFile("fonts/open-sans-latin-600-italic.woff2"),
  weight: "600",
  style: "italic",
});

// Base del texto a 440 px del borde inferior: fuera de la zona que tapa la interfaz de
// TikTok/Reels (estilo.md §9).
const BOTTOM = 440;
const FONT_SIZE = 62;

export const Caption: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: BOTTOM,
      }}
    >
      <div
        style={{
          fontFamily: FAMILY,
          fontWeight: 600,
          fontStyle: "italic",
          fontSize: FONT_SIZE,
          lineHeight: 1.2,
          color: "#FFFFFF",
          textShadow: "0 2px 6px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
