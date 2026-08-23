# 10kmonthgroup.com

Landing de una sola pantalla para reclutar agentes de seguros. Español, mobile-first,
sitio estático sin build. Todo el tráfico llega del link en la bio de @freddyjmo.

**Único trabajo de la página:** que un desconocido llene el formulario y termine en WhatsApp con Freddy.

---

## ⚠️ Antes de publicar — bloqueadores reales

Estos tres puntos están abiertos. El sitio funciona, pero **no se publica** hasta cerrarlos.

- [ ] **FAQ 5 ("¿Cuánto se puede ganar?") aprobada por escrito por compliance.**
      Está en `index.html` marcada con `data-compliance="pendiente"` y un comentario grande.
      El texto ya es la versión conservadora: **cero cifras, cero proyecciones**, disclaimer incluido.
      Pregunta exacta que hay que mandar:
      > "¿Qué puedo publicar en un sitio web público sobre estructura de comisiones e ingresos
      > potenciales? ¿Puedo citar datos del BLS? ¿Qué disclaimer exacto debo incluir?"
      - Si la aprueban → borra el atributo `data-compliance="pendiente"`.
      - Si la rechazan → borra el bloque `<details>` completo.
- [ ] **Disclaimer del footer y redacción de la casilla TCPA** confirmados con el MGA.
      La casilla dice ahora "Acepto que Freddy Mota **y su equipo** me contacten…", porque
      quien contacta es el equipo de recursos humanos, no Freddy en persona. Si el permiso
      solo nombrara a Freddy, no cubriría a quien de verdad llama.
- [ ] **Las dos preguntas de autorización de trabajo del formulario, aprobadas por escrito.**
      El formulario pregunta si la persona puede trabajar legalmente en EE. UU. y cuál de
      estas aplica: ciudadano o residente, permiso de trabajo vigente, ITIN con licencia de
      conducir, o ninguna. Recoger esa información tiene implicaciones legales — se confirma
      con Carta y con el MGA antes de publicar. Están en las dos versiones para que la
      prueba A/B siga midiendo una sola variable.
- [ ] **Tres testimonios con consentimiento firmado.** El bloque está comentado en la sección
      "El equipo" de `index.html`, listo para descomentar. No inventar ninguno.

Y del checklist del brief, todavía sin verificar:

- [ ] Uso del nombre/logo de American Income Life / Carta aprobado, o retirado
- [ ] ¿Utah ofrece el examen de licencia en español?
- [ ] ¿En qué estados puedes reclutar realmente? (si hay límite territorial, hay que filtrar el select de Estado)
- [ ] Probada dentro del navegador de Instagram, en iPhone **y** en Android
- [ ] Formulario probado de punta a punta: llega el correo, llega el SMS, **y** abre WhatsApp
- [ ] Alguien disponible para contestar en menos de 15 minutos

---

## Dos versiones: A y B

Hay dos landings en el repo. Misma marca, mismo copy, mismos disclaimers, mismo
formulario de cinco campos. Lo que cambia es **dónde vive el formulario**.

**A es la versión elegida.** Después de comparar las dos, A se quedó con lo mejor
de B: el formulario en el hero y el botón flotante de WhatsApp, pero conservando
su fondo claro y su retrato grande.

| | `index.html` (A) — **la elegida** | `prueba.html` (B) |
|---|---|---|
| Formulario | **En el hero, sin hacer scroll** | En el hero, sin hacer scroll |
| WhatsApp | **Botón flotante siempre visible** | Botón flotante siempre visible |
| Cierre | **Botón "Pedir más información"** | Botón "Quiero información" |
| Fondo del hero | Claro | Negro |
| Cifras (25 / 200+ / 4) | Dentro del texto | Barra de datos arriba |
| "Cómo se entra" | No existe | Tres pasos concretos |

> **B ya casi no aporta.** Las dos diferencias que quedan son el hero negro, la barra
> de cifras y la sección de tres pasos. Si te gustan esas dos secciones, lo sensato es
> traerlas a A y borrar `prueba.html`; si no, borra `prueba.html` y quédate solo con A.
> Mantener dos páginas casi iguales solo genera trabajo doble en cada cambio.

B nació de mirar `velasquezfinancialgroup.com`, otra agencia de Carta que corre
la misma jugada (link en bio de Instagram → landing en español). Lo que les
funciona bien y B les copia: el formulario arriba y el WhatsApp flotante.

Lo que **no** se copió, a propósito:

- Su sitio no tiene SSL — Chrome muestra "Not secure". Eso solo destruye confianza.
- Su botón dice "Submit" en una página en español.
- Su campo "Tu mensaje o consulta" es obligatorio. Es fricción pura.
- Mezclan voseo ("Construí", "Formá parte") con tuteo.
- Usan fotos de banco de imágenes en la sección de pasos.
- No tienen ni una FAQ, ni disclaimer de ingresos, ni casilla de consentimiento,
  ni política de privacidad. Eso no es un estilo distinto: es un hueco de compliance.

### Cómo elegir entre las dos

Cada lead que entra lleva un campo **`variante`** (`A` o `B`) y los eventos de
tracking van etiquetados igual. Así se puede comparar de verdad en vez de a ojo.

Para probarlas de a de veras, alterna el link de la bio de Instagram cada semana
y compara **leads por semana**, no impresiones:

```
https://10kmonthgroup.com/?utm_campaign=semana1        (versión A)
https://10kmonthgroup.com/prueba.html?utm_campaign=semana2   (versión B)
```

`prueba.html` lleva `noindex` para que Google no la trate como contenido duplicado.
Cuando decidas cuál se queda, la ganadora pasa a ser `index.html` y la otra se borra.

### La decisión de fondo, que no es de diseño

B es más agresiva: pide los datos antes de haberse ganado nada. Va a traer **más
leads y más fríos**. A convence primero y filtra sola: **menos leads, más tibios**.

Cuál conviene depende de una sola cosa: **a cuántas personas puedes atender tú,
personalmente, el mismo día.** Si B te trae el triple de leads y contestas la
mitad, B te está haciendo daño, no bien.

El botón flotante de WhatsApp tiene el mismo filo: quien lo usa se te va directo
al chat **sin dejar el lead en la Google Sheet**. Ganas velocidad, pierdes registro.
Sus eventos van marcados como `via: "flotante"` para que puedas medir cuánta gente
se va por ahí.

### Pendiente que salió de mirar a la competencia

Su formulario pregunta **"¿Puedes trabajar legalmente en EEUU?"** e incluye la opción
*"Tengo un número ITIN y una licencia de conducir válida"*. Si en Carta existe ese
camino, es la objeción más grande que tu página **no** responde hoy.

En `prueba.html` hay una FAQ **"¿Necesito papeles?"** comentada y vacía a propósito.
Preguntar o describir estatus migratorio tiene implicaciones legales: confirma con
Carta qué es cierto y redacta la respuesta **con tu MGA** antes de publicar nada ahí.

---

## Estructura

```
site/                   Lo ÚNICO que se publica. Netlify apunta aquí.
  index.html            La página completa: HTML + CSS + JS en un archivo. Sin dependencias.
  prueba.html           Versión B, del experimento A/B. noindex.
  privacidad.html       Política de privacidad (obligatoria por capturar teléfonos).
  img/                  Fotos. Ver img/LEEME-FOTOS.md.
  favicon.svg · robots.txt · sitemap.xml

netlify.toml            Config de despliegue, cabeceras y las reescrituras de /recruiting.
netlify/functions/
  lead.js               Reenvía el lead a un webhook externo si está configurado.
README.md               Este archivo.
.claude/                Skills de trabajo. No forma parte del sitio.
```

> **Por qué el sitio vive en `site/` y no en la raíz:** Netlify publica el
> directorio entero que se le indique. Con `publish = "."` quedaban accesibles
> bajo el dominio el README con sus notas internas, la propia configuración del
> despliegue, el código de la función y las skills. Aislar lo publicable en
> `site/` lo resuelve de raíz, en vez de ir bloqueando rutas una por una.

**Sin framework, sin npm install, sin build.** Para verlo local basta abrir `index.html`
en el navegador, o `python3 -m http.server 8000` en esta carpeta.

---

## Fotos

Ver **`img/LEEME-FOTOS.md`**. Resumen: tres archivos obligatorios
(`freddy-hero.jpg`, `freddy-quien-soy.jpg`, `equipo-summit.jpg`) más `og.jpg`.

Si un archivo no existe, el sitio **oculta ese bloque** en vez de mostrar la imagen rota.
Así que la página ya se ve bien hoy, sin fotos — pero sin ellas pierde casi toda su fuerza.
Súbelas antes de mandar tráfico.

---

## Despliegue en Netlify

Netlify se eligió sobre GitHub Pages por una sola razón: **Pages no puede recibir
formularios.** Es alojamiento estático puro. La página se vería igual, la gente
llegaría igual a WhatsApp, pero no habría correo, ni hoja de cálculo, ni registro
de ningún lead. Netlify da lo mismo (gratis, dominio propio, SSL) y además captura.

### 1. Crear la cuenta y conectar el repo

1. Entra a **[netlify.com](https://netlify.com)** → **Sign up** → **GitHub**.
   Iniciar sesión con GitHub evita tener que conectar nada después.
2. **Add new site** → **Import an existing project** → **GitHub** → autoriza el acceso
   → elige el repo **`10kmonth-`**.
3. En la pantalla de configuración:
   - **Branch to deploy:** la rama donde vive el sitio
   - **Build command:** *déjalo vacío*
   - **Publish directory:** `.`

   Ya vienen puestos en `netlify.toml`, así que no deberías tener que tocarlos.
4. **Deploy**. En menos de un minuto te da una URL tipo `algo-al-azar.netlify.app`.
   **Pruébala antes de tocar el dominio.**

### 2. Que los leads te lleguen

Netlify detecta el formulario solo, al leer el HTML publicado. No hay que configurar
nada para que empiece a guardar: los envíos aparecen en **Forms → lead**. Gratis hasta
100 al mes.

Lo único que sí hay que activar es el aviso:

**Site configuration → Forms → Form notifications → Add notification → Email notification**
→ destino `freddy@10kmonthgroup.com`.

> **Sobre el SMS del brief:** ya no hace falta. El propio flujo lo resuelve — el lead
> te escribe **a ti por WhatsApp**, así que el teléfono te suena en el momento, con la
> conversación ya abierta. El correo de Netlify queda como respaldo escrito.

**Si además quieres la Google Sheet**, no necesitas la función ni variables de entorno:
Netlify manda el lead a donde le digas.
**Form notifications → Add notification → Outgoing webhook** → pega ahí la URL del
*Catch Hook* de Zapier, y en Zapier el Zap es *Webhooks (Catch Hook)* → *Google Sheets:
Create Row*.

*(La función `netlify/functions/lead.js` hace lo mismo por si algún día prefieres
controlarlo desde el código: se activa poniendo `LEAD_WEBHOOK_URL` en Site
configuration → Environment variables. Si no la pones, no hace nada y el formulario
funciona igual.)*

### 3. El dominio, y la ruta /recruiting

**Un dominio apunta a un solo sitio.** Si `10kmonthgroup.com` apunta a este proyecto de
Netlify, este proyecto sirve todo el dominio, la raíz incluida. No se puede repartir
"la raíz a un lado y /recruiting a otro" solo con DNS.

Por eso el sitio está montado así: **la landing vive en la raíz y además responde en
`/recruiting`**, mediante reescrituras declaradas en `netlify.toml`. Son de tipo 200,
no redirecciones: la barra de direcciones se queda en `/recruiting`.

Eso significa que **el link de la bio de Instagram puede ser
`10kmonthgroup.com/recruiting` desde el primer día y no va a tener que cambiar nunca**,
se decida lo que se decida sobre el resto del sitio.

#### Conectar el dominio

Netlify → **Domain management** → **Add a domain** → escribe el dominio.
Netlify dice exactamente qué registros crear. Normalmente:

| Tipo | Host | Valor |
|---|---|---|
| `A` | `@` | el IP que muestre el panel de Netlify |
| `CNAME` | `www` | `TU-SITIO.netlify.app` |

> **Usa el valor que dé el panel, no uno copiado de un tutorial.** Ese IP lo pueden
> cambiar, y un dato viejo deja el sitio caído sin avisar.

Se crean en **Spaceship → tu dominio → Advanced DNS**, borrando antes los de parking.
Después, en Netlify, activa **HTTPS (Let's Encrypt)**. Propaga en minutos, a veces
hasta 24 horas.

#### Cuando exista el sitio principal

Hay dos caminos, según dónde se construya:

**a) En este mismo repo.** El sitio principal se pone en la raíz y la landing se mueve
a una carpeta `recruiting/`. Las rutas del sitio son relativas y ya está probado que
funciona desde subcarpeta, así que la mudanza no requiere tocar el código: se mueven
los archivos y se borran las reescrituras de `netlify.toml`, que dejan de hacer falta.
El formulario sigue capturando igual, porque Netlify Forms es del sitio entero.

**b) En otro proyecto de Netlify.** Ese otro se queda el dominio y hace proxy hacia
este, con una regla en su propio `netlify.toml`:

```toml
[[redirects]]
  from = "/recruiting/*"
  to = "https://moonlit-brioche-f91905.netlify.app/:splat"
  status = 200
```

> **Cuidado con esta opción:** el formulario haría POST al sitio principal, no a este,
> y Netlify Forms no lo reconocería. Los leads se perderían **en silencio**, sin ningún
> error visible. Si se toma este camino, hay que cambiar el destino del `fetch` en
> `index.html` a la URL absoluta de este sitio, y volver a probar de punta a punta.

**c) Si el sitio principal va en Wix, Squarespace o WordPress.com,** una ruta
`/recruiting` no es viable: esas plataformas no permiten proxy. La salida limpia sería
`recruiting.10kmonthgroup.com`, que funciona igual de bien y no rompe nada.

### 4. Probar antes de mandar tráfico

- [ ] Llenar el formulario de verdad desde el celular
- [ ] Confirmar que el lead aparece en **Netlify → Forms → lead**
- [ ] Confirmar que llega el correo
- [ ] Confirmar que abre WhatsApp con el mensaje ya escrito
- [ ] **Repetirlo todo desde el navegador de Instagram**, en iPhone y en Android

## Tracking

Los eventos ya están disparándose, esperando a que instales algo que los escuche:

| Evento | Cuándo |
|---|---|
| `lead_enviado` | El formulario se envió bien (incluye el estado) |
| `whatsapp_abierto` | Se abrió WhatsApp (distingue `automatico` de `boton`) |

Se mandan a `dataLayer`, a `gtag()` y a `fbq()` si existen. **Hoy no hay ninguno instalado**
— decisión pendiente entre Google Analytics, Meta Pixel o nada.

Si pones Meta Pixel: cuidado, la página captura teléfonos. Configura el pixel para
**no** mandar datos personales y revisa las políticas de datos sensibles de Meta.

Los UTM del link de Instagram se conservan durante toda la visita (`sessionStorage`) y
viajan con el lead. Úsalos así en la bio:

```
https://10kmonthgroup.com/?utm_source=instagram&utm_medium=bio&utm_campaign=reels_octubre
```

---

## Decisiones de diseño, por si alguien las cuestiona

- **Sin campo de correo.** Fricción sin uso. El teléfono es lo único que importa.
- **Naranja `#E2571E` solo en botones y detalles.** El texto chico en naranja usa `#C0410F`,
  la misma familia pero con contraste AA — el naranja de marca sobre fondo claro no pasa
  accesibilidad en tamaño pequeño.
- **Fuente display: Archivo** (una sola petición a Google Fonts, con `display=swap`).
  El cuerpo usa la fuente del sistema: cero espera, y en iPhone se ve nativo.
- **Acordeón con `<details>` nativo**, no JavaScript. Funciona con teclado y lector de
  pantalla sin que nadie lo programe.
- **Sin librerías.** El JS completo son ~180 líneas, sin dependencias.
- **Si falla la red al guardar**, el usuario igual se va a WhatsApp. Es preferible perder
  la fila en la Sheet que perder a la persona.

## Accesibilidad

Etiquetas reales en todos los campos, foco visible, errores anunciados con `aria-invalid`
y texto (no solo color), `prefers-reduced-motion` respetado, cuerpo mínimo 17px,
áreas táctiles de 52–56px.
