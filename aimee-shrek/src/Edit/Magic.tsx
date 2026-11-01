import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

// Transformación mágica de la escena de Shrek (como en la película, cuando Shrek y Fiona vuelven a ser ogros):
// destellos azules y blancos que suben en espiral alrededor de los niños, un brillo azul que crece, fogonazo blanco
// justo en el corte de "normales" a "caras verdes" (lo tapa) y después los destellos se dispersan y se apagan.
// La Sequence empieza "build" fotogramas antes del corte; dura build + after.
const N = 220;
const TRAIL = 4; // copias anteriores de cada destello: estela en espiral
const COLORS = ["#FFFFFF", "#CFE8FF", "#8FD0FF", "#5AB4FF", "#B9A8FF"];

export const Magic: React.FC<{ build: number; after: number }> = ({ build, after }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cut = build;
  const pin = interpolate(frame, [0, cut], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pout = interpolate(frame, [cut, cut + after], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glow = frame < cut ? 0.75 * pin ** 1.4 : 0.75 * (1 - pout) ** 2;
  // La habitación es muy clara: se oscurece y se tiñe de azul durante la magia para que los destellos se vean.
  const dim = frame < cut ? 0.7 * pin ** 0.7 : 0.7 * (1 - pout) ** 1.5;
  const flash = interpolate(frame, [cut - 4, cut - 1, cut + 1, cut + 8], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cx = width * 0.5;
  const sparks = [];
  for (let i = 0; i < N; i++) {
   for (let k = TRAIL; k >= 0; k--) {
    const spawn = random(`spawn-${i}`) * cut * 0.85;
    const t = frame - spawn - k * 1.2;
    if (t < 0) {
      continue;
    }
    const theta0 = random(`th-${i}`) * Math.PI * 2;
    const omega = (0.09 + random(`om-${i}`) * 0.08) * (random(`dir-${i}`) < 0.85 ? 1 : -1);
    const r0 = width * (0.14 + random(`r-${i}`) * 0.3);
    const y0 = height * (0.55 + random(`y-${i}`) * 0.42);
    const rise = height * (0.006 + random(`rise-${i}`) * 0.01);
    const theta = theta0 + omega * t;
    // Después del corte la espiral se abre y los destellos salen hacia fuera.
    const r = r0 * (1 - 0.25 * pin) * (1 + 1.4 * pout ** 1.3);
    const depth = Math.sin(theta); // >0: delante de los niños, más grande y brillante
    const x = cx + r * Math.cos(theta);
    const y = y0 - rise * t - height * 0.08 * pout;
    const twinkle = 0.55 + 0.45 * Math.sin(t * (0.5 + random(`tw-${i}`) * 0.6) + i);
    const fadeIn = interpolate(t, [0, 6], [0, 1], { extrapolateRight: "clamp" });
    const alpha = fadeIn * twinkle * (0.55 + 0.45 * (depth + 1) / 2) * (1 - pout) ** 1.2 * (1 - k / (TRAIL + 1)) ** 1.5;
    if (alpha <= 0.01 || y < -40) {
      continue;
    }
    const size = (10 + random(`s-${i}`) * 22) * (0.75 + 0.35 * (depth + 1) / 2) * (1 + 0.5 * pin) * (1 - 0.15 * k);
    const color = COLORS[Math.floor(random(`c-${i}`) * COLORS.length)];
    const star = k === 0 && random(`star-${i}`) < 0.3;
    sparks.push(
      <div
        key={`${i}-${k}`}
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity: alpha,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFFFFF 0%, ${color} 35%, rgba(90,170,255,0) 70%)`,
          boxShadow: `0 0 ${size * 0.8}px ${size * 0.25}px rgba(60,150,255,0.9), 0 0 ${size * 2}px ${color}`,
        }}
      >
        {star ? (
          <>
            <div
              style={{
                position: "absolute",
                left: -size * 1.2,
                top: size / 2 - 1.5,
                width: size * 3.4,
                height: 3,
                background: "linear-gradient(90deg, rgba(255,255,255,0), #FFFFFF, rgba(255,255,255,0))",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -size * 1.2,
                left: size / 2 - 1.5,
                height: size * 3.4,
                width: 3,
                background: "linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF, rgba(255,255,255,0))",
              }}
            />
          </>
        ) : null}
      </div>,
    );
   }
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundColor: "#0B1A55", opacity: dim * 0.75 }} />
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: glow,
          background:
            "radial-gradient(ellipse 60% 45% at 50% 62%, rgba(120,190,255,0.95) 0%, rgba(70,130,255,0.55) 45%, rgba(40,60,160,0) 80%)",
        }}
      />
      <AbsoluteFill>{sparks}</AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#F4FAFF", opacity: flash }} />
    </AbsoluteFill>
  );
};
