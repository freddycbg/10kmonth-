import { Composition } from "remotion";
import { AimeeFig } from "./AimeeFig";
import { Corto } from "./Corto";
import { CortoB } from "./CortoB";
import { CortoC } from "./CortoC";
import { CortoD } from "./CortoD";
import { CortoE } from "./CortoE";
import { CortoF } from "./CortoF";
import { CortoG } from "./CortoG";
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
        id="CortoB"
        component={CortoB}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition
        id="CortoC"
        component={CortoC}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition
        id="CortoD"
        component={CortoD}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition
        id="CortoE"
        component={CortoE}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition
        id="CortoF"
        component={CortoF}
        durationInFrames={corto.durationInFrames}
        fps={corto.fps}
        width={corto.width}
        height={corto.height}
      />
      <Composition id="AimeeFig" component={AimeeFig} durationInFrames={555} fps={30} width={1080} height={1920} />
      <Composition
        id="CortoG"
        component={CortoG}
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
