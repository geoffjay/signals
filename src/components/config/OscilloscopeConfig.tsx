import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for oscilloscope block
 */
export function OscilloscopeConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Time Window (seconds)" htmlFor="timeWindow">
        <NumberInput
          id="timeWindow"
          min={0.001}
          max={1}
          step={0.001}
          value={config.timeWindow || 0.05}
          onChange={(value) => onConfigChange({ timeWindow: value })}
        />
      </ConfigField>

      <ConfigField label="Refresh Rate (Hz)" htmlFor="refreshRate">
        <NumberInput
          id="refreshRate"
          min={10}
          max={120}
          step={1}
          value={config.refreshRate || 60}
          onChange={(value) => onConfigChange({ refreshRate: value })}
        />
      </ConfigField>

      <ConfigField label="Min Amplitude" htmlFor="minAmplitude">
        <NumberInput
          id="minAmplitude"
          min={-10}
          max={0}
          step={0.1}
          value={config.minAmplitude ?? -1}
          onChange={(value) => onConfigChange({ minAmplitude: value })}
        />
      </ConfigField>

      <ConfigField label="Max Amplitude" htmlFor="maxAmplitude">
        <NumberInput
          id="maxAmplitude"
          min={0}
          max={10}
          step={0.1}
          value={config.maxAmplitude ?? 1}
          onChange={(value) => onConfigChange({ maxAmplitude: value })}
        />
      </ConfigField>
    </>
  );
}
