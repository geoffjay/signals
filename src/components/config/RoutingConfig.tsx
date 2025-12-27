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
 * Configuration for multiplexer block
 */
export function MultiplexerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="numInputs">Number of Inputs</Label>
        <Select
          value={String(config.numInputs || 2)}
          onValueChange={(value) =>
            value && onConfigChange({ numInputs: parseInt(value) })
          }
        >
          <SelectTrigger id="numInputs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="8">8</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ConfigField label="Default Selector Value" htmlFor="selectorValue">
        <NumberInput
          id="selectorValue"
          min={0}
          max={(config.numInputs || 2) - 1}
          step={1}
          value={config.selectorValue || 0}
          onChange={(value) => onConfigChange({ selectorValue: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for splitter block
 */
export function SplitterConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="numOutputs">Number of Outputs</Label>
      <Select
        value={String(config.numOutputs || 2)}
        onValueChange={(value) =>
          value && onConfigChange({ numOutputs: parseInt(value) })
        }
      >
        <SelectTrigger id="numOutputs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="4">4</SelectItem>
          <SelectItem value="8">8</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
