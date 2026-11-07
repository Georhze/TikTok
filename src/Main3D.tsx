import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { Scene } from "./Scene";
import { Captions } from "./Captions";

export type Main3DProps = {
  /** File in /public, e.g. "voiceover.mp3". Leave empty for no audio. */
  audioFile: string;
  /** File in /public with captions JSON (Caption[] from @remotion/captions). */
  captionsFile: string;
  color: string;
};

export const main3DSchema: Main3DProps = {
  audioFile: "",
  captionsFile: "captions.json",
  color: "#ff2d55",
};

export const Main3D: React.FC<Main3DProps> = ({ audioFile, captionsFile, color }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0f0c29,#302b63,#24243e)" }}>
      {/* 3D layer. Always use <ThreeCanvas> (not R3F <Canvas>) so frames render deterministically. */}
      <ThreeCanvas linear width={width} height={height} camera={{ position: [0, 0, 6], fov: 50 }}>
        <Scene color={color} />
      </ThreeCanvas>

      {/* Captions layer */}
      {captionsFile ? <Captions src={staticFile(captionsFile)} /> : null}

      {/* Audio layer (voiceover / music) */}
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
    </AbsoluteFill>
  );
};
