import { useRef, useEffect, useMemo, createContext, useContext } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import type { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useAudioAnalysisCallback } from "@/hooks";

// Context to pass audio analysis functions into the Three.js scene
interface AudioAnalysisContext {
  getFrequencyData: () => Uint8Array | null;
  getTimeDomainData: () => Uint8Array | null;
  isRunning: () => boolean;
}

const AudioAnalysisContext = createContext<AudioAnalysisContext | null>(null);

function useAudioAnalysisFromContext() {
  const context = useContext(AudioAnalysisContext);
  if (!context) {
    // Return dummy functions if no context (shouldn't happen in practice)
    return {
      getFrequencyData: () => null,
      getTimeDomainData: () => null,
      isRunning: () => false,
    };
  }
  return context;
}

// Bar spectrum visualizer component
function BarSpectrum({ barCount = 64 }: { barCount?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { getFrequencyData } = useAudioAnalysisFromContext();

  // Create geometry and material
  const geometry = useMemo(() => new THREE.BoxGeometry(0.8, 1, 0.1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.4, 0.2, 1),
        toneMapped: false,
      }),
    []
  );

  // Bar spacing - tighter to fit in view
  const barSpacing = 0.15;

  // Initialize instances
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      const x = (i - barCount / 2) * barSpacing;
      dummy.position.set(x, 0, 0);
      dummy.scale.set(1, 0.5, 1); // Start with visible minimum height
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [barCount, barSpacing]);

  // Animate based on audio data
  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      // Get frequency value (0-255) and normalize
      let value = 0.5; // Minimum visible height
      if (frequencyData) {
        const index = Math.floor((i / barCount) * frequencyData.length);
        value = Math.max(0.5, (frequencyData[index] / 255) * 5);
      }

      const x = (i - barCount / 2) * barSpacing;
      dummy.position.set(x, value / 2, 0);
      dummy.scale.set(1, value, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Update color based on value
      const color = new THREE.Color();
      color.setHSL((value / 5) * 0.3, 1, 0.5 + (value / 5) * 0.3);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, barCount]}
    />
  );
}

// Floating particles for ambient effect
function AmbientParticles({ count = 100 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5, 0.3, 1),
        toneMapped: false,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  // Store particle positions and velocities
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 10
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        0
      ),
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);

      // Wrap around edges
      if (particle.position.x > 50) particle.position.x = -50;
      if (particle.position.x < -50) particle.position.x = 50;
      if (particle.position.y > 25) particle.position.y = -25;
      if (particle.position.y < -25) particle.position.y = 25;

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(0.5 + Math.sin(Date.now() * 0.001 + i) * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
}

// Main scene component
function VisualizerScene() {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 2, 50]}
        zoom={50}
        near={0.1}
        far={1000}
      />
      <ambientLight intensity={0.5} />
      <BarSpectrum barCount={64} />
      <AmbientParticles count={50} />
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface VisualizerCanvasProps {
  engine?: SignalProcessingEngine | null;
}

export function VisualizerCanvas({ engine = null }: VisualizerCanvasProps) {
  const audioAnalysis = useAudioAnalysisCallback(engine);

  return (
    <div className="w-full h-full bg-black">
      <AudioAnalysisContext.Provider value={audioAnalysis}>
        <Canvas
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#0a0a0f"]} />
          <VisualizerScene />
        </Canvas>
      </AudioAnalysisContext.Provider>
    </div>
  );
}
