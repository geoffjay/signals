import { Label } from "@/components/ui/label";
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for audio output block
 */
export function AudioOutputConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Volume" htmlFor="volume">
        <NumberInput
          id="volume"
          min={0}
          max={1}
          step={0.01}
          value={config.volume || 0.5}
          onChange={(value) => onConfigChange({ volume: value })}
        />
      </ConfigField>

      <div className="flex items-center space-x-2">
        <input
          id="muted"
          type="checkbox"
          checked={config.muted || false}
          onChange={(e) => onConfigChange({ muted: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="muted">Muted</Label>
      </div>
    </>
  );
}
