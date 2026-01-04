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
  | "fft"
  | "utility";

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

  // Dynamics (Compressor)
  threshold?: number; // dB (-100 to 0)
  knee?: number; // dB (0 to 40)
  ratio?: number; // (1 to 20)
  attack?: number; // seconds (0 to 1)
  release?: number; // seconds (0 to 1)

  // Distortion/Saturation
  distortionAmount?: number; // 0-100 for waveshaper
  distortionCurve?:
    | "soft-clip"
    | "hard-clip"
    | "tanh"
    | "atan"
    | "sine"
    | "cubic";
  clipThreshold?: number; // 0-1 for hard clipper
  softClipAmount?: number; // 0-1 for soft clipper
  softClipCurve?: "tanh" | "atan" | "cubic";
  oversample?: "none" | "2x" | "4x";

  // Time-based effects (Delay)
  delayTime?: number; // seconds (0 to 5)
  delayFeedback?: number; // 0 to 0.95 (prevent runaway)
  delayMix?: number; // dry/wet (0 to 1)

  // Modulation effects (Tremolo)
  tremoloRate?: number; // Hz (LFO speed)
  tremoloDepth?: number; // 0 to 1 (modulation depth)
  tremoloWaveform?: "sine" | "square" | "triangle" | "sawtooth";

  // Chorus
  chorusRate?: number; // Hz (LFO speed, 0.1 to 10)
  chorusDepth?: number; // seconds (modulation depth, 0.001 to 0.02)
  chorusMix?: number; // dry/wet (0 to 1)
  chorusVoices?: number; // 1 to 4 voices

  // Flanger
  flangerRate?: number; // Hz (LFO speed, 0.1 to 10)
  flangerDepth?: number; // seconds (modulation depth, 0.0001 to 0.01)
  flangerFeedback?: number; // -0.95 to 0.95 (negative for inverted)
  flangerMix?: number; // dry/wet (0 to 1)

  // Phaser
  phaserRate?: number; // Hz (LFO speed, 0.1 to 10)
  phaserDepth?: number; // 0 to 1 (modulation depth)
  phaserStages?: number; // 2, 4, 6, or 8 allpass stages
  phaserFeedback?: number; // -0.95 to 0.95
  phaserMix?: number; // dry/wet (0 to 1)
  phaserBaseFrequency?: number; // Hz (center frequency for allpass filters)

  // Vibrato
  vibratoRate?: number; // Hz (LFO speed, 0.1 to 20)
  vibratoDepth?: number; // seconds (pitch variation via delay, 0.001 to 0.01)
  vibratoWaveform?: "sine" | "square" | "triangle" | "sawtooth";

  // Reverb
  reverbPreset?:
    | "small-room"
    | "medium-room"
    | "large-hall"
    | "cathedral"
    | "plate"
    | "spring";
  reverbDecay?: number; // Decay multiplier (0.5 to 10)
  reverbMix?: number; // dry/wet (0 to 1)
  reverbPredelay?: number; // seconds (0 to 0.2)

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
  stereoMode?: boolean; // false = mono (single input), true = stereo (L/R inputs)

  // Input controls
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  outputValue?: number; // For button and toggle: the value to output when active
  pulseValue?: number;
  pulseDuration?: number; // in milliseconds

  // Keyboard control
  octave?: number; // Base octave (0-8)
  numOctaves?: number; // Number of octaves to display (1-3)
  gate?: number; // Gate signal (0 or 1)
  velocity?: number; // Velocity (0-1)

  // Beat pad control
  columns?: number; // Number of columns (1-8)
  rows?: number; // Number of rows (1-8)
  padSize?: number; // Size of each pad in pixels (24-60)
  gap?: number; // Gap between pads in pixels (2-12)
  activePad?: number; // Currently active pad index (-1 = none)
  padColors?: string[]; // Custom colors for each pad
  trigger?: number; // Trigger signal (0 or 1)

  // Crossfader control
  position?: number; // Crossfader position (0-1, 0.5 = center)
  curveType?: "linear" | "equal-power" | "cut"; // Crossfade curve type

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

  // Instrument blocks
  instrumentId?: string;

  // Envelope Follower
  envelopeAttack?: number; // seconds (0.001 to 1)
  envelopeRelease?: number; // seconds (0.01 to 2)

  // ADSR Envelope
  adsrAttack?: number; // seconds (0.001 to 5)
  adsrDecay?: number; // seconds (0.001 to 5)
  adsrSustain?: number; // level (0 to 1)
  adsrRelease?: number; // seconds (0.001 to 10)

  // Bit Crusher
  crusherBits?: number; // 1 to 16
  crusherMix?: number; // dry/wet (0 to 1)

  // Sample Rate Reducer
  reducerSampleRate?: number; // Hz (100 to 44100)
  reducerMix?: number; // dry/wet (0 to 1)

  // Ring Modulator
  ringModMix?: number; // dry/wet (0 to 1)

  // Multi-slider
  numSliders?: number; // 2, 4, or 8
  sliderConfigs?: Array<{
    min: number;
    max: number;
    step: number;
    value: number;
  }>;

  // Sequencer
  seqBpm?: number; // 20-300, default 120
  seqSteps?: number; // 8 or 16, default 16
  seqRows?: number; // 4 or 8, default 4
  seqMode?: "triggers" | "note"; // Output mode
  seqGrid?: boolean[][]; // [row][step] - which cells are active
  seqCurrentStep?: number; // Current playhead position (0 to steps-1)
  seqNoteValues?: number[]; // Frequency/pitch value for each row

  // Mixer
  mixerChannels?: number; // 2, 4, or 8
  mixerGains?: number[]; // Individual channel gains (0-2)
  mixerMasterGain?: number; // Master output gain (0-2)

  // Merge
  mergeChannels?: number; // 2, 4, or 8

  // Switch/Gate
  switchThreshold?: number; // Control threshold (0-1)
  switchInvert?: boolean; // Invert gate behavior

  // A/B Switch
  abThreshold?: number; // Threshold for switching (0-1)

  // Sample & Hold
  sampleHoldThreshold?: number; // Trigger threshold (0-1)

  // Comparator
  comparatorMode?: "greater" | "less" | "equal" | "notEqual";
  comparatorThreshold?: number; // Fixed comparison value
  comparatorUseThreshold?: boolean; // Compare against threshold vs input B
  comparatorOutputHigh?: number; // Output when condition is true
  comparatorOutputLow?: number; // Output when condition is false

  // Panner
  panPosition?: number; // -1 (left) to 1 (right)
  panLaw?: "linear" | "equal-power";

  // Logic Gates
  gateThreshold?: number; // Signal threshold for boolean conversion
  gateOutputHigh?: number; // Output when true
  gateOutputLow?: number; // Output when false

  // Matrix Router
  matrixInputs?: number; // 2, 4, or 8
  matrixOutputs?: number; // 2, 4, or 8
  matrixRouting?: number[][]; // [input][output] = gain (0 or 1)

  // Note to Frequency converter
  noteToFreqOctave?: number; // 0-8, default 4 (A4 = 440 Hz)

  // External Connections
  extConnectionCount?: number; // 1-16, default 1
  extConnectionNames?: string[]; // Names for each connection
  extConnectionValues?: number[]; // Current sampled values (runtime)
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
