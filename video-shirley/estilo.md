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

## 8. Adaptación para el vídeo de reclutamiento (Virginia), valores del borrador 1 (ver cambios en Preferencias)

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
- **Ritmo dinámico:** cambio de encuadre como mínimo cada 1.0 s y ningún tramo visible del orador de más de
  **2.0 s**; si es más largo, se parte en el inicio de una palabra con un punch-in. Los punch-ins **entran
  animados** (zoom del 80 al 100 % de su escala en 5 fotogramas, con desenfoque de 4 px), no en corte seco.
  Resultado del borrador 2: todos los tramos visibles del orador duran entre 1.1 y 1.6 s.
- **Arranque sin saturar de b-roll:** en los primeros ~7 s, como máximo 2 b-roll (borrador 1 tenía 4 seguidos y
  se veía "muy cargado"). Que se vea al orador en el gancho y en la presentación. Cobertura total: 54 %.
- **Zoom fuerte en el gancho** ("Nos encontramos en Virginia"): acercamiento lento del 100 al 114 %, aceleración
  brusca hasta ×2.05 justo en la palabra del golpe de música, con desenfoque de movimiento según la velocidad
  (máx. 7 px), rebote a ×1.9 y sacudida de 3 fotogramas (±20 px). La cara termina centrada en horizontal y al
  **42 % del alto** (borrador 4; antes 50 %), para que la cabeza tape la parte baja de "VIRGINIA".
- **Palabra gigante estable, sin parpadeo:** su tamaño se calcula en `build_edit.py` con las métricas reales de
  Anton (fontTools), nunca midiendo en el render: con 4 pestañas en paralelo algunas medían antes de cargar la
  fuente y "VIRGINIA"/"MITO" cambiaban de tamaño fotograma a fotograma (borrador 2). Entrada suave de 8
  fotogramas (desenfoque 16→0 px, escala 118→100 %, curva ease-out) y **mínimo 0.9 s en pantalla**.
- **Subtítulos y títulos a la vez:** las palabras del título no llevan subtítulo, pero las que se dicen después
  sí aparecen abajo aunque la palabra gigante siga arriba. Ninguna palabra se queda sin mostrar (70/70) y ningún
  bloque dura menos de 8 fotogramas.
- **Llamada a la acción:** título COMENTA / **10K**; "AQUÍ ABAJO" va en los subtítulos dorados de abajo
  (borrador 4). Como tercera línea del título quedaba justo sobre la cara y la tapaba el recorte del orador.
- **B-roll del hombre agobiado** (manos en la cabeza): en "o hablar un inglés fluido", después del aula
  universitaria, no en "Olvídate del mito". En "Olvídate del mito" se ve al orador con el título MITO.
- **Títulos cinéticos detrás del orador** (borrador 4): la palabra gigante (VIRGINIA, VIDA, MITO, 10K, HOY) va
  por encima del vídeo base pero **detrás de la cabeza**; los subtítulos de abajo siguen delante. Orden de capas:
  A-roll → b-roll → título → orador recortado → subtítulos → destellos.
  - **Recorte:** `scripts/mattes.py` (tras `build_edit.py`) segmenta al orador con **BiRefNet-portrait** (rembg)
    sobre un recorte de su silueta, solo en los fotogramas en que el título está sobre él y lo toca (79 de 163,
    ~50 s por fotograma en CPU; las máscaras se guardan y se reutilizan). u2net y el mosaico de 4 fotogramas
    pegaban trozos de la cúpula del Capitolio a la cabeza.
  - **Composición:** `Foreground.tsx` dibuja una segunda copia del A-roll con la misma transformación
    (`useArollStyle`) y la máscara como `mask-image`, así los píxeles son idénticos al vídeo base (sin saltos de
    color). Las máscaras de cada tramo se precargan con `delayRender` para que ningún fotograma salga sin máscara.
  - **Posición:** títulos **centrados** y bajados para que la cabeza tape ~el 25–30 % inferior de la palabra
    gigante: `y` = 0.225 (VIRGINIA), 0.156 (VIDA), 0.106 (MITO), 0.145 (10K), 0.135 (HOY). Se calcula con
    `y = (alto de la cabeza − 65 − 0.66 × tamaño) / 1920`, con el borde superior de la cabeza medido en pantalla.
  - Si cambia el encuadre del orador (ARoll.tsx), hay que cambiar también la copia de `view()` en `mattes.py`.

## Vídeo "Te están mintiendo" (10K Month): preferencias aprobadas

- **Voz sin ruido de fondo** (borrador 2, aprobado): la voz grabada en exteriores (viento, tráfico) se limpia con
  **DeepFilterNet3** (`"denoise": true` en `edit.config.json`; binario `/opt/deepfilter/deep-filter`, de las
  releases de GitHub de DeepFilterNet; PyTorch no se puede descargar aquí). Ruido en las pausas de −31 a −68 dB,
  mismo nivel de voz, y Whisper la entiende mejor (confianza 0.98 frente a 0.96). RNNoise (`arnndn`) quitaba
  bastante menos (−49 dB). Aplicarlo por defecto en grabaciones de exteriores.
- **Gancho con doble zoom** (`"intro"` en la configuración): golpe de zoom en el primer instante (×1.4 en 5
  fotogramas), empuje lento mientras habla y un segundo golpe más cerrado (×2.3, rebote y sacudida) en la palabra
  fuerte de la primera frase ("mintiendo"), que coincide con el golpe de la música. El título de esa frase sale
  detrás de la cabeza.
- **Títulos en un solo plano cerrado:** mientras un título está en pantalla no hay cambio de encuadre (la cabeza no
  salta detrás del texto) y el plano es cerrado para que la cabeza tape la parte baja de la palabra gigante.
- **Ningún b-roll tapa la palabra gigante** antes de 0.9 s; si choca, el b-roll se mueve o se quita.
- **Palabra gigante con tilde o Ñ** (SUEÑO): 0.2 em de espacio extra encima para que no choque con la línea
  superior; el `y` del título baja lo mismo para que la cabeza tape la misma parte.
- **Cierre de 10K Month:** el vídeo `FINAL.mp4` (animación del logo, con su sonido) sustituye a la tarjeta de
  Carta Business Group (`"end_video"`); la música sube a 0.35 en vez de 0.55.
- **A-roll a la resolución del original** (1440×2560) para que los zooms fuertes salgan nítidos.
- **Recorte del orador con `birefnet-general-lite`** cuando el fondo es limpio (cielo): igual de preciso que
  BiRefNet-portrait en la mitad de tiempo (~25 s por fotograma). u2net dejaba un halo azul alrededor de la cabeza.
- **B-roll descartado:** vídeos con subtítulos incrustados (el de Carta) y material de otra marca en vídeos de
  10K Month.
- **Entrega en alta calidad:** render con CRF 10 (`--crf=10 --x264-preset=slow`), vídeo copiado tal cual en el
  máster y AAC 44.1 kHz a 256 kbps.

## Vídeo de Claudia (reclutamiento para Carta Business Group Virginia): preferencias aprobadas

Claudia es del equipo: mujer de 48 años, colombiana, abogada toda su vida, empezando a reclutar. Mismo estilo de
edición (dinámico, títulos detrás de la cabeza, gancho con doble zoom), pero con **tipografía y color propios que
encajen con una mujer**. Aprobado en el borrador 1.

- **Subtítulos:** Montserrat ExtraBold (800) en mayúsculas, **rosa #FF9DBA** (a juego con su labial rojo), con la
  misma sombra fuerte y el mismo pop palabra a palabra.
- **Títulos cinéticos:** línea pequeña en Montserrat ExtraBold blanca con la palabra de acento en rosa, y la
  palabra gigante en **Playfair Display Black Italic, en minúsculas, rosa #FF8FB1** (estilo revista, elegante).
  En minúsculas sale mucho más grande que en mayúsculas ("triste" a 360 px); `build_edit.py` calcula el tamaño
  con las métricas de Playfair. Para colocarla detrás de la cabeza: `y = (alto de la cabeza − 65 − 0.75 × tamaño)
  / 1920` (sin línea superior, sin el 65).
- **Palabras gigantes:** *triste* (gancho), *manera* (¿existe otra manera?), *camino* (tu propio camino), *cero*
  (empezando de cero), *comenta* (con "QUIERES CONOCER MÁS" encima). Nada debajo de la palabra gigante: quedaría
  sobre la cara, tapado por el recorte; esas palabras van en los subtítulos.
- **El guion manda sobre el orden de la grabación:** si una frase se grabó en otro orden y es una toma aparte, se
  reordena antes de editar (`claudia_orden.mov`, cortes exactos al fotograma), y se quitan las frases que no son del
  guion ("¿Ya?").
- **Seguimiento de cara** (`scripts/facetrack.py` → `src/Edit/face.json`): cuando el orador camina, el encuadre
  (punch-ins, zoom del gancho) sigue su cara fotograma a fotograma, suavizado dentro de cada tramo. Con la cara
  fija por toma el plano cerrado la dejaba fuera.
- **B-roll pedido por el usuario, en su frase exacta** y sin llenar el vídeo (38 %): mamá con el bebé trabajando
  ("dejar de compartir tiempo con tu familia"), señora de traje rojo frustrada ("donde soñabas estar"), albañil
  ("trabajar más horas"), chico que no descansó ("dormir menos"), equipo viendo la PC ("crecer profesionalmente"),
  equipo señalando la pantalla ("ganas de aprender"), además de fábrica, escenario de premios y Founders Club.
- **Cierre:** tarjeta de Carta Business Group con "VIRGINIA" (2.5 s).
- **Recorte con `birefnet-general-lite`** también con fondos de edificios y árboles: borde limpio en el pelo rubio.

## Regla fija para los vídeos de Freddy

- **Todos los vídeos de Freddy terminan con la animación del logo 10K Month** (`Final (SOLO EN VIDEOS DE FREDDY).mp4`
  en la carpeta de b-roll; aquí `input/material/Final_10K.mp4`, `"end_video"` en la configuración). Solo en los de
  Freddy: los del equipo (Claudia, etc.) cierran con la tarjeta de Carta Business Group.
- En los vídeos de Freddy los subtítulos **no van en amarillo** y deben ir acordes a un hombre.

## Vídeo de Freddy 2 ("¿Crees que vivir en Estados Unidos cambia tu vida?"): estilo aprobado

Estilo fijo para los vídeos de Freddy, sacado de las referencias nuevas (subtítulos a media altura con la palabra
clave grande en otro color, números y gráficos en pantalla, destellos, cierre con logo). Aprobado en la versión final.

- **Subtítulos** (centro al 66 % del alto, delante del orador): palabras normales en Montserrat ExtraBold blanca,
  56 px, en mayúsculas; **palabras clave** (`"emphasis"` en la configuración) en su propia línea, Anton 124 px,
  **verde neón #35F2A0** (crecimiento y dinero, como la flecha del logo 10K), con un pop más fuerte. Nunca amarillo.
- **Títulos detrás de la cabeza** solo en momentos clave (gancho, MENTALIDAD, ATRÉVETE, 10K): línea pequeña en
  Montserrat blanca con acento verde y palabra gigante en Anton verde. Sombra fuerte en la línea blanca: sobre el
  cielo claro no se leía.
- **Iconos animados** (`"icons"`, componente `IconPop`, iconos de lucide-react) cuando hay que mostrar algo: insignia
  redonda oscura con aro y brillo verde, entrada elástica con giro, flota y sale encogiéndose. Calendario con
  "5 AÑOS", candado (limitadas), gráfica que sube (oportunidades), bombilla (mentalidad), puerta (abrirte sus
  puertas), flecha que rebota hacia los comentarios ("escribe acá abajo") y avión de papel que sale volando ("al
  privado"). A la derecha de la cabeza (x 0.78, y 0.27), 190 px.
- **Gancho:** doble zoom (×1.35 al empezar, ×2.3 en la palabra fuerte) con el drop de la música en esa palabra.
- **B-roll por nombre** de la carpeta compartida (Bandera Perú, Hacer delivery, Trabajar en cocina, Estados Unidos 2,
  Reflexión, Mentalidad, Lujo, Pasando la frontera, Convención AIL Las Vegas, Equipo de trabajo), ~40 % del tiempo.
- **Revisar el material antes de editar:** las tomas desde el segundo 11 traían una franja negra arriba; se recorta
  y reescala sin deformar (`freddy_limpio.mov`).
- **Cierre:** animación 10K Month (regla fija de arriba).
- **No renderizar mientras corre `mattes.py`:** juntos se quedan sin memoria y el sistema mata el recorte (se
  reanuda desde las máscaras guardadas).

## Vídeo de Johanna (agente de Carta Business Group, colombiana): estilo aprobado

Como los de Freddy y Claudia (dinámico, entrada fuerte), pero femenino y cálido. Aprobado en el primer borrador.

- **Subtítulos delante de ella** (no hace falta ponerlos detrás): Montserrat ExtraBold blanca, 56 px, en mayúsculas;
  **palabras clave** en su propia línea en **Poppins ExtraBold coral #FF7A6E**, 108 px (combina con los tonos tierra
  de su ropa y se lee sobre cielo, agua y madera).
- **Títulos delante** (sin recorte del orador), arriba de la cabeza: "¿LO QUE QUIERO PARA MI FUTURO?" sobre el b-roll
  de reflexión y "NO VINE SOLO A SOBREVIVIR" al final; palabra gigante en Poppins coral.
- **Gráficos animados** (`"overlays"`, Overlay.tsx): bandera de Colombia ondeando (`flag`), contador que sube
  (`counter`: "$15 / HORA" con kaching, "+20 AÑOS"), lista que se marca al decir cada palabra (`checklist`:
  EXCELENTE / ESTABLE / BENEFICIOS) y casilla con palomita (`code`: "LICENCIA DE AGENTE DE SEGUROS", en lugar del
  subtítulo). Iconos con brillo coral: calendario "7 AÑOS", familia, ubicación (CALIFORNIA, UTAH), gráfica (crecer),
  escudo (proteger), corazón (familia).
- **Gancho:** doble zoom con el golpe de la música en "Estados Unidos"; seguimiento de la cara (camina).
- **Música:** "And Still" (cinematic awards). Golpe en el gancho, parte suave en "no ha sido un camino fácil" y
  vuelve a subir en "futuro mejor". Efectos de sonido al 70 % (`"sfx_gain": 0.7`).
- **Cortes:** silencios de más de 0.3 s, sin dos planos seguidos de la misma toma con el mismo encuadre (un corte de
  silencio sin cambio de encuadre se ve como salto).
- **B-roll** (~40 %): Horizonte (mujer en la montaña, nieve para Utah, excursionista en la cima), Colchones, Trabajar
  de viejo, Frustración, Reflexión, Equipo de trabajo, Trabajar sin familia (mamá con bebé: proteger familias).
- **Cierre:** tarjeta de Carta Business Group VIRGINIA (como Claudia).

## Vídeo de Shirley (agente de Carta Business Group): estilo aprobado

Estilo de las agentes (Johanna, Claudia 2) con su identidad. Aprobado en el primer borrador.

- **Subtítulos** blancos (Montserrat ExtraBold) con la palabra clave en **Playfair Display Black Italic, minúsculas,
  rojo rosado #FF4F6D** (su labial). Títulos delante: "LA VIDA NOS PONE A *prueba*" (gancho), "TU MAYOR
  *testimonio*" sobre b-roll y "*contáctame*" con flecha al final.
- **Material HDR (HLG) de la DJI Osmo Pocket 3:** se pasa a SDR con tonemap hable (203 nits) en `build_aroll`
  (`hdr_prefix`); sin eso sale gris.
- **Marca de agua "dji OSMO POCKET 3"** (arriba a la izquierda, 16–18 % del alto): `"watermark_safe": {"base": 1.25,
  "y0_min": 0.2}`: zoom base en todo el A-roll y el encuadre empieza siempre por debajo de la marca.
- **Música** "And Still": suave en el gancho, golpe con destello en "Empezar un nuevo camino".
- **B-roll** ~36 % para que se luzcan sus tomas en los monumentos de Washington. Cierre Carta Business Group VIRGINIA.
