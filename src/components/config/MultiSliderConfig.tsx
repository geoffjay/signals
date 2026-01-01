import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for multi-slider block
 */
export function MultiSliderConfig({ config, onConfigChange }: ConfigComponentProps) {
  const numSliders = config.numSliders || 2;
  const sliderConfigs = config.sliderConfigs || [];

  // Handle number of sliders change
  const handleNumSlidersChange = (newNum: number) => {
    // Create new slider configs array with appropriate length
    const newSliderConfigs = Array.from({ length: newNum }, (_, i) =>
      sliderConfigs[i] || { min: 0, max: 1, step: 0.01, value: 0.5 }
    );
    onConfigChange({ numSliders: newNum, sliderConfigs: newSliderConfigs });
  };

  // Handle individual slider config changes
  const handleSliderConfigChange = (
    index: number,
    field: "min" | "max" | "step",
    value: number
  ) => {
    const newSliderConfigs = [...sliderConfigs];
    if (!newSliderConfigs[index]) {
      newSliderConfigs[index] = { min: 0, max: 1, step: 0.01, value: 0.5 };
    }
    newSliderConfigs[index] = {
      ...newSliderConfigs[index],
      [field]: value,
    };
    onConfigChange({ sliderConfigs: newSliderConfigs });
  };

  return (
    <>
      <ConfigField label="Number of Sliders" htmlFor="numSliders">
        <select
          id="numSliders"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={numSliders}
          onChange={(e) => handleNumSlidersChange(Number(e.target.value))}
        >
          <option value={2}>2 Sliders</option>
          <option value={4}>4 Sliders</option>
          <option value={8}>8 Sliders</option>
        </select>
      </ConfigField>

      <div className="mt-4 space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Slider Settings
        </div>
        {Array.from({ length: numSliders }).map((_, i) => {
          const sliderConfig = sliderConfigs[i] || { min: 0, max: 1, step: 0.01, value: 0.5 };
          return (
            <div key={i} className="p-3 bg-muted/30 rounded-md space-y-2">
              <div className="text-xs font-medium">Slider {i}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Min</label>
                  <NumberInput
                    id={`slider-${i}-min`}
                    step={0.01}
                    value={sliderConfig.min}
                    onChange={(value) => handleSliderConfigChange(i, "min", value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Max</label>
                  <NumberInput
                    id={`slider-${i}-max`}
                    step={0.01}
                    value={sliderConfig.max}
                    onChange={(value) => handleSliderConfigChange(i, "max", value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Step</label>
                  <NumberInput
                    id={`slider-${i}-step`}
                    min={0.001}
                    step={0.001}
                    value={sliderConfig.step}
                    onChange={(value) => handleSliderConfigChange(i, "step", value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
