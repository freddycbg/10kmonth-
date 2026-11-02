import { Composition } from "remotion";
import { Corto } from "./Corto";
import corto from "./Corto/corto.json";
import { Edit } from "./Edit";
import edit from "./Edit/edit.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Corto"
        component={Corto}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition
        id="Edit"
        component={Edit}
        durationInFrames={edit.durationInFrames}
        fps={edit.fps}
        width={edit.width}
        height={edit.height}
      />
    </>
  );
};
