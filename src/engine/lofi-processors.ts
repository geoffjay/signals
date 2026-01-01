// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./audioworklet.d.ts" />

// AudioWorklet processors for lo-fi/bit manipulation effects
// - BitCrusherProcessor: Reduces bit depth for digital degradation
// - SampleRateReducerProcessor: Reduces effective sample rate (sample-and-hold)

/**
 * Bit Crusher - Reduces bit depth for lo-fi digital sound
 * Creates quantization noise and digital artifacts
 */
class BitCrusherProcessor extends AudioWorkletProcessor {
  private bits: number;
  private mix: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.bits = procOpts?.bits ?? 8; // Default 8-bit
    this.mix = procOpts?.mix ?? 1.0; // Full wet by default

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setBits":
          this.bits = Math.max(1, Math.min(16, event.data.value));
          break;
        case "setMix":
          this.mix = Math.max(0, Math.min(1, event.data.value));
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    // Calculate quantization levels
    // For n bits, we have 2^n levels
    const levels = Math.pow(2, this.bits);

    for (let i = 0; i < outputChannel.length; i++) {
      const dry = inputChannel[i] || 0;

      // Quantize the sample
      // Map from [-1, 1] to [0, levels-1], round, then map back
      const normalized = (dry + 1) / 2; // Map to [0, 1]
      const quantized = Math.floor(normalized * levels) / levels; // Quantize
      const wet = quantized * 2 - 1; // Map back to [-1, 1]

      // Apply mix (dry/wet blend)
      outputChannel[i] = dry * (1 - this.mix) + wet * this.mix;
    }

    return true;
  }
}

/**
 * Sample Rate Reducer - Reduces effective sample rate
 * Creates aliasing and lo-fi digital artifacts
 * Uses sample-and-hold algorithm
 */
class SampleRateReducerProcessor extends AudioWorkletProcessor {
  private targetSampleRate: number;
  private mix: number;
  private holdSample: number = 0;
  private sampleCounter: number = 0;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.targetSampleRate = procOpts?.targetSampleRate ?? 8000; // Default 8kHz
    this.mix = procOpts?.mix ?? 1.0;

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setTargetSampleRate":
          this.targetSampleRate = Math.max(
            100,
            Math.min(sampleRate, event.data.value),
          );
          break;
        case "setMix":
          this.mix = Math.max(0, Math.min(1, event.data.value));
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    // Calculate how many samples to skip
    // decimationFactor = originalSampleRate / targetSampleRate
    const decimationFactor = sampleRate / this.targetSampleRate;

    for (let i = 0; i < outputChannel.length; i++) {
      const dry = inputChannel[i] || 0;

      // Increment counter and check if we should sample
      this.sampleCounter += 1;

      if (this.sampleCounter >= decimationFactor) {
        // Sample-and-hold: capture new sample
        this.holdSample = dry;
        this.sampleCounter -= decimationFactor; // Subtract to maintain fractional timing
      }

      // Output the held sample (reduced sample rate effect)
      const wet = this.holdSample;

      // Apply mix (dry/wet blend)
      outputChannel[i] = dry * (1 - this.mix) + wet * this.mix;
    }

    return true;
  }
}

// Register processors
registerProcessor("bit-crusher-processor", BitCrusherProcessor);
registerProcessor("sample-rate-reducer-processor", SampleRateReducerProcessor);
