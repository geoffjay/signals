import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ExternalSourcePicker } from "./ExternalSourcePicker";
import { useExternalConnectionStore } from "@/store/externalConnectionStore";
import { mapToEffectRange, formatEffectValue } from "@/visualizer/effectRanges";
import { cn } from "@/lib/utils";

// Helper hook to get a connection by name safely
function useConnectionByName(name: string | null) {
  const connectionsMap = useExternalConnectionStore((state) => state.connections);

  return useMemo(() => {
    if (!name) return undefined;
    for (const connection of connectionsMap.values()) {
      if (connection.name === name) {
        return connection;
      }
    }
    return undefined;
  }, [connectionsMap, name]);
}

interface EffectControlProps {
  effectName: string;
  label: string;
  description: string;
  enabled: boolean;
  value: number;
  externalSource: string | null;
  min: number;
  max: number;
  step: number;
  valueLabel?: string; // Optional label like "Intensity", "Offset", "Scale"
  formatValue?: (value: number) => string; // Optional custom formatter
  onToggle: () => void;
  onValueChange: (value: number) => void;
  onExternalSourceChange: (source: string | null) => void;
}

/**
 * Reusable effect control component with toggle, slider, and external source picker.
 * When an external source is connected, the slider is disabled and shows the external value.
 */
export function EffectControl({
  effectName,
  label,
  description,
  enabled,
  value,
  externalSource,
  min,
  max,
  step,
  valueLabel = "Intensity",
  formatValue,
  onToggle,
  onValueChange,
  onExternalSourceChange,
}: EffectControlProps) {
  // Get the external connection value if one is selected
  const externalConnection = useConnectionByName(externalSource);

  // Calculate the displayed value - either manual or from external source
  const isExternalActive = externalSource !== null && externalConnection !== undefined;
  const displayedValue = isExternalActive
    ? mapToEffectRange(externalConnection.value, effectName)
    : value;

  // Format the value for display
  const formattedValue = formatValue
    ? formatValue(displayedValue)
    : formatEffectValue(displayedValue, effectName);

  return (
    <div className="space-y-1.5">
      {/* Header row with label, description, external picker, and toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="space-y-0.5">
            <Label className="text-[11px]">{label}</Label>
            <p className="text-[9px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ExternalSourcePicker
            value={externalSource}
            onChange={onExternalSourceChange}
          />
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      {/* Slider row - only shown when effect is enabled */}
      {enabled && (
        <div className="space-y-1.5 pl-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] text-muted-foreground">
                {valueLabel}
              </Label>
              {/* External source indicator */}
              {isExternalActive && (
                <span className="text-[8px] text-purple-400 font-medium">
                  [{externalSource}]
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Visual intensity indicator when using external source */}
              {isExternalActive && (
                <div
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: `hsl(${270}, ${Math.round(externalConnection.value * 100)}%, ${50 + externalConnection.value * 25}%)`,
                    boxShadow: externalConnection.value > 0.5
                      ? `0 0 ${Math.round(externalConnection.value * 6)}px hsl(270, 100%, 60%)`
                      : undefined,
                  }}
                  title={`Signal: ${(externalConnection.value * 100).toFixed(0)}%`}
                />
              )}
              <span
                className={cn(
                  "text-[10px]",
                  isExternalActive ? "text-purple-400" : "text-muted-foreground"
                )}
              >
                {formattedValue}
              </span>
            </div>
          </div>
          <Slider
            value={[displayedValue]}
            onValueChange={(val) => {
              // Only allow manual changes when not using external source
              if (!isExternalActive) {
                const v = Array.isArray(val) ? val[0] : val;
                onValueChange(v);
              }
            }}
            min={min}
            max={max}
            step={step}
            className={cn(
              "w-full",
              isExternalActive && "opacity-60 cursor-not-allowed"
            )}
            disabled={isExternalActive}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Dual slider effect control for effects with two parameters (like Hue/Saturation).
 */
interface DualEffectControlProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  // First parameter
  param1Name: string;
  param1Label: string;
  param1Value: number;
  param1ExternalSource: string | null;
  param1Min: number;
  param1Max: number;
  param1Step: number;
  param1FormatValue?: (value: number) => string;
  onParam1Change: (value: number) => void;
  onParam1ExternalSourceChange: (source: string | null) => void;
  // Second parameter
  param2Name: string;
  param2Label: string;
  param2Value: number;
  param2ExternalSource: string | null;
  param2Min: number;
  param2Max: number;
  param2Step: number;
  param2FormatValue?: (value: number) => string;
  onParam2Change: (value: number) => void;
  onParam2ExternalSourceChange: (source: string | null) => void;
}

export function DualEffectControl({
  label,
  description,
  enabled,
  onToggle,
  param1Name,
  param1Label,
  param1Value,
  param1ExternalSource,
  param1Min,
  param1Max,
  param1Step,
  param1FormatValue,
  onParam1Change,
  onParam1ExternalSourceChange,
  param2Name,
  param2Label,
  param2Value,
  param2ExternalSource,
  param2Min,
  param2Max,
  param2Step,
  param2FormatValue,
  onParam2Change,
  onParam2ExternalSourceChange,
}: DualEffectControlProps) {
  // Get external connection values using stable helper hook
  const externalConnection1 = useConnectionByName(param1ExternalSource);
  const externalConnection2 = useConnectionByName(param2ExternalSource);

  const isExternal1Active = param1ExternalSource !== null && externalConnection1 !== undefined;
  const isExternal2Active = param2ExternalSource !== null && externalConnection2 !== undefined;

  const displayedValue1 = isExternal1Active
    ? mapToEffectRange(externalConnection1.value, param1Name)
    : param1Value;
  const displayedValue2 = isExternal2Active
    ? mapToEffectRange(externalConnection2.value, param2Name)
    : param2Value;

  const formattedValue1 = param1FormatValue
    ? param1FormatValue(displayedValue1)
    : formatEffectValue(displayedValue1, param1Name);
  const formattedValue2 = param2FormatValue
    ? param2FormatValue(displayedValue2)
    : formatEffectValue(displayedValue2, param2Name);

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-[11px]">{label}</Label>
          <p className="text-[9px] text-muted-foreground">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {/* Parameter sliders - only shown when effect is enabled */}
      {enabled && (
        <>
          {/* Parameter 1 */}
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-muted-foreground">
                  {param1Label}
                </Label>
                <ExternalSourcePicker
                  value={param1ExternalSource}
                  onChange={onParam1ExternalSourceChange}
                />
                {isExternal1Active && (
                  <span className="text-[8px] text-purple-400 font-medium">
                    [{param1ExternalSource}]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {isExternal1Active && (
                  <div
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: `hsl(270, ${Math.round(externalConnection1.value * 100)}%, ${50 + externalConnection1.value * 25}%)`,
                    }}
                  />
                )}
                <span
                  className={cn(
                    "text-[10px]",
                    isExternal1Active ? "text-purple-400" : "text-muted-foreground"
                  )}
                >
                  {formattedValue1}
                </span>
              </div>
            </div>
            <Slider
              value={[displayedValue1]}
              onValueChange={(val) => {
                if (!isExternal1Active) {
                  const v = Array.isArray(val) ? val[0] : val;
                  onParam1Change(v);
                }
              }}
              min={param1Min}
              max={param1Max}
              step={param1Step}
              className={cn(
                "w-full",
                isExternal1Active && "opacity-60 cursor-not-allowed"
              )}
              disabled={isExternal1Active}
            />
          </div>

          {/* Parameter 2 */}
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-muted-foreground">
                  {param2Label}
                </Label>
                <ExternalSourcePicker
                  value={param2ExternalSource}
                  onChange={onParam2ExternalSourceChange}
                />
                {isExternal2Active && (
                  <span className="text-[8px] text-purple-400 font-medium">
                    [{param2ExternalSource}]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {isExternal2Active && (
                  <div
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: `hsl(270, ${Math.round(externalConnection2.value * 100)}%, ${50 + externalConnection2.value * 25}%)`,
                    }}
                  />
                )}
                <span
                  className={cn(
                    "text-[10px]",
                    isExternal2Active ? "text-purple-400" : "text-muted-foreground"
                  )}
                >
                  {formattedValue2}
                </span>
              </div>
            </div>
            <Slider
              value={[displayedValue2]}
              onValueChange={(val) => {
                if (!isExternal2Active) {
                  const v = Array.isArray(val) ? val[0] : val;
                  onParam2Change(v);
                }
              }}
              min={param2Min}
              max={param2Max}
              step={param2Step}
              className={cn(
                "w-full",
                isExternal2Active && "opacity-60 cursor-not-allowed"
              )}
              disabled={isExternal2Active}
            />
          </div>
        </>
      )}
    </div>
  );
}
