import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ConfigField } from "./ConfigField";
import type { BlockConfig } from "@/types/blocks";

interface CommonBlockConfigProps {
  config: BlockConfig;
  onConfigChange: (updates: Partial<BlockConfig>) => void;
}

/**
 * Converts a hex color (#RRGGBB or #RRGGBBAA) to rgba format
 */
function hexToRgba(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex,
  );
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const a = result[4] ? parseInt(result[4], 16) / 255 : 1;

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Converts rgba format to hex color (#RRGGBBAA)
 */
function rgbaToHex(rgba: string): string {
  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  if (!match) return rgba;

  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  const a = match[4]
    ? Math.round(parseFloat(match[4]) * 255)
        .toString(16)
        .padStart(2, "0")
    : "ff";

  return `#${r}${g}${b}${a}`;
}

/**
 * Common configuration options available for all block types.
 * Includes custom label and background color settings.
 */
export function CommonBlockConfig({
  config,
  onConfigChange,
}: CommonBlockConfigProps) {
  // Local state for the RGBA text input
  const [rgbaInput, setRgbaInput] = useState(config.customColor || "");

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onConfigChange({ customLabel: value || undefined });
    },
    [onConfigChange],
  );

  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      const rgba = hexToRgba(hex);
      setRgbaInput(rgba);
      onConfigChange({ customColor: rgba });
    },
    [onConfigChange],
  );

  const handleRgbaInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setRgbaInput(value);

      // Validate and apply RGBA value
      if (
        value === "" ||
        /^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)$/.test(value)
      ) {
        onConfigChange({ customColor: value || undefined });
      }
    },
    [onConfigChange],
  );

  const handleClearColor = useCallback(() => {
    setRgbaInput("");
    onConfigChange({ customColor: undefined });
  }, [onConfigChange]);

  // Convert current color to hex for the color picker
  const colorPickerValue = config.customColor
    ? rgbaToHex(config.customColor).slice(0, 7) // Remove alpha for native color picker
    : "#4a5568";

  return (
    <div className="space-y-4">
      {/* Custom Label */}
      <ConfigField label="Custom Label" htmlFor="custom-label">
        <Input
          id="custom-label"
          type="text"
          value={config.customLabel || ""}
          onChange={handleLabelChange}
          placeholder="Enter custom label..."
        />
      </ConfigField>

      {/* Custom Color */}
      <ConfigField label="Background Color" htmlFor="custom-color">
        <div className="flex gap-2 items-center">
          {/* Native color picker */}
          <input
            type="color"
            id="custom-color"
            value={colorPickerValue}
            onChange={handleColorPickerChange}
            className="w-10 h-7 rounded border border-input cursor-pointer bg-transparent"
          />

          {/* RGBA text input */}
          <Input
            type="text"
            value={rgbaInput}
            onChange={handleRgbaInputChange}
            placeholder="rgba(r, g, b, a)"
            className="flex-1"
          />

          {/* Clear button */}
          {config.customColor && (
            <button
              type="button"
              onClick={handleClearColor}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
              title="Clear color"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter color as rgba(r, g, b, a) or use the picker
        </p>
      </ConfigField>
    </div>
  );
}
