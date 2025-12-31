/**
 * InstrumentConfig Component
 *
 * Configuration UI for instrument blocks.
 * Allows customizing label and color.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigComponentProps } from "./types";

export function InstrumentConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customLabel">Custom Label</Label>
        <Input
          id="customLabel"
          type="text"
          value={config.customLabel || ""}
          onChange={(e) =>
            onConfigChange({ customLabel: e.target.value || undefined })
          }
          placeholder="Override instrument name"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the instrument's default name
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customColor">Custom Color</Label>
        <div className="flex gap-2">
          <Input
            id="customColor"
            type="color"
            value={config.customColor || "#6366f1"}
            onChange={(e) => onConfigChange({ customColor: e.target.value })}
            className="w-12 h-8 p-0 border-0 cursor-pointer"
          />
          <Input
            type="text"
            value={config.customColor || ""}
            onChange={(e) =>
              onConfigChange({ customColor: e.target.value || undefined })
            }
            placeholder="#6366f1"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Custom background color for this instrument block
        </p>
      </div>

      {config.instrumentId && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Instrument ID: {config.instrumentId}
          </p>
        </div>
      )}
    </div>
  );
}
