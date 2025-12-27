import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for wave generator blocks (sine, square, triangle, sawtooth)
 */
export function WaveGeneratorConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const freqConnected = isInputConnected("freq");
  const ampConnected = isInputConnected("amp");
  const phaseConnected = isInputConnected("phase");

  return (
    <>
      <ConfigField
        label="Frequency (Hz)"
        htmlFor="frequency"
        isConnected={freqConnected}
      >
        <NumberInput
          id="frequency"
          min={20}
          max={20000}
          step={1}
          value={config.frequency || 440}
          onChange={(value) => onConfigChange({ frequency: value })}
          disabled={freqConnected}
        />
      </ConfigField>

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

      <ConfigField
        label="Phase (degrees)"
        htmlFor="phase"
        isConnected={phaseConnected}
      >
        <NumberInput
          id="phase"
          min={0}
          max={360}
          step={1}
          value={config.phase || 0}
          onChange={(value) => onConfigChange({ phase: value })}
          disabled={phaseConnected}
        />
      </ConfigField>
    </>
  );
}
