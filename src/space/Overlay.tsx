import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { BodyId, LINES, projectBody } from "./timeline";

export const FONT = "Montserrat, Arial Black, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

type Card = {
  from: number;
  to: number;
  tag: string;
  title: string;
  stat: (frame: number) => string;
};

// Count a number up between two frames
const count = (frame: number, from: number, to: number, value: number) =>
  fmt(interpolate(frame, [from, to], [0, value], { ...clamp, easing: Easing.out(Easing.cubic) }));

const CARDS: Card[] = [
  { from: 0, to: LINES.jupiter, tag: "SIZE CHECK", title: "EARTH", stat: () => "12,742 km wide" },
  {
    from: LINES.jupiter,
    to: LINES.sunIntro,
    tag: "#1",
    title: "JUPITER",
    stat: (f) => `${count(f, 86, 140, 1300)} Earths fit inside`,
  },
  {
    from: LINES.sunIntro,
    to: LINES.uyIntro,
    tag: "#2",
    title: "THE SUN",
    stat: (f) => (f < LINES.sunFact ? "109x wider than Earth" : `${count(f, LINES.sunFact + 20, LINES.sunFact + 75, 1_300_000)} Earths`),
  },
  {
    from: LINES.uyIntro,
    to: LINES.galaxy,
    tag: "#3",
    title: "UY SCUTI",
    stat: (f) => (f < LINES.uyFact ? "909x wider than the Sun" : `~${count(f, LINES.uyFact, LINES.uyFact + 60, 750_000_000)} Suns`),
  },
  { from: LINES.galaxy, to: LINES.cta, tag: "#4", title: "MILKY WAY", stat: () => "100-400 billion stars" },
  { from: LINES.cta, to: 99999, tag: "PART 2?", title: "FOLLOW", stat: () => "for more space facts" },
];

const StatCard: React.FC<{ card: Card }> = ({ card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - card.from;
  const enter = spring({ frame: local, fps, config: { damping: 14, stiffness: 160 } });
  const exit = interpolate(frame, [card.to - 5, card.to], [1, 0], clamp);
  const cta = card.title === "FOLLOW";
  const pulse = cta ? 1 + Math.sin(local / 5) * 0.04 : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, opacity: exit }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * -60}px) scale(${(0.85 + 0.15 * enter) * pulse})`,
          opacity: enter,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            background: cta ? "#ff2d55" : "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.35)",
            color: "white",
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 6,
            padding: "8px 26px",
            borderRadius: 999,
          }}
        >
          {card.tag}
        </div>
        <div
          style={{
            color: "white",
            fontWeight: 900,
            fontSize: 132,
            lineHeight: 1.05,
            marginTop: 14,
            textShadow: "0 0 40px rgba(120,180,255,0.6), 0 6px 0 rgba(0,0,0,0.6)",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            color: "#ffe600",
            fontWeight: 800,
            fontSize: 54,
            marginTop: 6,
            textShadow: "0 4px 0 rgba(0,0,0,0.7)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {card.stat(frame)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Little name tags that follow bodies once they have shrunk to dots. */
const BodyLabels: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 572) return null;
  const ids: BodyId[] = ["earth", "jupiter", "sun"];
  const visibility = (id: BodyId) => {
    const p = projectBody(id, frame);
    return (
      interpolate(p.r, [40, 70], [1, 0], clamp) *
      interpolate(p.x, [-40, 60], [0, 1], clamp) *
      interpolate(frame, [560, 572], [1, 0], clamp)
    );
  };
  return (
    <AbsoluteFill>
      {ids.map((id, i) => {
        const p = projectBody(id, frame);
        // Once a bigger neighbour has also shrunk to a dot right next to this one, only label the bigger one
        // (Jupiter's tag sits above its dot, so it can coexist with Earth's tag below).
        const crowdedBy = ids.slice(i + 1).filter((o) => !(id === "earth" && o === "jupiter"));
        const hidden = Math.max(0, ...crowdedBy.map(visibility));
        const opacity = visibility(id) * (1 - hidden);
        if (opacity <= 0) return null;
        const above = id === "jupiter";
        const below = (Math.max(p.r, 10) + 46) * (above ? -1.9 : 1);
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + below,
              transform: "translateX(-50%)",
              opacity,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 36,
              color: "white",
              padding: "6px 18px",
              borderRadius: 14,
              background: "rgba(0,0,0,0.55)",
              border: "2px solid rgba(255,255,255,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: above ? "100%" : -below + Math.max(p.r, 10) + 8,
                width: 3,
                height: Math.abs(below) - Math.max(p.r, 10) - (above ? 60 : 8),
                background: "rgba(255,255,255,0.6)",
              }}
            />
            {id === "earth" ? "Earth (you are here)" : id === "sun" ? "The Sun" : "Jupiter"}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const card = CARDS.find((c) => frame >= c.from && frame < c.to);
  return (
    <>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)" }}
      />
      <BodyLabels />
      {card ? <StatCard key={card.title} card={card} /> : null}
    </>
  );
};
