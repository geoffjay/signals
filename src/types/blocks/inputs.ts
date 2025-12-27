import type { BlockDefinition } from "./common";

/**
 * Input control block types
 */
export type InputBlockType = "slider" | "button" | "toggle" | "pulse";

/**
 * Input control block definitions
 */
export const INPUT_DEFINITIONS: Record<InputBlockType, BlockDefinition> = {
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
};
