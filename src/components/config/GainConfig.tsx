import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for gain block
 */
export function GainConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <ConfigField label="Gain (multiplier)" htmlFor="gain">
      <NumberInput
        id="gain"
        min={0}
        max={10}
        step={0.1}
        value={config.gain || 1.0}
        onChange={(value) => onConfigChange({ gain: value })}
      />
    </ConfigField>
  );
}
