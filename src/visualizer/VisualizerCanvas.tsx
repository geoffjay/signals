import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

// Demo frequency data for visualization
function useAudioAnalyzer() {
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    // Create a demo audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyzerRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Create a demo oscillator for visualization
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(analyser);
    // Don't connect to destination to avoid sound output

    oscillator.start();

    // Modulate frequency for visual interest
    const modulateFrequency = () => {
      const time = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(
        220 + Math.sin(time * 0.5) * 100,
        time
      );
      requestAnimationFrame(modulateFrequency);
    };
    modulateFrequency();

    return () => {
      oscillator.stop();
      audioContext.close();
    };
  }, []);

  const getFrequencyData = () => {
    if (analyzerRef.current && dataArrayRef.current) {
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return null;
  };

  return { getFrequencyData };
}

// Bar spectrum visualizer component
function BarSpectrum({ barCount = 64 }: { barCount?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { getFrequencyData } = useAudioAnalyzer();

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

  // Initialize instances
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      const x = (i - barCount / 2) * 1.2;
      dummy.position.set(x, 0, 0);
      dummy.scale.set(1, 0.1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [barCount]);

  // Animate based on audio data
  useFrame(() => {
    if (!meshRef.current) return;

    const frequencyData = getFrequencyData();
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < barCount; i++) {
      // Get frequency value (0-255) and normalize
      let value = 0.1;
      if (frequencyData) {
        const index = Math.floor((i / barCount) * frequencyData.length);
        value = Math.max(0.1, (frequencyData[index] / 255) * 20);
      }

      const x = (i - barCount / 2) * 1.2;
      dummy.position.set(x, value / 2, 0);
      dummy.scale.set(1, value, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Update color based on value
      const color = new THREE.Color();
      color.setHSL((value / 20) * 0.3, 1, 0.5 + (value / 20) * 0.3);
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
        position={[0, 10, 50]}
        zoom={10}
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

export function VisualizerCanvas() {
  return (
    <div className="w-full h-full bg-black">
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
    </div>
  );
}
