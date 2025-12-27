import { Input } from "@/components/ui/input";
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for numeric meter block
 */
export function NumericMeterConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <ConfigField label="Decimal Places" htmlFor="decimals">
        <NumberInput
          id="decimals"
          min={0}
          max={10}
          step={1}
          value={config.decimals ?? 3}
          onChange={(value) => onConfigChange({ decimals: value })}
        />
      </ConfigField>

      <ConfigField label="Unit (optional)" htmlFor="unit">
        <Input
          id="unit"
          type="text"
          placeholder="V, Hz, etc."
          value={config.unit ?? ""}
          onChange={(e) => onConfigChange({ unit: e.target.value })}
        />
      </ConfigField>
    </>
  );
}
