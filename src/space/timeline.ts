import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const DURATION = 26 * FPS;

// Real radii, in Earth radii. UY Scuti ~909 solar radii (Gaia-era estimate).
const R_EARTH = 1;
const R_JUPITER = 11.21;
const R_SUN = 109.2;
const R_UY = 909 * R_SUN;

// Bodies sit side by side on the x-axis, each new one to the right of the previous.
const X_EARTH = 0;
const X_JUPITER = X_EARTH + R_EARTH + 1.5 + R_JUPITER;
const X_SUN = X_JUPITER + R_JUPITER + 12 + R_SUN;
const X_UY = X_SUN + R_SUN + 150 + R_UY;

export type BodyId = "earth" | "jupiter" | "sun" | "uy";
export const BODIES: Record<BodyId, { r: number; x: number; label: string }> = {
  earth: { r: R_EARTH, x: X_EARTH, label: "Earth" },
  jupiter: { r: R_JUPITER, x: X_JUPITER, label: "Jupiter" },
  sun: { r: R_SUN, x: X_SUN, label: "Sun" },
  uy: { r: R_UY, x: X_UY, label: "UY Scuti" },
};

/** Vertical offset of the whole row of bodies (world units at z=0). */
export const ROW_Y = 0.25;

// Orthographic camera (true size comparison, no perspective distortion of giant spheres).
// Visible area at any depth: 2*HALF_W x 2*HALF_H world units.
export const HALF_H = 2.8;
export const HALF_W = HALF_H * (1080 / 1920);
export const ORTHO_ZOOM = 960 / HALF_H; // pixels per world unit
export const CAM_Z = 2000;

type Shot = { cx: number; v: number };
// Focus on body b, slightly offset so the previous (smaller) body is visible on its left.
const focus = (b: BodyId, zoom: number): Shot => ({
  cx: BODIES[b].x - 0.3 * BODIES[b].r,
  v: BODIES[b].r * zoom,
});

// Voice line start frames (from the generated voiceover)
export const LINES = {
  hook: 8,
  jupiter: 78,
  sunIntro: 191,
  sunFact: 267,
  uyIntro: 367,
  uyFact: 479,
  galaxy: 566,
  cta: 660,
};

export const KEYS: [number, Shot][] = [
  [0, { cx: 0, v: 1.35 }],
  [76, { cx: 0, v: 1.0 }],
  [80, { cx: 0, v: 1.0 }],
  [128, focus("jupiter", 1.05)],
  [188, focus("jupiter", 1.13)],
  [240, focus("sun", 1.05)],
  [362, focus("sun", 1.14)],
  [440, focus("uy", 1.05)],
  [566, focus("uy", 1.12)],
  [630, focus("uy", 45)],
];

/** Zoom transitions (start, end) — used for whoosh/impact SFX timing. */
export const ZOOMS = KEYS.slice(1)
  .map((k, i) => [KEYS[i][0], k[0], KEYS[i][1].v, k[1].v] as const)
  .filter(([, , va, vb]) => vb / va > 3)
  .map(([a, b]) => [a, b] as const);

const ease = Easing.inOut(Easing.cubic);

/** Camera state for a frame: view-center x and view radius (world units that map to 1 screen unit). */
export const getShot = (frame: number): Shot => {
  if (frame <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [fa, A] = KEYS[i];
    const [fb, B] = KEYS[i + 1];
    if (frame > fb) continue;
    const big = B.v / A.v > 3;
    const t = interpolate(frame, [fa, fb], [0, 1]);
    const e = big ? ease(t) : t;
    const v = Math.exp(Math.log(A.v) + (Math.log(B.v) - Math.log(A.v)) * e);
    const k = B.v / A.v;
    if (Math.abs(1 - k) < 1e-3) return { cx: A.cx + (B.cx - A.cx) * e, v };
    // Zoom around the one world point that stays fixed on screen.
    const p = (B.cx - A.cx * k) / (1 - k);
    return { cx: p + ((A.cx - p) * v) / A.v, v };
  }
  return KEYS[KEYS.length - 1][1];
};

/** Screen position (in px, 1080x1920) and on-screen radius (px) of a body at a frame. */
export const projectBody = (id: BodyId, frame: number) => {
  const { cx, v } = getShot(frame);
  const b = BODIES[id];
  const sx = (b.x - cx) / v;
  const sy = ROW_Y;
  return {
    x: 540 + (sx / HALF_W) * 540,
    y: 960 - (sy / HALF_H) * 960,
    r: ((b.r / v) / HALF_W) * 540,
  };
};
