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

/**
 * Configuration for keyboard block
 */
export function KeyboardConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Base Octave" htmlFor="octave">
        <NumberInput
          id="octave"
          min={0}
          max={7}
          step={1}
          value={config.octave ?? 4}
          onChange={(value) => onConfigChange({ octave: value })}
        />
      </ConfigField>

      <ConfigField label="Number of Octaves" htmlFor="numOctaves">
        <NumberInput
          id="numOctaves"
          min={1}
          max={3}
          step={1}
          value={config.numOctaves ?? 2}
          onChange={(value) => onConfigChange({ numOctaves: value })}
        />
      </ConfigField>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <p className="font-medium mb-1">Usage:</p>
        <p>Connect the <strong>Freq</strong> output to an oscillator's frequency input to control pitch.</p>
        <p className="mt-1">Use <strong>Gate</strong> and <strong>Vel</strong> to control amplitude via multiply blocks.</p>
      </div>
    </>
  );
}

/**
 * Configuration for beat pad block
 */
export function BeatPadConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Columns" htmlFor="columns">
        <NumberInput
          id="columns"
          min={1}
          max={8}
          step={1}
          value={config.columns ?? 4}
          onChange={(value) => onConfigChange({ columns: value })}
        />
      </ConfigField>

      <ConfigField label="Rows" htmlFor="rows">
        <NumberInput
          id="rows"
          min={1}
          max={8}
          step={1}
          value={config.rows ?? 4}
          onChange={(value) => onConfigChange({ rows: value })}
        />
      </ConfigField>

      <ConfigField label="Pad Size (px)" htmlFor="padSize">
        <NumberInput
          id="padSize"
          min={24}
          max={60}
          step={2}
          value={config.padSize ?? 40}
          onChange={(value) => onConfigChange({ padSize: value })}
        />
      </ConfigField>

      <ConfigField label="Gap (px)" htmlFor="gap">
        <NumberInput
          id="gap"
          min={2}
          max={12}
          step={1}
          value={config.gap ?? 4}
          onChange={(value) => onConfigChange({ gap: value })}
        />
      </ConfigField>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <p className="font-medium mb-1">Outputs:</p>
        <p><strong>Trig</strong>: 1 when pressed, 0 when released</p>
        <p><strong>Pad</strong>: Index of active pad (0-N)</p>
        <p><strong>Vel</strong>: Velocity based on tap position</p>
      </div>
    </>
  );
}

/**
 * Configuration for crossfader block
 */
export function CrossfaderConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Curve Type" htmlFor="curveType">
        <select
          id="curveType"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={config.curveType ?? "equal-power"}
          onChange={(e) => onConfigChange({ curveType: e.target.value as "linear" | "equal-power" | "cut" })}
        >
          <option value="linear">Linear</option>
          <option value="equal-power">Equal Power (recommended)</option>
          <option value="cut">Cut (DJ style)</option>
        </select>
      </ConfigField>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <p className="font-medium mb-1">Curve Types:</p>
        <p><strong>Linear</strong>: Simple fade, may dip in middle</p>
        <p><strong>Equal Power</strong>: Constant loudness throughout</p>
        <p><strong>Cut</strong>: Sharp transition at edges</p>
      </div>
    </>
  );
}
