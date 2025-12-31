/**
 * Pure functions for filter calculations
 * These implement biquad filter algorithms for testing filter behavior
 *
 * Mathematical basis:
 * Biquad filters use the transfer function:
 * H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
 *
 * The difference equation is:
 * y[n] = (b0/a0)*x[n] + (b1/a0)*x[n-1] + (b2/a0)*x[n-2] - (a1/a0)*y[n-1] - (a2/a0)*y[n-2]
 */

export type FilterType =
  | "lowpass"
  | "highpass"
  | "bandpass"
  | "notch"
  | "allpass"
  | "peaking"
  | "lowshelf"
  | "highshelf";

/**
 * Biquad filter coefficients
 */
export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
}

/**
 * Calculate lowpass filter coefficients
 * Based on Audio EQ Cookbook by Robert Bristow-Johnson
 *
 * H(s) = 1 / (s^2 + s/Q + 1)
 *
 * @param frequency - Cutoff frequency in Hz
 * @param Q - Q factor (resonance)
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateLowpassCoefficients(
  frequency: number,
  Q: number,
  sampleRate: number,
): BiquadCoefficients {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: (1 - cosw0) / 2,
    b1: 1 - cosw0,
    b2: (1 - cosw0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

/**
 * Calculate highpass filter coefficients
 *
 * H(s) = s^2 / (s^2 + s/Q + 1)
 *
 * @param frequency - Cutoff frequency in Hz
 * @param Q - Q factor
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateHighpassCoefficients(
  frequency: number,
  Q: number,
  sampleRate: number,
): BiquadCoefficients {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: (1 + cosw0) / 2,
    b1: -(1 + cosw0),
    b2: (1 + cosw0) / 2,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

/**
 * Calculate bandpass filter coefficients (constant skirt gain)
 *
 * H(s) = s / (s^2 + s/Q + 1)
 *
 * @param frequency - Center frequency in Hz
 * @param Q - Q factor (bandwidth)
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateBandpassCoefficients(
  frequency: number,
  Q: number,
  sampleRate: number,
): BiquadCoefficients {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: alpha,
    b1: 0,
    b2: -alpha,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

/**
 * Calculate notch (band-reject) filter coefficients
 *
 * H(s) = (s^2 + 1) / (s^2 + s/Q + 1)
 *
 * @param frequency - Notch frequency in Hz
 * @param Q - Q factor
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateNotchCoefficients(
  frequency: number,
  Q: number,
  sampleRate: number,
): BiquadCoefficients {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: 1,
    b1: -2 * cosw0,
    b2: 1,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

/**
 * Calculate allpass filter coefficients
 *
 * H(s) = (s^2 - s/Q + 1) / (s^2 + s/Q + 1)
 * Passes all frequencies with equal gain but shifts phase
 *
 * @param frequency - Center frequency in Hz
 * @param Q - Q factor
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateAllpassCoefficients(
  frequency: number,
  Q: number,
  sampleRate: number,
): BiquadCoefficients {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: 1 - alpha,
    b1: -2 * cosw0,
    b2: 1 + alpha,
    a0: 1 + alpha,
    a1: -2 * cosw0,
    a2: 1 - alpha,
  };
}

/**
 * Calculate peaking EQ filter coefficients
 *
 * H(s) = (s^2 + s*(A/Q) + 1) / (s^2 + s/(A*Q) + 1)
 * where A = sqrt(10^(dBgain/20))
 *
 * @param frequency - Center frequency in Hz
 * @param Q - Q factor
 * @param gainDb - Gain in dB (positive for boost, negative for cut)
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculatePeakingCoefficients(
  frequency: number,
  Q: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const A = Math.sqrt(Math.pow(10, gainDb / 20));
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);

  return {
    b0: 1 + alpha * A,
    b1: -2 * cosw0,
    b2: 1 - alpha * A,
    a0: 1 + alpha / A,
    a1: -2 * cosw0,
    a2: 1 - alpha / A,
  };
}

/**
 * Calculate low shelf filter coefficients
 *
 * Boosts or cuts frequencies below the specified frequency
 *
 * @param frequency - Shelf frequency in Hz
 * @param gainDb - Gain in dB
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateLowShelfCoefficients(
  frequency: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const A = Math.sqrt(Math.pow(10, gainDb / 20));
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = (sinw0 / 2) * Math.sqrt((A + 1 / A) * 2);
  const sqrtA = Math.sqrt(A);

  return {
    b0: A * (A + 1 - (A - 1) * cosw0 + 2 * sqrtA * alpha),
    b1: 2 * A * (A - 1 - (A + 1) * cosw0),
    b2: A * (A + 1 - (A - 1) * cosw0 - 2 * sqrtA * alpha),
    a0: A + 1 + (A - 1) * cosw0 + 2 * sqrtA * alpha,
    a1: -2 * (A - 1 + (A + 1) * cosw0),
    a2: A + 1 + (A - 1) * cosw0 - 2 * sqrtA * alpha,
  };
}

/**
 * Calculate high shelf filter coefficients
 *
 * Boosts or cuts frequencies above the specified frequency
 *
 * @param frequency - Shelf frequency in Hz
 * @param gainDb - Gain in dB
 * @param sampleRate - Sample rate in Hz
 * @returns Biquad coefficients
 */
export function calculateHighShelfCoefficients(
  frequency: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const A = Math.sqrt(Math.pow(10, gainDb / 20));
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = (sinw0 / 2) * Math.sqrt((A + 1 / A) * 2);
  const sqrtA = Math.sqrt(A);

  return {
    b0: A * (A + 1 + (A - 1) * cosw0 + 2 * sqrtA * alpha),
    b1: -2 * A * (A - 1 + (A + 1) * cosw0),
    b2: A * (A + 1 + (A - 1) * cosw0 - 2 * sqrtA * alpha),
    a0: A + 1 - (A - 1) * cosw0 + 2 * sqrtA * alpha,
    a1: 2 * (A - 1 - (A + 1) * cosw0),
    a2: A + 1 - (A - 1) * cosw0 - 2 * sqrtA * alpha,
  };
}

/**
 * Get filter coefficients for a given filter type
 */
export function getFilterCoefficients(
  type: FilterType,
  frequency: number,
  Q: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  switch (type) {
    case "lowpass":
      return calculateLowpassCoefficients(frequency, Q, sampleRate);
    case "highpass":
      return calculateHighpassCoefficients(frequency, Q, sampleRate);
    case "bandpass":
      return calculateBandpassCoefficients(frequency, Q, sampleRate);
    case "notch":
      return calculateNotchCoefficients(frequency, Q, sampleRate);
    case "allpass":
      return calculateAllpassCoefficients(frequency, Q, sampleRate);
    case "peaking":
      return calculatePeakingCoefficients(frequency, Q, gainDb, sampleRate);
    case "lowshelf":
      return calculateLowShelfCoefficients(frequency, gainDb, sampleRate);
    case "highshelf":
      return calculateHighShelfCoefficients(frequency, gainDb, sampleRate);
    default:
      return calculateLowpassCoefficients(frequency, Q, sampleRate);
  }
}

/**
 * Biquad filter implementation for testing
 */
export class BiquadFilter {
  private x1: number = 0;
  private x2: number = 0;
  private y1: number = 0;
  private y2: number = 0;
  private coefficients: BiquadCoefficients;

  constructor(coefficients: BiquadCoefficients) {
    this.coefficients = this.normalizeCoefficients(coefficients);
  }

  /**
   * Normalize coefficients by dividing by a0
   */
  private normalizeCoefficients(coeff: BiquadCoefficients): BiquadCoefficients {
    return {
      b0: coeff.b0 / coeff.a0,
      b1: coeff.b1 / coeff.a0,
      b2: coeff.b2 / coeff.a0,
      a0: 1,
      a1: coeff.a1 / coeff.a0,
      a2: coeff.a2 / coeff.a0,
    };
  }

  /**
   * Update filter coefficients
   */
  setCoefficients(coefficients: BiquadCoefficients): void {
    this.coefficients = this.normalizeCoefficients(coefficients);
  }

  /**
   * Process a single sample through the filter
   * Using Direct Form 1 implementation
   */
  process(input: number): number {
    const { b0, b1, b2, a1, a2 } = this.coefficients;

    const output =
      b0 * input +
      b1 * this.x1 +
      b2 * this.x2 -
      a1 * this.y1 -
      a2 * this.y2;

    // Update delay elements
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;

    return output;
  }

  /**
   * Process an array of samples
   */
  processArray(input: Float32Array | number[]): Float32Array {
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] = this.process(input[i]);
    }
    return output;
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }

  /**
   * Calculate frequency response magnitude at a given frequency
   *
   * |H(e^jw)| = |B(e^jw)| / |A(e^jw)|
   *
   * @param frequency - Frequency in Hz
   * @param sampleRate - Sample rate in Hz
   * @returns Magnitude (linear scale)
   */
  getMagnitudeAt(frequency: number, sampleRate: number): number {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const w = (2 * Math.PI * frequency) / sampleRate;

    // Calculate B(e^jw)
    const bReal = b0 + b1 * Math.cos(w) + b2 * Math.cos(2 * w);
    const bImag = -b1 * Math.sin(w) - b2 * Math.sin(2 * w);
    const bMag = Math.sqrt(bReal * bReal + bImag * bImag);

    // Calculate A(e^jw)
    const aReal = 1 + a1 * Math.cos(w) + a2 * Math.cos(2 * w);
    const aImag = -a1 * Math.sin(w) - a2 * Math.sin(2 * w);
    const aMag = Math.sqrt(aReal * aReal + aImag * aImag);

    return bMag / aMag;
  }

  /**
   * Calculate frequency response magnitude in dB
   */
  getMagnitudeDbAt(frequency: number, sampleRate: number): number {
    return 20 * Math.log10(this.getMagnitudeAt(frequency, sampleRate));
  }

  /**
   * Calculate phase response at a given frequency
   *
   * @param frequency - Frequency in Hz
   * @param sampleRate - Sample rate in Hz
   * @returns Phase in radians
   */
  getPhaseAt(frequency: number, sampleRate: number): number {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const w = (2 * Math.PI * frequency) / sampleRate;

    // Calculate B(e^jw)
    const bReal = b0 + b1 * Math.cos(w) + b2 * Math.cos(2 * w);
    const bImag = -b1 * Math.sin(w) - b2 * Math.sin(2 * w);

    // Calculate A(e^jw)
    const aReal = 1 + a1 * Math.cos(w) + a2 * Math.cos(2 * w);
    const aImag = -a1 * Math.sin(w) - a2 * Math.sin(2 * w);

    // Phase = atan2(bImag, bReal) - atan2(aImag, aReal)
    return Math.atan2(bImag, bReal) - Math.atan2(aImag, aReal);
  }
}

/**
 * Generate a test signal (sine wave)
 */
export function generateSineWave(
  frequency: number,
  sampleRate: number,
  duration: number,
  amplitude: number = 1,
): Float32Array {
  const numSamples = Math.floor(duration * sampleRate);
  const output = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    output[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }

  return output;
}

/**
 * Generate white noise for testing
 */
export function generateWhiteNoise(numSamples: number): Float32Array {
  const output = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return output;
}

/**
 * Calculate RMS (Root Mean Square) of a signal
 */
export function calculateRMS(signal: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < signal.length; i++) {
    sumSquares += signal[i] * signal[i];
  }
  return Math.sqrt(sumSquares / signal.length);
}

/**
 * Calculate peak amplitude of a signal
 */
export function calculatePeak(signal: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < signal.length; i++) {
    const abs = Math.abs(signal[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}
