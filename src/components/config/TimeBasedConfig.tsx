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
