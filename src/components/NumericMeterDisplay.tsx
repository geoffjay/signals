import { useEffect, useRef, useState } from "react";

interface NumericMeterDisplayProps {
  analyser?: AnalyserNode;
  decimals?: number;
  unit?: string;
}

export function NumericMeterDisplay({
  analyser,
  decimals = 3,
  unit = "",
}: NumericMeterDisplayProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!analyser) {
      setCurrentValue(0);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const updateValue = () => {
      // Get time domain data (waveform)
      analyser.getFloatTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) amplitude for AC signals
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      setCurrentValue(rms);
      animationRef.current = requestAnimationFrame(updateValue);
    };

    updateValue();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="bg-muted rounded-md p-3 text-center">
      <div className="text-2xl font-mono font-bold text-foreground">
        {currentValue.toFixed(decimals)}
        {unit && (
          <span className="text-sm ml-1 text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}
