import { AlarmClock, Check, Leaf, Sparkles, UtensilsCrossed, type LucideIcon } from "lucide-react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, ACCENT_GLOW, CREAM, SAGE, SCRIPT_FONT, TITLE_FONT } from "./fonts";

// Gráficos generados (vídeos de colaboración de Aimee; bandera, contador y lista añadidos para Johanna) (estilo influencer de sus referencias): frases clave
// con letra gruesa + cursiva, notificación de recordatorio, tarjeta de sugerencia, captura de la app flotando,
// insignia de descuento y casilla con el código. Todos entran con un pop elástico y salen en 5 fotogramas.
const ICONS: Record<string, LucideIcon> = { AlarmClock, Leaf, Sparkles, UtensilsCrossed };
const EXIT = 5;
// Sombra reforzada: la cursiva blanca se perdía sobre la pared clara (POV de Aimee).
const SHADOW = "0 3px 16px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.5)";
const CARD_SHADOW = "0 18px 50px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.18)";

type Line = { text: string; style: "bold" | "script"; size?: number };
export type OverlayProps = {
  type: string;
  x?: number;
  y?: number;
  rotate?: number;
  lines?: Line[];
  app?: string;
  title?: string;
  body?: string;
  time?: string;
  icon?: string;
  src?: string;
  width?: number;
  big?: string;
  small?: string;
  label?: string;
  code?: string;
  dark?: boolean;
  pill?: boolean;
  prefix?: string;
  value?: number;
  suffix?: string;
  items?: { text: string; at?: number }[];
};

const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  const exit = interpolate(frame, [durationInFrames - EXIT, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { pop: frame < delay ? 0 : pop, exit, frame, fps };
};

// Frase clave: líneas apiladas, gruesa en crema y cursiva en blanco, que se solapan un poco.
const Phrase: React.FC<OverlayProps> = ({ lines = [], x = 0.5, y = 0.2, rotate = 0, dark = false, pill = false }) => {
  const { width, height } = useVideoConfig();
  const { exit } = usePop();
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${exit})`,
        opacity: exit,
        textAlign: "center",
        whiteSpace: "nowrap",
        textShadow: dark ? "none" : SHADOW,
        // pill: tarjeta blanca detrás, para no mezclarse con lo que hay debajo (la pantalla del móvil).
        ...(pill
          ? { background: "rgba(255,255,255,0.94)", borderRadius: 34, padding: "18px 40px 22px", boxShadow: CARD_SHADOW }
          : {}),
      }}
    >
      {lines.map((l, i) => (
        <PhraseLine key={i} line={l} delay={i * 6} dark={dark} afterScript={i > 0 && lines[i - 1].style === "script"} />
      ))}
    </div>
  );
};

// dark: texto oscuro para fondos claros (el fondo amarillo de la toma del móvil).
const PhraseLine: React.FC<{ line: Line; delay: number; dark: boolean; afterScript: boolean }> = ({
  line,
  delay,
  dark,
  afterScript,
}) => {
  const { pop } = usePop(delay);
  const bold = line.style === "bold";
  return (
    <div
      style={{
        fontFamily: bold ? TITLE_FONT : SCRIPT_FONT,
        fontWeight: bold ? 800 : 500,
        fontStyle: bold ? "normal" : "italic",
        textTransform: bold ? "uppercase" : "none",
        fontSize: line.size ?? (bold ? 66 : 96),
        lineHeight: bold ? 1.0 : 0.95,
        // La cursiva se encaja bajo la línea gruesa; dos cursivas seguidas necesitan aire (los rasgos chocaban).
        marginTop: bold ? 0 : afterScript ? 6 : -10,
        color: dark ? (bold ? "#2F5546" : "#1C1C1E") : bold ? CREAM : "#FFFFFF",
        letterSpacing: bold ? "0.02em" : 0,
        opacity: Math.min(1, pop * 1.5),
        transform: `translateY(${(1 - pop) * 24}px) scale(${0.6 + 0.4 * pop})`,
      }}
    >
      {line.text}
    </div>
  );
};

// Notificación de recordatorio al estilo iOS, baja desde arriba.
const Notification: React.FC<OverlayProps> = ({ app = "Anna", title = "", body = "", time = "", y = 0.11 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit } = usePop();
  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.07,
        right: width * 0.07,
        top: height * y,
        transform: `translateY(${(1 - pop) * -220}px) scale(${0.96 + 0.04 * exit})`,
        opacity: Math.min(pop * 1.4, exit),
        background: "rgba(250, 250, 248, 0.94)",
        borderRadius: 44,
        padding: "30px 34px",
        boxShadow: CARD_SHADOW,
        display: "flex",
        gap: 26,
        alignItems: "center",
        fontFamily: TITLE_FONT,
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: 26,
          background: SAGE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Leaf size={62} color="#FFFFFF" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, color: "#1C1C1E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#6B6B70" }}>
          <span style={{ fontWeight: 800, letterSpacing: "0.04em" }}>{app.toUpperCase()}</span>
          <span style={{ fontWeight: 800 }}>{time}</span>
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#3A3A3C", marginTop: 4 }}>{body}</div>
      </div>
    </div>
  );
};

// Tarjeta de sugerencia con icono (p. ej. la receta que propone la app).
const Card: React.FC<OverlayProps> = ({ icon = "Sparkles", title = "", body = "", x = 0.5, y = 0.25, rotate = -3 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame, fps } = usePop();
  const Icon = ICONS[icon] ?? Sparkles;
  const float = Math.sin((frame / fps) * Math.PI * 1.2) * 6;
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y + float,
        transform: `translate(-50%, -50%) rotate(${rotate * pop}deg) scale(${pop * exit})`,
        width: width * 0.78,
        background: "#FFFFFF",
        borderRadius: 40,
        padding: "30px 34px",
        boxShadow: CARD_SHADOW,
        display: "flex",
        gap: 26,
        alignItems: "center",
        fontFamily: TITLE_FONT,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={66} color="#5C4A1E" strokeWidth={2.2} />
      </div>
      <div style={{ color: "#1C1C1E" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: SAGE, letterSpacing: "0.05em" }}>{title.toUpperCase()}</div>
        <div style={{ fontFamily: SCRIPT_FONT, fontStyle: "italic", fontWeight: 500, fontSize: 50, lineHeight: 1.1 }}>
          {body}
        </div>
      </div>
    </div>
  );
};

// Captura de la app flotando, con borde blanco, esquinas redondas y sombra.
const Screenshot: React.FC<OverlayProps> = ({ src = "", x = 0.5, y = 0.42, width: w = 0.56, rotate = -4 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame, fps } = usePop();
  const float = Math.sin((frame / fps) * Math.PI) * 8;
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: width * x,
        top: height * y + float,
        width: width * w,
        transform: `translate(-50%, -50%) rotate(${rotate + (1 - pop) * 10}deg) scale(${(0.5 + 0.5 * pop) * exit})`,
        opacity: Math.min(1, pop * 2),
        borderRadius: 42,
        border: "10px solid #FFFFFF",
        boxShadow: CARD_SHADOW,
      }}
    />
  );
};

// Insignia de descuento: círculo salvia con el porcentaje grande, entra con un pequeño balanceo.
const Badge: React.FC<OverlayProps> = ({ big = "20%", small = "", x = 0.78, y = 0.2 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame, fps } = usePop();
  const wiggle = Math.sin((frame / fps) * Math.PI * 3) * 4 * Math.max(0, 1 - frame / (fps * 1.2));
  const size = 300;
  return (
    <div
      style={{
        position: "absolute",
        left: width * x - size / 2,
        top: height * y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #A9D1BC, ${SAGE} 70%)`,
        border: "8px solid #FFFFFF",
        boxShadow: CARD_SHADOW,
        transform: `scale(${pop * exit}) rotate(${-8 + wiggle}deg)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFFFFF",
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        textShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontSize: 112, lineHeight: 0.95 }}>{big}</div>
      <div style={{ fontSize: 30, letterSpacing: "0.06em" }}>{small}</div>
    </div>
  );
};

// Casilla con el código: aparece vacía y la palomita se dibuja (como el "✓ Helloria" de la referencia 1).
const Code: React.FC<OverlayProps> = ({ label = "Código", code = "", x = 0.5, y = 0.6 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame } = usePop();
  const draw = interpolate(frame, [10, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y,
        transform: `translate(-50%, -50%) scale(${pop * exit})`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: "#FFFFFF",
        borderRadius: 999,
        padding: "22px 46px 22px 26px",
        boxShadow: CARD_SHADOW,
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: 22,
          border: `6px solid ${SAGE}`,
          background: draw > 0 ? SAGE : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ clipPath: `inset(0 ${100 - draw * 100}% 0 0)` }}>
          <Check size={64} color="#FFFFFF" strokeWidth={3.4} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, color: "#8E8E93", letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 70, color: "#1C1C1E", letterSpacing: "0.04em", lineHeight: 1 }}>{code}</div>
      </div>
    </div>
  );
};

// Bandera de Colombia ondeando (amarillo la mitad, azul y rojo un cuarto cada uno): franjas verticales desplazadas
// con una onda y sombreadas como tela. Debajo, el nombre del país.
const FLAG_SLICES = 28;
const Flag: React.FC<OverlayProps> = ({ x = 0.5, y = 0.22, width: w = 0.42, label = "COLOMBIA", rotate = -4 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame, fps } = usePop();
  const fw = width * w;
  const fh = fw * 0.66;
  const t = (frame / fps) * Math.PI * 2 * 0.9;
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y,
        transform: `translate(-50%, -50%) rotate(${rotate + (1 - pop) * -14}deg) scale(${pop * exit})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", width: fw, height: fh, filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.45))" }}>
        {new Array(FLAG_SLICES).fill(0).map((_, i) => {
          const k = i / (FLAG_SLICES - 1);
          // La onda crece hacia el lado libre (el asta queda a la izquierda).
          const wave = Math.sin(t - i * 0.42);
          const dy = wave * fh * 0.05 * (0.25 + k);
          const shade = 0.82 + 0.18 * (0.5 + 0.5 * Math.cos(t - i * 0.42));
          return (
            <div
              key={i}
              style={{
                width: fw / FLAG_SLICES + 0.6,
                height: fh,
                transform: `translateY(${dy}px)`,
                background: "linear-gradient(#FCD116 0 50%, #003893 50% 75%, #CE1126 75% 100%)",
                filter: `brightness(${shade})`,
                borderTopLeftRadius: i === 0 ? 14 : 0,
                borderBottomLeftRadius: i === 0 ? 14 : 0,
                borderTopRightRadius: i === FLAG_SLICES - 1 ? 14 : 0,
                borderBottomRightRadius: i === FLAG_SLICES - 1 ? 14 : 0,
              }}
            />
          );
        })}
      </div>
      {label ? (
        <div
          style={{
            marginTop: 26,
            fontFamily: TITLE_FONT,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: "0.08em",
            color: "#FFFFFF",
            textShadow: SHADOW,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

// Contador: el número sube desde 0 hasta value (p. ej. $15 / HORA) y da un pequeño golpe al llegar.
const COUNT_FRAMES = 16;
const Counter: React.FC<OverlayProps> = ({ prefix = "", value = 0, suffix = "", label = "", x = 0.5, y = 0.22 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame } = usePop();
  const k = interpolate(frame, [3, 3 + COUNT_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (v) => 1 - (1 - v) ** 3,
  });
  const hit = interpolate(frame, [3 + COUNT_FRAMES, 6 + COUNT_FRAMES, 11 + COUNT_FRAMES], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y,
        transform: `translate(-50%, -50%) scale(${pop * exit * hit})`,
        background: "rgba(14, 10, 10, 0.72)",
        border: `6px solid ${ACCENT}`,
        borderRadius: 48,
        padding: "18px 54px 26px",
        boxShadow: `0 0 50px ${ACCENT_GLOW}, 0 14px 30px rgba(0,0,0,0.45)`,
        textAlign: "center",
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {label ? (
        <div style={{ fontSize: 34, letterSpacing: "0.1em", color: CREAM, marginBottom: 2 }}>{label}</div>
      ) : null}
      <div style={{ color: "#FFFFFF", lineHeight: 1 }}>
        <span style={{ fontSize: 150 }}>
          {prefix}
          {Math.round(value * k)}
        </span>
        <span style={{ fontSize: 62, color: ACCENT, marginLeft: 12 }}>{suffix}</span>
      </div>
    </div>
  );
};

// Lista: tarjeta crema con casillas que se van marcando cuando se dice cada elemento (items[].at, de build_edit.py).
const Checklist: React.FC<OverlayProps> = ({ items = [], title = "", x = 0.5, y = 0.24 }) => {
  const { width, height } = useVideoConfig();
  const { pop, exit, frame, fps } = usePop();
  return (
    <div
      style={{
        position: "absolute",
        left: width * x,
        top: height * y,
        transform: `translate(-50%, -50%) rotate(${-2 * pop}deg) scale(${pop * exit})`,
        background: "rgba(255, 249, 242, 0.96)",
        borderRadius: 40,
        padding: "30px 46px 34px",
        boxShadow: CARD_SHADOW,
        fontFamily: TITLE_FONT,
        fontWeight: 800,
        minWidth: width * 0.62,
      }}
    >
      {title ? (
        <div style={{ fontSize: 30, letterSpacing: "0.1em", color: "#9A8F86", marginBottom: 14 }}>{title}</div>
      ) : null}
      {items.map((it, i) => {
        const at = it.at ?? i * 8;
        const show = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 200, mass: 0.6 } });
        const draw = interpolate(frame - at, [3, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              marginTop: i === 0 ? 0 : 18,
              opacity: frame < at ? 0.22 : 1,
              transform: `translateX(${(1 - show) * -30}px)`,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                border: `6px solid ${ACCENT}`,
                background: draw > 0 ? ACCENT : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ clipPath: `inset(0 ${100 - draw * 100}% 0 0)` }}>
                <Check size={54} color="#FFFFFF" strokeWidth={3.6} />
              </div>
            </div>
            <div style={{ fontSize: 62, color: "#2A2220", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Overlay: React.FC<OverlayProps> = (props) => {
  const C =
    {
      phrase: Phrase,
      notification: Notification,
      card: Card,
      image: Screenshot,
      badge: Badge,
      code: Code,
      flag: Flag,
      counter: Counter,
      checklist: Checklist,
    }[
      props.type
    ] ?? Phrase;
  return (
    <AbsoluteFill>
      <C {...props} />
    </AbsoluteFill>
  );
};
