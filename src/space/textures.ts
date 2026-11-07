import * as THREE from "three";
import { fbm } from "./noise";

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Paints an equirectangular texture; fn gets the unit-sphere point so there are no seams. */
const paint = (
  w: number,
  h: number,
  fn: (x: number, y: number, z: number, lat: number) => [number, number, number, number?],
) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = Math.PI / 2 - (j / h) * Math.PI;
    for (let i = 0; i < w; i++) {
      const lon = (i / w) * Math.PI * 2;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      const [r, g, b, a = 255] = fn(x, y, z, lat);
      const o = (j * w + i) * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

export const earthTexture = () =>
  paint(1024, 512, (x, y, z, lat) => {
    const n = fbm(x * 2.2 + 3, y * 2.2, z * 2.2, 6, 1);
    const absLat = Math.abs(lat) / (Math.PI / 2);
    if (absLat > 0.84 + (n - 0.5) * 0.15) return [235, 242, 250];
    const sea = 0.53;
    if (n < sea) {
      const d = clamp01((sea - n) / 0.15);
      const c = mix([38, 110, 190], [8, 32, 92], d);
      return [c[0], c[1], c[2]];
    }
    const h = clamp01((n - sea) / 0.2);
    const dry = fbm(x * 5, y * 5, z * 5, 3, 9);
    let c = mix([52, 128, 58], [30, 84, 40], h);
    if (dry > 0.55 && absLat < 0.45) c = mix(c, [196, 170, 110], clamp01((dry - 0.55) * 4));
    if (h > 0.8) c = mix(c, [130, 110, 90], (h - 0.8) * 5);
    return [c[0], c[1], c[2]];
  });

export const cloudTexture = () =>
  paint(1024, 512, (x, y, z) => {
    const n = fbm(x * 3 + 10, y * 6, z * 3, 6, 4);
    const a = clamp01((n - 0.5) * 3.2) * 255;
    return [255, 255, 255, a];
  });

export const jupiterTexture = () =>
  paint(1024, 512, (x, y, z, lat) => {
    const turb = fbm(x * 3, y * 3, z * 3, 5, 7);
    const band = Math.sin(lat * 16 + turb * 2.6);
    const fine = Math.sin(lat * 55 + turb * 9) * 0.5 + 0.5;
    const pal: RGB[] = [
      [238, 224, 200],
      [200, 150, 108],
      [168, 108, 72],
      [226, 196, 160],
    ];
    const t = band * 0.5 + 0.5;
    const idx = Math.min(2, Math.floor(t * 3));
    let c = mix(pal[idx], pal[idx + 1], t * 3 - idx);
    c = mix(c, [250, 240, 225], fine * 0.08);
    // Great Red Spot
    const lon = Math.atan2(z, x);
    const dx = (lon - 1.1) / 0.32;
    const dy = (lat + 0.38) / 0.11;
    const d = dx * dx + dy * dy;
    if (d < 1) c = mix(c, [190, 80, 50], (1 - d) * 0.85);
    return [c[0], c[1], c[2]];
  });

export const starTexture = (hot: RGB, mid: RGB, cool: RGB, scale: number, seed: number) =>
  paint(1024, 512, (x, y, z) => {
    const n = fbm(x * scale, y * scale, z * scale, 6, seed);
    const g = fbm(x * scale * 6, y * scale * 6, z * scale * 6, 3, seed + 5);
    const t = clamp01(n * 0.7 + g * 0.5 - 0.1);
    const c = t > 0.5 ? mix(mid, hot, (t - 0.5) * 2) : mix(cool, mid, t * 2);
    return [c[0], c[1], c[2]];
  });

/** Soft radial glow for sprites (atmospheres, star coronas, markers). */
export const glowTexture = (inner: string, outer: string) => {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};
