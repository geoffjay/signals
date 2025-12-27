import type { BlockDefinition } from "./common";

/**
 * FFT analyzer block type
 */
export type FFTBlockType = "fft-analyzer";

/**
 * FFT analyzer block definition
 */
export const FFT_DEFINITIONS: Record<FFTBlockType, BlockDefinition> = {
  "fft-analyzer": {
    type: "fft-analyzer",
    label: "FFT Analyzer",
    inputs: [{ id: "in", label: "In" }],
    outputs: [], // Dynamic based on mode
    defaultConfig: {
      fftMode: "spectrum",
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      numFrequencyOutputs: 4,
      frequencyBins: [
        { start: 0, end: 10, label: "Sub-Bass" },
        { start: 10, end: 50, label: "Bass" },
        { start: 50, end: 100, label: "Mids" },
        { start: 100, end: 200, label: "Highs" },
      ],
      numPeaks: 5,
      peakThreshold: -40,
      peakVisualization: "list",
      spectralOperation: "passthrough",
      operationFrequency: 1000,
      operationGain: 0,
    },
  },
};
