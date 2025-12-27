import { OscilloscopeDisplay } from "@/components/OscilloscopeDisplay";
import type { BlockConfig } from "@/types/blocks";

interface OscilloscopeBlockProps {
  analyser?: AnalyserNode;
  config: BlockConfig;
}

/**
 * Oscilloscope visualization block - displays waveform from analyser
 */
export function OscilloscopeBlock({ analyser, config }: OscilloscopeBlockProps) {
  return (
    <div className="mb-2">
      <OscilloscopeDisplay
        analyser={analyser}
        width={200}
        height={100}
        refreshRate={config.refreshRate}
        timeWindow={config.timeWindow}
        minAmplitude={config.minAmplitude}
        maxAmplitude={config.maxAmplitude}
      />
    </div>
  );
}
