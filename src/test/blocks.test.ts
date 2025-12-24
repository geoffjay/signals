import { describe, it, expect } from "vitest";
import {
  BLOCK_DEFINITIONS,
  getBlockInputs,
  getBlockOutputs,
  type BlockType,
} from "../types/blocks";

describe("Block Definitions", () => {
  it("should have definitions for all block types", () => {
    const blockTypes: BlockType[] = [
      "sine-wave",
      "square-wave",
      "triangle-wave",
      "sawtooth-wave",
      "noise",
      "gain",
      "low-pass-filter",
      "high-pass-filter",
      "band-pass-filter",
      "multiplexer",
      "splitter",
      "oscilloscope",
      "audio-output",
      "slider",
      "button",
      "toggle",
      "pulse",
      "numeric-meter",
      "add",
      "subtract",
      "multiply",
      "divide",
      "fft-analyzer",
      "ceil",
      "floor",
      "round",
      "abs",
      "sign",
      "negate",
      "sqrt",
      "sin",
      "cos",
      "min",
      "max",
      "pow",
      "mod",
      "clamp",
    ];

    blockTypes.forEach((blockType) => {
      expect(BLOCK_DEFINITIONS[blockType]).toBeDefined();
      expect(BLOCK_DEFINITIONS[blockType].label).toBeTruthy();
    });
  });

  it("should have valid default configurations", () => {
    Object.entries(BLOCK_DEFINITIONS).forEach(([type, definition]) => {
      expect(definition.defaultConfig).toBeDefined();

      // Wave generators should have frequency and amplitude
      if (
        ["sine-wave", "square-wave", "triangle-wave", "sawtooth-wave"].includes(
          type,
        )
      ) {
        expect(definition.defaultConfig.frequency).toBeGreaterThan(0);
        expect(definition.defaultConfig.amplitude).toBeGreaterThanOrEqual(0);
        expect(definition.defaultConfig.amplitude).toBeLessThanOrEqual(1);
      }

      // Filters should have cutoff frequency
      if (
        ["low-pass-filter", "high-pass-filter", "band-pass-filter"].includes(
          type,
        )
      ) {
        expect(definition.defaultConfig.cutoffFrequency).toBeGreaterThan(0);
      }

      // Multiplexer should have valid numInputs
      if (type === "multiplexer") {
        expect([2, 4, 8]).toContain(definition.defaultConfig.numInputs);
      }

      // Splitter should have valid numOutputs
      if (type === "splitter") {
        expect([2, 4, 8]).toContain(definition.defaultConfig.numOutputs);
      }
    });
  });
});

describe("getBlockInputs", () => {
  it("should return inputs for sine-wave", () => {
    const inputs = getBlockInputs("sine-wave", {});
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.some((i) => i.id === "freq")).toBe(true);
  });

  it("should return correct inputs for processors", () => {
    const inputs = getBlockInputs("gain", {});
    expect(inputs).toHaveLength(1);
    expect(inputs[0].label).toBe("In");
  });

  it("should return correct inputs for math blocks", () => {
    // Single input math blocks
    expect(getBlockInputs("ceil", {})).toHaveLength(1);
    expect(getBlockInputs("floor", {})).toHaveLength(1);
    expect(getBlockInputs("abs", {})).toHaveLength(1);

    // Two input math blocks
    expect(getBlockInputs("add", {})).toHaveLength(2);
    expect(getBlockInputs("min", {})).toHaveLength(2);
    expect(getBlockInputs("max", {})).toHaveLength(2);

    // Three input math blocks
    expect(getBlockInputs("clamp", {})).toHaveLength(3);
    const clampInputs = getBlockInputs("clamp", {});
    expect(clampInputs[0].label).toBe("Val");
    expect(clampInputs[1].label).toBe("Min");
    expect(clampInputs[2].label).toBe("Max");
  });

  it("should return dynamic inputs for multiplexer", () => {
    const inputs2 = getBlockInputs("multiplexer", { numInputs: 2 });
    // Multiplexer has N data inputs + 1 selector input
    expect(inputs2.length).toBeGreaterThanOrEqual(2);

    const inputs4 = getBlockInputs("multiplexer", { numInputs: 4 });
    expect(inputs4.length).toBeGreaterThanOrEqual(4);

    const inputs8 = getBlockInputs("multiplexer", { numInputs: 8 });
    expect(inputs8.length).toBeGreaterThanOrEqual(8);
  });

  it("should return correct inputs for FFT analyzer based on mode", () => {
    // Spectrum mode - single input
    const spectrumInputs = getBlockInputs("fft-analyzer", {
      fftMode: "spectrum",
    });
    expect(spectrumInputs).toHaveLength(1);

    // Frequency output mode - single input
    const freqInputs = getBlockInputs("fft-analyzer", {
      fftMode: "frequency-output",
    });
    expect(freqInputs).toHaveLength(1);

    // Peak detection mode - single input
    const peakInputs = getBlockInputs("fft-analyzer", {
      fftMode: "peak-detection",
    });
    expect(peakInputs).toHaveLength(1);

    // Spectral processing mode - single input
    const spectralInputs = getBlockInputs("fft-analyzer", {
      fftMode: "spectral-processing",
    });
    expect(spectralInputs).toHaveLength(1);
  });
});

describe("getBlockOutputs", () => {
  it("should return correct outputs for generators", () => {
    const outputs = getBlockOutputs("sine-wave", {});
    expect(outputs).toHaveLength(1);
    expect(outputs[0].label).toBe("Out");
  });

  it("should return no outputs for output blocks", () => {
    expect(getBlockOutputs("oscilloscope", {})).toHaveLength(0);
    expect(getBlockOutputs("audio-output", {})).toHaveLength(0);
    expect(getBlockOutputs("numeric-meter", {})).toHaveLength(0);
  });

  it("should return dynamic outputs for splitter", () => {
    const outputs2 = getBlockOutputs("splitter", { numOutputs: 2 });
    expect(outputs2).toHaveLength(2);

    const outputs4 = getBlockOutputs("splitter", { numOutputs: 4 });
    expect(outputs4).toHaveLength(4);

    const outputs8 = getBlockOutputs("splitter", { numOutputs: 8 });
    expect(outputs8).toHaveLength(8);
  });

  it("should return correct outputs for math blocks", () => {
    // All math blocks should have exactly 1 output
    const mathBlocks: BlockType[] = [
      "add",
      "subtract",
      "multiply",
      "divide",
      "ceil",
      "floor",
      "round",
      "abs",
      "sign",
      "negate",
      "sqrt",
      "sin",
      "cos",
      "min",
      "max",
      "pow",
      "mod",
      "clamp",
    ];

    mathBlocks.forEach((blockType) => {
      const outputs = getBlockOutputs(blockType, {});
      expect(outputs).toHaveLength(1);
      expect(outputs[0].label).toBe("Out");
    });
  });

  it("should return correct outputs for FFT analyzer based on mode", () => {
    // Spectrum mode - no outputs (visualization only)
    const spectrumOutputs = getBlockOutputs("fft-analyzer", {
      fftMode: "spectrum",
    });
    expect(spectrumOutputs).toHaveLength(0);

    // Frequency output mode - check that outputs exist with bins
    const freqOutputs2 = getBlockOutputs("fft-analyzer", {
      fftMode: "frequency-output",
      numFrequencyOutputs: 2,
      frequencyBins: [
        { start: 0, end: 100, label: "Bin 0" },
        { start: 100, end: 200, label: "Bin 1" },
      ],
    });
    expect(freqOutputs2.length).toBe(2);

    // Peak detection mode - no outputs (analysis only)
    const peakOutputs = getBlockOutputs("fft-analyzer", {
      fftMode: "peak-detection",
    });
    expect(peakOutputs).toHaveLength(0);

    // Spectral processing mode - single output
    const spectralOutputs = getBlockOutputs("fft-analyzer", {
      fftMode: "spectral-processing",
    });
    expect(spectralOutputs).toHaveLength(1);
  });
});

describe("Input Control Blocks", () => {
  it("should have correct configuration for slider", () => {
    const sliderDef = BLOCK_DEFINITIONS.slider;
    expect(sliderDef.defaultConfig.min).toBeDefined();
    expect(sliderDef.defaultConfig.max).toBeDefined();
    expect(sliderDef.defaultConfig.value).toBeDefined();
  });

  it("should have correct configuration for button", () => {
    const buttonDef = BLOCK_DEFINITIONS.button;
    expect(buttonDef.defaultConfig.value).toBeDefined();
    expect(buttonDef.defaultConfig.outputValue).toBeDefined();
  });

  it("should have correct configuration for toggle", () => {
    const toggleDef = BLOCK_DEFINITIONS.toggle;
    expect(toggleDef.defaultConfig.value).toBeDefined();
    expect(toggleDef.defaultConfig.outputValue).toBeDefined();
  });

  it("should have correct configuration for pulse", () => {
    const pulseDef = BLOCK_DEFINITIONS.pulse;
    expect(pulseDef.defaultConfig.pulseValue).toBeDefined();
    expect(pulseDef.defaultConfig.pulseDuration).toBeDefined();
  });
});
