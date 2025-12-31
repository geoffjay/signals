import type { BlockDefinition } from "./common";

/**
 * Waveform types for LFO-based modulation effects
 */
export type LFOWaveformType = "sine" | "square" | "triangle" | "sawtooth";

/**
 * Time-based effect block types
 */
export type TimeBasedBlockType =
  | "delay"
  | "tremolo"
  | "chorus"
  | "flanger"
  | "phaser"
  | "vibrato";

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

    chorus: {
      type: "chorus",
      label: "Chorus",
      inputs: [
        { id: "in", label: "In" },
        { id: "rate", label: "Rate" },
        { id: "depth", label: "Depth" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        chorusRate: 1.5,
        chorusDepth: 0.002,
        chorusMix: 0.5,
        chorusVoices: 2,
      },
    },

    flanger: {
      type: "flanger",
      label: "Flanger",
      inputs: [
        { id: "in", label: "In" },
        { id: "rate", label: "Rate" },
        { id: "depth", label: "Depth" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        flangerRate: 0.5,
        flangerDepth: 0.001,
        flangerFeedback: 0.5,
        flangerMix: 0.5,
      },
    },

    phaser: {
      type: "phaser",
      label: "Phaser",
      inputs: [
        { id: "in", label: "In" },
        { id: "rate", label: "Rate" },
        { id: "depth", label: "Depth" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        phaserRate: 0.5,
        phaserDepth: 1.0,
        phaserStages: 4,
        phaserFeedback: 0.5,
        phaserMix: 0.5,
        phaserBaseFrequency: 1000,
      },
    },

    vibrato: {
      type: "vibrato",
      label: "Vibrato",
      inputs: [
        { id: "in", label: "In" },
        { id: "rate", label: "Rate" },
        { id: "depth", label: "Depth" },
      ],
      outputs: [{ id: "out", label: "Out" }],
      defaultConfig: {
        vibratoRate: 5,
        vibratoDepth: 0.003,
        vibratoWaveform: "sine" as LFOWaveformType,
      },
    },
  };
