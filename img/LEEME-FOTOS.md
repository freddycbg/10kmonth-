# Fotos — qué archivo va dónde

Sube los archivos con **exactamente estos nombres**, en esta carpeta.
Si falta alguno, el sitio oculta ese bloque solo, en vez de mostrar una imagen rota.

## Los tres obligatorios

| Archivo | Dónde sale | Formato | Cuál de tus fotos |
|---|---|---|---|
| `freddy-hero.jpg` | Retrato grande del hero, solo en escritorio | vertical 3:4, ~900×1350 | La del **saco azul marino**, parado junto a la mesa larga con las lámparas de madera. |
| `freddy-avatar.jpg` | El círculo junto a tu nombre, sobre todo en celular | **cuadrada**, 300×300 | Recorte de cara y hombros sacado de `freddy-hero.jpg`. En un círculo de 54 px el retrato completo no sirve: la cara queda del tamaño de un punto. Si algún día cambias la foto del hero, hay que rehacer este recorte. |
| `freddy-quien-soy.jpg` | Sección "Quién soy" | vertical 3:4, ~900×1200 | La del **polo blanco y gorra, escribiendo en la libreta**. Se ve trabajando, no posando. (Alternativa: la del traje azul en la terraza.) |
| `equipo-summit.jpg` | Banda a todo lo ancho de "El equipo", con el texto encima | **horizontal y ancha**, ~1920×820. El recorte se ancla arriba: deja aire abajo, nunca arriba | La **wide del Leadership Summit**, todo el equipo alrededor de la mesa. Esa foto sola prueba lo de los 25 agentes. |

## Muy recomendado

| Archivo | Para qué | Formato |
|---|---|---|
| `og.jpg` | La vista previa cuando alguien comparte el link por WhatsApp. Sin ella el link se ve como un recuadro gris y parece spam. | **1200×630 exactas** |
| `apple-touch-icon.png` | Ícono al guardar el sitio en la pantalla de inicio | 180×180 |

## Solo con consentimiento firmado

`equipo-1.jpg`, `equipo-2.jpg`, `equipo-3.jpg` — cuadradas, ~800×800.
Hoy el bloque de testimonios está comentado en `index.html`. No lo descomentes
hasta tener el permiso por escrito de cada persona.

---

## Antes de subirlas: comprímelas

**Esto no es opcional.** Una foto de cámara pesa 6 MB. Tres de esas son 18 MB, y
la meta es que la página cargue en menos de 2 segundos en 4G. Alguien en el
navegador de Instagram con mala señal se va antes de ver nada.

1. Entra a **<https://squoosh.app>** (gratis, funciona en el navegador, no instalas nada)
2. Arrastra la foto
3. A la derecha elige **MozJPEG**, calidad **75**
4. En "Resize", pon el ancho: **900** para las verticales, **1600** para la horizontal
5. Descárgala y renómbrala con el nombre exacto de la tabla

Apunta a **200 KB o menos por foto**. A calidad 75 no se nota la diferencia y pesa
diez veces menos.

## Reglas de nombre

- Todo en minúsculas
- Sin acentos, sin espacios, sin ñ
- Extensión `.jpg` (no `.jpeg`, no `.JPG`, no `.png`, no `.heic`)

> **Si tus fotos son `.HEIC`** (lo normal si son de iPhone), squoosh.app las convierte
> a JPEG solo con exportarlas. No hace falta nada más.

## La imagen de Open Graph (`og.jpg`)

Hazla en Canva, tamaño 1200×630:

- Fondo negro `#111111`
- Tu foto del saco azul recortada a la derecha
- A la izquierda, en blanco y grande: **¿Cansado de que tu trabajo tenga techo?**
- Abajo, en naranja `#E2571E`: **$10k↗ MONTH**

Texto grande. En el celular esa vista previa se ve del tamaño de una estampilla.
