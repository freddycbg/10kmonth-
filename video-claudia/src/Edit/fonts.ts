import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Estilo de Claudia (estilo.md, "Vídeo de Claudia"): elegante y femenino. La palabra gigante de los títulos va en
// Playfair Display Black Italic en minúsculas; la línea pequeña de los títulos y los subtítulos, en Montserrat
// ExtraBold en mayúsculas.
export const TITLE_FONT = "Playfair Display";
export const TITLE_TOP_FONT = "Montserrat";
export const CAPTION_FONT = "Montserrat";

loadFont({
  family: TITLE_FONT,
  url: staticFile("fonts/playfair-display-latin-900-italic.woff2"),
  weight: "900",
  style: "italic",
});
loadFont({
  family: CAPTION_FONT,
  url: staticFile("fonts/montserrat-latin-800-normal.woff2"),
  weight: "800",
});

// Rosa a juego con el labial rojo de Claudia, legible sobre cielo, edificios y b-roll con la sombra de siempre.
export const CAPTION_COLOR = "#FF9DBA";
export const TITLE_COLOR = "#FF8FB1";
