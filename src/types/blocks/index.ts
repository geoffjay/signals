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
import { INPUT_DEFINITIONS, type InputBlockType } from "./inputs";
import { OUTPUT_DEFINITIONS, type OutputBlockType } from "./outputs";
import { ROUTING_DEFINITIONS, type RoutingBlockType } from "./routing";
import { FFT_DEFINITIONS, type FFTBlockType } from "./fft";
import type { BlockConfig, BlockDefinition } from "./common";

// Re-export type unions
export type { GeneratorBlockType } from "./generators";
export type { FilterBlockType } from "./filters";
export type { ProcessorBlockType, MathBlockType } from "./processors";
export type { InputBlockType } from "./inputs";
export type { OutputBlockType } from "./outputs";
export type { RoutingBlockType } from "./routing";
export type { FFTBlockType } from "./fft";

/**
 * Combined block type - union of all block types
 */
export type BlockType =
  | GeneratorBlockType
  | FilterBlockType
  | ProcessorBlockType
  | InputBlockType
  | OutputBlockType
  | RoutingBlockType
  | FFTBlockType;

/**
 * Combined block definitions - all block types in one record
 */
export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  ...GENERATOR_DEFINITIONS,
  ...FILTER_DEFINITIONS,
  ...PROCESSOR_DEFINITIONS,
  ...INPUT_DEFINITIONS,
  ...OUTPUT_DEFINITIONS,
  ...ROUTING_DEFINITIONS,
  ...FFT_DEFINITIONS,
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

  return definition.outputs;
}

// Re-export individual definition records for direct access if needed
export {
  GENERATOR_DEFINITIONS,
  FILTER_DEFINITIONS,
  PROCESSOR_DEFINITIONS,
  INPUT_DEFINITIONS,
  OUTPUT_DEFINITIONS,
  ROUTING_DEFINITIONS,
  FFT_DEFINITIONS,
};
