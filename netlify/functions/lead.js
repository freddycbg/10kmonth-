/**
 * Reenvía cada lead a un webhook externo (Zapier, CRM, lo que sea)
 * sin tocar el código del sitio.
 *
 * Se configura en Netlify → Site settings → Environment variables:
 *   LEAD_WEBHOOK_URL = https://hooks.zapier.com/hooks/catch/…
 *
 * Si la variable no está puesta, la función no hace nada y responde 204.
 * El lead NO se pierde: Netlify Forms sigue siendo la fuente de verdad.
 */
exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const destino = process.env.LEAD_WEBHOOK_URL;
  if (!destino) {
    return { statusCode: 204, body: "" }; // webhook no configurado: no-op
  }

  let datos;
  try {
    datos = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "JSON inválido" };
  }

  // Honeypot: si el bot llenó el campo oculto, lo tiramos en silencio.
  if (datos["bot-field"]) {
    return { statusCode: 204, body: "" };
  }

  const carga = {
    nombre:        String(datos.nombre || "").slice(0, 120),
    telefono:      String(datos.telefono || "").slice(0, 20),
    estado:        String(datos.estado || "").slice(0, 60),
    ocupacion:     String(datos.ocupacion || "").slice(0, 200),
    motivo:        String(datos.motivo || "").slice(0, 1000),
    consentimiento: datos.consentimiento === "si",
    utm_source:    String(datos.utm_source || "").slice(0, 120),
    utm_medium:    String(datos.utm_medium || "").slice(0, 120),
    utm_campaign:  String(datos.utm_campaign || "").slice(0, 120),
    utm_content:   String(datos.utm_content || "").slice(0, 120),
    utm_term:      String(datos.utm_term || "").slice(0, 120),
    referrer:      String(datos.referrer || "").slice(0, 200),
    recibido_en:   new Date().toISOString(),
    origen:        "10kmonthgroup.com",
  };

  try {
    const r = await fetch(destino, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(carga),
    });
    return { statusCode: r.ok ? 204 : 502, body: "" };
  } catch (e) {
    // Nunca reventamos: el usuario ya va camino a WhatsApp.
    console.error("Webhook falló:", e.message);
    return { statusCode: 502, body: "" };
  }
};
