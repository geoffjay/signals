import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for envelope follower block
 */
export function EnvelopeFollowerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Attack (sec)" htmlFor="envelopeAttack">
        <NumberInput
          id="envelopeAttack"
          min={0.001}
          max={1}
          step={0.001}
          value={config.envelopeAttack ?? 0.01}
          onChange={(value) => onConfigChange({ envelopeAttack: value })}
        />
        <p className="text-xs text-muted-foreground">
          How fast envelope rises (smaller = faster)
        </p>
      </ConfigField>

      <ConfigField label="Release (sec)" htmlFor="envelopeRelease">
        <NumberInput
          id="envelopeRelease"
          min={0.01}
          max={2}
          step={0.01}
          value={config.envelopeRelease ?? 0.1}
          onChange={(value) => onConfigChange({ envelopeRelease: value })}
        />
        <p className="text-xs text-muted-foreground">
          How fast envelope falls (smaller = faster)
        </p>
      </ConfigField>

      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm font-medium">Outputs:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <strong>Audio:</strong> Passes input signal through unchanged
          </li>
          <li>
            <strong>Env:</strong> Outputs the detected amplitude envelope (0-1)
          </li>
        </ul>
      </div>
    </>
  );
}

/**
 * Configuration for ADSR envelope generator block
 */
export function ADSRConfig({ config, onConfigChange }: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Attack (sec)" htmlFor="adsrAttack">
        <NumberInput
          id="adsrAttack"
          min={0.001}
          max={5}
          step={0.001}
          value={config.adsrAttack ?? 0.01}
          onChange={(value) => onConfigChange({ adsrAttack: value })}
        />
        <p className="text-xs text-muted-foreground">
          Time to reach peak level
        </p>
      </ConfigField>

      <ConfigField label="Decay (sec)" htmlFor="adsrDecay">
        <NumberInput
          id="adsrDecay"
          min={0.001}
          max={5}
          step={0.001}
          value={config.adsrDecay ?? 0.1}
          onChange={(value) => onConfigChange({ adsrDecay: value })}
        />
        <p className="text-xs text-muted-foreground">
          Time to fall to sustain level
        </p>
      </ConfigField>

      <ConfigField label="Sustain" htmlFor="adsrSustain">
        <NumberInput
          id="adsrSustain"
          min={0}
          max={1}
          step={0.01}
          value={config.adsrSustain ?? 0.7}
          onChange={(value) => onConfigChange({ adsrSustain: value })}
        />
        <p className="text-xs text-muted-foreground">
          Level held while gate is on (0-1)
        </p>
      </ConfigField>

      <ConfigField label="Release (sec)" htmlFor="adsrRelease">
        <NumberInput
          id="adsrRelease"
          min={0.001}
          max={10}
          step={0.001}
          value={config.adsrRelease ?? 0.5}
          onChange={(value) => onConfigChange({ adsrRelease: value })}
        />
        <p className="text-xs text-muted-foreground">
          Time to fall to zero after gate off
        </p>
      </ConfigField>

      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm font-medium">Inputs:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <strong>Gate:</strong> Trigger signal ({">"} 0.5 = on)
          </li>
          <li>
            <strong>In:</strong> Optional audio to shape with envelope
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          Without audio input, outputs raw envelope (0-1). With audio input,
          multiplies audio by envelope.
        </p>
      </div>
    </>
  );
}
