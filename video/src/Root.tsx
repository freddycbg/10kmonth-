import { Composition } from "remotion";
import { Edit } from "./Edit";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Edit"
      component={Edit}
      durationInFrames={30 * 10}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
