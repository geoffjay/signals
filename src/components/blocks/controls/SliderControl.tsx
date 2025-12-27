import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import type { BlockConfig } from "@/types/blocks";

interface SliderControlProps {
  config: BlockConfig;
  onValueChange: (value: number) => void;
}

/**
 * Slider control block - outputs a user-controlled value
 */
export function SliderControl({ config, onValueChange }: SliderControlProps) {
  // Prevent node selection when clicking on interactive controls
  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
    },
    [],
  );

  const handleChange = useCallback(
    (values: readonly number[] | number) => {
      const newValue = Array.isArray(values) ? values[0] : values;
      onValueChange(newValue);
    },
    [onValueChange],
  );

  return (
    <div className="mb-3 px-2 nodrag nowheel">
      <div className="text-xs text-center text-muted-foreground mb-1">
        {(config.value ?? 0.5).toFixed(3)}
      </div>
      <div onClick={stopPropagation}>
        <Slider
          min={config.min ?? 0}
          max={config.max ?? 1}
          step={config.step ?? 0.01}
          value={[config.value ?? 0.5]}
          onValueChange={handleChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
