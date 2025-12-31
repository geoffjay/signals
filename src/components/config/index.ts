import type { BlockType } from "@/types/blocks";
import type { ConfigComponentProps } from "./types";

// Import all config components
import { WaveGeneratorConfig } from "./WaveGeneratorConfig";
import { NoiseConfig } from "./NoiseConfig";
import { GainConfig } from "./GainConfig";
import { FilterConfig } from "./FilterConfig";
import { EQFilterConfig } from "./EQFilterConfig";
import { CompressorConfig } from "./CompressorConfig";
import {
  WaveshaperConfig,
  HardClipConfig,
  SoftClipConfig,
} from "./DistortionConfig";
import {
  DelayConfig,
  TremoloConfig,
  ChorusConfig,
  FlangerConfig,
  PhaserConfig,
  VibratoConfig,
} from "./TimeBasedConfig";
import { MultiplexerConfig, SplitterConfig } from "./RoutingConfig";
import { OscilloscopeConfig } from "./OscilloscopeConfig";
import { AudioOutputConfig } from "./AudioOutputConfig";
import {
  SliderConfig,
  ButtonConfig,
  ToggleConfig,
  PulseConfig,
} from "./InputControlConfig";
import { NumericMeterConfig } from "./NumericMeterConfig";
import { FFTAnalyzerConfig } from "./FFTAnalyzerConfig";

// Re-export types
export type { ConfigComponentProps } from "./types";

// Re-export shared components
export { ConfigField, NumberInput } from "./shared";

// Re-export all config components
export {
  WaveGeneratorConfig,
  NoiseConfig,
  GainConfig,
  FilterConfig,
  EQFilterConfig,
  CompressorConfig,
  WaveshaperConfig,
  HardClipConfig,
  SoftClipConfig,
  DelayConfig,
  TremoloConfig,
  ChorusConfig,
  FlangerConfig,
  PhaserConfig,
  VibratoConfig,
  MultiplexerConfig,
  SplitterConfig,
  OscilloscopeConfig,
  AudioOutputConfig,
  SliderConfig,
  ButtonConfig,
  ToggleConfig,
  PulseConfig,
  NumericMeterConfig,
  FFTAnalyzerConfig,
};

/**
 * Map of block types to their config components.
 * Returns the appropriate config component for a given block type,
 * or null for block types that have no configuration.
 */
export const configComponentMap: Record<
  BlockType,
  React.ComponentType<ConfigComponentProps> | null
> = {
  // Wave generators
  "sine-wave": WaveGeneratorConfig,
  "square-wave": WaveGeneratorConfig,
  "triangle-wave": WaveGeneratorConfig,
  "sawtooth-wave": WaveGeneratorConfig,
  noise: NoiseConfig,

  // Processor
  gain: GainConfig,

  // Filters
  "low-pass-filter": FilterConfig,
  "high-pass-filter": FilterConfig,
  "band-pass-filter": FilterConfig,
  "notch-filter": FilterConfig,
  "allpass-filter": FilterConfig,

  // EQ Filters
  "peaking-eq": EQFilterConfig,
  "lowshelf-filter": EQFilterConfig,
  "highshelf-filter": EQFilterConfig,

  // Dynamics
  compressor: CompressorConfig,

  // Distortion/Saturation
  waveshaper: WaveshaperConfig,
  "hard-clip": HardClipConfig,
  "soft-clip": SoftClipConfig,

  // Time-based effects
  delay: DelayConfig,
  tremolo: TremoloConfig,
  chorus: ChorusConfig,
  flanger: FlangerConfig,
  phaser: PhaserConfig,
  vibrato: VibratoConfig,

  // Routing
  multiplexer: MultiplexerConfig,
  splitter: SplitterConfig,

  // Outputs
  oscilloscope: OscilloscopeConfig,
  "audio-output": AudioOutputConfig,
  "numeric-meter": NumericMeterConfig,

  // Inputs
  slider: SliderConfig,
  button: ButtonConfig,
  toggle: ToggleConfig,
  pulse: PulseConfig,

  // FFT
  "fft-analyzer": FFTAnalyzerConfig,

  // Math operations (no config)
  add: null,
  subtract: null,
  multiply: null,
  divide: null,
  ceil: null,
  floor: null,
  round: null,
  abs: null,
  sign: null,
  negate: null,
  sqrt: null,
  sin: null,
  cos: null,
  min: null,
  max: null,
  pow: null,
  mod: null,
  clamp: null,
};

/**
 * Get the config component for a block type.
 * Returns null if the block type has no configuration options.
 */
export function getConfigComponent(
  blockType: BlockType,
): React.ComponentType<ConfigComponentProps> | null {
  return configComponentMap[blockType];
}
