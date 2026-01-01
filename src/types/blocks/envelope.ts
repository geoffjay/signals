import type { BlockDefinition } from "./common";

/**
 * Envelope processing block types
 */
export type EnvelopeBlockType = "envelope-follower" | "adsr";

/**
 * Envelope processing block definitions
 */
export const ENVELOPE_DEFINITIONS: Record<EnvelopeBlockType, BlockDefinition> =
  {
    "envelope-follower": {
      type: "envelope-follower",
      label: "Envelope Follower",
      inputs: [{ id: "in", label: "In" }],
      outputs: [
        { id: "audio", label: "Audio" },
        { id: "envelope", label: "Env" },
      ],
      defaultConfig: {
        envelopeAttack: 0.01,
        envelopeRelease: 0.1,
      },
    },

    adsr: {
      type: "adsr",
      label: "ADSR",
      inputs: [
        { id: "gate", label: "Gate" },
        { id: "in", label: "In" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        adsrAttack: 0.01,
        adsrDecay: 0.1,
        adsrSustain: 0.7,
        adsrRelease: 0.5,
      },
    },
  };
