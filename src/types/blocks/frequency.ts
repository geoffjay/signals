import type { BlockDefinition } from "./common";

/**
 * Frequency/Pitch Effect block types
 * Section 3.3 of signal-processors.md plan
 */
export type FrequencyBlockType = "ring-mod";

/**
 * Ring Modulator - Multiplies carrier and modulator signals together
 * Creates metallic, inharmonic tones characteristic of ring modulation
 */
export const FREQUENCY_DEFINITIONS: Record<FrequencyBlockType, BlockDefinition> =
  {
    "ring-mod": {
      type: "ring-mod",
      label: "Ring Modulator",
      inputs: [
        { id: "carrier", label: "Carrier" },
        { id: "modulator", label: "Mod" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        ringModMix: 1.0,
      },
    },
  };
