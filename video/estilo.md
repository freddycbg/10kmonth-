# estilo.md: guía de edición

Fuente: `referencia.mp4`, un testimonio de 4:14.8 (1276×720, 24 fps, H.264 + AAC estéreo 44.1 kHz).
Método: 509 fotogramas a 2 fps, 60 cambios de plano detectados con ffmpeg (`scene > 0.3`, completados a mano),
transcripción con Whisper large-v3-turbo con tiempos por palabra, medición de píxeles en fotogramas a resolución
completa y análisis de audio (EBU R128 y RMS en las pausas).

Lo marcado como **[SUPOSICIÓN]** no se puede medir con certeza desde el archivo.

---

## 1. Estructura y ritmo de cortes

| Métrica | Valor |
|---|---|
| Planos totales | 62, uno cada **4.1 s** de media |
| Planos en los primeros 30 s | 14, uno cada **2.1 s** (el arranque es el doble de rápido) |
| Entrevista (A-roll) | 56.9 % del tiempo · 22 planos · mediana **4.2 s** · mín. 1.2 s · máx. 28.9 s |
| B-roll | 40.2 % del tiempo · 38 planos · mediana **2.35 s** · mín. 0.75 s · máx. 9.6 s |
| Plano de presentación | 1 plano de 4.5 s (de pie, brazos cruzados, mirando a cámara) en 0:04.9 |
| Cierre | Tarjeta de logo de 2.9 s sobre fondo blanco |

**Estructura narrativa:**
1. **0:00–0:09 · Presentación:** nombre, edad y origen, y luego cargo y empresa, con un plano de presentación a cámara.
2. **0:09–1:16 · Historia de lucha:** emigración y trabajos duros, con mucho b-roll (lo más montado: un plano cada 1–3 s).
3. **1:16–2:26 · Punto de giro:** la oportunidad y la rutina de sacrificio. Planos de entrevista largos (hasta 29 s).
4. **2:26–3:50 · Logros:** empresa, reconocimientos, coche, crecimiento. Vuelve el b-roll.
5. **3:58–4:12 · CTA:** habla **de frente a cámara** ("Ahora, si te sientes identificado… no dudes en escribirme").
6. **4:12–4:15 · Logo**.

**Reglas de corte:**
- El corte cae siempre **en la frontera de una frase** de los subtítulos, nunca a mitad de palabra.
- Entrevista con **2 encuadres** que se alternan: **ancho** (sujeto a la derecha del centro, con la sala visible)
  y **cerrado** (sujeto en plano medio corto, más frontal). Se cambia de encuadre en cada corte de la entrevista,
  cada 3–17 s.
- Silencios recortados al máximo: entre palabras solo quedan **8 pausas > 0.5 s** en 4 minutos
  (máx. 0.78 s, mediana 0.0 s). Ritmo de habla: **2.98 palabras/s**.

## 2. Subtítulos

| Propiedad | Valor medido |
|---|---|
| Fuente | **Open Sans SemiBold Italic** [SUPOSICIÓN: identificada a ojo, coincide con la forma de la "a", la "g" y la cursiva] |
| Color | Blanco puro `#FFFFFF` |
| Sombra | Sombra difusa negra, aprox. `0 2px 6px rgba(0,0,0,0.6)` [SUPOSICIÓN en los valores exactos] |
| Fondo / caja | Ninguno |
| Tamaño | Altura de mayúscula = **24 px en un cuadro de 720 px** (3.3 % de la altura), es decir, cuerpo de unos **33 px @720p (4.6 % de la altura)** |
| Posición | Centrado horizontal · base del texto a **33–41 px del borde inferior (4.6–5.7 %)** |
| Ancho máximo | **643 px de 1276 (50 % del ancho)** · siempre **1 sola línea** |
| Palabras por bloque | **1–8 · mediana 4–5**. Se corta en comas o en frontera de frase ("Mi nombre es Raúl Silva" / "tengo 31 años de edad" / "soy de Guárico, Venezuela") |
| Puntuación | Se mantienen las comas y el punto final dentro del bloque |
| Números | En cifras ("31 años", "2 horas", "125 años"), salvo "siete años" |
| Animación | **Ninguna**: el bloque aparece y desaparece en 1 fotograma, sin fundido |
| Palabra destacada | **Ninguna**: no hay color, peso ni escala distintos |
| Sincronía | Cada bloque dura lo que dura su frase hablada (≈1–3 s) |

## 3. Textos en pantalla (aparte de los subtítulos)

- **No hay** títulos, rótulos con nombre, cifras animadas ni llamadas a la acción escritas.
- El único gráfico es el **logo final** ("Carta Business Group · Integrity and leadership", azul sobre blanco).

## 4. B-roll

- **Literal a la palabra:** cada b-roll ilustra exactamente lo que se dice en ese momento
  ("soy de Guárico" → vista aérea de la ciudad; "pirotecnia" → fuegos artificiales; "delivery" → moto de reparto;
  "forklift" → montacargas en un almacén; "hacía taxi" → interior de un taxi; "Rangers de Texas" → béisbol;
  "Lakers" → baloncesto; "sacarme un carro" → él caminando hacia el coche).
- **Dos fuentes:** (a) **banco de imágenes**, para lugares, banderas, trabajos y deportes; (b) **rodado propio**
  del protagonista (abriendo un libro, leyendo en un sillón, caminando al coche, la puerta, el logo del modelo).
- **Secuencias:** cuando enumera varias cosas, se encadenan de **3 a 8 b-rolls seguidos** (0:54–1:16 son 8 planos
  seguidos; 2:26–2:47 son 10).
- La voz sigue sonando debajo del b-roll (es J-cut o L-cut, nunca una pausa).

## 5. Transiciones

- **100 % cortes secos** entre planos (comprobado fotograma a fotograma: el cambio ocurre en 1 fotograma).
- Una sola excepción: la **revelación del logo** al final, que entra con un fundido sobre blanco
  con difuminado, de unos 1.5 s (4:12.0 → 4:13.5).

## 6. Zooms y movimiento

- **Sin zooms digitales** ni "punch-ins" bruscos.
- **Movimiento de cámara real lento** (slider o dolly) en los planos de entrevista y presentación:
  desplazamiento lateral con un ligero acercamiento. En el plano de 28.9 s, el sujeto se desplaza
  aprox. **8–10 % del ancho** del cuadro a lo largo de todo el plano. En el de presentación (4.5 s), hay un
  desplazamiento lateral con paralaje y un acercamiento de unos 5 %.
  [SUPOSICIÓN: son movimientos de cámara grabados, no hechos en edición.]
- Cuando el b-roll de banco de imágenes trae movimiento propio (drones, travelling), se usa tal cual.

## 7. Color

| Métrica (excluyendo la zona de subtítulos) | Entrevista | B-roll |
|---|---|---|
| Luminancia media | **139/255** (clave alta, luminosa) | 102/255 |
| Negro (percentil 1) | 12/255 | 18/255 |
| Blanco (percentil 99) | **217/255** (altas luces suaves, nunca quemadas) | 220/255 |
| Saturación media | **16 %** (desaturada, sobria) | 32 % |
| Balance R−B | **+1.7** (neutro, apenas cálido) | −7.1 |

Paleta del set: blancos, beige y madera clara, con traje oscuro como punto de contraste.

## 8. Sonido

| Métrica | Valor |
|---|---|
| Volumen integrado | **−14.2 LUFS** |
| Rango de volumen (LRA) | **3.6 LU** (voz muy comprimida y constante) |
| Voz (RMS mediano al hablar) | −17 dBFS |
| Pausas (RMS mediano) | −24.5 dBFS, es decir, **hay música de fondo** unos 7–8 dB por debajo de la voz |
| Logo final (sin voz) | −17 dBFS: la música sube a primer plano al cerrar |
| Inicio | La voz arranca en 0.0 s, sin intro musical |

- Tipo de música: **[SUPOSICIÓN]** instrumental corporativa e inspiradora (piano o pads), sin letra.
- Efectos de sonido (whoosh, impactos): **[SUPOSICIÓN]** no se detectan, salvo quizá en la revelación del logo.

---

## 9. Adaptación a vertical 1080×1920, 30 fps (valores vigentes, borrador 2)

> La referencia es horizontal. Estos son los valores que usa el borrador 2.
> Están en `scripts/build_edit.py` y `src/Edit/`.

- **Subtítulos:** Open Sans SemiBold Italic (600), blanco, sombra `0 2px 6px rgba(0,0,0,.6)`, cuerpo de **62 px**,
  1 línea de **máx. 30 caracteres y 6 palabras**, base a **440 px del borde inferior** (fuera de la interfaz
  de TikTok y Reels). Los bloques cortan en punto, en coma (si el bloque tiene ≥ 8 caracteres) y antes de
  y/pero/porque (si tiene ≥ 14 caracteres). Nunca terminan en palabra débil (de, la, y, pero, no…) ni dejan
  una palabra huérfana. Cada bloque empieza con su primera palabra y dura hasta el siguiente.
- **Silencios:** se cortan los silencios ≥ 0.3 s (audio < −40 dB) y se dejan 0.08 s tras la voz
  y 0.10 s antes. Se conservan 1.2 s de plano tras la última palabra.
- **Encuadres de la entrevista:** "ancho" = el plano original; "cerrado" = recorte digital al **145 %**
  con la cara en (60 %, 30 %). Se alternan en cada corte de silencio y en cada entrada o salida de b-roll,
  con un mínimo de **1.8 s** por plano (oculta los saltos del corte de silencios).
- **Movimiento:** acercamiento lento continuo del **100 % al 104 %** por plano.
- **Color (A-roll):** **sin filtro ni corrección de color**: colores originales de la cámara (ver Preferencias).
- **B-roll:** literal a la frase, cortado de la primera a la última palabra de esa frase (+0.15 s; si choca con
  el siguiente b-roll, termina donde empieza ese), sin audio, reencuadrado a 1080×1920 y sin filtro de color.
  Solo se convierte el trozo usado de cada clip. El aeropuerto de stock (120 fps) va a 0.5×.
  Cobertura del borrador 5: 27 inserciones, el 34 % del vídeo (referencia: 40 %).
- **Fotos como b-roll:** se recortan a vertical ("cover") con un paneo lento de un sujeto a otro
  (p. ej. de un gemelo al otro) y/o un zoom del 100 al 108 % durante la frase.
- **Audio:** voz con paso alto a 80 Hz y compresión 3:1, a −16 LUFS. La música se ajusta a la duración con
  `atempo`, va a ×0.13 bajo la voz (≈ 11 dB por debajo), sube a ×0.28 al terminar de hablar y se funde 1.5 s
  al final. El máster va a **−14 LUFS / −1 dBTP**.

---

## Preferencias aprendidas (correcciones aprobadas)

- **Formato final: siempre vertical 9:16, 1080×1920 a 30 fps.** Nunca horizontal, aunque la referencia lo sea.
  Si el material de origen no es 9:16, se recorta o se reencuadra a 9:16; no se añaden barras negras.
- **Subtítulos: los mismos que la referencia** (§2): frases cortas en una línea, Open Sans SemiBold Italic
  blanca con sombra, sin animación y sin palabra destacada. La sincronía palabra a palabra se usa para
  calcular cuándo entra y sale cada bloque, no para animar palabras sueltas.
- **Color: nada de filtros.** Los colores tienen que verse naturales, tal como salen de la cámara.
  No se aplican curvas, saturación, balance de blancos ni LUTs al A-roll, aunque la referencia sea
  más luminosa. (Borrador 1: el ajuste de luz y tono se veía artificial.)
- **Música más baja:** ×0.13 bajo la voz (≈ 11 dB por debajo de la voz, unos 3 dB menos que la referencia)
  y ×0.28 en el cierre. La voz siempre manda; la música es un fondo que apenas se nota.
- **Coherencia temporal del b-roll:** cada imagen tiene que corresponder al momento de la historia que se narra.
  Antes de los gemelos no puede aparecer nada de los gemelos (ni el portabebés con un bebé dentro): para
  "primer hijo" y "cuidar al niño" se usan fotos con solo el primer hijo. Para los gemelos: fotos del parto
  con los dos bebés y fotos o vídeos de cuando eran muy pequeños, en orden cronológico.
- **El protagonista trabajando:** en "trabajando en el almacén" va el clip donde él sale colocando cajas;
  el recorrido de la cámara alrededor de los palés se usa justo después ("distribución de alimentos").
- **Música:** pista actual "Freedom" (inspiradora, sin copyright). Si dura más que el vídeo se recorta y se
  funde al final; si dura menos, se estira con atempo. Siempre se normaliza a −9.3 LUFS (con limitador)
  antes de aplicar el nivel aprobado, para que cualquier pista quede igual de baja bajo la voz.
- **La música se oye desde el primer segundo:** si la pista empieza con una intro suave, se salta hasta donde
  entra con cuerpo (`music_start` en edit.config.json; "Freedom" empieza en el segundo 12) con un fundido
  de entrada de 0.25 s. Nunca debe parecer que el vídeo arranca sin música.
- **Delivery:** usar el repartidor de rojo con las cajas de pizza; el clip de la repartidora quedó descartado.
- **Entrega:** MP4 H.264 (High, 4.1, yuv420p) + **AAC-LC 44.1 kHz estéreo 192 kbps**, `faststart`, −14 LUFS.
  Se envía como **descarga** (no en el visor del chat) y de **un archivo a la vez**. El render a 48 kHz
  enviado al visor se escuchó mudo en el dispositivo del cliente; esta configuración sí funcionó.
- **B-roll propio primero:** se usa el material real del protagonista (almacén, familia, hijos, fotos)
  siempre que exista para esa frase; el stock solo cubre lo que no hay (ciudad, aeropuerto, bandera,
  delivery, dinero, boda, manifestación, reparación de móviles). El material propio va en la carpeta de Drive que pase el cliente.
