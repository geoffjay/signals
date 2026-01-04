/**
 * Block definitions index - combines all block types and provides helper functions
 */

// Re-export common types
export type {
  BlockConfig,
  BlockDefinition,
  PortDefinition,
  BlockCategory,
} from "./common";

// Import all definitions
import { GENERATOR_DEFINITIONS, type GeneratorBlockType } from "./generators";
import { FILTER_DEFINITIONS, type FilterBlockType } from "./filters";
import { PROCESSOR_DEFINITIONS, type ProcessorBlockType } from "./processors";
import { DYNAMICS_DEFINITIONS, type DynamicsBlockType } from "./dynamics";
import { DISTORTION_DEFINITIONS, type DistortionBlockType } from "./distortion";
import { TIMEBASED_DEFINITIONS, type TimeBasedBlockType } from "./timebased";
import { ENVELOPE_DEFINITIONS, type EnvelopeBlockType } from "./envelope";
import { LOFI_DEFINITIONS, type LoFiBlockType } from "./lofi";
import { FREQUENCY_DEFINITIONS, type FrequencyBlockType } from "./frequency";
import { INPUT_DEFINITIONS, type InputBlockType } from "./inputs";
import { OUTPUT_DEFINITIONS, type OutputBlockType } from "./outputs";
import { ROUTING_DEFINITIONS, type RoutingBlockType } from "./routing";
import { FFT_DEFINITIONS, type FFTBlockType } from "./fft";
import { UTILITY_DEFINITIONS, type UtilityBlockType } from "./utility";
import type { BlockConfig, BlockDefinition } from "./common";

// Re-export type unions
export type { GeneratorBlockType } from "./generators";
export type { FilterBlockType } from "./filters";
export type { ProcessorBlockType, MathBlockType } from "./processors";
export type { DynamicsBlockType } from "./dynamics";
export type { DistortionBlockType } from "./distortion";
export type { TimeBasedBlockType, LFOWaveformType, ReverbPresetType } from "./timebased";
export type { EnvelopeBlockType } from "./envelope";
export type { LoFiBlockType } from "./lofi";
export type { FrequencyBlockType } from "./frequency";
export type { InputBlockType } from "./inputs";
export type { OutputBlockType } from "./outputs";
export type { RoutingBlockType } from "./routing";
export type { FFTBlockType } from "./fft";
export type { UtilityBlockType } from "./utility";
export { NOTE_FREQUENCIES, NOTE_NAMES, getNoteFrequency } from "./utility";

/**
 * Combined block type - union of all block types
 */
export type BlockType =
  | GeneratorBlockType
  | FilterBlockType
  | ProcessorBlockType
  | DynamicsBlockType
  | DistortionBlockType
  | TimeBasedBlockType
  | EnvelopeBlockType
  | LoFiBlockType
  | FrequencyBlockType
  | InputBlockType
  | OutputBlockType
  | RoutingBlockType
  | FFTBlockType
  | UtilityBlockType;

/**
 * Combined block definitions - all block types in one record
 */
export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  ...GENERATOR_DEFINITIONS,
  ...FILTER_DEFINITIONS,
  ...PROCESSOR_DEFINITIONS,
  ...DYNAMICS_DEFINITIONS,
  ...DISTORTION_DEFINITIONS,
  ...TIMEBASED_DEFINITIONS,
  ...ENVELOPE_DEFINITIONS,
  ...LOFI_DEFINITIONS,
  ...FREQUENCY_DEFINITIONS,
  ...INPUT_DEFINITIONS,
  ...OUTPUT_DEFINITIONS,
  ...ROUTING_DEFINITIONS,
  ...FFT_DEFINITIONS,
  ...UTILITY_DEFINITIONS,
};

/**
 * Helper function to get inputs for configurable blocks.
 * Handles dynamic inputs for multiplexer.
 */
export function getBlockInputs(
  type: BlockType,
  config: BlockConfig,
): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === "multiplexer") {
    const numInputs = config.numInputs || 2;
    const inputs = [];
    for (let i = 0; i < numInputs; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    inputs.push({ id: "selector", label: "Sel" });
    return inputs;
  }

  if (type === "mixer") {
    const numChannels = config.mixerChannels || 2;
    const inputs = [];
    for (let i = 0; i < numChannels; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    return inputs;
  }

  if (type === "merge") {
    const numChannels = config.mergeChannels || 2;
    const inputs = [];
    for (let i = 0; i < numChannels; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    return inputs;
  }

  if (type === "matrix-router") {
    const numInputs = config.matrixInputs || 2;
    const inputs = [];
    for (let i = 0; i < numInputs; i++) {
      inputs.push({ id: `in${i}`, label: `In ${i}` });
    }
    return inputs;
  }

  if (type === "audio-output") {
    if (config.stereoMode) {
      return [
        { id: "left", label: "L" },
        { id: "right", label: "R" },
      ];
    }
    return [{ id: "in", label: "In" }];
  }

  return definition.inputs;
}

/**
 * Helper function to get outputs for configurable blocks.
 * Handles dynamic outputs for splitter and FFT analyzer.
 */
export function getBlockOutputs(
  type: BlockType,
  config: BlockConfig,
): Array<{ id: string; label: string }> {
  const definition = BLOCK_DEFINITIONS[type];

  if (type === "splitter") {
    const numOutputs = config.numOutputs || 2;
    const outputs = [];
    for (let i = 0; i < numOutputs; i++) {
      outputs.push({ id: `out${i}`, label: `Out ${i}` });
    }
    return outputs;
  }

  if (type === "multi-slider") {
    const numSliders = config.numSliders || 2;
    const outputs = [];
    for (let i = 0; i < numSliders; i++) {
      outputs.push({ id: `out${i}`, label: `Out ${i}` });
    }
    return outputs;
  }

  if (type === "sequencer") {
    const mode = config.seqMode || "triggers";
    const numRows = config.seqRows || 4;

    if (mode === "triggers") {
      // One trigger output per row plus step output
      const outputs = [];
      for (let i = 0; i < numRows; i++) {
        outputs.push({ id: `trig${i}`, label: `T${i}` });
      }
      outputs.push({ id: "step", label: "Step" });
      return outputs;
    } else {
      // Note mode: single trigger, note value, and step
      return [
        { id: "trigger", label: "Trig" },
        { id: "note", label: "Note" },
        { id: "step", label: "Step" },
      ];
    }
  }

  if (type === "fft-analyzer") {
    const mode = config.fftMode || "spectrum";

    switch (mode) {
      case "spectrum":
      case "peak-detection":
        // No audio outputs, visualization only
        return [];

      case "frequency-output": {
        const numOutputs = config.numFrequencyOutputs || 4;
        const bins = config.frequencyBins || [];
        return bins.slice(0, numOutputs).map((bin, i) => ({
          id: `freq_out${i}`,
          label: bin.label || `Bin ${i}`,
        }));
      }

      case "spectral-processing":
        // One processed audio output
        return [{ id: "out", label: "Out" }];

      default:
        return [];
    }
  }

  if (type === "matrix-router") {
    const numOutputs = config.matrixOutputs || 2;
    const outputs = [];
    for (let i = 0; i < numOutputs; i++) {
      outputs.push({ id: `out${i}`, label: `Out ${i}` });
    }
    return outputs;
  }

  return definition.outputs;
}

// Re-export individual definition records for direct access if needed
export {
  GENERATOR_DEFINITIONS,
  FILTER_DEFINITIONS,
  PROCESSOR_DEFINITIONS,
  DYNAMICS_DEFINITIONS,
  DISTORTION_DEFINITIONS,
  TIMEBASED_DEFINITIONS,
  ENVELOPE_DEFINITIONS,
  LOFI_DEFINITIONS,
  FREQUENCY_DEFINITIONS,
  INPUT_DEFINITIONS,
  OUTPUT_DEFINITIONS,
  ROUTING_DEFINITIONS,
  FFT_DEFINITIONS,
  UTILITY_DEFINITIONS,
};
