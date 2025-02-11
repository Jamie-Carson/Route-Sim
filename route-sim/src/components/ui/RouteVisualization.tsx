import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoutePoint } from "@/types/types";

// Create a separate component for the actual 3D content
const RouteScene = ({ points }: { points: RoutePoint[] }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Draw route lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="blue" linewidth={2} />
      </line>

      {/* Draw points */}
      {points.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}

      <OrbitControls />
    </>
  );
};

// Main component with error boundary and suspense
const RouteVisualization = ({
  points = [],
  width = "100%",
  height = "400px",
}: {
  points: RoutePoint[];
  width?: string;
  height?: string;
}) => {
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        style={{ background: "#f0f0f0" }}
      >
        <Suspense fallback={null}>
          <RouteScene points={points} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RouteVisualization;
