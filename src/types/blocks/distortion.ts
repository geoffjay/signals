import type { BlockDefinition } from "./common";

/**
 * Distortion curve types for waveshaper
 */
export type DistortionCurveType =
  | "soft-clip"
  | "hard-clip"
  | "tanh"
  | "atan"
  | "sine"
  | "cubic";

/**
 * Oversample settings for waveshaper
 */
export type OversampleType = "none" | "2x" | "4x";

/**
 * Distortion/saturation block types
 */
export type DistortionBlockType = "waveshaper" | "hard-clip" | "soft-clip";

/**
 * Distortion/saturation block definitions
 */
export const DISTORTION_DEFINITIONS: Record<
  DistortionBlockType,
  BlockDefinition
> = {
  waveshaper: {
    type: "waveshaper",
    label: "Waveshaper",
    inputs: [
      { id: "in", label: "In" },
      { id: "drive", label: "Drive" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      distortionAmount: 50,
      distortionCurve: "soft-clip" as DistortionCurveType,
      oversample: "none" as OversampleType,
    },
  },

  "hard-clip": {
    type: "hard-clip",
    label: "Hard Clipper",
    inputs: [
      { id: "in", label: "In" },
      { id: "threshold", label: "Thresh" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      clipThreshold: 0.8,
      oversample: "none" as OversampleType,
    },
  },

  "soft-clip": {
    type: "soft-clip",
    label: "Soft Clipper",
    inputs: [
      { id: "in", label: "In" },
      { id: "amount", label: "Amount" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      softClipAmount: 0.5,
      softClipCurve: "tanh",
      oversample: "none" as OversampleType,
    },
  },
};
