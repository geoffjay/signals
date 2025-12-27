/**
 * Block type definitions - re-exports from split files
 *
 * This file maintains backward compatibility with existing imports.
 * All types and definitions are now organized in src/types/blocks/
 */

export type {
  // Common types
  BlockConfig,
  BlockDefinition,
  PortDefinition,
  BlockCategory,
  // Combined block type
  BlockType,
  // Category-specific types
  GeneratorBlockType,
  FilterBlockType,
  ProcessorBlockType,
  MathBlockType,
  InputBlockType,
  OutputBlockType,
  RoutingBlockType,
  FFTBlockType,
} from "./blocks/index";

export {
  // Combined definitions
  BLOCK_DEFINITIONS,
  // Helper functions
  getBlockInputs,
  getBlockOutputs,
  // Individual definition records
  GENERATOR_DEFINITIONS,
  FILTER_DEFINITIONS,
  PROCESSOR_DEFINITIONS,
  INPUT_DEFINITIONS,
  OUTPUT_DEFINITIONS,
  ROUTING_DEFINITIONS,
  FFT_DEFINITIONS,
} from "./blocks/index";
