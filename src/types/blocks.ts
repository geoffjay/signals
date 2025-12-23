export type BlockType =
  | 'sine-wave'
  | 'square-wave'
  | 'triangle-wave'
  | 'sawtooth-wave'
  | 'noise'
  | 'gain'
  | 'low-pass-filter'
  | 'high-pass-filter'
  | 'band-pass-filter'
  | 'multiplexer'
  | 'splitter'
  | 'oscilloscope'
  | 'audio-output'
  | 'slider'
  | 'button'
  | 'toggle'
  | 'pulse'
  | 'numeric-meter'
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide';

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

  // Multiplexer
  numInputs?: number;
  selectorValue?: number;

  // Splitter
  numOutputs?: number;

  // Oscilloscope
  timeWindow?: number;
  refreshRate?: number;

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
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  inputs: Array<{ id: string; label: string }>;
  outputs: Array<{ id: string; label: string }>;
  defaultConfig: BlockConfig;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  'sine-wave': {
    type: 'sine-wave',
    label: 'Sine Wave',
    inputs: [
      { id: 'freq', label: 'Freq' },
      { id: 'amp', label: 'Amp' },
      { id: 'phase', label: 'Phase' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0
    }
  },
  'square-wave': {
    type: 'square-wave',
    label: 'Square Wave',
    inputs: [
      { id: 'freq', label: 'Freq' },
      { id: 'amp', label: 'Amp' },
      { id: 'phase', label: 'Phase' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0
    }
  },
  'triangle-wave': {
    type: 'triangle-wave',
    label: 'Triangle Wave',
    inputs: [
      { id: 'freq', label: 'Freq' },
      { id: 'amp', label: 'Amp' },
      { id: 'phase', label: 'Phase' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0
    }
  },
  'sawtooth-wave': {
    type: 'sawtooth-wave',
    label: 'Sawtooth Wave',
    inputs: [
      { id: 'freq', label: 'Freq' },
      { id: 'amp', label: 'Amp' },
      { id: 'phase', label: 'Phase' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      frequency: 440,
      amplitude: 0.5,
      phase: 0
    }
  },
  'noise': {
    type: 'noise',
    label: 'Noise Generator',
    inputs: [{ id: 'amp', label: 'Amp' }],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      amplitude: 0.5
    }
  },
  'gain': {
    type: 'gain',
    label: 'Gain',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      gain: 1.0
    }
  },
  'add': {
    type: 'add',
    label: 'Add',
    inputs: [
      { id: 'inputA', label: 'A' },
      { id: 'inputB', label: 'B' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {}
  },
  'subtract': {
    type: 'subtract',
    label: 'Subtract',
    inputs: [
      { id: 'inputA', label: 'A' },
      { id: 'inputB', label: 'B' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {}
  },
  'multiply': {
    type: 'multiply',
    label: 'Multiply',
    inputs: [
      { id: 'inputA', label: 'A' },
      { id: 'inputB', label: 'B' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {}
  },
  'divide': {
    type: 'divide',
    label: 'Divide',
    inputs: [
      { id: 'inputA', label: 'A' },
      { id: 'inputB', label: 'B' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {}
  },
  'low-pass-filter': {
    type: 'low-pass-filter',
    label: 'Low-Pass Filter',
    inputs: [
      { id: 'in', label: 'In' },
      { id: 'cutoff', label: 'Cutoff' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0
    }
  },
  'high-pass-filter': {
    type: 'high-pass-filter',
    label: 'High-Pass Filter',
    inputs: [
      { id: 'in', label: 'In' },
      { id: 'cutoff', label: 'Cutoff' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0
    }
  },
  'band-pass-filter': {
    type: 'band-pass-filter',
    label: 'Band-Pass Filter',
    inputs: [
      { id: 'in', label: 'In' },
      { id: 'cutoff', label: 'Cutoff' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0
    }
  },
  'multiplexer': {
    type: 'multiplexer',
    label: 'Multiplexer',
    inputs: [
      { id: 'in0', label: 'In 0' },
      { id: 'in1', label: 'In 1' },
      { id: 'selector', label: 'Sel' }
    ],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      numInputs: 2,
      selectorValue: 0
    }
  },
  'splitter': {
    type: 'splitter',
    label: 'Signal Splitter',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [
      { id: 'out0', label: 'Out 0' },
      { id: 'out1', label: 'Out 1' }
    ],
    defaultConfig: {
      numOutputs: 2
    }
  },
  'oscilloscope': {
    type: 'oscilloscope',
    label: 'Oscilloscope',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [],
    defaultConfig: {
      timeWindow: 0.05,
      refreshRate: 60
    }
  },
  'audio-output': {
    type: 'audio-output',
    label: 'Audio Output',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [],
    defaultConfig: {
      volume: 0.5,
      muted: false
    }
  },
  'slider': {
    type: 'slider',
    label: 'Slider',
    inputs: [],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.5
    }
  },
  'button': {
    type: 'button',
    label: 'Button',
    inputs: [],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      value: 0,
      outputValue: 1.0
    }
  },
  'toggle': {
    type: 'toggle',
    label: 'Toggle',
    inputs: [],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      value: 0,
      outputValue: 1.0
    }
  },
  'pulse': {
    type: 'pulse',
    label: 'Pulse',
    inputs: [],
    outputs: [{ id: 'out', label: 'Out' }],
    defaultConfig: {
      pulseValue: 1.0,
      pulseDuration: 100
    }
  },
  'numeric-meter': {
    type: 'numeric-meter',
    label: 'Numeric Meter',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [],
    defaultConfig: {
      decimals: 3,
      unit: ''
    }
  }
};

// Helper function to get inputs/outputs for configurable blocks
export function getBlockInputs(type: BlockType, config: BlockConfig): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === 'multiplexer') {
    const numInputs = config.numInputs || 2;
    const inputs = [];
    for (let i = 0; i < numInputs; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    inputs.push({ id: 'selector', label: 'Sel' });
    return inputs;
  }

  return definition.inputs;
}

export function getBlockOutputs(type: BlockType, config: BlockConfig): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === 'splitter') {
    const numOutputs = config.numOutputs || 2;
    const outputs = [];
    for (let i = 0; i < numOutputs; i++) {
      outputs.push({ id: `out${i}`, label: `Out ${i}` });
    }
    return outputs;
  }

  return definition.outputs;
}
