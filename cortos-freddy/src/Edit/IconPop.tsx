import {
  ArrowDown,
  BadgeCheck,
  CalendarDays,
  DoorOpen,
  Heart,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircle,
  Plane,
  Send,
  ShieldCheck,
  Siren,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, ACCENT_GLOW, GRAPHIC_FONT } from "./fonts";

// Icono animado para mostrar lo que se dice (estilo de Freddy): insignia redonda oscura con aro y brillo del color
// de acento (fonts.ts) y el icono dentro. Entra con un pop elástico y un giro corto, flota mientras está y sale encogiéndose.
// anim: "pop" (flota), "bounce" (rebota hacia abajo: flecha a los comentarios), "fly" (sale volando: enviar).
const ICONS: Record<string, LucideIcon> = {
  ArrowDown,
  BadgeCheck,
  CalendarDays,
  DoorOpen,
  Heart,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircle,
  Plane,
  Send,
  ShieldCheck,
  Siren,
  TrendingUp,
  TriangleAlert,
  Users,
};
const EXIT_FRAMES = 5;

export const IconPop: React.FC<{
  icon: string;
  x: number;
  y: number;
  size: number;
  anim: string;
  label: string;
}> = ({ icon, x, y, size, anim, label }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const Icon = ICONS[icon] ?? Lightbulb;

  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const exit = interpolate(frame, [durationInFrames - EXIT_FRAMES, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const t = frame / fps;
  let dx = 0;
  let dy = Math.sin(t * Math.PI * 1.6) * 6;
  if (anim === "bounce") {
    dy = Math.abs(Math.sin(t * Math.PI * 2.4)) * 34;
  }
  if (anim === "fly") {
    const fly = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    dx = fly * fly * width * 0.5;
    dy -= fly * fly * height * 0.15;
  }
  const scale = pop * (anim === "fly" ? 1 : exit);
  const rotate = (1 - pop) * -18;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: width * x - size / 2,
          top: height * y - size / 2,
          width: size,
          height: size,
          transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rotate}deg)`,
          opacity: anim === "fly" ? exit : 1,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(8, 14, 12, 0.72)",
            border: `${Math.round(size * 0.035)}px solid ${ACCENT}`,
            boxShadow: `0 0 ${size * 0.25}px ${ACCENT_GLOW}, 0 8px 24px rgba(0,0,0,0.45)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={size * 0.56} color={ACCENT} strokeWidth={2.4} />
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              top: size * 1.05,
              left: -size,
              right: -size,
              textAlign: "center",
              fontFamily: GRAPHIC_FONT,
              fontWeight: 800,
              fontSize: size * 0.34,
              color: "#FFFFFF",
              textShadow: "0 3px 12px rgba(0,0,0,0.7)",
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
