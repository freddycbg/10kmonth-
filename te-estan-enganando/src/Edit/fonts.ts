import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Títulos cinéticos (estilo.md §2b) y subtítulos palabra a palabra (§2a).
export const TITLE_FONT = "Anton";
export const CAPTION_FONT = "Poppins";

loadFont({
  family: TITLE_FONT,
  url: staticFile("fonts/anton-latin-400-normal.woff2"),
  weight: "400",
});
loadFont({
  family: CAPTION_FONT,
  url: staticFile("fonts/poppins-latin-800-normal.woff2"),
  weight: "800",
});

// Amarillo dorado de la marca (medido en las referencias).
export const GOLD = "#F1C440";
export const TITLE_GOLD = "#F7C14A";
