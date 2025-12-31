/**
 * Pure functions for waveshaper curve generation
 * These functions generate transfer curves for distortion/saturation effects
 *
 * Mathematical basis:
 * A waveshaper applies a transfer function f(x) to each sample
 * The curve array maps input values [-1, 1] to output values
 * For input x, the output is curve[floor((x + 1) / 2 * (n - 1))]
 */

export type WaveshaperCurveType =
  | "soft-clip"
  | "hard-clip"
  | "tanh"
  | "atan"
  | "sine"
  | "cubic";

/**
 * Generate a hard clipping curve
 * Mathematical formula: f(x) = clamp(x * (1 + amount * 10), -1, 1)
 * This creates a linear region that clips sharply at ±threshold
 *
 * @param samples - Number of samples in the curve
 * @param threshold - Clipping threshold (0-1), lower = more clipping
 * @returns Float32Array with the transfer curve
 */
export function generateHardClipCurve(
  samples: number,
  threshold: number,
): Float32Array {
  const curve = new Float32Array(samples);
  const clampedThreshold = Math.max(0.01, Math.min(1, threshold));

  for (let i = 0; i < samples; i++) {
    // Map index to input range [-1, 1]
    const x = (2 * i) / (samples - 1) - 1;
    // Apply hard clipping: linear until threshold, then clamp
    const scaled = x / clampedThreshold;
    curve[i] = Math.max(-1, Math.min(1, scaled));
  }

  return curve;
}

/**
 * Generate a soft clipping curve using tanh
 * Mathematical formula: f(x) = tanh(x * (1 + amount * 10))
 * tanh provides smooth saturation that approaches ±1 asymptotically
 *
 * Properties:
 * - Odd function: tanh(-x) = -tanh(x)
 * - Bounded: -1 < tanh(x) < 1
 * - Derivative at origin: tanh'(0) = 1
 *
 * @param samples - Number of samples in the curve
 * @param amount - Distortion amount (0-1), higher = more saturation
 * @returns Float32Array with the transfer curve
 */
export function generateTanhCurve(
  samples: number,
  amount: number,
): Float32Array {
  const curve = new Float32Array(samples);
  // Scale factor: 1 at amount=0, 11 at amount=1
  const k = 1 + amount * 10;

  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    curve[i] = Math.tanh(k * x);
  }

  return curve;
}

/**
 * Generate a soft clipping curve using atan
 * Mathematical formula: f(x) = (2/π) * atan(x * (1 + amount * 10))
 * atan provides even gentler saturation than tanh
 *
 * Properties:
 * - Odd function: atan(-x) = -atan(x)
 * - Bounded when normalized: -1 < (2/π)*atan(x) < 1
 * - Gentler knee than tanh
 *
 * @param samples - Number of samples in the curve
 * @param amount - Distortion amount (0-1)
 * @returns Float32Array with the transfer curve
 */
export function generateAtanCurve(
  samples: number,
  amount: number,
): Float32Array {
  const curve = new Float32Array(samples);
  const k = 1 + amount * 10;
  const normalization = 2 / Math.PI; // Normalize atan range to [-1, 1]

  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    curve[i] = normalization * Math.atan(k * x);
  }

  return curve;
}

/**
 * Generate a sine-based waveshaping curve
 * Mathematical formula: f(x) = sin(x * π/2 * (1 + amount * 2))
 * Creates a more aggressive, "folding" distortion at high amounts
 *
 * At amount=0: f(x) ≈ sin(πx/2) which is nearly linear near origin
 * At amount=1: f(x) = sin(3πx/2) which creates folding distortion
 *
 * @param samples - Number of samples in the curve
 * @param amount - Distortion amount (0-1)
 * @returns Float32Array with the transfer curve
 */
export function generateSineCurve(
  samples: number,
  amount: number,
): Float32Array {
  const curve = new Float32Array(samples);
  const k = (Math.PI / 2) * (1 + amount * 2);

  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    curve[i] = Math.sin(k * x);
  }

  return curve;
}

/**
 * Generate a cubic waveshaping curve
 * Mathematical formula: f(x) = x - (amount/3) * x³
 * Classic "tube" distortion character
 *
 * Properties:
 * - Odd function (preserves waveform symmetry)
 * - For amount < 1: monotonic, gentle saturation
 * - Creates 3rd harmonic distortion (warm, musical character)
 *
 * @param samples - Number of samples in the curve
 * @param amount - Distortion amount (0-1)
 * @returns Float32Array with the transfer curve
 */
export function generateCubicCurve(
  samples: number,
  amount: number,
): Float32Array {
  const curve = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    // Cubic soft clipper: x - (amount/3) * x³
    // At amount=1: f(1) = 1 - 1/3 = 0.667, f(-1) = -0.667
    const y = x - (amount / 3) * x * x * x;
    // Normalize to ensure output stays in [-1, 1]
    curve[i] = Math.max(-1, Math.min(1, y));
  }

  return curve;
}

/**
 * Generate a waveshaper curve based on curve type and amount
 * This is the main entry point for waveshaper curve generation
 *
 * @param curveType - Type of distortion curve
 * @param amount - Amount of distortion (0-1)
 * @param samples - Number of samples (default 1024 for good resolution)
 * @returns Float32Array with the transfer curve
 */
export function generateWaveshaperCurve(
  curveType: WaveshaperCurveType | string,
  amount: number,
  samples: number = 1024,
): Float32Array {
  switch (curveType) {
    case "hard-clip":
      // For hard clip, amount controls the threshold
      // Higher amount = lower threshold = more clipping
      return generateHardClipCurve(samples, 1 - amount * 0.9);

    case "soft-clip":
    case "tanh":
      return generateTanhCurve(samples, amount);

    case "atan":
      return generateAtanCurve(samples, amount);

    case "sine":
      return generateSineCurve(samples, amount);

    case "cubic":
      return generateCubicCurve(samples, amount);

    default:
      // Default to tanh for unknown types
      return generateTanhCurve(samples, amount);
  }
}

/**
 * Apply a waveshaper curve to a sample value
 * This simulates what the WaveShaperNode does internally
 *
 * @param curve - The transfer curve
 * @param input - Input sample value (expected range: -1 to 1)
 * @returns Output sample value
 */
export function applyWaveshaperCurve(
  curve: Float32Array,
  input: number,
): number {
  // Clamp input to [-1, 1]
  const clampedInput = Math.max(-1, Math.min(1, input));

  // Map input [-1, 1] to curve index [0, curve.length - 1]
  const index = ((clampedInput + 1) / 2) * (curve.length - 1);

  // Linear interpolation between adjacent curve samples
  const indexLow = Math.floor(index);
  const indexHigh = Math.min(indexLow + 1, curve.length - 1);
  const fraction = index - indexLow;

  return curve[indexLow] * (1 - fraction) + curve[indexHigh] * fraction;
}

/**
 * Process an array of samples through a waveshaper curve
 *
 * @param curve - The transfer curve
 * @param input - Array of input samples
 * @returns Array of output samples
 */
export function processWithWaveshaper(
  curve: Float32Array,
  input: Float32Array | number[],
): Float32Array {
  const output = new Float32Array(input.length);

  for (let i = 0; i < input.length; i++) {
    output[i] = applyWaveshaperCurve(curve, input[i]);
  }

  return output;
}
