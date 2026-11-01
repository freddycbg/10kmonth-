import { Video } from "@remotion/media";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useArollStyle } from "./ARoll";
import fg from "./fg.json";

// Recorte del orador encima de los títulos cinéticos: una segunda copia del A-roll con la máscara de su silueta
// (scripts/mattes.py). Al ser el mismo vídeo con la misma transformación, los píxeles coinciden con el base y
// el título queda "detrás" de la cabeza.
const masks = fg.masks as Record<string, number[]>;

const maskSrc = (frame: number) => staticFile(`media/fg/m${frame}.png`);

export const Foreground: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame() + from;
  const style = useArollStyle(from);
  const rect = masks[String(frame)];

  // La máscara es una imagen CSS y Remotion no espera por ella: se precargan y decodifican todas las del tramo
  // al montar, si no un fotograma podría salir sin máscara y el recorte taparía el título entero.
  const [handle] = useState(() => delayRender("máscaras del orador"));
  const [images] = useState<HTMLImageElement[]>([]);
  useEffect(() => {
    const loads: Promise<void>[] = [];
    for (let f = from; f <= to; f++) {
      if (masks[String(f)]) {
        const img = new Image();
        img.src = maskSrc(f);
        images.push(img);
        loads.push(img.decode());
      }
    }
    Promise.all(loads)
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [from, to, handle, images]);

  if (!rect) {
    return null;
  }
  const src = maskSrc(frame);
  const [x, y, w, h] = rect;
  const mask = {
    maskImage: `url(${src})`,
    maskSize: `${w}px ${h}px`,
    maskPosition: `${x}px ${y}px`,
    maskRepeat: "no-repeat",
    WebkitMaskImage: `url(${src})`,
    WebkitMaskSize: `${w}px ${h}px`,
    WebkitMaskPosition: `${x}px ${y}px`,
    WebkitMaskRepeat: "no-repeat",
  };
  return (
    <AbsoluteFill>
      <Video
        name="Orador (recorte)"
        src={staticFile("media/aroll.mp4")}
        muted
        trimBefore={from}
        style={{ ...style, ...mask }}
      />
    </AbsoluteFill>
  );
};
