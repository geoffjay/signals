import type { BlockType, BlockConfig } from "@/types/blocks";
import {
  SliderControl,
  ButtonControl,
  ToggleControl,
  PulseControl,
} from "./controls";
import {
  OscilloscopeBlock,
  FFTAnalyzerBlock,
  NumericMeterBlock,
} from "./visualizations";

interface BlockContentProps {
  blockType: BlockType;
  config: BlockConfig;
  analyser?: AnalyserNode;
  handlers: {
    onSliderChange: (value: number) => void;
    onButtonPress: () => void;
    onButtonRelease: () => void;
    onToggle: (e: React.MouseEvent) => void;
    onPulse: (e: React.MouseEvent) => void;
  };
}

/**
 * Dispatcher component that renders the appropriate content
 * based on block type (controls, visualizations, or nothing)
 */
export function BlockContent({
  blockType,
  config,
  analyser,
  handlers,
}: BlockContentProps) {
  switch (blockType) {
    // Visualizations
    case "oscilloscope":
      return <OscilloscopeBlock analyser={analyser} config={config} />;

    case "fft-analyzer":
      return <FFTAnalyzerBlock analyser={analyser} config={config} />;

    case "numeric-meter":
      return <NumericMeterBlock analyser={analyser} config={config} />;

    // Controls
    case "slider":
      return (
        <SliderControl
          config={config}
          onValueChange={handlers.onSliderChange}
        />
      );

    case "button":
      return (
        <ButtonControl
          config={config}
          onPress={handlers.onButtonPress}
          onRelease={handlers.onButtonRelease}
        />
      );

    case "toggle":
      return <ToggleControl config={config} onToggle={handlers.onToggle} />;

    case "pulse":
      return <PulseControl config={config} onPulse={handlers.onPulse} />;

    // All other block types have no special content
    default:
      return null;
  }
}
