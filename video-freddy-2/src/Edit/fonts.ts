import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Estilo de Freddy (estilo.md, "Vídeo de Freddy 2"): masculino y con energía, sin el amarillo de antes.
// Palabras normales en Montserrat ExtraBold blanca; palabras clave grandes en Anton verde neón (como las
// referencias "No contrato / Experiencia"). Los títulos detrás de la cabeza, en Anton.
export const TITLE_FONT = "Anton";
export const TITLE_TOP_FONT = "Montserrat";
export const CAPTION_FONT = "Montserrat";
export const CAPTION_EM_FONT = "Anton";
// Estilo de la palabra gigante de los títulos (Claudia: Playfair italic en minúsculas).
export const TITLE_STYLE = { fontStyle: "normal", fontWeight: 400, textTransform: "uppercase" } as const;

loadFont({
  family: TITLE_FONT,
  url: staticFile("fonts/anton-latin-400-normal.woff2"),
  weight: "400",
});
loadFont({
  family: CAPTION_FONT,
  url: staticFile("fonts/montserrat-latin-800-normal.woff2"),
  weight: "800",
});

export const CAPTION_COLOR = "#FFFFFF";
// Verde neón: crecimiento y dinero, a juego con la flecha del logo de 10K Month.
export const ACCENT = "#35F2A0";
export const TITLE_COLOR = ACCENT;
