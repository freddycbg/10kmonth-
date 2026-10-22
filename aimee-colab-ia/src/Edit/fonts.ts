import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Estilo de Aimee (colaboraciones de redes, estilo influencer; estilo.md "Aimee"): subtítulos pequeños y
// limpios en Poppins SemiBold con mayúsculas normales, y frases clave que combinan Montserrat ExtraBold en
// mayúsculas color crema con Playfair Display en cursiva (como "DIARIO visual" en la referencia 2).
export const TITLE_FONT = "Montserrat";
export const TITLE_TOP_FONT = "Montserrat";
export const CAPTION_FONT = "Poppins";
export const CAPTION_EM_FONT = "Montserrat";
export const SCRIPT_FONT = "Playfair Display";
export const TITLE_STYLE = { fontStyle: "normal", fontWeight: 800, textTransform: "uppercase" } as const;

loadFont({
  family: CAPTION_FONT,
  url: staticFile("fonts/poppins-latin-600-normal.woff2"),
  weight: "600",
});
loadFont({
  family: TITLE_FONT,
  url: staticFile("fonts/montserrat-latin-800-normal.woff2"),
  weight: "800",
});
loadFont({
  family: SCRIPT_FONT,
  url: staticFile("fonts/playfair-display-latin-500-italic.woff2"),
  weight: "500",
  style: "italic",
});

export const CAPTION_COLOR = "#FFFFFF";
// Crema de la referencia 2 y verde salvia de la app Anna (su logo y sus burbujas de chat).
export const CREAM = "#FFF1B8";
export const SAGE = "#8DBAA3";
export const ACCENT = CREAM;
export const TITLE_COLOR = CREAM;
