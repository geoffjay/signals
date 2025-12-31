/**
 * Pure functions for math operations on signal samples
 * These mirror the AudioWorklet processors in math-processors.js
 *
 * All functions operate on sample arrays and are designed for
 * deterministic testing of the mathematical operations.
 */

/**
 * Unary math operations (single input → single output)
 */

/**
 * Ceiling function: rounds up to nearest integer
 * Mathematical formula: f(x) = ⌈x⌉
 *
 * @param input - Input sample array
 * @returns Output array with ceiling applied
 */
export function ceil(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.ceil(input[i] || 0);
  }
  return output;
}

/**
 * Floor function: rounds down to nearest integer
 * Mathematical formula: f(x) = ⌊x⌋
 *
 * @param input - Input sample array
 * @returns Output array with floor applied
 */
export function floor(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.floor(input[i] || 0);
  }
  return output;
}

/**
 * Round function: rounds to nearest integer
 * Mathematical formula: f(x) = round(x)
 *
 * @param input - Input sample array
 * @returns Output array with rounding applied
 */
export function round(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.round(input[i] || 0);
  }
  return output;
}

/**
 * Absolute value function
 * Mathematical formula: f(x) = |x|
 *
 * Properties:
 * - Always non-negative: |x| ≥ 0
 * - |x| = x if x ≥ 0, |x| = -x if x < 0
 *
 * @param input - Input sample array
 * @returns Output array with absolute values
 */
export function abs(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.abs(input[i] || 0);
  }
  return output;
}

/**
 * Sign function: extracts the sign of a number
 * Mathematical formula: f(x) = sgn(x) = { -1 if x < 0, 0 if x = 0, 1 if x > 0 }
 *
 * @param input - Input sample array
 * @returns Output array with sign values (-1, 0, or 1)
 */
export function sign(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.sign(input[i] || 0);
  }
  return output;
}

/**
 * Negate function: inverts the sign
 * Mathematical formula: f(x) = -x
 *
 * @param input - Input sample array
 * @returns Output array with negated values
 */
export function negate(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = -(input[i] || 0);
  }
  return output;
}

/**
 * Square root function (non-negative inputs only)
 * Mathematical formula: f(x) = √x for x ≥ 0, 0 for x < 0
 *
 * Note: Returns 0 for negative inputs to avoid NaN
 *
 * @param input - Input sample array
 * @returns Output array with square roots
 */
export function sqrt(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const x = input[i] || 0;
    output[i] = x >= 0 ? Math.sqrt(x) : 0;
  }
  return output;
}

/**
 * Sine function
 * Mathematical formula: f(x) = sin(x)
 *
 * Properties:
 * - Periodic: sin(x + 2π) = sin(x)
 * - Range: [-1, 1]
 * - sin(0) = 0, sin(π/2) = 1
 *
 * @param input - Input sample array (in radians)
 * @returns Output array with sine values
 */
export function sin(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.sin(input[i] || 0);
  }
  return output;
}

/**
 * Cosine function
 * Mathematical formula: f(x) = cos(x)
 *
 * Properties:
 * - Periodic: cos(x + 2π) = cos(x)
 * - Range: [-1, 1]
 * - cos(0) = 1, cos(π/2) = 0
 *
 * @param input - Input sample array (in radians)
 * @returns Output array with cosine values
 */
export function cos(input: Float32Array | number[]): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = Math.cos(input[i] || 0);
  }
  return output;
}

/**
 * Binary math operations (two inputs → single output)
 */

/**
 * Addition: element-wise sum
 * Mathematical formula: f(a, b) = a + b
 *
 * @param inputA - First input array
 * @param inputB - Second input array
 * @returns Output array with sums
 */
export function add(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = (inputA[i] || 0) + (inputB[i] || 0);
  }
  return output;
}

/**
 * Subtraction: element-wise difference
 * Mathematical formula: f(a, b) = a - b
 *
 * @param inputA - First input array
 * @param inputB - Second input array
 * @returns Output array with differences
 */
export function subtract(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = (inputA[i] || 0) - (inputB[i] || 0);
  }
  return output;
}

/**
 * Multiplication: element-wise product
 * Mathematical formula: f(a, b) = a × b
 *
 * @param inputA - First input array
 * @param inputB - Second input array
 * @returns Output array with products
 */
export function multiply(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = (inputA[i] || 0) * (inputB[i] || 0);
  }
  return output;
}

/**
 * Division: element-wise quotient
 * Mathematical formula: f(a, b) = a / b
 *
 * Note: Returns 0 when dividing by 0 to avoid Infinity/NaN
 *
 * @param inputA - First input array (dividend)
 * @param inputB - Second input array (divisor)
 * @returns Output array with quotients
 */
export function divide(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const a = inputA[i] || 0;
    const b = inputB[i] || 0;
    output[i] = b !== 0 ? a / b : 0;
  }
  return output;
}

/**
 * Minimum: element-wise minimum
 * Mathematical formula: f(a, b) = min(a, b)
 *
 * @param inputA - First input array
 * @param inputB - Second input array
 * @returns Output array with minimum values
 */
export function min(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = Math.min(inputA[i] || 0, inputB[i] || 0);
  }
  return output;
}

/**
 * Maximum: element-wise maximum
 * Mathematical formula: f(a, b) = max(a, b)
 *
 * @param inputA - First input array
 * @param inputB - Second input array
 * @returns Output array with maximum values
 */
export function max(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    output[i] = Math.max(inputA[i] || 0, inputB[i] || 0);
  }
  return output;
}

/**
 * Power: element-wise exponentiation
 * Mathematical formula: f(a, b) = a^b
 *
 * Note: Result is clamped to [-100, 100] to prevent overflow
 *
 * @param inputA - Base array
 * @param inputB - Exponent array
 * @returns Output array with power values
 */
export function pow(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const base = inputA[i] || 0;
    const exp = inputB[i] || 0;
    const result = Math.pow(base, exp);
    output[i] = isFinite(result) ? Math.max(-100, Math.min(100, result)) : 0;
  }
  return output;
}

/**
 * Modulo: element-wise remainder
 * Mathematical formula: f(a, b) = a mod b
 *
 * Note: Uses a small epsilon to avoid division by zero
 *
 * @param inputA - Dividend array
 * @param inputB - Divisor array
 * @returns Output array with remainder values
 */
export function mod(
  inputA: Float32Array | number[],
  inputB: Float32Array | number[],
): Float32Array {
  const length = Math.min(inputA.length, inputB.length);
  const output = new Float32Array(length);
  const epsilon = 1e-4;

  for (let i = 0; i < length; i++) {
    const a = inputA[i] || 0;
    const b = inputB[i] || 0;
    // Ensure divisor is not too close to zero
    const safeB = Math.abs(b) < epsilon ? (b >= 0 ? epsilon : -epsilon) : b;
    output[i] = a % safeB;
  }
  return output;
}

/**
 * Ternary math operations (three inputs → single output)
 */

/**
 * Clamp: constrain values to a range
 * Mathematical formula: f(x, min, max) = max(min, min(max, x))
 *
 * @param input - Values to clamp
 * @param minValues - Minimum bounds
 * @param maxValues - Maximum bounds
 * @returns Output array with clamped values
 */
export function clamp(
  input: Float32Array | number[],
  minValues: Float32Array | number[],
  maxValues: Float32Array | number[],
): Float32Array {
  const length = Math.min(input.length, minValues.length, maxValues.length);
  const output = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const x = input[i] || 0;
    const minVal = minValues[i] || 0;
    const maxVal = maxValues[i] || 0;
    output[i] = Math.max(minVal, Math.min(maxVal, x));
  }

  return output;
}

/**
 * Multiplexer: select between inputs based on selector value
 * Mathematical formula: output = lerp(inputs[floor(s)], inputs[ceil(s)], frac(s))
 *
 * This implements smooth crossfading between inputs for continuous selector values.
 *
 * @param selector - Selector values (0 to numInputs-1)
 * @param inputs - Array of input arrays
 * @returns Output array with selected/interpolated values
 */
export function multiplex(
  selector: Float32Array | number[],
  inputs: (Float32Array | number[])[],
): Float32Array {
  if (inputs.length === 0) {
    return new Float32Array(selector.length);
  }

  const length = selector.length;
  const numInputs = inputs.length;
  const output = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const s = selector[i] || 0;
    // Clamp selector to valid range
    const clampedS = Math.max(0, Math.min(numInputs - 1, s));
    const lowIndex = Math.floor(clampedS);
    const highIndex = Math.min(lowIndex + 1, numInputs - 1);
    const fraction = clampedS - lowIndex;

    const lowValue = inputs[lowIndex]?.[i] ?? 0;
    const highValue = inputs[highIndex]?.[i] ?? 0;

    // Linear interpolation between adjacent inputs
    output[i] = lowValue * (1 - fraction) + highValue * fraction;
  }

  return output;
}

/**
 * Gain: multiply signal by a constant or varying gain
 * Mathematical formula: f(x, g) = x × g
 *
 * @param input - Input signal array
 * @param gain - Gain value or array of gain values
 * @returns Output array with gained signal
 */
export function gain(
  input: Float32Array | number[],
  gainValue: number | Float32Array | number[],
): Float32Array {
  const output = new Float32Array(input.length);

  if (typeof gainValue === "number") {
    for (let i = 0; i < input.length; i++) {
      output[i] = (input[i] || 0) * gainValue;
    }
  } else {
    for (let i = 0; i < input.length; i++) {
      output[i] = (input[i] || 0) * (gainValue[i] || 0);
    }
  }

  return output;
}
