import type { BlockDefinition } from "./common";

/**
 * Lo-fi/bit manipulation block types
 */
export type LoFiBlockType = "bit-crusher" | "sample-rate-reducer";

/**
 * Lo-fi/bit manipulation block definitions
 */
export const LOFI_DEFINITIONS: Record<LoFiBlockType, BlockDefinition> = {
  "bit-crusher": {
    type: "bit-crusher",
    label: "Bit Crusher",
    inputs: [
      { id: "in", label: "In" },
      { id: "bits", label: "Bits" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      crusherBits: 8,
      crusherMix: 1.0,
    },
  },

  "sample-rate-reducer": {
    type: "sample-rate-reducer",
    label: "Sample Rate Reducer",
    inputs: [
      { id: "in", label: "In" },
      { id: "rate", label: "Rate" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      reducerSampleRate: 8000,
      reducerMix: 1.0,
    },
  },
};
