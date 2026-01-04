import { useRef, useEffect, useMemo, createContext, useContext } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  Glitch,
  Scanline,
  Pixelation,
  DotScreen,
  Sepia,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import type { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useAudioAnalysisCallback } from "@/hooks";
import {
  useSignalFlowStore,
  type VisualizerConfig,
} from "@/store/signalFlowStore";
import { useExternalConnectionStore } from "@/store/externalConnectionStore";
import { mapToEffectRange } from "./effectRanges";

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
          bloomExternalSource: null,
          chromaticAberrationEnabled: false,
          chromaticAberrationOffset: 0.005,
          chromaticAberrationExternalSource: null,
          vignetteEnabled: false,
          vignetteIntensity: 0.5,
          vignetteExternalSource: null,
          noiseEnabled: false,
          noiseIntensity: 0.15,
          noiseExternalSource: null,
          glitchEnabled: false,
          glitchIntensity: 0.5,
          glitchExternalSource: null,
          scanlinesEnabled: false,
          scanlinesIntensity: 0.5,
          scanlinesExternalSource: null,
          pixelationEnabled: false,
          pixelationGranularity: 8,
          pixelationExternalSource: null,
          dotScreenEnabled: false,
          dotScreenScale: 1.5,
          dotScreenExternalSource: null,
          sepiaEnabled: false,
          sepiaIntensity: 0.5,
          sepiaExternalSource: null,
          hueSaturationEnabled: false,
          hueShift: 0,
          hueExternalSource: null,
          saturation: 0,
          saturationExternalSource: null,
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

// Effects component - only renders EffectComposer when effects are enabled
interface EffectsProps {
  effects: {
    bloomEnabled: boolean;
    bloomIntensity: number;
    chromaticAberrationEnabled: boolean;
    chromaticAberrationOffset: number;
    vignetteEnabled: boolean;
    vignetteIntensity: number;
    noiseEnabled: boolean;
    noiseIntensity: number;
    glitchEnabled: boolean;
    glitchIntensity: number;
    scanlinesEnabled: boolean;
    scanlinesIntensity: number;
    pixelationEnabled: boolean;
    pixelationGranularity: number;
    dotScreenEnabled: boolean;
    dotScreenScale: number;
    sepiaEnabled: boolean;
    sepiaIntensity: number;
    hueSaturationEnabled: boolean;
    hueShift: number;
    saturation: number;
  };
}

function Effects({ effects }: EffectsProps) {
  // Check if any effect is enabled
  const anyEffectEnabled =
    effects.bloomEnabled ||
    effects.chromaticAberrationEnabled ||
    effects.vignetteEnabled ||
    effects.noiseEnabled ||
    effects.glitchEnabled ||
    effects.scanlinesEnabled ||
    effects.pixelationEnabled ||
    effects.dotScreenEnabled ||
    effects.sepiaEnabled ||
    effects.hueSaturationEnabled;

  // Don't render EffectComposer if no effects are enabled
  if (!anyEffectEnabled) {
    return null;
  }

  // Build effects array with only enabled effects
  const activeEffects: React.ReactElement[] = [];

  if (effects.bloomEnabled) {
    activeEffects.push(
      <Bloom
        key="bloom"
        intensity={effects.bloomIntensity}
        luminanceThreshold={0}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    );
  }

  if (effects.chromaticAberrationEnabled) {
    activeEffects.push(
      <ChromaticAberration
        key="chromatic"
        offset={new THREE.Vector2(effects.chromaticAberrationOffset, effects.chromaticAberrationOffset)}
        radialModulation={false}
        modulationOffset={0}
      />
    );
  }

  if (effects.vignetteEnabled) {
    activeEffects.push(
      <Vignette
        key="vignette"
        offset={0.5}
        darkness={effects.vignetteIntensity}
        blendFunction={BlendFunction.NORMAL}
      />
    );
  }

  if (effects.noiseEnabled) {
    activeEffects.push(
      <Noise
        key="noise"
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={effects.noiseIntensity}
      />
    );
  }

  if (effects.glitchEnabled) {
    activeEffects.push(
      <Glitch
        key="glitch"
        delay={new THREE.Vector2(1.5, 3.5)}
        duration={new THREE.Vector2(0.6 * effects.glitchIntensity, 1.0 * effects.glitchIntensity)}
        strength={new THREE.Vector2(0.3 * effects.glitchIntensity, 1.0 * effects.glitchIntensity)}
        mode={GlitchMode.SPORADIC}
        active={true}
      />
    );
  }

  if (effects.scanlinesEnabled) {
    activeEffects.push(
      <Scanline
        key="scanline"
        blendFunction={BlendFunction.OVERLAY}
        density={1.25 + effects.scanlinesIntensity}
        opacity={effects.scanlinesIntensity * 0.5}
      />
    );
  }

  if (effects.pixelationEnabled) {
    activeEffects.push(
      <Pixelation key="pixelation" granularity={effects.pixelationGranularity} />
    );
  }

  if (effects.dotScreenEnabled) {
    activeEffects.push(
      <DotScreen
        key="dotscreen"
        blendFunction={BlendFunction.NORMAL}
        scale={effects.dotScreenScale}
        angle={0}
      />
    );
  }

  if (effects.sepiaEnabled) {
    activeEffects.push(
      <Sepia key="sepia" intensity={effects.sepiaIntensity} />
    );
  }

  if (effects.hueSaturationEnabled) {
    activeEffects.push(
      <HueSaturation
        key="huesaturation"
        hue={effects.hueShift * Math.PI}
        saturation={effects.saturation}
      />
    );
  }

  return (
    <EffectComposer>
      {activeEffects}
    </EffectComposer>
  );
}

// Helper to resolve effect value from external source or manual value
function useResolvedEffectValue(
  effectName: string,
  manualValue: number,
  externalSource: string | null
): number {
  // Get raw connections Map - stable reference
  const connectionsMap = useExternalConnectionStore((state) => state.connections);

  // Compute resolved value in useMemo to avoid unstable references
  return useMemo(() => {
    if (!externalSource) {
      return manualValue;
    }

    // Find connection by name
    for (const connection of connectionsMap.values()) {
      if (connection.name === externalSource) {
        return mapToEffectRange(connection.value, effectName);
      }
    }

    return manualValue;
  }, [connectionsMap, externalSource, manualValue, effectName]);
}

// Main scene component
function VisualizerScene() {
  const { config } = useVisualizerContext();

  // Get external source settings with defaults
  const bloomExternalSource = config.effects.bloomExternalSource ?? null;
  const chromaticAberrationExternalSource = config.effects.chromaticAberrationExternalSource ?? null;
  const vignetteExternalSource = config.effects.vignetteExternalSource ?? null;
  const noiseExternalSource = config.effects.noiseExternalSource ?? null;
  const glitchExternalSource = config.effects.glitchExternalSource ?? null;
  const scanlinesExternalSource = config.effects.scanlinesExternalSource ?? null;
  const pixelationExternalSource = config.effects.pixelationExternalSource ?? null;
  const dotScreenExternalSource = config.effects.dotScreenExternalSource ?? null;
  const sepiaExternalSource = config.effects.sepiaExternalSource ?? null;
  const hueExternalSource = config.effects.hueExternalSource ?? null;
  const saturationExternalSource = config.effects.saturationExternalSource ?? null;

  // Resolve effect values (from external source or manual)
  const bloomIntensity = useResolvedEffectValue(
    "bloom",
    config.effects.bloomIntensity ?? 1.5,
    bloomExternalSource
  );
  const chromaticAberrationOffset = useResolvedEffectValue(
    "chromaticAberration",
    config.effects.chromaticAberrationOffset ?? 0.005,
    chromaticAberrationExternalSource
  );
  const vignetteIntensity = useResolvedEffectValue(
    "vignette",
    config.effects.vignetteIntensity ?? 0.5,
    vignetteExternalSource
  );
  const noiseIntensity = useResolvedEffectValue(
    "noise",
    config.effects.noiseIntensity ?? 0.15,
    noiseExternalSource
  );
  const glitchIntensity = useResolvedEffectValue(
    "glitch",
    config.effects.glitchIntensity ?? 0.5,
    glitchExternalSource
  );
  const scanlinesIntensity = useResolvedEffectValue(
    "scanlines",
    config.effects.scanlinesIntensity ?? 0.5,
    scanlinesExternalSource
  );
  const pixelationGranularity = useResolvedEffectValue(
    "pixelation",
    config.effects.pixelationGranularity ?? 8,
    pixelationExternalSource
  );
  const dotScreenScale = useResolvedEffectValue(
    "dotScreen",
    config.effects.dotScreenScale ?? 1.5,
    dotScreenExternalSource
  );
  const sepiaIntensity = useResolvedEffectValue(
    "sepia",
    config.effects.sepiaIntensity ?? 0.5,
    sepiaExternalSource
  );
  const hueShift = useResolvedEffectValue(
    "hue",
    config.effects.hueShift ?? 0,
    hueExternalSource
  );
  const saturation = useResolvedEffectValue(
    "saturation",
    config.effects.saturation ?? 0,
    saturationExternalSource
  );

  // Merge with defaults for backwards compatibility with persisted state
  const effects = {
    bloomEnabled: config.effects.bloomEnabled ?? true,
    bloomIntensity,
    chromaticAberrationEnabled: config.effects.chromaticAberrationEnabled ?? false,
    chromaticAberrationOffset,
    vignetteEnabled: config.effects.vignetteEnabled ?? false,
    vignetteIntensity,
    noiseEnabled: config.effects.noiseEnabled ?? false,
    noiseIntensity,
    glitchEnabled: config.effects.glitchEnabled ?? false,
    glitchIntensity,
    scanlinesEnabled: config.effects.scanlinesEnabled ?? false,
    scanlinesIntensity,
    pixelationEnabled: config.effects.pixelationEnabled ?? false,
    pixelationGranularity,
    dotScreenEnabled: config.effects.dotScreenEnabled ?? false,
    dotScreenScale,
    sepiaEnabled: config.effects.sepiaEnabled ?? false,
    sepiaIntensity,
    hueSaturationEnabled: config.effects.hueSaturationEnabled ?? false,
    hueShift,
    saturation,
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
      <Effects effects={effects} />
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
