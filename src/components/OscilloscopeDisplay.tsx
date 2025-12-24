import { useEffect, useRef } from "react";

interface OscilloscopeDisplayProps {
  analyser: AnalyserNode | undefined;
  width?: number;
  height?: number;
  refreshRate?: number;
  timeWindow?: number;
  minAmplitude?: number;
  maxAmplitude?: number;
}

export function OscilloscopeDisplay({
  analyser,
  width = 300,
  height = 150,
  refreshRate = 60,
  timeWindow = 0.05,
  minAmplitude = -1,
  maxAmplitude = 1,
}: OscilloscopeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastDrawTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Calculate frame interval from refresh rate
    const frameInterval = 1000 / refreshRate; // milliseconds per frame

    const draw = (timestamp: number) => {
      // Throttle drawing based on refresh rate
      const elapsed = timestamp - lastDrawTimeRef.current;
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawTimeRef.current = timestamp;

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = "rgb(20, 20, 30)";
      ctx.fillRect(0, 0, width, height);

      // Calculate zero line position based on amplitude range
      const amplitudeRange = maxAmplitude - minAmplitude;
      const zeroPosition =
        amplitudeRange !== 0 ? (0 - minAmplitude) / amplitudeRange : 0.5;
      const zeroY = height * (1 - zeroPosition);

      // Draw center line (zero line)
      ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(100, 200, 100)";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // dataArray[i] is 0-255, where 128 is center (zero crossing)
        // Convert to actual signal amplitude value
        const amplitude = (dataArray[i] - 128) / 128.0;

        // Map amplitude to canvas Y coordinate based on viewport range
        // amplitude is the actual signal value (e.g., -1 to +1 for normal audio, but can exceed)
        // We map it to the minAmplitude-maxAmplitude viewport
        const normalizedY =
          amplitudeRange !== 0
            ? (amplitude - minAmplitude) / amplitudeRange
            : 0.5;
        const y = height * (1 - normalizedY);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    analyser,
    width,
    height,
    refreshRate,
    timeWindow,
    minAmplitude,
    maxAmplitude,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-border rounded"
    />
  );
}
