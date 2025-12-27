import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for EQ filter blocks (peaking-eq, lowshelf, highshelf)
 */
export function EQFilterConfig({
  config,
  blockType,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const frequencyConnected =
    isInputConnected("frequency") || isInputConnected("cutoff");
  const showQFactor = blockType === "peaking-eq";

  return (
    <>
      <ConfigField
        label="Frequency (Hz)"
        htmlFor="cutoffFrequency"
        isConnected={frequencyConnected}
      >
        <NumberInput
          id="cutoffFrequency"
          min={20}
          max={20000}
          step={1}
          value={config.cutoffFrequency || 1000}
          onChange={(value) => onConfigChange({ cutoffFrequency: value })}
          disabled={frequencyConnected}
        />
      </ConfigField>

      {showQFactor && (
        <ConfigField label="Q Factor" htmlFor="qFactor">
          <NumberInput
            id="qFactor"
            min={0.1}
            max={20}
            step={0.1}
            value={config.qFactor || 1.0}
            onChange={(value) => onConfigChange({ qFactor: value })}
          />
        </ConfigField>
      )}

      <ConfigField label="Gain (dB)" htmlFor="filterGain">
        <NumberInput
          id="filterGain"
          min={-40}
          max={40}
          step={0.5}
          value={config.filterGain || 0}
          onChange={(value) => onConfigChange({ filterGain: value })}
        />
      </ConfigField>
    </>
  );
}
