import type { BlockDefinition } from "./common";

/**
 * Input control block types
 */
export type InputBlockType =
  | "slider"
  | "button"
  | "toggle"
  | "pulse"
  | "keyboard"
  | "beat-pad"
  | "crossfader";

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
  keyboard: {
    type: "keyboard",
    label: "Keyboard",
    inputs: [],
    outputs: [
      { id: "freq", label: "Freq" },
      { id: "gate", label: "Gate" },
      { id: "velocity", label: "Vel" },
    ],
    defaultConfig: {
      // Starting octave (C4 = middle C = 261.63 Hz)
      octave: 4,
      // Number of octaves to display (1-3)
      numOctaves: 2,
      // Current pressed key frequency (0 when no key pressed)
      frequency: 0,
      // Gate signal (1 when key pressed, 0 when released)
      gate: 0,
      // Velocity (0-1, based on vertical position of click)
      velocity: 0,
    },
  },
  "beat-pad": {
    type: "beat-pad",
    label: "Beat Pad",
    inputs: [],
    outputs: [
      { id: "trigger", label: "Trig" },
      { id: "padIndex", label: "Pad" },
      { id: "velocity", label: "Vel" },
    ],
    defaultConfig: {
      // Grid dimensions
      columns: 4,
      rows: 4,
      // Pad size in pixels
      padSize: 40,
      // Gap between pads
      gap: 4,
      // Current trigger state
      trigger: 0,
      // Currently pressed pad index (0-based, -1 when none)
      activePad: -1,
      // Velocity of last hit
      velocity: 0,
      // Pad colors (can be customized per pad)
      padColors: [],
    },
  },
  crossfader: {
    type: "crossfader",
    label: "Crossfader",
    inputs: [
      { id: "inputA", label: "A" },
      { id: "inputB", label: "B" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      // Position: 0 = full A, 0.5 = equal mix, 1 = full B
      position: 0.5,
      // Curve type: linear, equal-power, or cut
      curveType: "equal-power" as "linear" | "equal-power" | "cut",
    },
  },
};
