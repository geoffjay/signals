import { describe, it, expect } from "vitest";
import {
  generateHardClipCurve,
  generateTanhCurve,
  generateAtanCurve,
  generateSineCurve,
  generateCubicCurve,
  generateWaveshaperCurve,
  applyWaveshaperCurve,
  processWithWaveshaper,
} from "@/engine/dsp/waveshaper";

describe("Waveshaper DSP", () => {
  const SAMPLES = 1024;

  describe("generateHardClipCurve", () => {
    /**
     * Mathematical verification:
     * Hard clipping implements f(x) = clamp(x / threshold, -1, 1)
     *
     * Properties:
     * - Linear in the passband: for |x| < threshold, f(x) = x/threshold
     * - Saturates at ±1 for |x| ≥ threshold
     * - Odd function: f(-x) = -f(x)
     */

    it("should produce odd function (symmetric around origin)", () => {
      const curve = generateHardClipCurve(SAMPLES, 0.5);

      // Check symmetry: curve[i] = -curve[n-1-i]
      for (let i = 0; i < SAMPLES / 2; i++) {
        const symmetricIndex = SAMPLES - 1 - i;
        expect(curve[i]).toBeCloseTo(-curve[symmetricIndex], 5);
      }
    });

    it("should output 0 at midpoint (zero crossing)", () => {
      const curve = generateHardClipCurve(SAMPLES, 0.5);
      // For 1024 samples, x=0 maps to index (0+1)/2 * (1024-1) = 511.5
      // We need to check that f(0) ≈ 0 using interpolation
      const zeroIndex = ((0 + 1) / 2) * (SAMPLES - 1);
      const indexLow = Math.floor(zeroIndex);
      const fraction = zeroIndex - indexLow;
      const interpolated = curve[indexLow] * (1 - fraction) + curve[indexLow + 1] * fraction;

      expect(interpolated).toBeCloseTo(0, 3);
    });

    it("should saturate at ±1 for high threshold", () => {
      const curve = generateHardClipCurve(SAMPLES, 0.1); // Low threshold = more clipping

      // First and last values should be ±1 (fully saturated)
      expect(curve[0]).toBeCloseTo(-1, 5);
      expect(curve[SAMPLES - 1]).toBeCloseTo(1, 5);
    });

    it("should be nearly linear with threshold = 1", () => {
      const curve = generateHardClipCurve(SAMPLES, 1.0);

      // With threshold = 1, the curve should approximate identity function
      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        expect(curve[i]).toBeCloseTo(x, 4);
      }
    });

    it("should clip at correct threshold", () => {
      const threshold = 0.3;
      const curve = generateHardClipCurve(SAMPLES, threshold);

      // For x = threshold, output should be 1.0
      // For x = -threshold, output should be -1.0
      const indexAtThreshold = Math.round(((threshold + 1) / 2) * (SAMPLES - 1));
      const indexAtNegThreshold = Math.round(((-threshold + 1) / 2) * (SAMPLES - 1));

      expect(curve[indexAtThreshold]).toBeCloseTo(1, 3);
      expect(curve[indexAtNegThreshold]).toBeCloseTo(-1, 3);
    });
  });

  describe("generateTanhCurve", () => {
    /**
     * Mathematical verification:
     * tanh provides soft saturation: f(x) = tanh(k * x)
     *
     * Properties:
     * - Bounded: -1 < tanh(x) < 1 for all x
     * - Odd function: tanh(-x) = -tanh(x)
     * - tanh(0) = 0
     * - tanh'(0) = 1 (unit slope at origin when k=1)
     * - Asymptotes to ±1 as x → ±∞
     */

    it("should produce odd function", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);

      for (let i = 0; i < SAMPLES / 2; i++) {
        const symmetricIndex = SAMPLES - 1 - i;
        expect(curve[i]).toBeCloseTo(-curve[symmetricIndex], 5);
      }
    });

    it("should output 0 at midpoint", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);
      // For 1024 samples, x=0 maps to index 511.5, so we interpolate
      const zeroIndex = ((0 + 1) / 2) * (SAMPLES - 1);
      const indexLow = Math.floor(zeroIndex);
      const fraction = zeroIndex - indexLow;
      const interpolated = curve[indexLow] * (1 - fraction) + curve[indexLow + 1] * fraction;

      expect(interpolated).toBeCloseTo(0, 3);
    });

    it("should be bounded by ±1", () => {
      const curve = generateTanhCurve(SAMPLES, 1.0);

      for (let i = 0; i < SAMPLES; i++) {
        expect(Math.abs(curve[i])).toBeLessThanOrEqual(1);
      }
    });

    it("should approach ±1 asymptotically at edges", () => {
      const curve = generateTanhCurve(SAMPLES, 1.0);

      // With amount=1, k=11, tanh(11) ≈ 0.99999998
      expect(curve[0]).toBeCloseTo(-1, 2);
      expect(curve[SAMPLES - 1]).toBeCloseTo(1, 2);
    });

    it("should match tanh formula", () => {
      const amount = 0.5;
      const curve = generateTanhCurve(SAMPLES, amount);
      const k = 1 + amount * 10;

      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        const expected = Math.tanh(k * x);
        expect(curve[i]).toBeCloseTo(expected, 5);
      }
    });

    it("should increase distortion with higher amount", () => {
      const curveLow = generateTanhCurve(SAMPLES, 0.1);
      const curveHigh = generateTanhCurve(SAMPLES, 0.9);

      // At x=0.5, higher amount should produce more saturation (closer to 1)
      const indexAt05 = Math.round(((0.5 + 1) / 2) * (SAMPLES - 1));
      expect(curveHigh[indexAt05]).toBeGreaterThan(curveLow[indexAt05]);
    });
  });

  describe("generateAtanCurve", () => {
    /**
     * Mathematical verification:
     * atan provides gentler saturation: f(x) = (2/π) * atan(k * x)
     *
     * Properties:
     * - Bounded: -1 < (2/π)*atan(x) < 1
     * - Odd function
     * - Gentler knee than tanh (less harmonic distortion)
     */

    it("should produce odd function", () => {
      const curve = generateAtanCurve(SAMPLES, 0.5);

      for (let i = 0; i < SAMPLES / 2; i++) {
        const symmetricIndex = SAMPLES - 1 - i;
        expect(curve[i]).toBeCloseTo(-curve[symmetricIndex], 5);
      }
    });

    it("should be bounded by ±1", () => {
      const curve = generateAtanCurve(SAMPLES, 1.0);

      for (let i = 0; i < SAMPLES; i++) {
        expect(Math.abs(curve[i])).toBeLessThanOrEqual(1);
      }
    });

    it("should match atan formula", () => {
      const amount = 0.5;
      const curve = generateAtanCurve(SAMPLES, amount);
      const k = 1 + amount * 10;
      const norm = 2 / Math.PI;

      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        const expected = norm * Math.atan(k * x);
        expect(curve[i]).toBeCloseTo(expected, 5);
      }
    });

    it("should have gentler saturation than tanh", () => {
      const atanCurve = generateAtanCurve(SAMPLES, 0.5);
      const tanhCurve = generateTanhCurve(SAMPLES, 0.5);

      // At x=0.5, atan should be closer to linear (lower value) than tanh
      const indexAt05 = Math.round(((0.5 + 1) / 2) * (SAMPLES - 1));
      expect(Math.abs(atanCurve[indexAt05])).toBeLessThan(
        Math.abs(tanhCurve[indexAt05])
      );
    });
  });

  describe("generateSineCurve", () => {
    /**
     * Mathematical verification:
     * Sine waveshaping: f(x) = sin(k * x) where k = (π/2)(1 + 2*amount)
     *
     * Properties:
     * - Creates wave folding at high amounts
     * - Odd function
     * - Generates odd harmonics
     */

    it("should produce odd function", () => {
      const curve = generateSineCurve(SAMPLES, 0.5);

      for (let i = 0; i < SAMPLES / 2; i++) {
        const symmetricIndex = SAMPLES - 1 - i;
        expect(curve[i]).toBeCloseTo(-curve[symmetricIndex], 5);
      }
    });

    it("should output 0 at midpoint", () => {
      const curve = generateSineCurve(SAMPLES, 0.5);
      // For 1024 samples, x=0 maps to index 511.5, so we interpolate
      const zeroIndex = ((0 + 1) / 2) * (SAMPLES - 1);
      const indexLow = Math.floor(zeroIndex);
      const fraction = zeroIndex - indexLow;
      const interpolated = curve[indexLow] * (1 - fraction) + curve[indexLow + 1] * fraction;

      expect(interpolated).toBeCloseTo(0, 3);
    });

    it("should match sine formula", () => {
      const amount = 0.5;
      const curve = generateSineCurve(SAMPLES, amount);
      const k = (Math.PI / 2) * (1 + amount * 2);

      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        const expected = Math.sin(k * x);
        expect(curve[i]).toBeCloseTo(expected, 5);
      }
    });

    it("should create wave folding at amount=1", () => {
      const curve = generateSineCurve(SAMPLES, 1.0);

      // At amount=1, k = (π/2)(1 + 2*1) = 3π/2
      // At x=1: sin(3π/2 * 1) = sin(3π/2) = -1
      const indexAt1 = SAMPLES - 1;
      // The curve value at x=1 should be sin(3π/2) = -1
      expect(curve[indexAt1]).toBeCloseTo(-1, 1);
    });
  });

  describe("generateCubicCurve", () => {
    /**
     * Mathematical verification:
     * Cubic waveshaping: f(x) = x - (amount/3) * x³
     *
     * Properties:
     * - Odd function (generates odd harmonics only)
     * - Classic "tube" distortion character
     * - Creates 3rd harmonic distortion
     * - For amount < 1: monotonically increasing
     */

    it("should produce odd function", () => {
      const curve = generateCubicCurve(SAMPLES, 0.5);

      for (let i = 0; i < SAMPLES / 2; i++) {
        const symmetricIndex = SAMPLES - 1 - i;
        expect(curve[i]).toBeCloseTo(-curve[symmetricIndex], 5);
      }
    });

    it("should output 0 at midpoint", () => {
      const curve = generateCubicCurve(SAMPLES, 0.5);
      // For 1024 samples, x=0 maps to index 511.5, so we interpolate
      const zeroIndex = ((0 + 1) / 2) * (SAMPLES - 1);
      const indexLow = Math.floor(zeroIndex);
      const fraction = zeroIndex - indexLow;
      const interpolated = curve[indexLow] * (1 - fraction) + curve[indexLow + 1] * fraction;

      expect(interpolated).toBeCloseTo(0, 3);
    });

    it("should match cubic formula", () => {
      const amount = 0.5;
      const curve = generateCubicCurve(SAMPLES, amount);

      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        const expected = Math.max(-1, Math.min(1, x - (amount / 3) * x * x * x));
        expect(curve[i]).toBeCloseTo(expected, 5);
      }
    });

    it("should reduce peak output at amount=1", () => {
      const curve = generateCubicCurve(SAMPLES, 1.0);

      // At amount=1: f(1) = 1 - 1/3 = 0.667
      expect(curve[SAMPLES - 1]).toBeCloseTo(2 / 3, 2);
      expect(curve[0]).toBeCloseTo(-2 / 3, 2);
    });

    it("should be linear at amount=0", () => {
      const curve = generateCubicCurve(SAMPLES, 0.0);

      for (let i = 0; i < SAMPLES; i++) {
        const x = (2 * i) / (SAMPLES - 1) - 1;
        expect(curve[i]).toBeCloseTo(x, 5);
      }
    });
  });

  describe("generateWaveshaperCurve", () => {
    it("should dispatch to correct curve generator", () => {
      const hardClip = generateWaveshaperCurve("hard-clip", 0.5, SAMPLES);
      const tanh = generateWaveshaperCurve("tanh", 0.5, SAMPLES);
      const softClip = generateWaveshaperCurve("soft-clip", 0.5, SAMPLES);

      // soft-clip should be same as tanh
      for (let i = 0; i < SAMPLES; i++) {
        expect(softClip[i]).toBeCloseTo(tanh[i], 5);
      }

      // hard-clip should be different from tanh
      let different = false;
      for (let i = 0; i < SAMPLES; i++) {
        if (Math.abs(hardClip[i] - tanh[i]) > 0.01) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });

    it("should default to tanh for unknown types", () => {
      const unknown = generateWaveshaperCurve("unknown-type", 0.5, SAMPLES);
      const tanh = generateWaveshaperCurve("tanh", 0.5, SAMPLES);

      for (let i = 0; i < SAMPLES; i++) {
        expect(unknown[i]).toBeCloseTo(tanh[i], 5);
      }
    });
  });

  describe("applyWaveshaperCurve", () => {
    it("should interpolate between curve samples", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);

      // Test at exact sample points
      const output0 = applyWaveshaperCurve(curve, -1);
      expect(output0).toBeCloseTo(curve[0], 5);

      const output1 = applyWaveshaperCurve(curve, 1);
      expect(output1).toBeCloseTo(curve[SAMPLES - 1], 5);

      // At x=0, the interpolated value should be close to 0 (since tanh(0) = 0)
      const outputMid = applyWaveshaperCurve(curve, 0);
      expect(outputMid).toBeCloseTo(0, 3);
    });

    it("should clamp out-of-range inputs", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);

      const outputHigh = applyWaveshaperCurve(curve, 2.0);
      expect(outputHigh).toBeCloseTo(curve[SAMPLES - 1], 5);

      const outputLow = applyWaveshaperCurve(curve, -2.0);
      expect(outputLow).toBeCloseTo(curve[0], 5);
    });
  });

  describe("processWithWaveshaper", () => {
    it("should process array of samples", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);
      const input = new Float32Array([0, 0.5, 1, -0.5, -1]);
      const output = processWithWaveshaper(curve, input);

      expect(output.length).toBe(input.length);

      for (let i = 0; i < input.length; i++) {
        const expected = applyWaveshaperCurve(curve, input[i]);
        expect(output[i]).toBeCloseTo(expected, 5);
      }
    });

    it("should preserve zero crossing", () => {
      const curve = generateTanhCurve(SAMPLES, 0.5);
      const input = new Float32Array([0]);
      const output = processWithWaveshaper(curve, input);

      expect(output[0]).toBeCloseTo(0, 5);
    });
  });
});
