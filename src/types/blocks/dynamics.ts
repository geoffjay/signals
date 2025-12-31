import type { BlockDefinition } from "./common";

/**
 * Dynamics processor block types
 */
export type DynamicsBlockType = "compressor";

/**
 * Dynamics processor block definitions
 */
export const DYNAMICS_DEFINITIONS: Record<DynamicsBlockType, BlockDefinition> =
  {
    compressor: {
      type: "compressor",
      label: "Compressor",
      inputs: [{ id: "in", label: "In" }],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        threshold: -24,
        knee: 30,
        ratio: 12,
        attack: 0.003,
        release: 0.25,
      },
    },
  };
