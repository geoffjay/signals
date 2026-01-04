import { useRef, useEffect, useMemo, createContext, useContext } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import type { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useAudioAnalysisCallback } from "@/hooks";
import {
  useSignalFlowStore,
  type VisualizerConfig,
} from "@/store/signalFlowStore";

// Context to pass audio analysis functions and config into the Three.js scene
interface AudioAnalysisContext {
  getFrequencyData: () => Uint8Array | null;
  getTimeDomainData: () => Uint8Array | null;
  isRunning: () => boolean;
}

interface VisualizerContextValue {
  audio: AudioAnalysisContext;
  config: VisualizerConfig;
}

const VisualizerContext = createContext<VisualizerContextValue | null>(null);

function useVisualizerContext() {
  const context = useContext(VisualizerContext);
  if (!context) {
    return {
      audio: {
        getFrequencyData: () => null,
        getTimeDomainData: () => null,
        isRunning: () => false,
      },
      config: {
        type: "bar-spectrum" as const,
        effects: {
          bloomEnabled: true,
          bloomIntensity: 1.5,
          chromaticAberrationEnabled: false,
          chromaticAberrationOffset: 0.005,
          vignetteEnabled: false,
          vignetteIntensity: 0.5,
          noiseEnabled: false,
          noiseIntensity: 0.15,
        },
        barCount: 64,
        particleCount: 50,
        colorScheme: "purple" as const,
      },
    };
  }
  return context;
}

// Color scheme helpers
function getColorForScheme(
  scheme: "purple" | "rainbow" | "monochrome",
  value: number,
  index: number,
  total: number
): THREE.Color {
  const color = new THREE.Color();
  switch (scheme) {
    case "purple":
      color.setHSL(0.75 + value * 0.1, 0.8, 0.4 + value * 0.3);
      break;
    case "rainbow":
      color.setHSL((index / total + value * 0.1) % 1, 1, 0.5);
      break;
    case "monochrome":
      color.setRGB(0.8 + value * 0.2, 0.8 + value * 0.2, 0.8 + value * 0.2);
      break;
  }
  return color;
}

// Bar spectrum visualizer component
function BarSpectrum() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { audio, config } = useVisualizerContext();
  const barCount = config.barCount;

  const geometry = useMemo(() => new THREE.BoxGeometry(0.8, 1, 0.1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.4, 0.2, 1),
        toneMapped: false,
      }),
    []
  );

  const barSpacing = 0.15;

  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      const x = (i - barCount / 2) * barSpacing;
      dummy.position.set(x, 0, 0);
      dummy.scale.set(1, 0.5, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [barCount, barSpacing]);

  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = audio.getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      let value = 0.5;
      if (frequencyData) {
        const index = Math.floor((i / barCount) * frequencyData.length);
        value = Math.max(0.5, (frequencyData[index] / 255) * 5);
      }

      const x = (i - barCount / 2) * barSpacing;
      dummy.position.set(x, value / 2, 0);
      dummy.scale.set(1, value, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = getColorForScheme(
        config.colorScheme,
        value / 5,
        i,
        barCount
      );
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, barCount]} />
  );
}

// Waveform visualizer component
function Waveform() {
  const lineRef = useRef<THREE.Line>(null);
  const { audio, config } = useVisualizerContext();
  const pointCount = 256;

  const positions = useMemo(() => new Float32Array(pointCount * 3), []);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(() => {
    const baseColor =
      config.colorScheme === "purple"
        ? new THREE.Color(0.6, 0.3, 1)
        : config.colorScheme === "rainbow"
          ? new THREE.Color(0.2, 0.8, 1)
          : new THREE.Color(1, 1, 1);
    return new THREE.LineBasicMaterial({
      color: baseColor,
      toneMapped: false,
      linewidth: 2,
    });
  }, [config.colorScheme]);

  useFrame(() => {
    if (!lineRef.current) return;

    const timeDomainData = audio.getTimeDomainData();
    const positionAttr = lineRef.current.geometry.getAttribute("position");

    for (let i = 0; i < pointCount; i++) {
      let value = 128;
      if (timeDomainData) {
        const index = Math.floor((i / pointCount) * timeDomainData.length);
        value = timeDomainData[index];
      }

      const x = (i / pointCount - 0.5) * 16;
      const y = ((value - 128) / 128) * 4;
      positionAttr.setXYZ(i, x, y, 0);
    }

    positionAttr.needsUpdate = true;
  });

  return <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />;
}

// Circular spectrum visualizer
function CircularSpectrum() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { audio, config } = useVisualizerContext();
  const barCount = config.barCount;

  const geometry = useMemo(() => new THREE.BoxGeometry(0.2, 1, 0.1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.4, 0.2, 1),
        toneMapped: false,
      }),
    []
  );

  const radius = 3;

  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      dummy.rotation.z = angle - Math.PI / 2;
      dummy.scale.set(1, 0.5, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [barCount, radius]);

  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = audio.getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      let value = 0.3;
      if (frequencyData) {
        const index = Math.floor((i / barCount) * frequencyData.length);
        value = Math.max(0.3, (frequencyData[index] / 255) * 2);
      }

      const angle = (i / barCount) * Math.PI * 2;
      const extendedRadius = radius + value * 0.5;
      dummy.position.set(
        Math.cos(angle) * extendedRadius,
        Math.sin(angle) * extendedRadius,
        0
      );
      dummy.rotation.z = angle - Math.PI / 2;
      dummy.scale.set(1, value, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = getColorForScheme(
        config.colorScheme,
        value / 2,
        i,
        barCount
      );
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, barCount]} />
  );
}

// Audio-reactive particles
function AudioParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { audio, config } = useVisualizerContext();
  const count = config.particleCount;

  const geometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5, 0.3, 1),
        toneMapped: false,
        transparent: true,
        opacity: 0.8,
      }),
    []
  );

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 5
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        0
      ),
      baseScale: 0.3 + Math.random() * 0.7,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = audio.getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    // Calculate average bass level for particle reactivity
    let bassLevel = 0;
    if (frequencyData) {
      for (let i = 0; i < 16; i++) {
        bassLevel += frequencyData[i];
      }
      bassLevel = bassLevel / (16 * 255);
    }

    particles.forEach((particle, i) => {
      // Apply velocity with audio reactivity
      const speed = 1 + bassLevel * 3;
      particle.position.x += particle.velocity.x * speed;
      particle.position.y += particle.velocity.y * speed;

      // Wrap around edges
      if (particle.position.x > 10) particle.position.x = -10;
      if (particle.position.x < -10) particle.position.x = 10;
      if (particle.position.y > 7.5) particle.position.y = -7.5;
      if (particle.position.y < -7.5) particle.position.y = 7.5;

      dummy.position.copy(particle.position);
      const scale = particle.baseScale * (1 + bassLevel * 2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = getColorForScheme(
        config.colorScheme,
        bassLevel,
        i,
        count
      );
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

// Frequency grid visualizer
function FrequencyGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { audio, config } = useVisualizerContext();
  const gridSize = 8;
  const cellCount = gridSize * gridSize;

  const geometry = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.4, 0.2, 1),
        toneMapped: false,
      }),
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < cellCount; i++) {
      const x = (i % gridSize) - gridSize / 2 + 0.5;
      const y = Math.floor(i / gridSize) - gridSize / 2 + 0.5;
      dummy.position.set(x, y, 0);
      dummy.scale.set(1, 1, 0.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cellCount, gridSize]);

  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = audio.getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < cellCount; i++) {
      const x = (i % gridSize) - gridSize / 2 + 0.5;
      const y = Math.floor(i / gridSize) - gridSize / 2 + 0.5;

      let value = 0.1;
      if (frequencyData) {
        const freqIndex = Math.floor((i / cellCount) * frequencyData.length);
        value = Math.max(0.1, (frequencyData[freqIndex] / 255) * 2);
      }

      dummy.position.set(x, y, value / 2);
      dummy.scale.set(1, 1, value);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = getColorForScheme(
        config.colorScheme,
        value / 2,
        i,
        cellCount
      );
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, cellCount]} />
  );
}

// Geometric shapes visualizer
function GeometricShapes() {
  const groupRef = useRef<THREE.Group>(null);
  const { audio, config } = useVisualizerContext();

  const shapes = useMemo(() => {
    return [
      {
        geometry: new THREE.OctahedronGeometry(1, 0),
        position: new THREE.Vector3(-3, 0, 0),
        rotationSpeed: 0.01,
      },
      {
        geometry: new THREE.IcosahedronGeometry(1, 0),
        position: new THREE.Vector3(0, 0, 0),
        rotationSpeed: 0.015,
      },
      {
        geometry: new THREE.TorusGeometry(0.8, 0.3, 8, 16),
        position: new THREE.Vector3(3, 0, 0),
        rotationSpeed: 0.02,
      },
    ];
  }, []);

  const material = useMemo(() => {
    const baseColor =
      config.colorScheme === "purple"
        ? new THREE.Color(0.6, 0.3, 1)
        : config.colorScheme === "rainbow"
          ? new THREE.Color(0.2, 0.8, 0.6)
          : new THREE.Color(0.9, 0.9, 0.9);
    return new THREE.MeshBasicMaterial({
      color: baseColor,
      wireframe: true,
      toneMapped: false,
    });
  }, [config.colorScheme]);

  useFrame(() => {
    if (!groupRef.current) return;

    const frequencyData = audio.getFrequencyData();

    groupRef.current.children.forEach((mesh, i) => {
      let value = 1;
      if (frequencyData) {
        const bandStart = Math.floor((i / shapes.length) * frequencyData.length);
        const bandEnd = Math.floor(
          ((i + 1) / shapes.length) * frequencyData.length
        );
        let sum = 0;
        for (let j = bandStart; j < bandEnd; j++) {
          sum += frequencyData[j];
        }
        value = 1 + (sum / ((bandEnd - bandStart) * 255)) * 2;
      }

      mesh.scale.setScalar(value);
      mesh.rotation.x += shapes[i].rotationSpeed * value;
      mesh.rotation.y += shapes[i].rotationSpeed * 0.7 * value;
    });
  });

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <mesh
          key={i}
          geometry={shape.geometry}
          material={material}
          position={shape.position}
        />
      ))}
    </group>
  );
}

// Ambient particles (background decoration)
function AmbientParticles({ count = 50 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { config } = useVisualizerContext();

  const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5, 0.3, 1),
        toneMapped: false,
        transparent: true,
        opacity: 0.4,
      }),
    []
  );

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
      particle.position.add(particle.velocity);

      if (particle.position.x > 50) particle.position.x = -50;
      if (particle.position.x < -50) particle.position.x = 50;
      if (particle.position.y > 25) particle.position.y = -25;
      if (particle.position.y < -25) particle.position.y = 25;

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(0.5 + Math.sin(Date.now() * 0.001 + i) * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = getColorForScheme(
        config.colorScheme,
        0.5,
        i,
        count
      );
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

// Main scene component
function VisualizerScene() {
  const { config } = useVisualizerContext();

  // Merge with defaults for backwards compatibility with persisted state
  const effects = {
    bloomEnabled: config.effects.bloomEnabled ?? true,
    bloomIntensity: config.effects.bloomIntensity ?? 1.5,
    chromaticAberrationEnabled: config.effects.chromaticAberrationEnabled ?? false,
    chromaticAberrationOffset: config.effects.chromaticAberrationOffset ?? 0.005,
    vignetteEnabled: config.effects.vignetteEnabled ?? false,
    vignetteIntensity: config.effects.vignetteIntensity ?? 0.5,
    noiseEnabled: config.effects.noiseEnabled ?? false,
    noiseIntensity: config.effects.noiseIntensity ?? 0.15,
  };

  // Render the appropriate visualizer based on type
  const renderVisualizer = () => {
    switch (config.type) {
      case "bar-spectrum":
        return <BarSpectrum />;
      case "waveform":
        return <Waveform />;
      case "circular-spectrum":
        return <CircularSpectrum />;
      case "particles":
        return <AudioParticles />;
      case "frequency-grid":
        return <FrequencyGrid />;
      case "geometric":
        return <GeometricShapes />;
      default:
        return <BarSpectrum />;
    }
  };

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
      {renderVisualizer()}
      <AmbientParticles count={30} />
      <EffectComposer>
        <Bloom
          intensity={effects.bloomEnabled ? effects.bloomIntensity : 0}
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          offset={
            effects.chromaticAberrationEnabled
              ? new THREE.Vector2(
                  effects.chromaticAberrationOffset,
                  effects.chromaticAberrationOffset
                )
              : new THREE.Vector2(0, 0)
          }
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={0.5}
          darkness={effects.vignetteEnabled ? effects.vignetteIntensity : 0}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          premultiply
          blendFunction={BlendFunction.ADD}
          opacity={effects.noiseEnabled ? effects.noiseIntensity : 0}
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
  const visualizerConfig = useSignalFlowStore((state) => state.visualizerConfig);

  const contextValue = useMemo(
    () => ({
      audio: audioAnalysis,
      config: visualizerConfig,
    }),
    [audioAnalysis, visualizerConfig]
  );

  return (
    <div className="w-full h-full bg-black">
      <VisualizerContext.Provider value={contextValue}>
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
      </VisualizerContext.Provider>
    </div>
  );
}
