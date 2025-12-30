import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for dynamics compressor block
 */
export function CompressorConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Threshold (dB)" htmlFor="threshold">
        <NumberInput
          id="threshold"
          min={-100}
          max={0}
          step={1}
          value={config.threshold ?? -24}
          onChange={(value) => onConfigChange({ threshold: value })}
        />
      </ConfigField>

      <ConfigField label="Knee (dB)" htmlFor="knee">
        <NumberInput
          id="knee"
          min={0}
          max={40}
          step={1}
          value={config.knee ?? 30}
          onChange={(value) => onConfigChange({ knee: value })}
        />
      </ConfigField>

      <ConfigField label="Ratio" htmlFor="ratio">
        <NumberInput
          id="ratio"
          min={1}
          max={20}
          step={0.5}
          value={config.ratio ?? 12}
          onChange={(value) => onConfigChange({ ratio: value })}
        />
      </ConfigField>

      <ConfigField label="Attack (s)" htmlFor="attack">
        <NumberInput
          id="attack"
          min={0}
          max={1}
          step={0.001}
          value={config.attack ?? 0.003}
          onChange={(value) => onConfigChange({ attack: value })}
        />
      </ConfigField>

      <ConfigField label="Release (s)" htmlFor="release">
        <NumberInput
          id="release"
          min={0}
          max={1}
          step={0.01}
          value={config.release ?? 0.25}
          onChange={(value) => onConfigChange({ release: value })}
        />
      </ConfigField>
    </>
  );
}
