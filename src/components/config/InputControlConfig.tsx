import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for slider block
 */
export function SliderConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Minimum" htmlFor="min">
        <NumberInput
          id="min"
          step={0.01}
          value={config.min ?? 0}
          onChange={(value) => onConfigChange({ min: value })}
        />
      </ConfigField>

      <ConfigField label="Maximum" htmlFor="max">
        <NumberInput
          id="max"
          step={0.01}
          value={config.max ?? 1}
          onChange={(value) => onConfigChange({ max: value })}
        />
      </ConfigField>

      <ConfigField label="Step" htmlFor="step">
        <NumberInput
          id="step"
          min={0.001}
          step={0.001}
          value={config.step ?? 0.01}
          onChange={(value) => onConfigChange({ step: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for button block
 */
export function ButtonConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <ConfigField label="Output Value" htmlFor="outputValue">
      <NumberInput
        id="outputValue"
        step={0.01}
        value={config.outputValue ?? 1.0}
        onChange={(value) => onConfigChange({ outputValue: value })}
      />
    </ConfigField>
  );
}

/**
 * Configuration for toggle block
 */
export function ToggleConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <ConfigField label="Output Value" htmlFor="outputValue">
      <NumberInput
        id="outputValue"
        step={0.01}
        value={config.outputValue ?? 1.0}
        onChange={(value) => onConfigChange({ outputValue: value })}
      />
    </ConfigField>
  );
}

/**
 * Configuration for pulse block
 */
export function PulseConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Pulse Value" htmlFor="pulseValue">
        <NumberInput
          id="pulseValue"
          step={0.01}
          value={config.pulseValue ?? 1.0}
          onChange={(value) => onConfigChange({ pulseValue: value })}
        />
      </ConfigField>

      <ConfigField label="Duration (ms)" htmlFor="pulseDuration">
        <NumberInput
          id="pulseDuration"
          min={10}
          max={5000}
          step={10}
          value={config.pulseDuration ?? 100}
          onChange={(value) => onConfigChange({ pulseDuration: value })}
        />
      </ConfigField>
    </>
  );
}
