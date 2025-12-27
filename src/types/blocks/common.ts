/**
 * Common types and interfaces shared across all block definitions
 */

export type BlockCategory =
  | "generator"
  | "filter"
  | "processor"
  | "math"
  | "input"
  | "output"
  | "routing"
  | "fft";

/**
 * Block configuration interface containing all possible configuration options.
 * Different block types use different subsets of these options.
 */
export interface BlockConfig {
  // Common settings for all blocks
  customLabel?: string; // Custom label to display instead of default block name
  customColor?: string; // Custom background color (RGBA format: "rgba(r,g,b,a)")

  // Wave generators
  frequency?: number;
  amplitude?: number;
  phase?: number;

  // Gain
  gain?: number;

  // Filters
  cutoffFrequency?: number;
  qFactor?: number;
  filterGain?: number; // dB, for peaking EQ and shelf filters

  // Multiplexer
  numInputs?: number;
  selectorValue?: number;

  // Splitter
  numOutputs?: number;

  // Oscilloscope
  timeWindow?: number;
  refreshRate?: number;
  minAmplitude?: number;
  maxAmplitude?: number;

  // Audio output
  volume?: number;
  muted?: boolean;

  // Input controls
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  outputValue?: number; // For button and toggle: the value to output when active
  pulseValue?: number;
  pulseDuration?: number; // in milliseconds

  // Numeric meter
  decimals?: number;
  unit?: string;

  // FFT Analyzer
  fftMode?:
    | "spectrum"
    | "frequency-output"
    | "peak-detection"
    | "spectral-processing";
  fftSize?: number; // 32-32768, power of 2
  smoothingTimeConstant?: number; // 0-1
  minDecibels?: number; // -100 to -30
  maxDecibels?: number; // -30 to 0

  // Mode 2: Frequency Output
  frequencyBins?: Array<{ start: number; end: number; label: string }>;
  numFrequencyOutputs?: number; // 2, 4, 8

  // Mode 3: Peak Detection
  numPeaks?: number; // 1-10
  peakThreshold?: number; // -100 to 0 dB
  peakVisualization?: "list" | "graph";

  // Mode 4: Spectral Processing
  spectralOperation?: "passthrough" | "low-shelf" | "high-shelf" | "notch-band";
  operationFrequency?: number;
  operationGain?: number;
}

/**
 * Port definition for inputs and outputs
 */
export interface PortDefinition {
  id: string;
  label: string;
}

/**
 * Block definition containing type, label, ports, and default config
 */
export interface BlockDefinition {
  type: string;
  label: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultConfig: BlockConfig;
}
