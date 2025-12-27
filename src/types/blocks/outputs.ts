import type { BlockDefinition } from "./common";

/**
 * Output/visualization block types
 */
export type OutputBlockType = "oscilloscope" | "audio-output" | "numeric-meter";

/**
 * Output block definitions
 */
export const OUTPUT_DEFINITIONS: Record<OutputBlockType, BlockDefinition> = {
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
};
