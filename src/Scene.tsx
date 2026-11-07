import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { RoundedBox, Torus } from "@react-three/drei";

// IMPORTANT: drive every animation from useCurrentFrame(), never from useFrame()/clock.
// That keeps renders deterministic and lets Remotion render frames in parallel.
export const Scene: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 12 } });
  const rotation = frame * 0.03;
  const float = Math.sin(frame / 15) * 0.2;
  const ringScale = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#00e5ff" />

      <group position={[0, 0.8 + float, 0]} scale={entrance}>
        <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.2} smoothness={6} rotation={[rotation, rotation * 1.3, 0]}>
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.25} />
        </RoundedBox>
        <Torus args={[1.6, 0.06, 32, 128]} rotation={[Math.PI / 2.4, rotation, 0]} scale={ringScale}>
          <meshStandardMaterial color="#ffffff" emissive="#00e5ff" emissiveIntensity={1.5} />
        </Torus>
      </group>
    </>
  );
};
