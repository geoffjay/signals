import { NumericMeterDisplay } from "@/components/NumericMeterDisplay";
import type { BlockConfig } from "@/types/blocks";

interface NumericMeterBlockProps {
  analyser?: AnalyserNode;
  config: BlockConfig;
}

/**
 * Numeric meter visualization block - displays numeric value
 */
export function NumericMeterBlock({
  analyser,
  config,
}: NumericMeterBlockProps) {
  return (
    <div className="mb-2 px-2">
      <NumericMeterDisplay
        analyser={analyser}
        decimals={config.decimals ?? 3}
        unit={config.unit ?? ""}
      />
    </div>
  );
}
