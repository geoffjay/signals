import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for delay block
 */
export function DelayConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const timeConnected = isInputConnected?.("time") ?? false;
  const feedbackConnected = isInputConnected?.("feedback") ?? false;

  return (
    <>
      <ConfigField
        label="Delay Time (sec)"
        htmlFor="delayTime"
        isConnected={timeConnected}
      >
        <NumberInput
          id="delayTime"
          min={0}
          max={5}
          step={0.01}
          value={config.delayTime ?? 0.3}
          onChange={(value) => onConfigChange({ delayTime: value })}
          disabled={timeConnected}
        />
      </ConfigField>

      <ConfigField
        label="Feedback"
        htmlFor="delayFeedback"
        isConnected={feedbackConnected}
      >
        <NumberInput
          id="delayFeedback"
          min={0}
          max={0.95}
          step={0.01}
          value={config.delayFeedback ?? 0.3}
          onChange={(value) => onConfigChange({ delayFeedback: value })}
          disabled={feedbackConnected}
        />
        <p className="text-xs text-muted-foreground">
          Higher values create more repeats (max 0.95 to prevent runaway)
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="delayMix">
        <NumberInput
          id="delayMix"
          min={0}
          max={1}
          step={0.01}
          value={config.delayMix ?? 0.5}
          onChange={(value) => onConfigChange({ delayMix: value })}
        />
        <p className="text-xs text-muted-foreground">
          0 = dry only, 1 = wet only
        </p>
      </ConfigField>
    </>
  );
}

/**
 * Configuration for tremolo block
 */
export function TremoloConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const rateConnected = isInputConnected?.("rate") ?? false;
  const depthConnected = isInputConnected?.("depth") ?? false;

  return (
    <>
      <ConfigField
        label="Rate (Hz)"
        htmlFor="tremoloRate"
        isConnected={rateConnected}
      >
        <NumberInput
          id="tremoloRate"
          min={0.1}
          max={20}
          step={0.1}
          value={config.tremoloRate ?? 5}
          onChange={(value) => onConfigChange({ tremoloRate: value })}
          disabled={rateConnected}
        />
        <p className="text-xs text-muted-foreground">LFO speed in Hz</p>
      </ConfigField>

      <ConfigField
        label="Depth"
        htmlFor="tremoloDepth"
        isConnected={depthConnected}
      >
        <NumberInput
          id="tremoloDepth"
          min={0}
          max={1}
          step={0.01}
          value={config.tremoloDepth ?? 0.5}
          onChange={(value) => onConfigChange({ tremoloDepth: value })}
          disabled={depthConnected}
        />
        <p className="text-xs text-muted-foreground">
          Modulation intensity (0-1)
        </p>
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="tremoloWaveform">Waveform</Label>
        <Select
          value={config.tremoloWaveform ?? "sine"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              tremoloWaveform: value as
                | "sine"
                | "square"
                | "triangle"
                | "sawtooth",
            })
          }
        >
          <SelectTrigger id="tremoloWaveform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sine">Sine (Smooth)</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
            <SelectItem value="square">Square (Choppy)</SelectItem>
            <SelectItem value="sawtooth">Sawtooth</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">LFO waveform shape</p>
      </div>
    </>
  );
}

/**
 * Configuration for chorus block
 */
export function ChorusConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const rateConnected = isInputConnected?.("rate") ?? false;
  const depthConnected = isInputConnected?.("depth") ?? false;

  return (
    <>
      <ConfigField
        label="Rate (Hz)"
        htmlFor="chorusRate"
        isConnected={rateConnected}
      >
        <NumberInput
          id="chorusRate"
          min={0.1}
          max={10}
          step={0.1}
          value={config.chorusRate ?? 1.5}
          onChange={(value) => onConfigChange({ chorusRate: value })}
          disabled={rateConnected}
        />
        <p className="text-xs text-muted-foreground">LFO speed in Hz</p>
      </ConfigField>

      <ConfigField
        label="Depth (sec)"
        htmlFor="chorusDepth"
        isConnected={depthConnected}
      >
        <NumberInput
          id="chorusDepth"
          min={0.001}
          max={0.02}
          step={0.001}
          value={config.chorusDepth ?? 0.002}
          onChange={(value) => onConfigChange({ chorusDepth: value })}
          disabled={depthConnected}
        />
        <p className="text-xs text-muted-foreground">
          Modulation depth in seconds
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="chorusMix">
        <NumberInput
          id="chorusMix"
          min={0}
          max={1}
          step={0.01}
          value={config.chorusMix ?? 0.5}
          onChange={(value) => onConfigChange({ chorusMix: value })}
        />
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="chorusVoices">Voices</Label>
        <Select
          value={String(config.chorusVoices ?? 2)}
          onValueChange={(value) =>
            value && onConfigChange({ chorusVoices: parseInt(value) })
          }
        >
          <SelectTrigger id="chorusVoices">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Voice</SelectItem>
            <SelectItem value="2">2 Voices</SelectItem>
            <SelectItem value="3">3 Voices</SelectItem>
            <SelectItem value="4">4 Voices</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          More voices = richer sound
        </p>
      </div>
    </>
  );
}

/**
 * Configuration for flanger block
 */
export function FlangerConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const rateConnected = isInputConnected?.("rate") ?? false;
  const depthConnected = isInputConnected?.("depth") ?? false;

  return (
    <>
      <ConfigField
        label="Rate (Hz)"
        htmlFor="flangerRate"
        isConnected={rateConnected}
      >
        <NumberInput
          id="flangerRate"
          min={0.1}
          max={10}
          step={0.1}
          value={config.flangerRate ?? 0.5}
          onChange={(value) => onConfigChange({ flangerRate: value })}
          disabled={rateConnected}
        />
        <p className="text-xs text-muted-foreground">LFO speed in Hz</p>
      </ConfigField>

      <ConfigField
        label="Depth (sec)"
        htmlFor="flangerDepth"
        isConnected={depthConnected}
      >
        <NumberInput
          id="flangerDepth"
          min={0.0001}
          max={0.01}
          step={0.0001}
          value={config.flangerDepth ?? 0.001}
          onChange={(value) => onConfigChange({ flangerDepth: value })}
          disabled={depthConnected}
        />
        <p className="text-xs text-muted-foreground">
          Shorter than chorus for metallic sweep
        </p>
      </ConfigField>

      <ConfigField label="Feedback" htmlFor="flangerFeedback">
        <NumberInput
          id="flangerFeedback"
          min={-0.95}
          max={0.95}
          step={0.01}
          value={config.flangerFeedback ?? 0.5}
          onChange={(value) => onConfigChange({ flangerFeedback: value })}
        />
        <p className="text-xs text-muted-foreground">
          Negative values invert phase
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="flangerMix">
        <NumberInput
          id="flangerMix"
          min={0}
          max={1}
          step={0.01}
          value={config.flangerMix ?? 0.5}
          onChange={(value) => onConfigChange({ flangerMix: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for phaser block
 */
export function PhaserConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const rateConnected = isInputConnected?.("rate") ?? false;
  const depthConnected = isInputConnected?.("depth") ?? false;

  return (
    <>
      <ConfigField
        label="Rate (Hz)"
        htmlFor="phaserRate"
        isConnected={rateConnected}
      >
        <NumberInput
          id="phaserRate"
          min={0.1}
          max={10}
          step={0.1}
          value={config.phaserRate ?? 0.5}
          onChange={(value) => onConfigChange({ phaserRate: value })}
          disabled={rateConnected}
        />
        <p className="text-xs text-muted-foreground">LFO speed in Hz</p>
      </ConfigField>

      <ConfigField
        label="Depth"
        htmlFor="phaserDepth"
        isConnected={depthConnected}
      >
        <NumberInput
          id="phaserDepth"
          min={0}
          max={1}
          step={0.01}
          value={config.phaserDepth ?? 1.0}
          onChange={(value) => onConfigChange({ phaserDepth: value })}
          disabled={depthConnected}
        />
        <p className="text-xs text-muted-foreground">Modulation intensity</p>
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="phaserStages">Stages</Label>
        <Select
          value={String(config.phaserStages ?? 4)}
          onValueChange={(value) =>
            value && onConfigChange({ phaserStages: parseInt(value) })
          }
        >
          <SelectTrigger id="phaserStages">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Stages</SelectItem>
            <SelectItem value="4">4 Stages</SelectItem>
            <SelectItem value="6">6 Stages</SelectItem>
            <SelectItem value="8">8 Stages</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          More stages = deeper effect
        </p>
      </div>

      <ConfigField label="Feedback" htmlFor="phaserFeedback">
        <NumberInput
          id="phaserFeedback"
          min={-0.95}
          max={0.95}
          step={0.01}
          value={config.phaserFeedback ?? 0.5}
          onChange={(value) => onConfigChange({ phaserFeedback: value })}
        />
        <p className="text-xs text-muted-foreground">
          Negative values invert phase
        </p>
      </ConfigField>

      <ConfigField label="Mix (Dry/Wet)" htmlFor="phaserMix">
        <NumberInput
          id="phaserMix"
          min={0}
          max={1}
          step={0.01}
          value={config.phaserMix ?? 0.5}
          onChange={(value) => onConfigChange({ phaserMix: value })}
        />
      </ConfigField>

      <ConfigField label="Base Frequency (Hz)" htmlFor="phaserBaseFrequency">
        <NumberInput
          id="phaserBaseFrequency"
          min={100}
          max={5000}
          step={10}
          value={config.phaserBaseFrequency ?? 1000}
          onChange={(value) => onConfigChange({ phaserBaseFrequency: value })}
        />
        <p className="text-xs text-muted-foreground">
          Center frequency for allpass filters
        </p>
      </ConfigField>
    </>
  );
}

/**
 * Configuration for vibrato block
 */
export function VibratoConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const rateConnected = isInputConnected?.("rate") ?? false;
  const depthConnected = isInputConnected?.("depth") ?? false;

  return (
    <>
      <ConfigField
        label="Rate (Hz)"
        htmlFor="vibratoRate"
        isConnected={rateConnected}
      >
        <NumberInput
          id="vibratoRate"
          min={0.1}
          max={20}
          step={0.1}
          value={config.vibratoRate ?? 5}
          onChange={(value) => onConfigChange({ vibratoRate: value })}
          disabled={rateConnected}
        />
        <p className="text-xs text-muted-foreground">LFO speed in Hz</p>
      </ConfigField>

      <ConfigField
        label="Depth (sec)"
        htmlFor="vibratoDepth"
        isConnected={depthConnected}
      >
        <NumberInput
          id="vibratoDepth"
          min={0.001}
          max={0.01}
          step={0.001}
          value={config.vibratoDepth ?? 0.003}
          onChange={(value) => onConfigChange({ vibratoDepth: value })}
          disabled={depthConnected}
        />
        <p className="text-xs text-muted-foreground">
          Pitch variation depth in seconds
        </p>
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="vibratoWaveform">Waveform</Label>
        <Select
          value={config.vibratoWaveform ?? "sine"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              vibratoWaveform: value as
                | "sine"
                | "square"
                | "triangle"
                | "sawtooth",
            })
          }
        >
          <SelectTrigger id="vibratoWaveform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sine">Sine (Smooth)</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="sawtooth">Sawtooth</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">LFO waveform shape</p>
      </div>
    </>
  );
}
