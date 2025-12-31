/**
 * Pure functions for modulation effects
 * These implement the DSP algorithms for time-based and modulation effects
 *
 * Key concepts:
 * - LFO (Low Frequency Oscillator): generates modulation signal
 * - Delay line: stores past samples for time-based effects
 * - Dry/wet mix: blend between original and processed signal
 */

export type LFOWaveform = "sine" | "triangle" | "square" | "sawtooth";

/**
 * Generate LFO samples for a given waveform
 *
 * @param waveform - Type of waveform
 * @param frequency - Frequency in Hz
 * @param sampleRate - Sample rate in Hz
 * @param numSamples - Number of samples to generate
 * @param phase - Initial phase (0-1)
 * @returns Array of LFO values in range [-1, 1]
 */
export function generateLFO(
  waveform: LFOWaveform,
  frequency: number,
  sampleRate: number,
  numSamples: number,
  phase: number = 0,
): Float32Array {
  const output = new Float32Array(numSamples);
  const phaseIncrement = frequency / sampleRate;

  let currentPhase = phase;

  for (let i = 0; i < numSamples; i++) {
    switch (waveform) {
      case "sine":
        // f(t) = sin(2πt)
        output[i] = Math.sin(2 * Math.PI * currentPhase);
        break;

      case "triangle":
        // f(t) = 4|t - 0.5| - 1 for t in [0, 1]
        // Maps to [-1, 1]
        const t = currentPhase % 1;
        output[i] = 4 * Math.abs(t - 0.5) - 1;
        break;

      case "square":
        // f(t) = 1 if t < 0.5, -1 otherwise
        output[i] = currentPhase % 1 < 0.5 ? 1 : -1;
        break;

      case "sawtooth":
        // f(t) = 2t - 1 for t in [0, 1]
        output[i] = 2 * (currentPhase % 1) - 1;
        break;
    }

    currentPhase += phaseIncrement;
    if (currentPhase >= 1) currentPhase -= 1;
  }

  return output;
}

/**
 * Simple delay line implementation
 * Used for testing delay-based effects
 */
export class DelayLine {
  private buffer: Float32Array;
  private writeIndex: number = 0;
  private sampleRate: number;

  constructor(maxDelaySeconds: number, sampleRate: number) {
    this.sampleRate = sampleRate;
    const bufferSize = Math.ceil(maxDelaySeconds * sampleRate) + 1;
    this.buffer = new Float32Array(bufferSize);
  }

  /**
   * Write a sample to the delay line
   */
  write(sample: number): void {
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
  }

  /**
   * Read a sample from the delay line with linear interpolation
   *
   * @param delaySamples - Delay amount in samples (can be fractional)
   * @returns Delayed sample value
   */
  read(delaySamples: number): number {
    const readPos = this.writeIndex - delaySamples - 1;
    const readIndex = ((readPos % this.buffer.length) + this.buffer.length) % this.buffer.length;

    const indexLow = Math.floor(readIndex);
    const indexHigh = (indexLow + 1) % this.buffer.length;
    const fraction = readIndex - indexLow;

    return this.buffer[indexLow] * (1 - fraction) + this.buffer[indexHigh] * fraction;
  }

  /**
   * Process a sample through the delay line
   */
  process(input: number, delayTime: number, feedback: number): { delayed: number; output: number } {
    const delaySamples = delayTime * this.sampleRate;
    const delayed = this.read(delaySamples);
    this.write(input + delayed * feedback);
    return { delayed, output: delayed };
  }

  /**
   * Reset the delay line
   */
  reset(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
  }
}

/**
 * Process tremolo effect
 * Mathematical formula: output = input × (1 - depth + depth × (lfo + 1) / 2)
 *
 * This modulates the amplitude using an LFO:
 * - When depth = 0: output = input (no modulation)
 * - When depth = 1: output varies from 0 to input based on LFO
 *
 * @param input - Input signal
 * @param rate - LFO frequency in Hz
 * @param depth - Modulation depth (0-1)
 * @param waveform - LFO waveform
 * @param sampleRate - Sample rate in Hz
 * @returns Processed output
 */
export function processTremolo(
  input: Float32Array,
  rate: number,
  depth: number,
  waveform: LFOWaveform,
  sampleRate: number,
): Float32Array {
  const lfo = generateLFO(waveform, rate, sampleRate, input.length);
  const output = new Float32Array(input.length);

  for (let i = 0; i < input.length; i++) {
    // Map LFO from [-1,1] to [0,1], then scale by depth
    const modulationAmount = (lfo[i] + 1) / 2; // 0 to 1
    const gainMod = 1 - depth + depth * modulationAmount;
    output[i] = input[i] * gainMod;
  }

  return output;
}

/**
 * Process simple delay effect
 * Mathematical formula:
 *   delayed = delayLine[t - delayTime]
 *   output = input × (1 - mix) + delayed × mix
 *
 * @param input - Input signal
 * @param delayTime - Delay time in seconds
 * @param feedback - Feedback amount (0 to 0.95)
 * @param mix - Dry/wet mix (0 = dry, 1 = wet)
 * @param sampleRate - Sample rate in Hz
 * @returns Processed output
 */
export function processDelay(
  input: Float32Array,
  delayTime: number,
  feedback: number,
  mix: number,
  sampleRate: number,
): Float32Array {
  const delayLine = new DelayLine(5, sampleRate); // Max 5 seconds
  const output = new Float32Array(input.length);

  for (let i = 0; i < input.length; i++) {
    const { delayed } = delayLine.process(input[i], delayTime, feedback);
    output[i] = input[i] * (1 - mix) + delayed * mix;
  }

  return output;
}

/**
 * Process chorus effect
 * Uses multiple delay lines with slightly different LFO-modulated delay times
 *
 * Mathematical basis:
 * - Each voice has a delay time modulated by: baseDelay + depth × sin(2πft + phaseOffset)
 * - Voices are summed and mixed with dry signal
 *
 * @param input - Input signal
 * @param rate - LFO rate in Hz
 * @param depth - Modulation depth in seconds
 * @param mix - Dry/wet mix (0-1)
 * @param voices - Number of chorus voices (1-4)
 * @param sampleRate - Sample rate
 * @returns Processed output
 */
export function processChorus(
  input: Float32Array,
  rate: number,
  depth: number,
  mix: number,
  voices: number,
  sampleRate: number,
): Float32Array {
  const output = new Float32Array(input.length);
  const baseDelay = 0.02; // 20ms base delay

  // Create delay lines and LFOs for each voice
  const delayLines: DelayLine[] = [];
  const lfos: Float32Array[] = [];

  for (let v = 0; v < voices; v++) {
    delayLines.push(new DelayLine(0.1, sampleRate)); // 100ms max
    const phaseOffset = v / voices;
    lfos.push(generateLFO("sine", rate, sampleRate, input.length, phaseOffset));
  }

  for (let i = 0; i < input.length; i++) {
    let wetSum = 0;

    for (let v = 0; v < voices; v++) {
      // Modulated delay time
      const modulatedDelay = baseDelay + depth * (lfos[v][i] + 1) / 2;
      delayLines[v].write(input[i]);
      wetSum += delayLines[v].read(modulatedDelay * sampleRate);
    }

    const wet = wetSum / voices;
    output[i] = input[i] * (1 - mix) + wet * mix;
  }

  return output;
}

/**
 * Process flanger effect
 * Similar to chorus but with shorter delay times and feedback
 *
 * Mathematical basis:
 * - Very short delay (0.1-10ms) modulated by LFO
 * - Feedback creates comb filtering effect
 * - Characteristic "jet" or "swoosh" sound
 *
 * @param input - Input signal
 * @param rate - LFO rate in Hz
 * @param depth - Modulation depth in seconds (typically 0.0001-0.01)
 * @param feedback - Feedback amount (-0.95 to 0.95)
 * @param mix - Dry/wet mix
 * @param sampleRate - Sample rate
 * @returns Processed output
 */
export function processFlanger(
  input: Float32Array,
  rate: number,
  depth: number,
  feedback: number,
  mix: number,
  sampleRate: number,
): Float32Array {
  const output = new Float32Array(input.length);
  const delayLine = new DelayLine(0.02, sampleRate); // 20ms max
  const baseDelay = 0.001; // 1ms base delay
  const lfo = generateLFO("sine", rate, sampleRate, input.length);

  let feedbackSample = 0;

  for (let i = 0; i < input.length; i++) {
    // Modulated delay time
    const modulatedDelay = baseDelay + depth * (lfo[i] + 1) / 2;
    const delaySamples = modulatedDelay * sampleRate;

    // Write input + feedback
    delayLine.write(input[i] + feedbackSample * feedback);

    // Read delayed sample
    const delayed = delayLine.read(delaySamples);
    feedbackSample = delayed;

    output[i] = input[i] * (1 - mix) + delayed * mix;
  }

  return output;
}

/**
 * All-pass filter for phaser stages
 * Transfer function: H(z) = (a + z^-1) / (1 + a*z^-1)
 * where a = (1 - tan(π*fc/fs)) / (1 + tan(π*fc/fs))
 *
 * All-pass filters pass all frequencies with equal gain but shift phase
 */
export class AllpassFilter {
  private x1: number = 0; // Previous input
  private y1: number = 0; // Previous output
  private coefficient: number = 0;

  /**
   * Set the center frequency
   */
  setFrequency(frequency: number, sampleRate: number): void {
    const tan = Math.tan(Math.PI * frequency / sampleRate);
    this.coefficient = (1 - tan) / (1 + tan);
  }

  /**
   * Process a single sample
   */
  process(input: number): number {
    const output = this.coefficient * input + this.x1 - this.coefficient * this.y1;
    this.x1 = input;
    this.y1 = output;
    return output;
  }

  /**
   * Reset the filter state
   */
  reset(): void {
    this.x1 = 0;
    this.y1 = 0;
  }
}

/**
 * Process phaser effect
 * Uses a chain of all-pass filters with modulated center frequency
 *
 * Mathematical basis:
 * - Each all-pass filter adds phase shift near its cutoff frequency
 * - When mixed with dry signal, creates notches in frequency response
 * - LFO sweeps the notches across the spectrum
 *
 * @param input - Input signal
 * @param rate - LFO rate in Hz
 * @param depth - Modulation depth (0-1)
 * @param stages - Number of all-pass stages (2, 4, 6, or 8)
 * @param feedback - Feedback amount (-0.95 to 0.95)
 * @param mix - Dry/wet mix
 * @param baseFrequency - Center frequency for all-pass filters
 * @param sampleRate - Sample rate
 * @returns Processed output
 */
export function processPhaser(
  input: Float32Array,
  rate: number,
  depth: number,
  stages: number,
  feedback: number,
  mix: number,
  baseFrequency: number,
  sampleRate: number,
): Float32Array {
  const output = new Float32Array(input.length);
  const lfo = generateLFO("sine", rate, sampleRate, input.length);

  // Create allpass filter chain
  const filters: AllpassFilter[] = [];
  for (let s = 0; s < stages; s++) {
    filters.push(new AllpassFilter());
  }

  let feedbackSample = 0;

  for (let i = 0; i < input.length; i++) {
    // Modulated frequency
    const modAmount = (lfo[i] + 1) / 2 * depth;
    const frequency = baseFrequency * Math.pow(10, modAmount);

    // Update all filter frequencies
    for (const filter of filters) {
      filter.setFrequency(Math.min(frequency, sampleRate * 0.49), sampleRate);
    }

    // Process through filter chain
    let processed = input[i] + feedbackSample * feedback;
    for (const filter of filters) {
      processed = filter.process(processed);
    }

    feedbackSample = processed;
    output[i] = input[i] * (1 - mix) + processed * mix;
  }

  return output;
}

/**
 * Process vibrato effect
 * Pitch modulation via delay modulation
 *
 * Mathematical basis:
 * - Variable delay creates Doppler-like pitch shift
 * - When delay decreases, pitch goes up (samples compressed)
 * - When delay increases, pitch goes down (samples stretched)
 *
 * @param input - Input signal
 * @param rate - LFO rate in Hz
 * @param depth - Modulation depth in seconds
 * @param waveform - LFO waveform
 * @param sampleRate - Sample rate
 * @returns Processed output
 */
export function processVibrato(
  input: Float32Array,
  rate: number,
  depth: number,
  waveform: LFOWaveform,
  sampleRate: number,
): Float32Array {
  const output = new Float32Array(input.length);
  const delayLine = new DelayLine(0.05, sampleRate); // 50ms max
  const lfo = generateLFO(waveform, rate, sampleRate, input.length);
  const baseDelay = 0.01; // 10ms base delay

  for (let i = 0; i < input.length; i++) {
    // Modulated delay time
    const modulatedDelay = baseDelay + depth * (lfo[i] + 1) / 2;
    const delaySamples = modulatedDelay * sampleRate;

    delayLine.write(input[i]);
    output[i] = delayLine.read(delaySamples);
  }

  return output;
}

/**
 * Mix dry and wet signals
 *
 * @param dry - Dry (unprocessed) signal
 * @param wet - Wet (processed) signal
 * @param mix - Mix amount (0 = all dry, 1 = all wet)
 * @returns Mixed output
 */
export function dryWetMix(
  dry: Float32Array,
  wet: Float32Array,
  mix: number,
): Float32Array {
  const length = Math.min(dry.length, wet.length);
  const output = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    output[i] = dry[i] * (1 - mix) + wet[i] * mix;
  }

  return output;
}
