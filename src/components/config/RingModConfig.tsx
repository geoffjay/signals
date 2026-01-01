import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for ring modulator block
 * Ring modulation multiplies carrier and modulator signals,
 * producing sum and difference frequencies (metallic/inharmonic tones)
 */
export function RingModConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <ConfigField label="Mix (dry/wet)" htmlFor="ringModMix">
      <NumberInput
        id="ringModMix"
        min={0}
        max={1}
        step={0.01}
        value={config.ringModMix ?? 1.0}
        onChange={(value) => onConfigChange({ ringModMix: value })}
      />
    </ConfigField>
  );
}
