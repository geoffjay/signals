import type { BlockType } from "@/types/blocks";

/**
 * Block type categories
 */
export type BlockCategory =
  | "generator"
  | "filter"
  | "processor"
  | "math"
  | "input"
  | "output"
  | "routing"
  | "fft";

/**
 * Generator block types (wave generators and noise)
 */
const GENERATOR_BLOCKS: BlockType[] = [
  "sine-wave",
  "square-wave",
  "triangle-wave",
  "sawtooth-wave",
  "noise",
];

/**
 * Filter block types
 */
const FILTER_BLOCKS: BlockType[] = [
  "low-pass-filter",
  "high-pass-filter",
  "band-pass-filter",
  "notch-filter",
  "allpass-filter",
  "peaking-eq",
  "lowshelf-filter",
  "highshelf-filter",
];

/**
 * Input control block types
 */
const INPUT_CONTROL_BLOCKS: BlockType[] = [
  "slider",
  "button",
  "toggle",
  "pulse",
];

/**
 * Output/visualization block types
 */
const OUTPUT_BLOCKS: BlockType[] = [
  "oscilloscope",
  "audio-output",
  "numeric-meter",
];

/**
 * Routing block types
 */
const ROUTING_BLOCKS: BlockType[] = ["multiplexer", "splitter"];

/**
 * Math operation block types (single input)
 */
const SINGLE_INPUT_MATH_BLOCKS: BlockType[] = [
  "ceil",
  "floor",
  "round",
  "abs",
  "sign",
  "negate",
  "sqrt",
  "sin",
  "cos",
];

/**
 * Math operation block types (two inputs)
 */
const TWO_INPUT_MATH_BLOCKS: BlockType[] = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "min",
  "max",
  "pow",
  "mod",
];

/**
 * Math operation block types (three inputs)
 */
const THREE_INPUT_MATH_BLOCKS: BlockType[] = ["clamp"];

/**
 * All math block types
 */
const MATH_BLOCKS: BlockType[] = [
  ...SINGLE_INPUT_MATH_BLOCKS,
  ...TWO_INPUT_MATH_BLOCKS,
  ...THREE_INPUT_MATH_BLOCKS,
];

/**
 * Blocks that require analyser nodes for visualization
 */
const ANALYSER_BLOCKS: BlockType[] = [
  "oscilloscope",
  "numeric-meter",
  "fft-analyzer",
];

/**
 * Check if block type is a generator (wave or noise)
 */
export function isGeneratorBlock(blockType: BlockType): boolean {
  return GENERATOR_BLOCKS.includes(blockType);
}

/**
 * Check if block type is a filter
 */
export function isFilterBlock(blockType: BlockType): boolean {
  return FILTER_BLOCKS.includes(blockType);
}

/**
 * Check if block type is an input control (slider, button, toggle, pulse)
 */
export function isInputControlBlock(blockType: BlockType): boolean {
  return INPUT_CONTROL_BLOCKS.includes(blockType);
}

/**
 * Check if block type is an output/visualization
 */
export function isOutputBlock(blockType: BlockType): boolean {
  return OUTPUT_BLOCKS.includes(blockType);
}

/**
 * Check if block type is a routing block
 */
export function isRoutingBlock(blockType: BlockType): boolean {
  return ROUTING_BLOCKS.includes(blockType);
}

/**
 * Check if block type is a math operation
 */
export function isMathBlock(blockType: BlockType): boolean {
  return MATH_BLOCKS.includes(blockType);
}

/**
 * Check if block type is a single-input math operation
 */
export function isSingleInputMathBlock(blockType: BlockType): boolean {
  return SINGLE_INPUT_MATH_BLOCKS.includes(blockType);
}

/**
 * Check if block type is a two-input math operation
 */
export function isTwoInputMathBlock(blockType: BlockType): boolean {
  return TWO_INPUT_MATH_BLOCKS.includes(blockType);
}

/**
 * Check if block type requires an analyser for visualization
 */
export function isAnalyserBlock(blockType: BlockType): boolean {
  return ANALYSER_BLOCKS.includes(blockType);
}

/**
 * Check if block type is an FFT analyzer
 */
export function isFFTBlock(blockType: BlockType): boolean {
  return blockType === "fft-analyzer";
}

/**
 * Get the category for a block type
 */
export function getBlockCategory(blockType: BlockType): BlockCategory {
  if (isGeneratorBlock(blockType)) return "generator";
  if (isFilterBlock(blockType)) return "filter";
  if (isInputControlBlock(blockType)) return "input";
  if (isOutputBlock(blockType)) return "output";
  if (isRoutingBlock(blockType)) return "routing";
  if (isMathBlock(blockType)) return "math";
  if (isFFTBlock(blockType)) return "fft";
  return "processor"; // Default for gain and other processors
}

// Re-export block lists for external use
export {
  GENERATOR_BLOCKS,
  FILTER_BLOCKS,
  INPUT_CONTROL_BLOCKS,
  OUTPUT_BLOCKS,
  ROUTING_BLOCKS,
  MATH_BLOCKS,
  SINGLE_INPUT_MATH_BLOCKS,
  TWO_INPUT_MATH_BLOCKS,
  THREE_INPUT_MATH_BLOCKS,
  ANALYSER_BLOCKS,
};
