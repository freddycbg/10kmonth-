import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Estilo de Johanna (agente de CBG, colombiana; estilo.md "Johanna"): dinámico como los de Freddy, femenino y
// cálido. Palabras normales en Montserrat ExtraBold blanca; palabras clave y títulos en Poppins ExtraBold color
// coral (a juego con los tonos tierra de su ropa y legible sobre cielo, agua y madera).
export const TITLE_FONT = "Poppins";
export const TITLE_TOP_FONT = "Montserrat";
export const CAPTION_FONT = "Montserrat";
export const CAPTION_EM_FONT = "Poppins";
export const SCRIPT_FONT = "Playfair Display";
export const TITLE_STYLE = { fontStyle: "normal", fontWeight: 800, textTransform: "uppercase" } as const;

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Montserrat", url: staticFile("fonts/montserrat-latin-800-normal.woff2"), weight: "800" });
loadFont({
  family: SCRIPT_FONT,
  url: staticFile("fonts/playfair-display-latin-900-italic.woff2"),
  weight: "900",
  style: "italic",
});

export const CAPTION_COLOR = "#FFFFFF";
export const ACCENT = "#FF7A6E"; // coral
export const TITLE_COLOR = ACCENT;
export const CREAM = "#FFE9D6";
export const SAGE = ACCENT;
export const ACCENT_GLOW = "rgba(255, 122, 110, 0.55)";
