import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for filter blocks (low-pass, high-pass, band-pass, notch, allpass)
 */
export function FilterConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const cutoffConnected = isInputConnected("cutoff");

  return (
    <>
      <ConfigField
        label="Cutoff Frequency (Hz)"
        htmlFor="cutoffFrequency"
        isConnected={cutoffConnected}
      >
        <NumberInput
          id="cutoffFrequency"
          min={20}
          max={20000}
          step={1}
          value={config.cutoffFrequency || 1000}
          onChange={(value) => onConfigChange({ cutoffFrequency: value })}
          disabled={cutoffConnected}
        />
      </ConfigField>

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
    </>
  );
}
