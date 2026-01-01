import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for bit crusher block
 */
export function BitCrusherConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Bit Depth" htmlFor="crusherBits">
        <NumberInput
          id="crusherBits"
          min={1}
          max={16}
          step={1}
          value={config.crusherBits ?? 8}
          onChange={(value) => onConfigChange({ crusherBits: value })}
        />
        <p className="text-xs text-muted-foreground">
          Number of bits (1 = extreme, 16 = clean)
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="crusherMix">
        <NumberInput
          id="crusherMix"
          min={0}
          max={1}
          step={0.01}
          value={config.crusherMix ?? 1.0}
          onChange={(value) => onConfigChange({ crusherMix: value })}
        />
        <p className="text-xs text-muted-foreground">
          0 = dry only, 1 = wet only
        </p>
      </ConfigField>

      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm font-medium">Common Settings:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <strong>16 bit:</strong> CD quality (no effect)
          </li>
          <li>
            <strong>8 bit:</strong> Retro game console
          </li>
          <li>
            <strong>4 bit:</strong> Very lo-fi
          </li>
          <li>
            <strong>1 bit:</strong> Extreme square wave
          </li>
        </ul>
      </div>
    </>
  );
}

/**
 * Configuration for sample rate reducer block
 */
export function SampleRateReducerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Sample Rate (Hz)" htmlFor="reducerSampleRate">
        <NumberInput
          id="reducerSampleRate"
          min={100}
          max={44100}
          step={100}
          value={config.reducerSampleRate ?? 8000}
          onChange={(value) => onConfigChange({ reducerSampleRate: value })}
        />
        <p className="text-xs text-muted-foreground">
          Target sample rate (lower = more aliasing)
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="reducerMix">
        <NumberInput
          id="reducerMix"
          min={0}
          max={1}
          step={0.01}
          value={config.reducerMix ?? 1.0}
          onChange={(value) => onConfigChange({ reducerMix: value })}
        />
        <p className="text-xs text-muted-foreground">
          0 = dry only, 1 = wet only
        </p>
      </ConfigField>

      <div className="p-3 bg-muted rounded-md space-y-2">
        <p className="text-sm font-medium">Reference Rates:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            <strong>44100 Hz:</strong> CD quality (no effect)
          </li>
          <li>
            <strong>22050 Hz:</strong> Radio quality
          </li>
          <li>
            <strong>8000 Hz:</strong> Telephone quality
          </li>
          <li>
            <strong>4000 Hz:</strong> Walkie-talkie quality
          </li>
        </ul>
      </div>
    </>
  );
}
