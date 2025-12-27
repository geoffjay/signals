import type { BlockDefinition } from "./common";

/**
 * Math operation block types
 */
export type MathBlockType =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
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

/**
 * Processor block types (gain + math)
 */
export type ProcessorBlockType = "gain" | MathBlockType;

/**
 * Processor block definitions
 */
export const PROCESSOR_DEFINITIONS: Record<
  ProcessorBlockType,
  BlockDefinition
> = {
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
