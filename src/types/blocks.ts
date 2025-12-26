export type BlockType =
  | "sine-wave"
  | "square-wave"
  | "triangle-wave"
  | "sawtooth-wave"
  | "noise"
  | "gain"
  | "low-pass-filter"
  | "high-pass-filter"
  | "band-pass-filter"
  | "notch-filter"
  | "allpass-filter"
  | "peaking-eq"
  | "lowshelf-filter"
  | "highshelf-filter"
  | "multiplexer"
  | "splitter"
  | "oscilloscope"
  | "audio-output"
  | "slider"
  | "button"
  | "toggle"
  | "pulse"
  | "numeric-meter"
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "fft-analyzer"
  | "ceil"
  | "floor"
  | "round"
  | "abs"
  | "sign"
  | "negate"
  | "sqrt"
  | "sin"
  | "cos"
  | "min"
  | "max"
  | "pow"
  | "mod"
  | "clamp";

export interface BlockConfig {
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

export interface BlockDefinition {
  type: BlockType;
  label: string;
  inputs: Array<{ id: string; label: string }>;
  outputs: Array<{ id: string; label: string }>;
  defaultConfig: BlockConfig;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  "sine-wave": {
    type: "sine-wave",
    label: "Sine Wave",
    inputs: [
      { id: "freq", label: "Freq" },
      { id: "amp", label: "Amp" },
      { id: "phase", label: "Phase" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    },
  },
  "square-wave": {
    type: "square-wave",
    label: "Square Wave",
    inputs: [
      { id: "freq", label: "Freq" },
      { id: "amp", label: "Amp" },
      { id: "phase", label: "Phase" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    },
  },
  "triangle-wave": {
    type: "triangle-wave",
    label: "Triangle Wave",
    inputs: [
      { id: "freq", label: "Freq" },
      { id: "amp", label: "Amp" },
      { id: "phase", label: "Phase" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    },
  },
  "sawtooth-wave": {
    type: "sawtooth-wave",
    label: "Sawtooth Wave",
    inputs: [
      { id: "freq", label: "Freq" },
      { id: "amp", label: "Amp" },
      { id: "phase", label: "Phase" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    },
  },
  noise: {
    type: "noise",
    label: "Noise Generator",
    inputs: [{ id: "amp", label: "Amp" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      amplitude: 0.5,
    },
  },
  gain: {
    type: "gain",
    label: "Gain",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      gain: 1.0,
    },
  },
  add: {
    type: "add",
    label: "Add",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  subtract: {
    type: "subtract",
    label: "Subtract",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  multiply: {
    type: "multiply",
    label: "Multiply",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  divide: {
    type: "divide",
    label: "Divide",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  "low-pass-filter": {
    type: "low-pass-filter",
    label: "Low-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "high-pass-filter": {
    type: "high-pass-filter",
    label: "High-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "band-pass-filter": {
    type: "band-pass-filter",
    label: "Band-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "notch-filter": {
    type: "notch-filter",
    label: "Notch Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "allpass-filter": {
    type: "allpass-filter",
    label: "All-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "peaking-eq": {
    type: "peaking-eq",
    label: "Peaking EQ",
    inputs: [
      { id: "in", label: "In" },
      { id: "frequency", label: "Freq" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
      filterGain: 0,
    },
  },
  "lowshelf-filter": {
    type: "lowshelf-filter",
    label: "Low-Shelf Filter",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 200,
      filterGain: 0,
    },
  },
  "highshelf-filter": {
    type: "highshelf-filter",
    label: "High-Shelf Filter",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 3000,
      filterGain: 0,
    },
  },
  multiplexer: {
    type: "multiplexer",
    label: "Multiplexer",
    inputs: [
      { id: "in0", label: "In 0" },
      { id: "in1", label: "In 1" },
      { id: "selector", label: "Sel" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      numInputs: 2,
      selectorValue: 0,
    },
  },
  splitter: {
    type: "splitter",
    label: "Signal Splitter",
    inputs: [{ id: "in", label: "In" }],
    outputs: [
      { id: "out0", label: "Out 0" },
      { id: "out1", label: "Out 1" },
    ],
    defaultConfig: {
      numOutputs: 2,
    },
  },
  oscilloscope: {
    type: "oscilloscope",
    label: "Oscilloscope",
    inputs: [{ id: "in", label: "In" }],
    outputs: [],
    defaultConfig: {
      timeWindow: 0.05,
      refreshRate: 60,
      minAmplitude: -1,
      maxAmplitude: 1,
    },
  },
  "audio-output": {
    type: "audio-output",
    label: "Audio Output",
    inputs: [{ id: "in", label: "In" }],
    outputs: [],
    defaultConfig: {
      volume: 0.5,
      muted: false,
    },
  },
  slider: {
    type: "slider",
    label: "Slider",
    inputs: [],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.5,
    },
  },
  button: {
    type: "button",
    label: "Button",
    inputs: [],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      value: 0,
      outputValue: 1.0,
    },
  },
  toggle: {
    type: "toggle",
    label: "Toggle",
    inputs: [],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      value: 0,
      outputValue: 1.0,
    },
  },
  pulse: {
    type: "pulse",
    label: "Pulse",
    inputs: [],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      pulseValue: 1.0,
      pulseDuration: 100,
    },
  },
  "numeric-meter": {
    type: "numeric-meter",
    label: "Numeric Meter",
    inputs: [{ id: "in", label: "In" }],
    outputs: [],
    defaultConfig: {
      decimals: 3,
      unit: "",
    },
  },
  "fft-analyzer": {
    type: "fft-analyzer",
    label: "FFT Analyzer",
    inputs: [{ id: "in", label: "In" }],
    outputs: [], // Dynamic based on mode
    defaultConfig: {
      fftMode: "spectrum",
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      numFrequencyOutputs: 4,
      frequencyBins: [
        { start: 0, end: 10, label: "Sub-Bass" },
        { start: 10, end: 50, label: "Bass" },
        { start: 50, end: 100, label: "Mids" },
        { start: 100, end: 200, label: "Highs" },
      ],
      numPeaks: 5,
      peakThreshold: -40,
      peakVisualization: "list",
      spectralOperation: "passthrough",
      operationFrequency: 1000,
      operationGain: 0,
    },
  },
  ceil: {
    type: "ceil",
    label: "Ceil",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  floor: {
    type: "floor",
    label: "Floor",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  round: {
    type: "round",
    label: "Round",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  abs: {
    type: "abs",
    label: "Abs",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  sign: {
    type: "sign",
    label: "Sign",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  negate: {
    type: "negate",
    label: "Negate",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  sqrt: {
    type: "sqrt",
    label: "Sqrt",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  sin: {
    type: "sin",
    label: "Sin",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  cos: {
    type: "cos",
    label: "Cos",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  min: {
    type: "min",
    label: "Min",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  max: {
    type: "max",
    label: "Max",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  pow: {
    type: "pow",
    label: "Power",
    inputs: [
      { id: "inputA", label: "Base" },
      { id: "inputB", label: "Exp" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  mod: {
    type: "mod",
    label: "Modulo",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
  clamp: {
    type: "clamp",
    label: "Clamp",
    inputs: [
      { id: "inputValue", label: "Val" },
      { id: "inputMin", label: "Min" },
      { id: "inputMax", label: "Max" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {},
  },
};

// Helper function to get inputs/outputs for configurable blocks
export function getBlockInputs(
  type: BlockType,
  config: BlockConfig,
): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === "multiplexer") {
    const numInputs = config.numInputs || 2;
    const inputs = [];
    for (let i = 0; i < numInputs; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    inputs.push({ id: "selector", label: "Sel" });
    return inputs;
  }

  return definition.inputs;
}

export function getBlockOutputs(
  type: BlockType,
  config: BlockConfig,
): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === "splitter") {
    const numOutputs = config.numOutputs || 2;
    const outputs = [];
    for (let i = 0; i < numOutputs; i++) {
      outputs.push({ id: `out${i}`, label: `Out ${i}` });
    }
    return outputs;
  }

  if (type === "fft-analyzer") {
    const mode = config.fftMode || "spectrum";

    switch (mode) {
      case "spectrum":
      case "peak-detection":
        // No audio outputs, visualization only
        return [];

      case "frequency-output": {
        const numOutputs = config.numFrequencyOutputs || 4;
        const bins = config.frequencyBins || [];
        return bins.slice(0, numOutputs).map((bin, i) => ({
          id: `freq_out${i}`,
          label: bin.label || `Bin ${i}`,
        }));
      }

      case "spectral-processing":
        // One processed audio output
        return [{ id: "out", label: "Out" }];

      default:
        return [];
    }
  }

  return definition.outputs;
}
