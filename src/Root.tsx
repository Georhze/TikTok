import { Composition } from "remotion";
import { Main3D, main3DSchema } from "./Main3D";

// TikTok / Reels / Shorts format: 1080x1920 vertical, 30fps
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main3D"
      component={Main3D}
      durationInFrames={30 * 10}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={main3DSchema}
    />
  );
};
