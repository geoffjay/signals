import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for noise generator block
 */
export function NoiseConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const ampConnected = isInputConnected("amp");

  return (
    <ConfigField
      label="Amplitude"
      htmlFor="amplitude"
      isConnected={ampConnected}
    >
      <NumberInput
        id="amplitude"
        min={0}
        max={1}
        step={0.01}
        value={config.amplitude || 0.5}
        onChange={(value) => onConfigChange({ amplitude: value })}
        disabled={ampConnected}
      />
    </ConfigField>
  );
}
