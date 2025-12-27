import { SpectrumDisplay } from "@/components/SpectrumDisplay";
import type { BlockConfig } from "@/types/blocks";

interface FFTAnalyzerBlockProps {
  analyser?: AnalyserNode;
  config: BlockConfig;
}

/**
 * FFT Analyzer visualization block - displays frequency spectrum
 */
export function FFTAnalyzerBlock({ analyser, config }: FFTAnalyzerBlockProps) {
  // Only render in spectrum mode
  if (config.fftMode !== "spectrum") {
    return null;
  }

  return (
    <div className="mb-2">
      <SpectrumDisplay
        analyser={analyser}
        width={240}
        height={140}
        refreshRate={config.refreshRate ?? 60}
        minDecibels={config.minDecibels}
        maxDecibels={config.maxDecibels}
      />
    </div>
  );
}
