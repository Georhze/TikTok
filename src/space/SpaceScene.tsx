import { useMemo } from "react";
import * as THREE from "three";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { BODIES, BodyId, getShot, HALF_W, LINES, ROW_Y } from "./timeline";
import { cloudTexture, earthTexture, glowTexture, jupiterTexture, starTexture } from "./textures";
import { rng } from "./noise";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Glow sprite whose on-screen size never drops below `minScreen` (so tiny bodies stay visible as dots). */
const Glow: React.FC<{
  tex: THREE.Texture;
  size: number;
  v: number;
  minScreen: number;
  opacity?: number;
  /** Frame at which the glow starts fading in (huge star halos would otherwise cover the earlier shots). */
  from?: number;
}> = ({ tex, size, v, minScreen, opacity = 1, from = 0 }) => {
  const frame = useCurrentFrame();
  const s = Math.max(size, minScreen * v);
  const fade = interpolate(frame, [from, from + 30], [0, 1], clamp);
  return (
    <sprite scale={[s, s, 1]}>
      <spriteMaterial
        map={tex}
        transparent
        opacity={opacity * fade}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
};

/** Positions a body on the row and skips it entirely while it is off-screen. */
const Body: React.FC<{ id: BodyId; children: React.ReactNode }> = ({ id, children }) => {
  const { cx, v } = getShot(useCurrentFrame());
  const b = BODIES[id];
  const left = (b.x - b.r * 1.7 - cx) / v;
  const right = (b.x + b.r * 1.7 - cx) / v;
  if (left > HALF_W * 1.05 || right < -HALF_W * 1.05) return null;
  return <group position={[b.x, 0, 0]}>{children}</group>;
};

export const SpaceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { cx, v } = getShot(frame);

  const tex = useMemo(
    () => ({
      earth: earthTexture(),
      clouds: cloudTexture(),
      jupiter: jupiterTexture(),
      sun: starTexture([255, 250, 210], [255, 176, 40], [214, 82, 10], 4, 21),
      uy: starTexture([255, 190, 120], [230, 80, 30], [120, 18, 8], 2.2, 33),
      atmo: glowTexture("rgba(110,180,255,0.9)", "rgba(40,100,255,0)"),
      sunGlow: glowTexture("rgba(255,190,80,1)", "rgba(255,90,0,0)"),
      uyGlow: glowTexture("rgba(255,110,50,1)", "rgba(180,20,0,0)"),
      dot: glowTexture("rgba(255,255,255,1)", "rgba(160,200,255,0)"),
      jupGlow: glowTexture("rgba(255,220,180,0.6)", "rgba(255,180,120,0)"),
    }),
    [],
  );

  // Bodies fade out as we zoom out into the galaxy
  const bodiesOpacity = interpolate(frame, [600, 640], [1, 0], clamp);
  const galaxyIn = interpolate(frame, [596, 660], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const spin = frame * 0.004;

  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-3, 2, 4]} intensity={3.2} />

      <Starfield frame={frame} v={v} />

      {bodiesOpacity > 0 && (
        <group position={[-cx / v, ROW_Y, 0]} scale={1 / v}>
          <Body id="earth">
            <mesh rotation={[0.41, spin * 2.5 - 1.2, 0]}>
              <sphereGeometry args={[1, 96, 96]} />
              <meshStandardMaterial map={tex.earth} roughness={0.85} metalness={0} />
            </mesh>
            <mesh rotation={[0.41, spin * 3.1 - 1.2, 0]} scale={1.012}>
              <sphereGeometry args={[1, 96, 96]} />
              <meshStandardMaterial map={tex.clouds} transparent depthWrite={false} roughness={1} />
            </mesh>
            <Glow tex={tex.atmo} size={2.5} v={v} minScreen={0.05} opacity={bodiesOpacity} />
          </Body>

          <Body id="jupiter">
            <mesh rotation={[0.05, spin * 1.5, 0]} scale={[1, 0.935, 1]}>
              <sphereGeometry args={[BODIES.jupiter.r, 128, 128]} />
              <meshStandardMaterial map={tex.jupiter} roughness={0.9} />
            </mesh>
            <Glow tex={tex.jupGlow} size={BODIES.jupiter.r * 2.3} v={v} minScreen={0.05} from={80} opacity={bodiesOpacity} />
          </Body>

          <Body id="sun">
            <mesh rotation={[0.1, spin * 0.6, 0]}>
              <sphereGeometry args={[BODIES.sun.r, 128, 128]} />
              <meshBasicMaterial map={tex.sun} toneMapped={false} />
            </mesh>
            <Glow tex={tex.sunGlow} size={BODIES.sun.r * 3.4} v={v} minScreen={0.07} from={195} opacity={bodiesOpacity} />
          </Body>

          <Body id="uy">
            <mesh rotation={[0.2, spin * 0.3, 0]}>
              <sphereGeometry args={[BODIES.uy.r, 128, 128]} />
              <meshBasicMaterial map={tex.uy} toneMapped={false} />
            </mesh>
            <Glow tex={tex.uyGlow} size={BODIES.uy.r * 3} v={v} minScreen={0.08} from={372} opacity={bodiesOpacity} />
          </Body>
        </group>
      )}

      {galaxyIn > 0 && <Galaxy frame={frame} appear={galaxyIn} glow={tex.sunGlow} />}
    </>
  );
};

const Starfield: React.FC<{ frame: number; v: number }> = ({ frame, v }) => {
  const geom = useMemo(() => {
    const r = rng(7);
    const n = 3500;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 7;
      pos[i * 3 + 1] = (r() - 0.5) * 7;
      pos[i * 3 + 2] = -1500;
      const b = 0.4 + r() * 0.6;
      const tint = r();
      col[i * 3] = b * (tint > 0.8 ? 1 : 0.85);
      col[i * 3 + 1] = b * 0.9;
      col[i * 3 + 2] = b * (tint < 0.3 ? 1 : 0.95);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  // Rotate subtly with time and with zoom level, giving a sense of motion during zooms
  return (
    <points geometry={geom} rotation={[0, 0, frame * 0.0006 + Math.log(v) * 0.05]}>
      <pointsMaterial size={2.2} sizeAttenuation={false} vertexColors transparent opacity={0.9} />
    </points>
  );
};

const Galaxy: React.FC<{ frame: number; appear: number; glow: THREE.Texture }> = ({ frame, appear, glow }) => {
  const geom = useMemo(() => {
    const r = rng(42);
    const n = 30000;
    const arms = 4;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const core = new THREE.Color("#ffe2b0");
    const edge = new THREE.Color("#6fa8ff");
    const pink = new THREE.Color("#ff7ad9");
    for (let i = 0; i < n; i++) {
      const rad = Math.pow(r(), 0.7) * 2.4;
      const arm = (i % arms) * ((Math.PI * 2) / arms);
      const spread = (r() - 0.5) * (0.35 + rad * 0.12) * 2;
      const ang = rad * 2.4 + arm + spread;
      const jitter = () => (r() - 0.5) * 0.18 * (1.2 - rad / 2.4);
      pos[i * 3] = Math.cos(ang) * rad + jitter();
      pos[i * 3 + 1] = jitter() * 0.6;
      pos[i * 3 + 2] = Math.sin(ang) * rad + jitter();
      const c = core.clone().lerp(edge, Math.min(1, rad / 1.8));
      if (r() < 0.04) c.lerp(pink, 0.7);
      const b = 0.55 + r() * 0.45;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const s = 0.35 + appear * 0.65;
  return (
    <group position={[0, ROW_Y, 0]} rotation={[0.95, 0, 0.25]} scale={s}>
      <group rotation={[0, -frame * 0.006, 0]}>
        <points geometry={geom}>
          <pointsMaterial
            size={2}
            sizeAttenuation={false}
            vertexColors
            transparent
            opacity={appear}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
      <sprite scale={[1.1, 1.1, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.55 * appear} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
};

export { LINES };
