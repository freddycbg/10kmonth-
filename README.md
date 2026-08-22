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
index.html              Versión A: la página completa, formulario al final.
prueba.html             Versión B: formulario en el hero + WhatsApp flotante. noindex.
privacidad.html         Política de privacidad (obligatoria por capturar teléfonos).
netlify.toml            Config de despliegue y cabeceras. Sin build command.
netlify/functions/
  lead.js               Reenvía el lead a un webhook externo (Zapier/CRM) si está configurado.
img/                    Fotos. Ver img/LEEME-FOTOS.md — ahí dice qué archivo va dónde.
favicon.svg
robots.txt · sitemap.xml
```

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

1. Conecta este repo en Netlify → **Add new site → Import an existing project**.
2. Build command: **vacío**. Publish directory: **`.`** (ya está en `netlify.toml`).
3. Deploy. Netlify te da una URL tipo `algo-random.netlify.app` — pruébala antes de tocar el DNS.

### DNS en Spaceship

En Spaceship → tu dominio → **Advanced DNS**, borra los registros de parking y crea:

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| `A` | `@` | `75.2.60.5` | Automático |
| `CNAME` | `www` | `TU-SITIO.netlify.app` | Automático |

> El `75.2.60.5` es el balanceador de Netlify. **Verifícalo** en el panel de Netlify
> (Domain management → Add domain → te dice el valor exacto a usar) antes de escribirlo:
> ese IP lo pueden cambiar y no quieres el sitio caído por copiar un dato viejo.

Después, en Netlify → **Domain management** → agrega `10kmonthgroup.com` y activa
**HTTPS (Let's Encrypt)**. Propaga en minutos, a veces hasta 24 horas.

Configura también `www` → redirige al dominio sin `www` (Netlify lo hace solo al
marcar el dominio principal).

**Dominios de redirección** (`10kalmes.com`, `tenkmonth.com`, `10kmonths.com`), si los
registras: agrégalos en Netlify como *domain alias* con el mismo DNS, y Netlify los
redirige a `10kmonthgroup.com`.

---

## Cómo llegan los leads

Tres capas, en este orden:

**1. Netlify Forms — la fuente de verdad.**
El formulario tiene `data-netlify="true"`, así que Netlify captura cada envío sin
configurar nada. Se ven en Netlify → **Forms → lead**. Gratis hasta 100 envíos/mes.

Activa la notificación por correo:
Netlify → Forms → **Form notifications → Add notification → Email notification**
→ destino `freddy@10kmonthgroup.com`.

**2. Webhook a Zapier — para la Google Sheet y el SMS.**
El sitio también manda cada lead en JSON a `/.netlify/functions/lead`, que lo reenvía
a donde apunte la variable de entorno:

Netlify → Site settings → **Environment variables** → agrega:

```
LEAD_WEBHOOK_URL = https://hooks.zapier.com/hooks/catch/…
```

Si la variable no está puesta, la función no hace nada y el formulario sigue funcionando igual.
En Zapier, el Zap es: **Webhooks by Zapier (Catch Hook)** → *Google Sheets: Create Row* →
*SMS by Zapier: Send SMS* a tu celular.

> El SMS no es un lujo. El correo lo ves en dos horas; el lead se enfría en veinte minutos.

**3. WhatsApp — el lead se contacta solo.**
Al enviar, el usuario ve `Listo, [Nombre].` y a los 1.5 s se le abre WhatsApp con el
mensaje ya escrito. Tú recibes un mensaje suyo, no al revés.

### El detalle que hay que probar sí o sí

El navegador embebido de Instagram **bloquea redirecciones automáticas seguido**.
Por eso, junto al mensaje de éxito, siempre aparece un botón grande **"Abrir WhatsApp"**
que ya funciona sin depender de la redirección. Ese botón es el que salva el lead.

**Pruébalo desde Instagram de verdad**: pon el link en tu bio (o mándate un DM con él),
ábrelo desde la app, llena el formulario y confirma que llegas a WhatsApp.
En Chrome de escritorio siempre va a funcionar; ese no es el examen.

Los datos que se guardan por lead: nombre, teléfono en formato `+1XXXXXXXXXX`, estado,
ocupación, motivo, consentimiento, los cinco parámetros UTM y el referrer.

---

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
