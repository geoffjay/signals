import { describe, it, expect } from "vitest";
import {
  ceil,
  floor,
  round,
  abs,
  sign,
  negate,
  sqrt,
  sin,
  cos,
  add,
  subtract,
  multiply,
  divide,
  min,
  max,
  pow,
  mod,
  clamp,
  multiplex,
  gain,
} from "@/engine/dsp/math-operations";

describe("Math Operations DSP", () => {
  describe("Unary Operations", () => {
    describe("ceil", () => {
      /**
       * Mathematical definition: ⌈x⌉ = smallest integer ≥ x
       */
      it("should round up to nearest integer", () => {
        const input = new Float32Array([0.1, 0.9, 1.5, -0.1, -0.9, -1.5]);
        const output = ceil(input);

        expect(output[0]).toBeCloseTo(1, 5);   // ⌈0.1⌉ = 1
        expect(output[1]).toBeCloseTo(1, 5);   // ⌈0.9⌉ = 1
        expect(output[2]).toBeCloseTo(2, 5);   // ⌈1.5⌉ = 2
        expect(output[3]).toBeCloseTo(0, 5);   // ⌈-0.1⌉ = 0 (Float32 precision)
        expect(output[4]).toBeCloseTo(0, 5);   // ⌈-0.9⌉ = 0
        expect(output[5]).toBeCloseTo(-1, 5);  // ⌈-1.5⌉ = -1
      });

      it("should preserve integers", () => {
        const input = new Float32Array([0, 1, -1, 5, -5]);
        const output = ceil(input);

        for (let i = 0; i < input.length; i++) {
          expect(output[i]).toBe(input[i]);
        }
      });
    });

    describe("floor", () => {
      /**
       * Mathematical definition: ⌊x⌋ = largest integer ≤ x
       */
      it("should round down to nearest integer", () => {
        const input = new Float32Array([0.1, 0.9, 1.5, -0.1, -0.9, -1.5]);
        const output = floor(input);

        expect(output[0]).toBe(0);   // ⌊0.1⌋ = 0
        expect(output[1]).toBe(0);   // ⌊0.9⌋ = 0
        expect(output[2]).toBe(1);   // ⌊1.5⌋ = 1
        expect(output[3]).toBe(-1);  // ⌊-0.1⌋ = -1
        expect(output[4]).toBe(-1);  // ⌊-0.9⌋ = -1
        expect(output[5]).toBe(-2);  // ⌊-1.5⌋ = -2
      });

      it("should satisfy ceil(x) = -floor(-x) for non-integers", () => {
        const input = new Float32Array([0.5, 1.7, -2.3, 3.14159]);
        const ceilOut = ceil(input);
        const negInput = new Float32Array(input.map((x) => -x));
        const floorNeg = floor(negInput);

        for (let i = 0; i < input.length; i++) {
          expect(ceilOut[i]).toBe(-floorNeg[i]);
        }
      });
    });

    describe("round", () => {
      /**
       * Mathematical definition: round(x) = nearest integer (half rounds up)
       */
      it("should round to nearest integer", () => {
        const input = new Float32Array([0.4, 0.6, 1.4, -0.4, -0.6, -1.4]);
        const output = round(input);

        expect(output[0]).toBeCloseTo(0, 5);   // round(0.4) = 0
        expect(output[1]).toBeCloseTo(1, 5);   // round(0.6) = 1
        expect(output[2]).toBeCloseTo(1, 5);   // round(1.4) = 1
        expect(output[3]).toBeCloseTo(0, 5);   // round(-0.4) = 0
        expect(output[4]).toBeCloseTo(-1, 5);  // round(-0.6) = -1
        expect(output[5]).toBeCloseTo(-1, 5);  // round(-1.4) = -1
      });
    });

    describe("abs", () => {
      /**
       * Mathematical definition: |x| = x if x ≥ 0, -x if x < 0
       */
      it("should return absolute value", () => {
        const input = new Float32Array([1, -1, 0, 0.5, -0.5, 3.14, -3.14]);
        const output = abs(input);

        expect(output[0]).toBe(1);
        expect(output[1]).toBe(1);
        expect(output[2]).toBe(0);
        expect(output[3]).toBe(0.5);
        expect(output[4]).toBe(0.5);
        expect(output[5]).toBeCloseTo(3.14, 5);
        expect(output[6]).toBeCloseTo(3.14, 5);
      });

      it("should satisfy |x| ≥ 0 for all x", () => {
        const input = new Float32Array(100);
        for (let i = 0; i < 100; i++) {
          input[i] = Math.random() * 200 - 100;
        }
        const output = abs(input);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBeGreaterThanOrEqual(0);
        }
      });

      it("should satisfy |x| = |-x|", () => {
        const input = new Float32Array([1, -1, 5.5, -5.5]);
        const negInput = new Float32Array(input.map((x) => -x));
        const out1 = abs(input);
        const out2 = abs(negInput);

        for (let i = 0; i < input.length; i++) {
          expect(out1[i]).toBe(out2[i]);
        }
      });
    });

    describe("sign", () => {
      /**
       * Mathematical definition: sgn(x) = -1 if x < 0, 0 if x = 0, 1 if x > 0
       */
      it("should return sign of value", () => {
        const input = new Float32Array([5, -5, 0, 0.001, -0.001]);
        const output = sign(input);

        expect(output[0]).toBe(1);
        expect(output[1]).toBe(-1);
        expect(output[2]).toBe(0);
        expect(output[3]).toBe(1);
        expect(output[4]).toBe(-1);
      });

      it("should satisfy x = |x| * sign(x) for all x", () => {
        const input = new Float32Array([5, -5, 0.5, -0.5]);
        const absOut = abs(input);
        const signOut = sign(input);

        for (let i = 0; i < input.length; i++) {
          expect(absOut[i] * signOut[i]).toBeCloseTo(input[i], 5);
        }
      });
    });

    describe("negate", () => {
      /**
       * Mathematical definition: -x
       */
      it("should negate values", () => {
        const input = new Float32Array([1, -1, 0, 5.5, -5.5]);
        const output = negate(input);

        expect(output[0]).toBeCloseTo(-1, 5);
        expect(output[1]).toBeCloseTo(1, 5);
        expect(output[2]).toBeCloseTo(0, 5);  // -0 and 0 are equivalent
        expect(output[3]).toBeCloseTo(-5.5, 5);
        expect(output[4]).toBeCloseTo(5.5, 5);
      });

      it("should satisfy -(-x) = x", () => {
        const input = new Float32Array([1, -1, 0.5, -0.5, 3.14]);
        const negated = negate(input);
        const doubleNegated = negate(negated);

        for (let i = 0; i < input.length; i++) {
          expect(doubleNegated[i]).toBeCloseTo(input[i], 5);
        }
      });
    });

    describe("sqrt", () => {
      /**
       * Mathematical definition: √x = y where y² = x and y ≥ 0
       */
      it("should return square root for non-negative values", () => {
        const input = new Float32Array([0, 1, 4, 9, 16, 0.25, 2]);
        const output = sqrt(input);

        expect(output[0]).toBe(0);
        expect(output[1]).toBe(1);
        expect(output[2]).toBe(2);
        expect(output[3]).toBe(3);
        expect(output[4]).toBe(4);
        expect(output[5]).toBe(0.5);
        expect(output[6]).toBeCloseTo(Math.sqrt(2), 5);
      });

      it("should return 0 for negative values (safe behavior)", () => {
        const input = new Float32Array([-1, -4, -9]);
        const output = sqrt(input);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBe(0);
        }
      });

      it("should satisfy sqrt(x)² = x for x ≥ 0", () => {
        const input = new Float32Array([1, 4, 9, 2, 7.5]);
        const sqrtOut = sqrt(input);
        const squared = multiply(sqrtOut, sqrtOut);

        for (let i = 0; i < input.length; i++) {
          expect(squared[i]).toBeCloseTo(input[i], 5);
        }
      });
    });

    describe("sin", () => {
      /**
       * Mathematical properties of sine:
       * - sin(0) = 0
       * - sin(π/2) = 1
       * - sin(π) = 0
       * - sin(3π/2) = -1
       * - Range: [-1, 1]
       */
      it("should return sine values", () => {
        const input = new Float32Array([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]);
        const output = sin(input);

        expect(output[0]).toBeCloseTo(0, 5);
        expect(output[1]).toBeCloseTo(1, 5);
        expect(output[2]).toBeCloseTo(0, 5);
        expect(output[3]).toBeCloseTo(-1, 5);
      });

      it("should satisfy sin²(x) + cos²(x) = 1", () => {
        const input = new Float32Array([0, 0.5, 1, 2, Math.PI]);
        const sinOut = sin(input);
        const cosOut = cos(input);

        for (let i = 0; i < input.length; i++) {
          const sum = sinOut[i] * sinOut[i] + cosOut[i] * cosOut[i];
          expect(sum).toBeCloseTo(1, 5);
        }
      });

      it("should be bounded by [-1, 1]", () => {
        const input = new Float32Array(100);
        for (let i = 0; i < 100; i++) {
          input[i] = Math.random() * 20 - 10;
        }
        const output = sin(input);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBeGreaterThanOrEqual(-1);
          expect(output[i]).toBeLessThanOrEqual(1);
        }
      });
    });

    describe("cos", () => {
      /**
       * Mathematical properties of cosine:
       * - cos(0) = 1
       * - cos(π/2) = 0
       * - cos(π) = -1
       * - cos(3π/2) = 0
       */
      it("should return cosine values", () => {
        const input = new Float32Array([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]);
        const output = cos(input);

        expect(output[0]).toBeCloseTo(1, 5);
        expect(output[1]).toBeCloseTo(0, 5);
        expect(output[2]).toBeCloseTo(-1, 5);
        expect(output[3]).toBeCloseTo(0, 5);
      });

      it("should satisfy cos(x) = sin(x + π/2)", () => {
        const input = new Float32Array([0, 0.5, 1, 2, Math.PI]);
        const cosOut = cos(input);
        const shiftedInput = new Float32Array(input.map((x) => x + Math.PI / 2));
        const sinShifted = sin(shiftedInput);

        for (let i = 0; i < input.length; i++) {
          expect(cosOut[i]).toBeCloseTo(sinShifted[i], 5);
        }
      });
    });
  });

  describe("Binary Operations", () => {
    describe("add", () => {
      /**
       * Mathematical properties:
       * - Commutative: a + b = b + a
       * - Associative: (a + b) + c = a + (b + c)
       * - Identity: a + 0 = a
       */
      it("should add element-wise", () => {
        const a = new Float32Array([1, 2, 3, 4]);
        const b = new Float32Array([5, 6, 7, 8]);
        const output = add(a, b);

        expect(output[0]).toBe(6);
        expect(output[1]).toBe(8);
        expect(output[2]).toBe(10);
        expect(output[3]).toBe(12);
      });

      it("should be commutative", () => {
        const a = new Float32Array([1.5, 2.5, 3.5]);
        const b = new Float32Array([4.5, 5.5, 6.5]);
        const ab = add(a, b);
        const ba = add(b, a);

        for (let i = 0; i < a.length; i++) {
          expect(ab[i]).toBeCloseTo(ba[i], 5);
        }
      });

      it("should have 0 as identity", () => {
        const a = new Float32Array([1, 2, 3]);
        const zero = new Float32Array([0, 0, 0]);
        const output = add(a, zero);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBeCloseTo(a[i], 5);
        }
      });
    });

    describe("subtract", () => {
      it("should subtract element-wise", () => {
        const a = new Float32Array([5, 6, 7, 8]);
        const b = new Float32Array([1, 2, 3, 4]);
        const output = subtract(a, b);

        expect(output[0]).toBe(4);
        expect(output[1]).toBe(4);
        expect(output[2]).toBe(4);
        expect(output[3]).toBe(4);
      });

      it("should satisfy a - a = 0", () => {
        const a = new Float32Array([1.5, 2.5, 3.5]);
        const output = subtract(a, a);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBeCloseTo(0, 5);
        }
      });
    });

    describe("multiply", () => {
      /**
       * Mathematical properties:
       * - Commutative: a × b = b × a
       * - Identity: a × 1 = a
       * - Zero: a × 0 = 0
       */
      it("should multiply element-wise", () => {
        const a = new Float32Array([2, 3, 4, 5]);
        const b = new Float32Array([3, 4, 5, 6]);
        const output = multiply(a, b);

        expect(output[0]).toBe(6);
        expect(output[1]).toBe(12);
        expect(output[2]).toBe(20);
        expect(output[3]).toBe(30);
      });

      it("should have 1 as identity", () => {
        const a = new Float32Array([1.5, 2.5, 3.5]);
        const ones = new Float32Array([1, 1, 1]);
        const output = multiply(a, ones);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBeCloseTo(a[i], 5);
        }
      });

      it("should yield 0 when multiplied by 0", () => {
        const a = new Float32Array([1.5, 2.5, 3.5]);
        const zeros = new Float32Array([0, 0, 0]);
        const output = multiply(a, zeros);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBe(0);
        }
      });
    });

    describe("divide", () => {
      it("should divide element-wise", () => {
        const a = new Float32Array([6, 12, 20, 30]);
        const b = new Float32Array([2, 3, 4, 5]);
        const output = divide(a, b);

        expect(output[0]).toBe(3);
        expect(output[1]).toBe(4);
        expect(output[2]).toBe(5);
        expect(output[3]).toBe(6);
      });

      it("should return 0 for division by 0 (safe behavior)", () => {
        const a = new Float32Array([1, 2, 3]);
        const b = new Float32Array([0, 0, 0]);
        const output = divide(a, b);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBe(0);
        }
      });

      it("should satisfy a / a = 1 for a ≠ 0", () => {
        const a = new Float32Array([1.5, 2.5, 3.5, -1.5]);
        const output = divide(a, a);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBeCloseTo(1, 5);
        }
      });
    });

    describe("min", () => {
      it("should return minimum element-wise", () => {
        const a = new Float32Array([1, 5, 3, 7]);
        const b = new Float32Array([2, 4, 6, 0]);
        const output = min(a, b);

        expect(output[0]).toBe(1);
        expect(output[1]).toBe(4);
        expect(output[2]).toBe(3);
        expect(output[3]).toBe(0);
      });

      it("should satisfy min(a, a) = a", () => {
        const a = new Float32Array([1, 2, 3, 4]);
        const output = min(a, a);

        for (let i = 0; i < a.length; i++) {
          expect(output[i]).toBe(a[i]);
        }
      });

      it("should be commutative", () => {
        const a = new Float32Array([1, 5, 3]);
        const b = new Float32Array([2, 4, 6]);
        const ab = min(a, b);
        const ba = min(b, a);

        for (let i = 0; i < a.length; i++) {
          expect(ab[i]).toBe(ba[i]);
        }
      });
    });

    describe("max", () => {
      it("should return maximum element-wise", () => {
        const a = new Float32Array([1, 5, 3, 7]);
        const b = new Float32Array([2, 4, 6, 0]);
        const output = max(a, b);

        expect(output[0]).toBe(2);
        expect(output[1]).toBe(5);
        expect(output[2]).toBe(6);
        expect(output[3]).toBe(7);
      });

      it("should satisfy max(a, b) ≥ min(a, b)", () => {
        const a = new Float32Array([1, 5, 3, 7]);
        const b = new Float32Array([2, 4, 6, 0]);
        const maxOut = max(a, b);
        const minOut = min(a, b);

        for (let i = 0; i < a.length; i++) {
          expect(maxOut[i]).toBeGreaterThanOrEqual(minOut[i]);
        }
      });
    });

    describe("pow", () => {
      /**
       * Mathematical properties:
       * - a^1 = a
       * - a^0 = 1 (for a ≠ 0)
       * - a^b × a^c = a^(b+c)
       */
      it("should compute power element-wise", () => {
        const base = new Float32Array([2, 3, 4, 10]);
        const exp = new Float32Array([2, 2, 0.5, 0]);
        const output = pow(base, exp);

        expect(output[0]).toBe(4);        // 2² = 4
        expect(output[1]).toBe(9);        // 3² = 9
        expect(output[2]).toBe(2);        // 4^0.5 = 2
        expect(output[3]).toBe(1);        // 10^0 = 1
      });

      it("should clamp extreme values to [-100, 100]", () => {
        const base = new Float32Array([10, 100]);
        const exp = new Float32Array([10, 10]);
        const output = pow(base, exp);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBeLessThanOrEqual(100);
          expect(output[i]).toBeGreaterThanOrEqual(-100);
        }
      });
    });

    describe("mod", () => {
      /**
       * Mathematical definition: a mod b = a - b * floor(a/b)
       */
      it("should compute modulo element-wise", () => {
        const a = new Float32Array([5, 7, 10, 3.5]);
        const b = new Float32Array([3, 4, 3, 1.5]);
        const output = mod(a, b);

        expect(output[0]).toBeCloseTo(2, 5);     // 5 mod 3 = 2
        expect(output[1]).toBeCloseTo(3, 5);     // 7 mod 4 = 3
        expect(output[2]).toBeCloseTo(1, 5);     // 10 mod 3 = 1
        expect(output[3]).toBeCloseTo(0.5, 5);   // 3.5 mod 1.5 = 0.5
      });

      it("should handle near-zero divisor safely", () => {
        const a = new Float32Array([1, 2, 3]);
        const b = new Float32Array([0.00001, 0.00001, 0.00001]);
        const output = mod(a, b);

        // Should not produce NaN or Infinity
        for (let i = 0; i < output.length; i++) {
          expect(isFinite(output[i])).toBe(true);
        }
      });
    });
  });

  describe("Ternary Operations", () => {
    describe("clamp", () => {
      /**
       * Mathematical definition: clamp(x, min, max) = max(min, min(max, x))
       */
      it("should clamp values to range", () => {
        const values = new Float32Array([0.5, -1, 2, 0, 1]);
        const mins = new Float32Array([0, 0, 0, 0, 0]);
        const maxs = new Float32Array([1, 1, 1, 1, 1]);
        const output = clamp(values, mins, maxs);

        expect(output[0]).toBe(0.5);  // Within range
        expect(output[1]).toBe(0);    // Clamped to min
        expect(output[2]).toBe(1);    // Clamped to max
        expect(output[3]).toBe(0);    // At min
        expect(output[4]).toBe(1);    // At max
      });

      it("should satisfy min ≤ output ≤ max", () => {
        const values = new Float32Array(100);
        const mins = new Float32Array(100).fill(-0.5);
        const maxs = new Float32Array(100).fill(0.5);

        for (let i = 0; i < 100; i++) {
          values[i] = Math.random() * 4 - 2; // Range: -2 to 2
        }

        const output = clamp(values, mins, maxs);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBeGreaterThanOrEqual(-0.5);
          expect(output[i]).toBeLessThanOrEqual(0.5);
        }
      });
    });
  });

  describe("Multiplexer", () => {
    describe("multiplex", () => {
      /**
       * Multiplexer selects between inputs based on selector value.
       * For fractional selector values, it interpolates between adjacent inputs.
       */
      it("should select correct input with integer selector", () => {
        const selector = new Float32Array([0, 1, 0, 1]);
        const input0 = new Float32Array([1, 1, 1, 1]);
        const input1 = new Float32Array([2, 2, 2, 2]);
        const output = multiplex(selector, [input0, input1]);

        expect(output[0]).toBe(1);  // Select input 0
        expect(output[1]).toBe(2);  // Select input 1
        expect(output[2]).toBe(1);  // Select input 0
        expect(output[3]).toBe(2);  // Select input 1
      });

      it("should interpolate for fractional selector", () => {
        const selector = new Float32Array([0.5]);
        const input0 = new Float32Array([0]);
        const input1 = new Float32Array([1]);
        const output = multiplex(selector, [input0, input1]);

        // 0.5 should interpolate halfway between 0 and 1
        expect(output[0]).toBeCloseTo(0.5, 5);
      });

      it("should clamp selector to valid range", () => {
        const selector = new Float32Array([-1, 5]);
        const input0 = new Float32Array([1, 1]);
        const input1 = new Float32Array([2, 2]);
        const output = multiplex(selector, [input0, input1]);

        expect(output[0]).toBe(1);  // Clamped to 0, select input 0
        expect(output[1]).toBe(2);  // Clamped to 1, select input 1
      });

      it("should handle empty inputs gracefully", () => {
        const selector = new Float32Array([0, 1]);
        const output = multiplex(selector, []);

        expect(output.length).toBe(2);
        expect(output[0]).toBe(0);
        expect(output[1]).toBe(0);
      });
    });
  });

  describe("Gain", () => {
    describe("gain", () => {
      it("should multiply by constant gain", () => {
        const input = new Float32Array([1, 2, 3, 4]);
        const output = gain(input, 0.5);

        expect(output[0]).toBe(0.5);
        expect(output[1]).toBe(1);
        expect(output[2]).toBe(1.5);
        expect(output[3]).toBe(2);
      });

      it("should multiply by varying gain array", () => {
        const input = new Float32Array([1, 2, 3, 4]);
        const gainValues = new Float32Array([1, 2, 0.5, 0]);
        const output = gain(input, gainValues);

        expect(output[0]).toBe(1);
        expect(output[1]).toBe(4);
        expect(output[2]).toBe(1.5);
        expect(output[3]).toBe(0);
      });

      it("should preserve silence with gain = 1", () => {
        const input = new Float32Array([1, 2, 3, 4]);
        const output = gain(input, 1);

        for (let i = 0; i < input.length; i++) {
          expect(output[i]).toBe(input[i]);
        }
      });

      it("should produce silence with gain = 0", () => {
        const input = new Float32Array([1, 2, 3, 4]);
        const output = gain(input, 0);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBe(0);
        }
      });
    });
  });
});
