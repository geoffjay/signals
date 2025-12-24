import { useEffect, useRef } from 'react';

interface SpectrumDisplayProps {
  analyser: AnalyserNode | undefined;
  width?: number;
  height?: number;
  refreshRate?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

export function SpectrumDisplay({
  analyser,
  width = 300,
  height = 150,
  refreshRate = 60,
  minDecibels = -90,
  maxDecibels = -10,
}: SpectrumDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastDrawTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Calculate frame interval from refresh rate
    const frameInterval = 1000 / refreshRate; // milliseconds per frame

    // Frequency range for display (20 Hz to 20 kHz)
    const minFreq = 20;
    const maxFreq = 20000;
    const nyquist = analyser.context.sampleRate / 2;

    // Logarithmic frequency scale helper
    const logX = (freq: number): number => {
      return (Math.log10(freq) - Math.log10(minFreq)) /
             (Math.log10(maxFreq) - Math.log10(minFreq)) * width;
    };

    // Convert frequency to bin index
    const freqToBin = (freq: number): number => {
      return Math.round(freq * bufferLength / nyquist);
    };

    const draw = (timestamp: number) => {
      // Throttle drawing based on refresh rate
      const elapsed = timestamp - lastDrawTimeRef.current;
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawTimeRef.current = timestamp;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);

      // Draw frequency grid lines and labels
      const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      const labels = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'];

      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';

      frequencies.forEach((freq, i) => {
        const x = logX(freq);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.fillText(labels[i], x, height - 2);
      });

      // Draw spectrum bars
      ctx.fillStyle = 'rgb(100, 200, 100)';

      // Use logarithmic spacing for bars
      const numBars = Math.min(100, bufferLength);
      for (let i = 0; i < numBars; i++) {
        // Logarithmic frequency distribution
        const freqRatio = Math.pow(maxFreq / minFreq, i / numBars);
        const freq = minFreq * freqRatio;
        const binIndex = Math.min(freqToBin(freq), bufferLength - 1);

        // Get next frequency for bar width
        const nextFreqRatio = Math.pow(maxFreq / minFreq, (i + 1) / numBars);
        const nextFreq = minFreq * nextFreqRatio;

        const x = logX(freq);
        const nextX = logX(nextFreq);
        const barWidth = Math.max(1, nextX - x - 1);

        // dataArray values are 0-255 where 0 = minDecibels, 255 = maxDecibels
        const value = dataArray[binIndex];
        const barHeight = (value / 255) * (height - 15); // Leave room for labels

        ctx.fillRect(x, height - 15 - barHeight, barWidth, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, width, height, refreshRate, minDecibels, maxDecibels]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-border rounded"
    />
  );
}
