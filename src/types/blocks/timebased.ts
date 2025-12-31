import type { BlockDefinition } from "./common";

/**
 * Waveform types for LFO-based modulation effects
 */
export type LFOWaveformType = "sine" | "square" | "triangle" | "sawtooth";

/**
 * Time-based effect block types
 */
export type TimeBasedBlockType = "delay" | "tremolo";

/**
 * Time-based effect block definitions
 */
export const TIMEBASED_DEFINITIONS: Record<TimeBasedBlockType, BlockDefinition> =
  {
    delay: {
      type: "delay",
      label: "Delay",
      inputs: [
        { id: "in", label: "In" },
        { id: "time", label: "Time" },
        { id: "feedback", label: "FB" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        delayTime: 0.3,
        delayFeedback: 0.3,
        delayMix: 0.5,
      },
    },

    tremolo: {
      type: "tremolo",
      label: "Tremolo",
      inputs: [
        { id: "in", label: "In" },
        { id: "rate", label: "Rate" },
        { id: "depth", label: "Depth" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        tremoloRate: 5,
        tremoloDepth: 0.5,
        tremoloWaveform: "sine" as LFOWaveformType,
      },
    },
  };
