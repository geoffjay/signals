import type { BlockDefinition } from "./common";

/**
 * Routing block types
 */
export type RoutingBlockType =
  | "multiplexer"
  | "splitter"
  | "mixer"
  | "merge"
  | "switch"
  | "ab-switch"
  | "sample-hold"
  | "comparator"
  | "panner"
  | "stereo-splitter"
  | "stereo-merger"
  | "and-gate"
  | "or-gate"
  | "xor-gate"
  | "not-gate"
  | "matrix-router";

/**
 * Routing block definitions
 */
export const ROUTING_DEFINITIONS: Record<RoutingBlockType, BlockDefinition> = {
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
  mixer: {
    type: "mixer",
    label: "Mixer",
    inputs: [
      { id: "in0", label: "In 0" },
      { id: "in1", label: "In 1" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      mixerChannels: 2,
      mixerGains: [1.0, 1.0],
      mixerMasterGain: 1.0,
    },
  },
  merge: {
    type: "merge",
    label: "Merge",
    inputs: [
      { id: "in0", label: "In 0" },
      { id: "in1", label: "In 1" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      mergeChannels: 2,
    },
  },
  switch: {
    type: "switch",
    label: "Switch/Gate",
    inputs: [
      { id: "in", label: "In" },
      { id: "control", label: "Ctrl" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      switchThreshold: 0.5,
      switchInvert: false,
    },
  },
  "ab-switch": {
    type: "ab-switch",
    label: "A/B Switch",
    inputs: [
      { id: "inA", label: "A" },
      { id: "inB", label: "B" },
      { id: "control", label: "Ctrl" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      abThreshold: 0.5,
    },
  },
  "sample-hold": {
    type: "sample-hold",
    label: "Sample & Hold",
    inputs: [
      { id: "in", label: "In" },
      { id: "trigger", label: "Trig" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      sampleHoldThreshold: 0.5,
    },
  },
  comparator: {
    type: "comparator",
    label: "Comparator",
    inputs: [
      { id: "inA", label: "A" },
      { id: "inB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      comparatorMode: "greater" as "greater" | "less" | "equal" | "notEqual",
      comparatorThreshold: 0, // Used when comparing against fixed value instead of input B
      comparatorUseThreshold: false, // If true, compare A against threshold instead of B
      comparatorOutputHigh: 1.0,
      comparatorOutputLow: 0.0,
    },
  },
  panner: {
    type: "panner",
    label: "Panner",
    inputs: [
      { id: "in", label: "In" },
      { id: "pan", label: "Pan" },
    ],
    outputs: [
      { id: "left", label: "L" },
      { id: "right", label: "R" },
    ],
    defaultConfig: {
      panPosition: 0, // -1 = full left, 0 = center, 1 = full right
      panLaw: "equal-power" as "linear" | "equal-power",
    },
  },
  "stereo-splitter": {
    type: "stereo-splitter",
    label: "Stereo Splitter",
    inputs: [{ id: "in", label: "Stereo" }],
    outputs: [
      { id: "left", label: "L" },
      { id: "right", label: "R" },
    ],
    defaultConfig: {},
  },
  "stereo-merger": {
    type: "stereo-merger",
    label: "Stereo Merger",
    inputs: [
      { id: "left", label: "L" },
      { id: "right", label: "R" },
    ],
    outputs: [{ id: "out", label: "Stereo" }],
    defaultConfig: {},
  },
  "and-gate": {
    type: "and-gate",
    label: "AND Gate",
    inputs: [
      { id: "inA", label: "A" },
      { id: "inB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      gateThreshold: 0.5,
      gateOutputHigh: 1.0,
      gateOutputLow: 0.0,
    },
  },
  "or-gate": {
    type: "or-gate",
    label: "OR Gate",
    inputs: [
      { id: "inA", label: "A" },
      { id: "inB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      gateThreshold: 0.5,
      gateOutputHigh: 1.0,
      gateOutputLow: 0.0,
    },
  },
  "xor-gate": {
    type: "xor-gate",
    label: "XOR Gate",
    inputs: [
      { id: "inA", label: "A" },
      { id: "inB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      gateThreshold: 0.5,
      gateOutputHigh: 1.0,
      gateOutputLow: 0.0,
    },
  },
  "not-gate": {
    type: "not-gate",
    label: "NOT Gate",
    inputs: [{ id: "in", label: "In" }],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      gateThreshold: 0.5,
      gateOutputHigh: 1.0,
      gateOutputLow: 0.0,
    },
  },
  "matrix-router": {
    type: "matrix-router",
    label: "Matrix Router",
    inputs: [
      { id: "in0", label: "In 0" },
      { id: "in1", label: "In 1" },
    ],
    outputs: [
      { id: "out0", label: "Out 0" },
      { id: "out1", label: "Out 1" },
    ],
    defaultConfig: {
      matrixInputs: 2,
      matrixOutputs: 2,
      matrixRouting: [[1, 0], [0, 1]], // [input][output] = gain (0 or 1)
    },
  },
};
