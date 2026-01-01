import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import type { BlockConfig } from "@/types/blocks";

interface MultiSliderControlProps {
  config: BlockConfig;
  onValueChange: (sliderIndex: number, value: number) => void;
}

/**
 * Multi-Slider control block - outputs multiple user-controlled values
 */
export function MultiSliderControl({ config, onValueChange }: MultiSliderControlProps) {
  const numSliders = config.numSliders || 2;
  const sliderConfigs = config.sliderConfigs || [];

  // Prevent node selection when clicking on interactive controls
  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
    },
    [],
  );

  return (
    <div className="mb-3 px-2 nodrag nowheel">
      <div className="flex gap-3 items-end justify-center">
        {Array.from({ length: numSliders }).map((_, i) => {
          const sliderConfig = sliderConfigs[i] || { min: 0, max: 1, step: 0.01, value: 0.5 };

          const handleChange = (values: readonly number[] | number) => {
            const newValue = Array.isArray(values) ? values[0] : values;
            onValueChange(i, newValue);
          };

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="text-[9px] text-muted-foreground">
                {sliderConfig.value.toFixed(2)}
              </div>
              <div
                onClick={stopPropagation}
                className="h-20"
              >
                <Slider
                  orientation="vertical"
                  min={sliderConfig.min}
                  max={sliderConfig.max}
                  step={sliderConfig.step}
                  value={[sliderConfig.value]}
                  onValueChange={handleChange}
                  className="h-full"
                />
              </div>
              <div className="text-[9px] text-muted-foreground font-medium">
                {i}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
