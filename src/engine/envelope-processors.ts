// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./audioworklet.d.ts" />

// AudioWorklet processors for envelope processing
// - EnvelopeFollowerProcessor: RMS envelope detection with configurable attack/release
// - ADSRProcessor: Attack-Decay-Sustain-Release envelope generator

/**
 * Envelope Follower - Extracts amplitude envelope from audio signal
 * Outputs both audio passthrough and envelope signal
 * Uses RMS (Root Mean Square) for envelope detection
 */
class EnvelopeFollowerProcessor extends AudioWorkletProcessor {
  private envelope: number = 0;
  private attackCoeff: number;
  private releaseCoeff: number;
  private rmsWindowSize: number = 128;
  private rmsBuffer: Float32Array;
  private rmsIndex: number = 0;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    const attack = procOpts?.attack ?? 0.01; // seconds
    const release = procOpts?.release ?? 0.1; // seconds

    // Calculate coefficients based on sample rate (typically 44100 or 48000)
    // Using exponential smoothing: coeff = 1 - exp(-1/(time * sampleRate))
    this.attackCoeff = 1 - Math.exp(-1 / (attack * sampleRate));
    this.releaseCoeff = 1 - Math.exp(-1 / (release * sampleRate));
    this.rmsBuffer = new Float32Array(this.rmsWindowSize);

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      if (event.data.type === "setAttack") {
        this.attackCoeff = 1 - Math.exp(-1 / (event.data.value * sampleRate));
      } else if (event.data.type === "setRelease") {
        this.releaseCoeff = 1 - Math.exp(-1 / (event.data.value * sampleRate));
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const audioOutput = outputs[0]; // Audio passthrough
    const envelopeOutput = outputs[1]; // Envelope signal

    if (!input || input.length === 0) return true;

    const inputChannel = input[0];
    const audioOutputChannel = audioOutput?.[0];
    const envelopeOutputChannel = envelopeOutput?.[0];

    if (!inputChannel) return true;

    for (let i = 0; i < inputChannel.length; i++) {
      const sample = inputChannel[i] || 0;

      // Audio passthrough
      if (audioOutputChannel) {
        audioOutputChannel[i] = sample;
      }

      // RMS calculation using circular buffer
      this.rmsBuffer[this.rmsIndex] = sample * sample;
      this.rmsIndex = (this.rmsIndex + 1) % this.rmsWindowSize;

      // Calculate RMS
      let sum = 0;
      for (let j = 0; j < this.rmsWindowSize; j++) {
        sum += this.rmsBuffer[j];
      }
      const rms = Math.sqrt(sum / this.rmsWindowSize);

      // Apply attack/release envelope following
      const coeff = rms > this.envelope ? this.attackCoeff : this.releaseCoeff;
      this.envelope += coeff * (rms - this.envelope);

      // Output envelope
      if (envelopeOutputChannel) {
        envelopeOutputChannel[i] = this.envelope;
      }
    }

    return true;
  }
}

/**
 * ADSR Envelope Generator
 * Generates attack-decay-sustain-release envelope from gate signal
 * Can be used standalone or to shape audio input
 */
class ADSRProcessor extends AudioWorkletProcessor {
  private envelope: number = 0;
  private stage: "idle" | "attack" | "decay" | "sustain" | "release" = "idle";
  private prevGate: number = 0;

  // ADSR parameters
  private attack: number;
  private decay: number;
  private sustain: number;
  private release: number;

  // Pre-calculated rates (initialized in calculateRates called from constructor)
  private attackRate: number = 0;
  private decayRate: number = 0;
  private releaseRate: number = 0;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.attack = procOpts?.attack ?? 0.01;
    this.decay = procOpts?.decay ?? 0.1;
    this.sustain = procOpts?.sustain ?? 0.7;
    this.release = procOpts?.release ?? 0.5;

    this.calculateRates();

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setAttack":
          this.attack = event.data.value;
          this.calculateRates();
          break;
        case "setDecay":
          this.decay = event.data.value;
          this.calculateRates();
          break;
        case "setSustain":
          this.sustain = event.data.value;
          break;
        case "setRelease":
          this.release = event.data.value;
          this.calculateRates();
          break;
      }
    };
  }

  private calculateRates() {
    // Calculate rate per sample (linear ramp)
    // Rate = 1 / (time * sampleRate)
    this.attackRate = this.attack > 0 ? 1 / (this.attack * sampleRate) : 1;
    this.decayRate =
      this.decay > 0 ? (1 - this.sustain) / (this.decay * sampleRate) : 1;
    this.releaseRate =
      this.release > 0 ? this.sustain / (this.release * sampleRate) : 1;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const gateInput = inputs[0]; // Gate signal
    const audioInput = inputs[1]; // Optional audio input to shape
    const output = outputs[0];

    if (!output || output.length === 0) return true;

    const gateChannel = gateInput?.[0];
    const audioChannel = audioInput?.[0];
    const outputChannel = output[0];

    if (!outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      // Get gate value (threshold at 0.5)
      const gate = (gateChannel?.[i] ?? 0) > 0.5 ? 1 : 0;

      // Detect gate transitions
      if (gate > this.prevGate) {
        // Gate on - start attack
        this.stage = "attack";
      } else if (gate < this.prevGate) {
        // Gate off - start release
        this.stage = "release";
      }
      this.prevGate = gate;

      // Process envelope based on current stage
      switch (this.stage) {
        case "idle":
          this.envelope = 0;
          break;

        case "attack":
          this.envelope += this.attackRate;
          if (this.envelope >= 1) {
            this.envelope = 1;
            this.stage = "decay";
          }
          break;

        case "decay":
          this.envelope -= this.decayRate;
          if (this.envelope <= this.sustain) {
            this.envelope = this.sustain;
            this.stage = "sustain";
          }
          break;

        case "sustain":
          this.envelope = this.sustain;
          break;

        case "release":
          this.envelope -= this.releaseRate;
          if (this.envelope <= 0) {
            this.envelope = 0;
            this.stage = "idle";
          }
          break;
      }

      // Output envelope value
      // If audio input is connected, multiply by envelope; otherwise output raw envelope
      if (audioChannel && audioChannel[i] !== undefined) {
        outputChannel[i] = audioChannel[i] * this.envelope;
      } else {
        outputChannel[i] = this.envelope;
      }
    }

    return true;
  }
}

// Register processors
registerProcessor("envelope-follower-processor", EnvelopeFollowerProcessor);
registerProcessor("adsr-processor", ADSRProcessor);
