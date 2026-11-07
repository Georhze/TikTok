import { Composition } from "remotion";
import { Main3D, main3DSchema } from "./Main3D";
import { SpaceVideo } from "./space/SpaceVideo";
import { DURATION, FPS } from "./space/timeline";
import { ProfilePic } from "./brand/ProfilePic";

// TikTok / Reels / Shorts format: 1080x1920 vertical, 30fps
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpaceScale"
        component={SpaceVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Main3D"
        component={Main3D}
        durationInFrames={30 * 10}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={main3DSchema}
      />
      {/* Channel avatar — render with: npm run avatar */}
      <Composition
        id="ProfilePic"
        component={ProfilePic}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ variant: "icon" as "icon" | "monogram" }}
      />
    </>
  );
};
