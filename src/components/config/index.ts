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
  ReverbConfig,
} from "./TimeBasedConfig";
import { EnvelopeFollowerConfig, ADSRConfig } from "./EnvelopeConfig";
import { BitCrusherConfig, SampleRateReducerConfig } from "./LoFiConfig";
import { RingModConfig } from "./RingModConfig";
import {
  MultiplexerConfig,
  SplitterConfig,
  MixerConfig,
  MergeConfig,
  SwitchConfig,
  ABSwitchConfig,
  SampleHoldConfig,
  ComparatorConfig,
  PannerConfig,
  LogicGateConfig,
  MatrixRouterConfig,
} from "./RoutingConfig";
import { OscilloscopeConfig } from "./OscilloscopeConfig";
import { AudioOutputConfig } from "./AudioOutputConfig";
import {
  SliderConfig,
  ButtonConfig,
  ToggleConfig,
  PulseConfig,
  KeyboardConfig,
  BeatPadConfig,
  CrossfaderConfig,
} from "./InputControlConfig";
import { MultiSliderConfig } from "./MultiSliderConfig";
import { SequencerConfig } from "./SequencerConfig";
import { NumericMeterConfig } from "./NumericMeterConfig";
import { FFTAnalyzerConfig } from "./FFTAnalyzerConfig";
import { NoteToFreqConfig } from "./NoteToFreqConfig";

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
  ReverbConfig,
  EnvelopeFollowerConfig,
  ADSRConfig,
  BitCrusherConfig,
  SampleRateReducerConfig,
  RingModConfig,
  MultiplexerConfig,
  SplitterConfig,
  MixerConfig,
  MergeConfig,
  SwitchConfig,
  ABSwitchConfig,
  SampleHoldConfig,
  ComparatorConfig,
  PannerConfig,
  LogicGateConfig,
  MatrixRouterConfig,
  OscilloscopeConfig,
  AudioOutputConfig,
  SliderConfig,
  MultiSliderConfig,
  ButtonConfig,
  ToggleConfig,
  PulseConfig,
  KeyboardConfig,
  BeatPadConfig,
  CrossfaderConfig,
  SequencerConfig,
  NumericMeterConfig,
  FFTAnalyzerConfig,
  NoteToFreqConfig,
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
  reverb: ReverbConfig,

  // Envelope processing
  "envelope-follower": EnvelopeFollowerConfig,
  adsr: ADSRConfig,

  // Lo-Fi effects
  "bit-crusher": BitCrusherConfig,
  "sample-rate-reducer": SampleRateReducerConfig,

  // Frequency/Pitch effects
  "ring-mod": RingModConfig,

  // Routing
  multiplexer: MultiplexerConfig,
  splitter: SplitterConfig,
  mixer: MixerConfig,
  merge: MergeConfig,
  switch: SwitchConfig,
  "ab-switch": ABSwitchConfig,
  "sample-hold": SampleHoldConfig,
  comparator: ComparatorConfig,
  panner: PannerConfig,
  "stereo-splitter": null, // No config needed
  "stereo-merger": null, // No config needed
  "and-gate": LogicGateConfig,
  "or-gate": LogicGateConfig,
  "xor-gate": LogicGateConfig,
  "not-gate": LogicGateConfig,
  "matrix-router": MatrixRouterConfig,

  // Outputs
  oscilloscope: OscilloscopeConfig,
  "audio-output": AudioOutputConfig,
  "numeric-meter": NumericMeterConfig,

  // Inputs
  slider: SliderConfig,
  "multi-slider": MultiSliderConfig,
  button: ButtonConfig,
  toggle: ToggleConfig,
  pulse: PulseConfig,
  keyboard: KeyboardConfig,
  "beat-pad": BeatPadConfig,
  crossfader: CrossfaderConfig,
  sequencer: SequencerConfig,

  // FFT
  "fft-analyzer": FFTAnalyzerConfig,

  // Utility
  "note-to-freq": NoteToFreqConfig,
  "note-to-freq-poly": NoteToFreqConfig,

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
