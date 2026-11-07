import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";

// How many ms of words to group into one caption "page"
const SWITCH_CAPTIONS_EVERY_MS = 900;

type CaptionStyle = { fontFamily?: string; fontSize?: number; bottom?: number };

export const Captions: React.FC<{ src: string } & CaptionStyle> = ({ src, ...style }) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender("Loading captions"));
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(src)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch(() => {
        setCaptions([]);
        continueRender(handle);
      });
  }, [src, handle]);

  const pages = useMemo(() => {
    if (!captions) return [];
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    }).pages;
  }, [captions]);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? next.startMs : page.startMs + SWITCH_CAPTIONS_EVERY_MS;
        const duration = Math.max(1, Math.round(((endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} {...style} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const HIGHLIGHT = "#ffe600";

const CaptionPage: React.FC<{ page: TikTokPage } & CaptionStyle> = ({
  page,
  fontFamily = "Arial Black, Helvetica, sans-serif",
  fontSize = 84,
  bottom = 420,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Time relative to the page start (the Sequence resets frame to 0)
  const absoluteMs = page.startMs + (frame / fps) * 1000;
  const pop = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 6 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom }}>
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 900,
          textAlign: "center",
          color: "white",
          textTransform: "uppercase",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke",
          transform: `scale(${0.8 + 0.2 * pop})`,
          maxWidth: 900,
          lineHeight: 1.15,
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= absoluteMs && t.toMs > absoluteMs;
          return (
            <span key={t.fromMs} style={{ color: active ? HIGHLIGHT : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
