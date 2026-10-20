# estilo.md: vídeo de reclutamiento (Carta Business Group · Virginia)

Fuentes analizadas (las dos son de Carta Business Group, verticales 720×1280, 30 fps, H.264 + AAC):

- **R1 · "El dolor del fracaso o el dolor del éxito"**: 41.7 s, motivacional, un solo orador en exteriores.
- **R2 · "AWARDS 2025"**: 76.6 s, ceremonia de premios en la oficina de Costa Mesa, varios testimonios.

Método: fotogramas a 2 fps (83 + 153) y en cada cambio de plano (ffmpeg `scene > 0.25`), transiciones
revisadas fotograma a fotograma, transcripción con Whisper large-v3-turbo con tiempos por palabra,
medición de píxeles en fotogramas a resolución completa, y análisis de audio (EBU R128 y RMS en las pausas).

Lo marcado como **[SUPOSICIÓN]** no se puede medir con certeza desde el archivo.

---

## 1. Ritmo y estructura

| Métrica | R1 (motivacional) | R2 (premios) |
|---|---|---|
| Planos reales | ~10 (14 detecciones con los destellos) | ~60 (79 detecciones) |
| Duración media de plano | **~3.0 s** (mediana 2.5 s, máx. 11 s) | **~1.0 s** (mediana 0.9 s, máx. 4.4 s) |
| Ritmo de habla | 3.25 palabras/s | 2.70 palabras/s |
| Pausas > 0.3 s | 2 en 39 s (máx. 0.54 s) | 4 (son tramos de solo música, montaje) |
| Gancho | Frase fuerte desde el fotograma 0, sin intro | "¡Hey familia!" desde el fotograma 0 |
| Cierre | Destello blanco, fondo desenfocado y logo "B" blanco (≈ 1.7 s) | Logo animado de Carta Business Group sobre blanco (3 s) |

**Estructura de R1:** gancho (0–3 s) → problema (3–23 s) → giro, "pero te voy a comentar algo" (23 s) →
dilema (25–32 s) → llamada a la acción, "te invito a que hagas lo incómodo" (32–40 s) → logo.

**Estructura de R2:** bienvenida del líder → montaje de premios y aplausos → testimonios cortos de cada
premiado (3–10 s cada uno) → montaje final de equipo → logo.

- Silencios recortados al máximo en las partes habladas.
- R2 intercala **tramos de solo música de 3 a 4 s** (13–16.5 s "Let's go", 29–33 s, 46.5–50 s) con montaje
  rápido de b-roll de equipo, para dar energía.
- R1 usa **punch-ins** (saltos de encuadre al 120–130 % en el mismo plano) para tapar cortes: 9.0 s, 10.6 s.

## 2. Subtítulos y textos en pantalla

Hay **tres estilos de texto**, todos en el mismo **amarillo dorado de la marca**:

### 2a. Subtítulos palabra a palabra (R2, en todo el vídeo)

| Propiedad | Valor |
|---|---|
| Fuente | Sans geométrica extra-negrita en MAYÚSCULAS, tipo **Poppins ExtraBold / Montserrat ExtraBold** [SUPOSICIÓN en la familia exacta] |
| Color | **#F1C440** (amarillo dorado; medido entre #E4BC40 y #F1C440) |
| Contorno o caja | Ninguno; sombra muy suave [SUPOSICIÓN] |
| Tamaño | Mayúscula de **40–56 px en un cuadro de 1280 px** (3.1–4.4 % del alto) |
| Posición | Centrado horizontal, centro vertical al **73–78 % del alto** (tercio inferior) |
| Palabras por bloque | Se **acumulan palabra a palabra** hasta 2–4 palabras (máx. ~22 caracteres) y el bloque se limpia |
| Animación | Cada palabra **entra en 3–4 fotogramas**: aparece algo más pequeña y más abajo y sube a su sitio (escala ~70 → 100 %) |
| Palabra destacada | A veces la palabra clave cae en **una segunda línea desplazada** ("EN / MÉXICO", "AL / ASADOR") |

### 2b. Títulos cinéticos de frase clave (R1)

| Propiedad | Valor |
|---|---|
| Fuente | Condensada ultra-negrita en MAYÚSCULAS, tipo **Anton** [SUPOSICIÓN en la familia exacta] |
| Línea 1 (contexto) | Blanco **#FFFFFF** con la palabra de acento en amarillo **#F7C14A**; mayúscula ≈ **30 px / 1280 (2.3 %)** |
| Línea 2 (palabra clave) | **Una palabra gigante** en amarillo #F7C14A, ≈ **125 px / 1280 (9.8 % del alto)** y **86 % del ancho** |
| Alineación | Bloque alineado a la izquierda, margen izquierdo ≈ **6–11 % del ancho** |
| Posición vertical | Variable según el plano: 15–30 % o 45–60 % del alto, sin tapar la cara |
| Animación | La línea 1 se construye palabra a palabra; la palabra gigante entra con **desenfoque de movimiento y escala en ~5 fotogramas** |
| Frecuencia | Solo en frases clave (≈ 1 cada 3–5 s): "INCÓMODO", "PAGAR", "CAPACIDAD", "FALLIDO", "PRECIO", "LO INCÓMODO" |

### 2c. Subtítulo pequeño (R1, frases que no llevan título)

| Propiedad | Valor |
|---|---|
| Fuente | **Serif negrita** en minúsculas, tipo **DM Serif Display / Playfair Display** [SUPOSICIÓN en la familia exacta] |
| Color | Amarillo **#F2C14E** (medido #E5CE88 por mezcla con el fondo) |
| Tamaño | ≈ **27 px de alto con descendentes / 1280 (2.1 %)** |
| Posición | Centrado, **75–77 % del alto** (en primeros planos baja al 84–90 %) |
| Bloque | Frase de 3–5 palabras, 1 línea, sin animación |

## 3. B-roll y montaje

- **R2: 60–70 % del tiempo es b-roll** o planos de otras personas: público aplaudiendo, entrega de trofeos,
  abrazos, el equipo caminando junto a camionetas negras, fotos de grupo, el logo en la pared.
- **R1: 0 % de b-roll**: es todo el orador en 5 localizaciones distintas (muro, terraza, gradas,
  pista de pickleball), cambiando de localización cada 3–10 s.
- El logo **Carta Business Group** aparece en casi todos los planos de interior (pared con logo, photocall).
- Encuadres: primer plano medio (de la cintura arriba), plano entero caminando hacia cámara, contrapicado
  desde abajo y algún gran angular.

## 4. Transiciones

| Tipo | Dónde | Duración |
|---|---|---|
| Corte seco | La mayoría (≈ 85 %) | — |
| **Destello blanco / flare** | R1 3.0 s; R2 16.5 s | ~6 fotogramas (0.2 s): sube a blanco en 2, 1 fotograma blanco, baja en 3 |
| **Fuga de luz cálida** (naranja/rosa) superpuesta | R2 11.5 s, 16.4 s, 29.0 s, 33.5 s | 5–10 fotogramas |
| **Corte con desenfoque de movimiento** (whip) | R2 22.2 s | 1–2 fotogramas borrosos |
| Cierre | R1: destello → fondo desenfocado + logo blanco. R2: logo con letras en relieve que se resuelven en el logo a color | 1.7–3 s |

## 5. Zooms y movimiento

- Cámara en mano o gimbal **siempre en movimiento suave** (paseos hacia cámara, órbitas cortas).
- **Punch-ins digitales** del 100 al 120–130 % entre frases (R1).
- Algún plano con **cámara lenta** en el b-roll de equipo caminando (R2, 13–15 s) [SUPOSICIÓN: grabado a 60 fps].

## 6. Color

- **R1:** exterior soleado, look cinematográfico cálido: naranjas y amarillos saturados, cielo azul profundo,
  contraste alto (teal & orange).
- **R2:** interior de oficina luminoso y casi neutro, blancos limpios, dorados y negros de la decoración.
- Paleta de marca coherente: **amarillo dorado #F1C440 / #F7C14A**, negro, blanco, y el azul y verde del logo.

## 7. Sonido

| Métrica | R1 | R2 |
|---|---|---|
| Volumen integrado | **−14.3 LUFS** | **−14.4 LUFS** |
| Voz (RMS mediano) | −16.9 dB | −22.1 dB |
| Música en pausas | −22.7 dB (≈ 6 dB bajo la voz) | −19.0 dB (**música casi al nivel de la voz**) |
| Inicio | Voz desde 0.0 s, con música | Voz desde 0.0 s, con música fuerte (−10.9 dB los primeros 0.5 s) |

- R1: música motivacional tipo cinemática por debajo de la voz [SUPOSICIÓN en el género].
- R2: música enérgica y festiva; en los tramos sin voz sube a primer plano.
- Efectos: **whoosh / impacto** en los destellos y en la entrada de títulos grandes [SUPOSICIÓN: no se aíslan
  con claridad bajo la música].

---

## 8. Adaptación para el vídeo de reclutamiento (Virginia), valores del borrador 1

> Combina la autoridad y los títulos de R1 con la energía y los subtítulos de R2. Código en
> `scripts/build_edit.py`, `edit.config.json` y `src/Edit/`.

- **Formato:** 1080×1920, 30 fps. Duración: 20.8 s de orador + 2.5 s de tarjeta final = 23.3 s.
- **Silencios:** se cortan los ≥ 0.3 s por debajo de **−36 dB** (el ruido de fondo exterior está en −43 dB);
  0.08 s de margen tras la voz y 0.10 s antes. Quedan 6 tramos (24.2 s → 20.8 s).
- **Subtítulos (2a):** Poppins ExtraBold, mayúsculas, **#F1C440**, **66 px**, centro al **74 %** del alto,
  bloques de **≤ 3 palabras / 22 caracteres**. Cortan en puntuación y antes de "y/pero/porque", y nunca terminan
  en palabra débil (de, la, en, este…). Cada palabra entra con un muelle de 6 fotogramas (escala 70→100 %,
  sube 22 px). Sombra reforzada `0 3px 14px rgba(0,0,0,.65)` para leerse sobre fondos claros.
- **Títulos cinéticos (2b):** Anton. Línea 1 de **62 px** en blanco con la palabra de acento en **#F7C14A**,
  construida palabra a palabra al ritmo de la voz; palabra gigante en #F7C14A ajustada al **85 % del ancho**
  (máx. 330 px), entra en 6 fotogramas con desenfoque 18→0 px y escala 125→100 %. Margen izquierdo del 7.5 %,
  arriba (13–14 % del alto) para no tapar la cara. Se retira cuando empieza la siguiente frase.
  Títulos: NOS ENCONTRAMOS EN **VIRGINIA** · CAMBIAR SU **VIDA** · OLVÍDATE DEL **MITO** · COMENTA **10K** ·
  EL DÍA DE **HOY**. Mientras hay título no hay subtítulo.
- **Orador:** se alterna plano ancho y punch-in en cada cambio de toma o de b-roll (mínimo 1.5 s por plano,
  ningún cambio a < 0.5 s de un b-roll). Punch-in: ×1.6 en las tomas de cuerpo entero (Capitolio, césped) y
  ×1.35 en el banco, con la cara al 50 % / 34 %. Acercamiento continuo del 5 % por plano. Colores originales.
- **B-roll:** 11 inserciones, **66 % del tiempo del orador** (como R2), literal a la frase. El vídeo horizontal
  `1020` se recorta a vertical en la posición de cada sujeto (`cx`) y **nunca empieza encima de uno de sus
  cortes** (0.95, 2.08, 3.22, 4.0, 5.08, 6.27, 7.03, 8.12, 13.23, 14.5, 16.28 s); los planos que se quedan cortos
  van a cámara lenta suave (0.55–0.9×, el original es de 60 fps).
- **Transiciones:** destello blanco de 6 fotogramas en "Olvídate del mito", "Comenta 10K" y al entrar la tarjeta
  final. Fuga de luz cálida de 18 fotogramas al entrar "Las oportunidades existen" y "Tu próximo capítulo".
  Hecha con degradados CSS, porque el efecto WebGL de `@remotion/effects` no se dibuja en el render sin GPU.
- **Música:** "Música de fondo alegre #32". Se salta su intro suave (0–32 s) y arranca en el crescendo
  (32.5 s), de modo que **el golpe de 33.5 s cae en la palabra "Virginia"** (1.0 s), donde entra el primer
  título gigante. Normalizada a −9.3 LUFS, a ×0.2 bajo la voz (≈ 7 dB por debajo) y ×0.55 en la tarjeta final.
  Máster a −14 LUFS.
- **Cierre:** tarjeta blanca de 2.5 s con el logo de Carta Business Group y "VIRGINIA" debajo. El logo está
  extraído del final de R2 (sustituir por el PNG original cuando esté disponible).

---

## Preferencias aprendidas (correcciones aprobadas)

- **Música:** no ponerla desde el comienzo, porque la pista empieza muy bajita; entra más adelante
  (indicación del cliente antes del primer borrador).
- **Tono:** vídeo de reclutamiento para la agencia en Virginia; tiene que verse **muy profesional**.
