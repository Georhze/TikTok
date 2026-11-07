import "@fontsource/montserrat/900.css";
import { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { earthTexture, cloudTexture, glowTexture, starTexture } from "../space/textures";
import { rng } from "../space/noise";

export type ProfilePicProps = { variant: "icon" | "monogram" };

const SIZE = 1080;
const HALF = 2; // ortho view: -2..2 world units

/** Brand avatar: a tiny Earth next to a giant star = "scale". Designed for a circular crop. */
export const ProfilePic: React.FC<ProfilePicProps> = ({ variant }) => {
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #141a3a 0%, #070814 60%, #02030a 100%)" }}>
      <ThreeCanvas
        orthographic
        width={SIZE}
        height={SIZE}
        camera={{ position: [0, 0, 100], zoom: SIZE / 2 / HALF, near: 1, far: 500 }}
        gl={{ alpha: true }}
      >
        <Scene variant={variant} />
      </ThreeCanvas>

      {variant === "monogram" ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 900,
              fontSize: 300,
              letterSpacing: -10,
              color: "white",
              marginTop: 40,
              textShadow: "0 0 60px rgba(0,0,0,0.9), 0 10px 0 rgba(0,0,0,0.55)",
            }}
          >
            M<span style={{ color: "#ffe600" }}>S</span>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Darken everything outside the circle so the square file looks finished too */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent ${SIZE / 2 - 36}px, #02030a ${SIZE / 2 - 34}px)`,
        }}
      />
      {/* Brand ring hugging the circular crop */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: SIZE - 70,
            height: SIZE - 70,
            borderRadius: "50%",
            border: "14px solid #ffe600",
            boxShadow: "0 0 50px rgba(255,230,0,0.45), inset 0 0 50px rgba(255,230,0,0.25)",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene: React.FC<ProfilePicProps> = ({ variant }) => {
  const tex = useMemo(
    () => ({
      earth: earthTexture(),
      clouds: cloudTexture(),
      sun: starTexture([255, 250, 210], [255, 176, 40], [214, 82, 10], 4, 21),
      sunGlow: glowTexture("rgba(255,190,80,1)", "rgba(255,90,0,0)"),
      atmo: glowTexture("rgba(110,180,255,0.9)", "rgba(40,100,255,0)"),
    }),
    [],
  );
  const stars = useMemo(() => {
    const r = rng(3);
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 4;
      pos[i * 3 + 1] = (r() - 0.5) * 4;
      pos[i * 3 + 2] = -50;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const mono = variant === "monogram";
  // Giant star rising from the bottom-right, tiny Earth top-left: the whole channel idea in one image
  const sun = mono ? { x: 0.0, y: -2.45, r: 1.9 } : { x: 0.42, y: -0.42, r: 1.12 };
  const earth = mono ? { x: -0.85, y: 0.9, r: 0.24 } : { x: -0.88, y: 0.88, r: 0.3 };

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, -2, 4]} intensity={5} color="#fff1d6" />
      <points geometry={stars}>
        <pointsMaterial size={3} sizeAttenuation={false} color="#cfd8ff" transparent opacity={0.8} />
      </points>

      <group position={[sun.x, sun.y, 0]}>
        <mesh rotation={[0.2, 0.6, 0]}>
          <sphereGeometry args={[sun.r, 128, 128]} />
          <meshBasicMaterial map={tex.sun} toneMapped={false} />
        </mesh>
        <sprite scale={[sun.r * 2.9, sun.r * 2.9, 1]}>
          <spriteMaterial map={tex.sunGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>

      <group position={[earth.x, earth.y, 5]}>
        <mesh rotation={[0.41, 2.2, 0]}>
          <sphereGeometry args={[earth.r, 96, 96]} />
          <meshStandardMaterial map={tex.earth} roughness={0.85} />
        </mesh>
        <mesh rotation={[0.41, 2.6, 0]} scale={1.015}>
          <sphereGeometry args={[earth.r, 96, 96]} />
          <meshStandardMaterial map={tex.clouds} transparent depthWrite={false} />
        </mesh>
        <sprite scale={[earth.r * 2.6, earth.r * 2.6, 1]}>
          <spriteMaterial map={tex.atmo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  );
};
