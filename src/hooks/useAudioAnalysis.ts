import { useRef, useEffect, useCallback, useState } from "react";
import type { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";

interface AudioAnalysisData {
  frequencyData: Uint8Array | null;
  timeDomainData: Uint8Array | null;
  isRunning: boolean;
  frequencyBinCount: number;
}

interface UseAudioAnalysisOptions {
  /** Update frequency in Hz (default: 60) */
  refreshRate?: number;
  /** Whether to actively poll for data (default: true) */
  enabled?: boolean;
}

/**
 * Hook that provides real-time audio analysis data from the SignalProcessingEngine.
 * Uses requestAnimationFrame for smooth updates synchronized with the display refresh rate.
 */
export function useAudioAnalysis(
  engine: SignalProcessingEngine | null,
  options: UseAudioAnalysisOptions = {}
): AudioAnalysisData {
  const { refreshRate = 60, enabled = true } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [frequencyBinCount, setFrequencyBinCount] = useState(0);

  // Use refs for the data arrays to avoid unnecessary re-renders
  // The visualizer will read these directly in its animation loop
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const timeDomainDataRef = useRef<Uint8Array | null>(null);

  // Animation frame ref for cleanup
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Get fresh data from the engine
  const updateData = useCallback(() => {
    if (!engine || !enabled) return;

    const running = engine.getIsRunning();
    setIsRunning(running);

    if (running) {
      const binCount = engine.getFrequencyBinCount();
      if (binCount !== frequencyBinCount) {
        setFrequencyBinCount(binCount);
      }

      // Get the data - engine updates the arrays in place
      frequencyDataRef.current = engine.getFrequencyData();
      timeDomainDataRef.current = engine.getTimeDomainData();
    } else {
      frequencyDataRef.current = null;
      timeDomainDataRef.current = null;
    }
  }, [engine, enabled, frequencyBinCount]);

  // Animation loop that updates at the specified refresh rate
  useEffect(() => {
    if (!engine || !enabled) return;

    const minInterval = 1000 / refreshRate;

    const animate = (timestamp: number) => {
      // Throttle updates based on refresh rate
      if (timestamp - lastUpdateRef.current >= minInterval) {
        updateData();
        lastUpdateRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [engine, enabled, refreshRate, updateData]);

  return {
    frequencyData: frequencyDataRef.current,
    timeDomainData: timeDomainDataRef.current,
    isRunning,
    frequencyBinCount,
  };
}

/**
 * Simpler hook that just provides a callback to get current audio data.
 * Useful when you want to control the update timing yourself (e.g., in useFrame).
 */
export function useAudioAnalysisCallback(
  engine: SignalProcessingEngine | null
) {
  const getFrequencyData = useCallback(() => {
    if (!engine || !engine.getIsRunning()) return null;
    return engine.getFrequencyData();
  }, [engine]);

  const getTimeDomainData = useCallback(() => {
    if (!engine || !engine.getIsRunning()) return null;
    return engine.getTimeDomainData();
  }, [engine]);

  const isRunning = useCallback(() => {
    return engine?.getIsRunning() ?? false;
  }, [engine]);

  const getFrequencyBinCount = useCallback(() => {
    return engine?.getFrequencyBinCount() ?? 0;
  }, [engine]);

  return {
    getFrequencyData,
    getTimeDomainData,
    isRunning,
    getFrequencyBinCount,
  };
}
