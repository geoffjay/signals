import { useEffect, useRef } from 'react';

interface OscilloscopeDisplayProps {
  analyser: AnalyserNode | undefined;
  width?: number;
  height?: number;
  refreshRate?: number;
}

export function OscilloscopeDisplay({
  analyser,
  width = 300,
  height = 150,
  refreshRate = 60,
}: OscilloscopeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(100, 200, 100)';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // dataArray[i] is 0-255, where 128 is center (zero crossing)
        // Convert to -1 to +1 range, then map to canvas coordinates
        const normalizedValue = (dataArray[i] - 128) / 128.0;
        const y = height / 2 - (normalizedValue * height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(() => draw());
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, width, height, refreshRate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-border rounded"
    />
  );
}
