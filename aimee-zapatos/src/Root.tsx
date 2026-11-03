import { Composition } from "remotion";
import { Zapatos } from "./Zapatos";

export const RemotionRoot: React.FC = () => (
  <Composition id="Zapatos" component={Zapatos} durationInFrames={416} fps={30} width={1080} height={1920} />
);
