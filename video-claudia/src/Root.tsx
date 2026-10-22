import { Composition } from "remotion";
import { Edit } from "./Edit";
import edit from "./Edit/edit.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Edit"
      component={Edit}
      durationInFrames={edit.durationInFrames}
      fps={edit.fps}
      width={edit.width}
      height={edit.height}
    />
  );
};
