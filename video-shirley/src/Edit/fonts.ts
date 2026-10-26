import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Shirley (estilo.md, "Vídeo de Shirley"): el estilo de las agentes (Johanna, Claudia 2): subtítulos blancos con la
// palabra clave grande en color, iconos y títulos, con su identidad: rojo rosado a juego con su labial y palabra
// clave / palabra gigante en Playfair Display Black Italic en minúsculas (elegante, femenino).
export const TITLE_FONT = "Playfair Display";
export const TITLE_TOP_FONT = "Montserrat";
export const CAPTION_FONT = "Montserrat";
export const CAPTION_EM_FONT = "Playfair Display";
export const SCRIPT_FONT = "Playfair Display";
export const TITLE_STYLE = { fontStyle: "italic", fontWeight: 900, textTransform: "lowercase" } as const;
export const CAPTION_EM_STYLE = { fontStyle: "italic", fontWeight: 900, textTransform: "lowercase" } as const;

loadFont({
  family: TITLE_FONT,
  url: staticFile("fonts/playfair-display-latin-900-italic.woff2"),
  weight: "900",
  style: "italic",
});
loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });

export const CAPTION_COLOR = "#FFFFFF";
export const ACCENT = "#FF4F6D"; // rojo rosado de Shirley (su labial)
export const ACCENT_GLOW = "rgba(255, 79, 109, 0.55)";
export const TITLE_COLOR = ACCENT;
export const CREAM = "#FFE1E6";
export const SAGE = ACCENT;
export const GRAPHIC_FONT = "Poppins"; // tarjetas y contadores (Overlay.tsx)
