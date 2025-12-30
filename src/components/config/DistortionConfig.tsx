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
 * Configuration for waveshaper (general distortion) block
 */
export function WaveshaperConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const driveConnected = isInputConnected?.("drive") ?? false;

  return (
    <>
      <ConfigField
        label="Distortion Amount"
        htmlFor="distortionAmount"
        isConnected={driveConnected}
      >
        <NumberInput
          id="distortionAmount"
          min={0}
          max={100}
          step={1}
          value={config.distortionAmount ?? 50}
          onChange={(value) => onConfigChange({ distortionAmount: value })}
          disabled={driveConnected}
        />
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="distortionCurve">Curve Type</Label>
        <Select
          value={config.distortionCurve ?? "soft-clip"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              distortionCurve: value as
                | "soft-clip"
                | "hard-clip"
                | "tanh"
                | "atan"
                | "sine"
                | "cubic",
            })
          }
        >
          <SelectTrigger id="distortionCurve">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="soft-clip">Soft Clip</SelectItem>
            <SelectItem value="hard-clip">Hard Clip</SelectItem>
            <SelectItem value="tanh">Tanh (Warm)</SelectItem>
            <SelectItem value="atan">Atan (Soft)</SelectItem>
            <SelectItem value="sine">Sine (Odd Harmonics)</SelectItem>
            <SelectItem value="cubic">Cubic (Subtle)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oversample">Oversample</Label>
        <Select
          value={config.oversample ?? "none"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              oversample: value as "none" | "2x" | "4x",
            })
          }
        >
          <SelectTrigger id="oversample">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="2x">2x</SelectItem>
            <SelectItem value="4x">4x</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Higher values reduce aliasing but use more CPU
        </p>
      </div>
    </>
  );
}

/**
 * Configuration for hard clipper block
 */
export function HardClipConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const thresholdConnected = isInputConnected?.("threshold") ?? false;

  return (
    <>
      <ConfigField
        label="Clip Threshold"
        htmlFor="clipThreshold"
        isConnected={thresholdConnected}
      >
        <NumberInput
          id="clipThreshold"
          min={0.01}
          max={1}
          step={0.01}
          value={config.clipThreshold ?? 0.8}
          onChange={(value) => onConfigChange({ clipThreshold: value })}
          disabled={thresholdConnected}
        />
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="oversample">Oversample</Label>
        <Select
          value={config.oversample ?? "none"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              oversample: value as "none" | "2x" | "4x",
            })
          }
        >
          <SelectTrigger id="oversample">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="2x">2x</SelectItem>
            <SelectItem value="4x">4x</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Higher values reduce aliasing but use more CPU
        </p>
      </div>
    </>
  );
}

/**
 * Configuration for soft clipper block
 */
export function SoftClipConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const amountConnected = isInputConnected?.("amount") ?? false;

  return (
    <>
      <ConfigField
        label="Saturation Amount"
        htmlFor="softClipAmount"
        isConnected={amountConnected}
      >
        <NumberInput
          id="softClipAmount"
          min={0}
          max={1}
          step={0.01}
          value={config.softClipAmount ?? 0.5}
          onChange={(value) => onConfigChange({ softClipAmount: value })}
          disabled={amountConnected}
        />
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="softClipCurve">Curve Type</Label>
        <Select
          value={config.softClipCurve ?? "tanh"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              softClipCurve: value as "tanh" | "atan" | "cubic",
            })
          }
        >
          <SelectTrigger id="softClipCurve">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tanh">Tanh (Warm)</SelectItem>
            <SelectItem value="atan">Atan (Soft)</SelectItem>
            <SelectItem value="cubic">Cubic (Subtle)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oversample">Oversample</Label>
        <Select
          value={config.oversample ?? "none"}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              oversample: value as "none" | "2x" | "4x",
            })
          }
        >
          <SelectTrigger id="oversample">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="2x">2x</SelectItem>
            <SelectItem value="4x">4x</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Higher values reduce aliasing but use more CPU
        </p>
      </div>
    </>
  );
}
