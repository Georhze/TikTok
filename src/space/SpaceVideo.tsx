import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { SpaceScene } from "./SpaceScene";
import { Overlay, FONT } from "./Overlay";
import { Captions } from "../Captions";
import { CAM_Z, ORTHO_ZOOM, ZOOMS } from "./timeline";

export const SpaceVideo: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#02030a" }}>
      <ThreeCanvas
        orthographic
        width={width}
        height={height}
        camera={{ position: [0, 0, CAM_Z], zoom: ORTHO_ZOOM, near: 1, far: 5000 }}
      >
        <SpaceScene />
      </ThreeCanvas>

      <Overlay />
      <Captions src={staticFile("space/captions.json")} fontFamily={FONT} fontSize={80} bottom={330} />

      {/* Audio: voiceover + ambient music + a whoosh into every zoom and an impact when it lands */}
      <Audio src={staticFile("space/voiceover.mp3")} />
      <Audio src={staticFile("space/music.mp3")} volume={0.55} />
      {ZOOMS.map(([start, end]) => (
        <Sequence key={start} from={Math.max(0, start - 12)} layout="none">
          <Audio src={staticFile("space/whoosh.wav")} volume={0.5} />
          <Sequence from={end - start + 12 - 3} layout="none">
            <Audio src={staticFile("space/impact.wav")} volume={0.7} />
          </Sequence>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
