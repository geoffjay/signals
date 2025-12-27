import type { BlockDefinition } from "./common";

/**
 * Routing block types
 */
export type RoutingBlockType = "multiplexer" | "splitter";

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
};
