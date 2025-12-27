import type { BlockDefinition } from "./common";

/**
 * Generator block types
 */
export type GeneratorBlockType =
  | "sine-wave"
  | "square-wave"
  | "triangle-wave"
  | "sawtooth-wave"
  | "noise";

/**
 * Generator block definitions
 */
export const GENERATOR_DEFINITIONS: Record<
  GeneratorBlockType,
  BlockDefinition
> = {
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
};
