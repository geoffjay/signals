import type { BlockType, BlockConfig } from "@/types/blocks";
import {
  SliderControl,
  MultiSliderControl,
  ButtonControl,
  ToggleControl,
  PulseControl,
  KeyboardControl,
  BeatPadControl,
  CrossfaderControl,
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
    onMultiSliderChange?: (sliderIndex: number, value: number) => void;
    onButtonPress: () => void;
    onButtonRelease: () => void;
    onToggle: (e: React.MouseEvent) => void;
    onPulse: (e: React.MouseEvent) => void;
    onKeyPress?: (frequency: number, velocity: number) => void;
    onKeyRelease?: () => void;
    onPadPress?: (padIndex: number, velocity: number) => void;
    onPadRelease?: () => void;
    onCrossfaderChange?: (position: number) => void;
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

    case "multi-slider":
      return (
        <MultiSliderControl
          config={config}
          onValueChange={handlers.onMultiSliderChange ?? (() => {})}
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

    case "keyboard":
      return (
        <KeyboardControl
          config={config}
          onKeyPress={handlers.onKeyPress ?? (() => {})}
          onKeyRelease={handlers.onKeyRelease ?? (() => {})}
        />
      );

    case "beat-pad":
      return (
        <BeatPadControl
          config={config}
          onPadPress={handlers.onPadPress ?? (() => {})}
          onPadRelease={handlers.onPadRelease ?? (() => {})}
        />
      );

    case "crossfader":
      return (
        <CrossfaderControl
          config={config}
          onPositionChange={handlers.onCrossfaderChange ?? (() => {})}
        />
      );

    // All other block types have no special content
    default:
      return null;
  }
}
