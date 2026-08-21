# Fotos — qué archivo va dónde

Sube los archivos con **exactamente estos nombres** en esta carpeta.
Si falta alguno, el sitio oculta ese hueco automáticamente en vez de mostrar
una imagen rota (el brief dice: "si no hay foto real, mejor sin foto").

| Archivo | Dónde sale | Formato | Cuál de tus fotos |
|---|---|---|---|
| `freddy-hero.jpg` | Hero, arriba de todo | vertical 3:4, ~900×1200 | La del **saco azul marino**, parado junto a la mesa larga con las lámparas de madera. Es la más limpia y la más "profesional pero no de estudio". |
| `freddy-quien-soy.jpg` | Sección "Quién soy" | vertical 3:4, ~900×1200 | La del **polo blanco y gorra, escribiendo en la libreta**. Se ve trabajando, no posando — pega con el texto. (Alternativa: la del traje azul en la terraza.) |
| `equipo-summit.jpg` | Sección "El equipo" | horizontal 16:10, ~1600×1000 | La **wide del Leadership Summit**, todo el equipo alrededor de la mesa. Esa foto sola prueba lo de los 25 agentes. |
| `og.jpg` | Vista previa al compartir por WhatsApp | **1200×630 exactas** | Ver abajo. |
| `apple-touch-icon.png` | Ícono al guardar en pantalla de inicio | 180×180 | Opcional. Fondo negro + "10k" en blanco. |
| `equipo-1.jpg` … `equipo-3.jpg` | Testimonios | cuadradas ~800×800 | **Solo con consentimiento firmado.** Hoy están comentados en `index.html`. |

## Antes de subirlas

1. **Redimensiona.** Nada arriba de 1600px de ancho. Una foto de cámara pesa 6 MB
   y mata la meta de "carga en menos de 2 segundos en 4G".
2. **Comprime a ~200 KB o menos por foto.** Usa <https://squoosh.app> (gratis, en el navegador).
   Calidad 75–80 en JPEG no se nota y baja el peso 10×.
3. **Nombre exacto, minúsculas, sin acentos ni espacios.**

## La imagen de Open Graph (`og.jpg`)

Es la que aparece cuando alguien manda el link por WhatsApp. Si no está, se ve un
recuadro gris y el link parece spam. Hazla en Canva, 1200×630:

- Fondo negro `#111111`
- Tu foto del saco azul recortada a la derecha
- A la izquierda, en blanco y grande: **¿Cansado de que tu trabajo tenga techo?**
- Abajo, en naranja `#E2571E`: **$10k↗ MONTH**

Texto grande. En el celular esa vista previa se ve del tamaño de una estampilla.
