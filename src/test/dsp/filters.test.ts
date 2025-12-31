import { describe, it, expect } from "vitest";
import {
  calculateLowpassCoefficients,
  calculateHighpassCoefficients,
  calculateBandpassCoefficients,
  calculateNotchCoefficients,
  calculateAllpassCoefficients,
  calculatePeakingCoefficients,
  calculateLowShelfCoefficients,
  calculateHighShelfCoefficients,
  getFilterCoefficients,
  BiquadFilter,
  generateSineWave,
  generateWhiteNoise,
  calculateRMS,
  calculatePeak,
} from "@/engine/dsp/filters";

describe("Filter DSP", () => {
  const SAMPLE_RATE = 48000;

  describe("Filter Coefficient Calculation", () => {
    /**
     * All biquad filters are based on the Audio EQ Cookbook by Robert Bristow-Johnson.
     * The coefficients define a transfer function:
     * H(z) = (b0 + b1*z^-1 + b2*z^-2) / (a0 + a1*z^-1 + a2*z^-2)
     *
     * Key properties for stability:
     * - a0 should be non-zero (we normalize by a0)
     * - The poles should be inside the unit circle
     */

    describe("Lowpass Filter Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
        expect(isFinite(coeff.b0)).toBe(true);
        expect(isFinite(coeff.b1)).toBe(true);
        expect(isFinite(coeff.b2)).toBe(true);
        expect(isFinite(coeff.a1)).toBe(true);
        expect(isFinite(coeff.a2)).toBe(true);
      });

      it("should have symmetric numerator (b0 = b2)", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);

        expect(coeff.b0).toBeCloseTo(coeff.b2, 10);
      });

      it("should have DC gain of 1 (unity at 0 Hz)", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);

        // At DC (z = 1): H(1) = (b0 + b1 + b2) / (a0 + a1 + a2)
        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(1, 5);
      });
    });

    describe("Highpass Filter Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateHighpassCoefficients(1000, 0.707, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
        expect(isFinite(coeff.b0)).toBe(true);
        expect(isFinite(coeff.b1)).toBe(true);
        expect(isFinite(coeff.b2)).toBe(true);
      });

      it("should have symmetric numerator (b0 = b2)", () => {
        const coeff = calculateHighpassCoefficients(1000, 0.707, SAMPLE_RATE);

        expect(coeff.b0).toBeCloseTo(coeff.b2, 10);
      });

      it("should have zero DC gain", () => {
        const coeff = calculateHighpassCoefficients(1000, 0.707, SAMPLE_RATE);

        // At DC (z = 1): H(1) should be 0 for highpass
        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(0, 5);
      });

      it("should have unity gain at Nyquist", () => {
        const coeff = calculateHighpassCoefficients(1000, 0.707, SAMPLE_RATE);

        // At Nyquist (z = -1): H(-1) = (b0 - b1 + b2) / (a0 - a1 + a2)
        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        expect(nyquistGain).toBeCloseTo(1, 5);
      });
    });

    describe("Bandpass Filter Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateBandpassCoefficients(1000, 1, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
        expect(isFinite(coeff.b0)).toBe(true);
      });

      it("should have zero DC gain", () => {
        const coeff = calculateBandpassCoefficients(1000, 1, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(0, 5);
      });

      it("should have zero Nyquist gain", () => {
        const coeff = calculateBandpassCoefficients(1000, 1, SAMPLE_RATE);

        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        expect(nyquistGain).toBeCloseTo(0, 5);
      });

      it("should have b1 = 0 (antisymmetric numerator)", () => {
        const coeff = calculateBandpassCoefficients(1000, 1, SAMPLE_RATE);

        expect(coeff.b1).toBeCloseTo(0, 10);
      });
    });

    describe("Notch Filter Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateNotchCoefficients(1000, 1, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
      });

      it("should have unity DC gain", () => {
        const coeff = calculateNotchCoefficients(1000, 1, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(1, 5);
      });

      it("should have unity Nyquist gain", () => {
        const coeff = calculateNotchCoefficients(1000, 1, SAMPLE_RATE);

        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        expect(nyquistGain).toBeCloseTo(1, 5);
      });
    });

    describe("Allpass Filter Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateAllpassCoefficients(1000, 0.707, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
      });

      it("should have unity gain at DC and Nyquist", () => {
        const coeff = calculateAllpassCoefficients(1000, 0.707, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);

        expect(Math.abs(dcGain)).toBeCloseTo(1, 5);
        expect(Math.abs(nyquistGain)).toBeCloseTo(1, 5);
      });
    });

    describe("Peaking EQ Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculatePeakingCoefficients(1000, 1, 6, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
      });

      it("should have unity DC gain", () => {
        const coeff = calculatePeakingCoefficients(1000, 1, 6, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(1, 5);
      });

      it("should have unity Nyquist gain", () => {
        const coeff = calculatePeakingCoefficients(1000, 1, 6, SAMPLE_RATE);

        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        expect(nyquistGain).toBeCloseTo(1, 5);
      });

      it("should produce identical coefficients at 0 dB gain", () => {
        const coeff = calculatePeakingCoefficients(1000, 1, 0, SAMPLE_RATE);

        // At 0 dB, the filter should be unity gain everywhere
        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);

        expect(dcGain).toBeCloseTo(1, 5);
        expect(nyquistGain).toBeCloseTo(1, 5);
      });
    });

    describe("Low Shelf Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateLowShelfCoefficients(200, 6, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
      });

      it("should have boosted DC gain for positive dB", () => {
        const coeff = calculateLowShelfCoefficients(200, 6, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        // 6 dB boost = 10^(6/20) ≈ 2
        expect(dcGain).toBeCloseTo(Math.pow(10, 6 / 20), 2);
      });

      it("should have unity Nyquist gain", () => {
        const coeff = calculateLowShelfCoefficients(200, 6, SAMPLE_RATE);

        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        expect(nyquistGain).toBeCloseTo(1, 5);
      });
    });

    describe("High Shelf Coefficients", () => {
      it("should produce valid coefficients", () => {
        const coeff = calculateHighShelfCoefficients(3000, 6, SAMPLE_RATE);

        expect(coeff.a0).toBeGreaterThan(0);
      });

      it("should have unity DC gain", () => {
        const coeff = calculateHighShelfCoefficients(3000, 6, SAMPLE_RATE);

        const dcGain =
          (coeff.b0 + coeff.b1 + coeff.b2) / (coeff.a0 + coeff.a1 + coeff.a2);
        expect(dcGain).toBeCloseTo(1, 5);
      });

      it("should have boosted Nyquist gain for positive dB", () => {
        const coeff = calculateHighShelfCoefficients(3000, 6, SAMPLE_RATE);

        const nyquistGain =
          (coeff.b0 - coeff.b1 + coeff.b2) / (coeff.a0 - coeff.a1 + coeff.a2);
        // 6 dB boost = 10^(6/20) ≈ 2
        expect(nyquistGain).toBeCloseTo(Math.pow(10, 6 / 20), 2);
      });
    });
  });

  describe("getFilterCoefficients", () => {
    it("should dispatch to correct coefficient function", () => {
      const lowpass = getFilterCoefficients("lowpass", 1000, 0.707, 0, SAMPLE_RATE);
      const direct = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);

      expect(lowpass.b0).toBeCloseTo(direct.b0, 10);
      expect(lowpass.b1).toBeCloseTo(direct.b1, 10);
    });
  });

  describe("BiquadFilter", () => {
    describe("Filter Processing", () => {
      it("should process samples through filter", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        const input = generateSineWave(100, SAMPLE_RATE, 0.1);
        const output = filter.processArray(input);

        expect(output.length).toBe(input.length);
        expect(calculateRMS(output)).toBeGreaterThan(0);
      });

      it("should attenuate frequencies above cutoff for lowpass", () => {
        const cutoff = 1000;
        const coeff = calculateLowpassCoefficients(cutoff, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        // Below cutoff: should pass
        const lowFreq = generateSineWave(200, SAMPLE_RATE, 0.1);
        const lowOutput = filter.processArray(lowFreq);

        // Reset filter
        filter.reset();

        // Above cutoff: should attenuate
        const highFreq = generateSineWave(5000, SAMPLE_RATE, 0.1);
        const highOutput = filter.processArray(highFreq);

        const lowRMS = calculateRMS(lowOutput.slice(500));
        const highRMS = calculateRMS(highOutput.slice(500));
        const lowInputRMS = calculateRMS(lowFreq.slice(500));
        const highInputRMS = calculateRMS(highFreq.slice(500));

        // Low frequency should pass with minimal attenuation
        expect(lowRMS / lowInputRMS).toBeGreaterThan(0.8);

        // High frequency should be significantly attenuated
        expect(highRMS / highInputRMS).toBeLessThan(0.3);
      });

      it("should pass frequencies above cutoff for highpass", () => {
        const cutoff = 1000;
        const coeff = calculateHighpassCoefficients(cutoff, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        // Below cutoff: should attenuate
        const lowFreq = generateSineWave(200, SAMPLE_RATE, 0.1);
        const lowOutput = filter.processArray(lowFreq);

        filter.reset();

        // Above cutoff: should pass
        const highFreq = generateSineWave(5000, SAMPLE_RATE, 0.1);
        const highOutput = filter.processArray(highFreq);

        const lowRMS = calculateRMS(lowOutput.slice(500));
        const highRMS = calculateRMS(highOutput.slice(500));
        const highInputRMS = calculateRMS(highFreq.slice(500));

        // Low frequency should be attenuated
        expect(lowRMS).toBeLessThan(0.1);

        // High frequency should pass
        expect(highRMS / highInputRMS).toBeGreaterThan(0.8);
      });

      it("should create notch at specified frequency", () => {
        const notchFreq = 1000;
        const coeff = calculateNotchCoefficients(notchFreq, 10, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        // At notch frequency: should attenuate
        const atNotch = generateSineWave(notchFreq, SAMPLE_RATE, 0.1);
        const notchOutput = filter.processArray(atNotch);

        filter.reset();

        // Away from notch: should pass
        const awayFromNotch = generateSineWave(200, SAMPLE_RATE, 0.1);
        const passOutput = filter.processArray(awayFromNotch);

        const notchRMS = calculateRMS(notchOutput.slice(1000));
        const passRMS = calculateRMS(passOutput.slice(1000));
        const inputRMS = calculateRMS(awayFromNotch.slice(1000));

        // At notch frequency should be heavily attenuated
        expect(notchRMS).toBeLessThan(0.1);

        // Away from notch should pass
        expect(passRMS / inputRMS).toBeGreaterThan(0.9);
      });
    });

    describe("Frequency Response Calculation", () => {
      it("should calculate correct magnitude at DC for lowpass", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        const dcMag = filter.getMagnitudeAt(1, SAMPLE_RATE); // Near DC
        expect(dcMag).toBeCloseTo(1, 1);
      });

      it("should calculate -3dB at cutoff for Butterworth lowpass", () => {
        const cutoff = 1000;
        // Q = 1/√2 ≈ 0.707 gives Butterworth response (maximally flat)
        const coeff = calculateLowpassCoefficients(cutoff, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        const cutoffMagDb = filter.getMagnitudeDbAt(cutoff, SAMPLE_RATE);
        expect(cutoffMagDb).toBeCloseTo(-3, 0.5);
      });

      it("should roll off significantly above cutoff", () => {
        const cutoff = 1000;
        const coeff = calculateLowpassCoefficients(cutoff, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        const mag1k = filter.getMagnitudeDbAt(1000, SAMPLE_RATE);
        const mag2k = filter.getMagnitudeDbAt(2000, SAMPLE_RATE);
        const mag4k = filter.getMagnitudeDbAt(4000, SAMPLE_RATE);

        // 2nd order filter: ~6dB/octave per pole = ~12dB/octave
        // But near cutoff the rolloff is gradual, so we just check for significant drop
        const drop1to2 = mag1k - mag2k;
        const drop2to4 = mag2k - mag4k;

        // Should drop between 6-12 dB per octave depending on frequency
        expect(drop1to2).toBeGreaterThan(5);
        expect(drop1to2).toBeLessThan(15);
        expect(drop2to4).toBeGreaterThan(8);
        expect(drop2to4).toBeLessThan(15);
      });

      it("should calculate correct peaking response", () => {
        const centerFreq = 1000;
        const gainDb = 6;
        const coeff = calculatePeakingCoefficients(
          centerFreq,
          1,
          gainDb,
          SAMPLE_RATE
        );
        const filter = new BiquadFilter(coeff);

        // At center frequency, should have specified gain
        const peakMagDb = filter.getMagnitudeDbAt(centerFreq, SAMPLE_RATE);
        expect(peakMagDb).toBeCloseTo(gainDb, 0.5);

        // Away from center, should approach unity
        const dcMagDb = filter.getMagnitudeDbAt(10, SAMPLE_RATE);
        expect(dcMagDb).toBeCloseTo(0, 0.5);
      });

      it("should calculate phase shift for allpass", () => {
        const coeff = calculateAllpassCoefficients(1000, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        // Allpass should have unity magnitude everywhere
        const mag100 = filter.getMagnitudeAt(100, SAMPLE_RATE);
        const mag1000 = filter.getMagnitudeAt(1000, SAMPLE_RATE);
        const mag5000 = filter.getMagnitudeAt(5000, SAMPLE_RATE);

        expect(mag100).toBeCloseTo(1, 2);
        expect(mag1000).toBeCloseTo(1, 2);
        expect(mag5000).toBeCloseTo(1, 2);

        // But phase should vary
        const phase100 = filter.getPhaseAt(100, SAMPLE_RATE);
        const phase1000 = filter.getPhaseAt(1000, SAMPLE_RATE);
        const phase5000 = filter.getPhaseAt(5000, SAMPLE_RATE);

        // Maximum phase shift at center frequency
        expect(Math.abs(phase1000)).toBeGreaterThan(Math.abs(phase100));
      });
    });

    describe("Filter Reset", () => {
      it("should reset to initial state", () => {
        const coeff = calculateLowpassCoefficients(1000, 0.707, SAMPLE_RATE);
        const filter = new BiquadFilter(coeff);

        // Process some samples
        const input = generateSineWave(440, SAMPLE_RATE, 0.01);
        filter.processArray(input);

        // Reset
        filter.reset();

        // The next sample should behave as if filter is fresh
        const firstSample = filter.process(0);
        expect(firstSample).toBe(0);
      });
    });
  });

  describe("Test Signal Generation", () => {
    describe("generateSineWave", () => {
      it("should generate correct frequency", () => {
        const frequency = 440;
        const wave = generateSineWave(frequency, SAMPLE_RATE, 0.1);

        // Count zero crossings
        let zeroCrossings = 0;
        for (let i = 1; i < wave.length; i++) {
          if ((wave[i - 1] < 0 && wave[i] >= 0) || (wave[i - 1] >= 0 && wave[i] < 0)) {
            zeroCrossings++;
          }
        }

        // Each cycle has 2 zero crossings
        const expectedCycles = frequency * 0.1;
        const expectedCrossings = expectedCycles * 2;

        // Allow ±1 tolerance due to discrete sampling and endpoint effects
        expect(Math.abs(zeroCrossings - expectedCrossings)).toBeLessThanOrEqual(1);
      });

      it("should generate correct amplitude", () => {
        const amplitude = 0.5;
        const wave = generateSineWave(440, SAMPLE_RATE, 0.1, amplitude);

        const peak = calculatePeak(wave);
        expect(peak).toBeCloseTo(amplitude, 2);
      });

      it("should be bounded to [-amplitude, amplitude]", () => {
        const amplitude = 0.7;
        const wave = generateSineWave(440, SAMPLE_RATE, 0.1, amplitude);

        for (let i = 0; i < wave.length; i++) {
          expect(Math.abs(wave[i])).toBeLessThanOrEqual(amplitude + 0.001);
        }
      });
    });

    describe("generateWhiteNoise", () => {
      it("should generate values in [-1, 1]", () => {
        const noise = generateWhiteNoise(10000);

        for (let i = 0; i < noise.length; i++) {
          expect(noise[i]).toBeGreaterThanOrEqual(-1);
          expect(noise[i]).toBeLessThanOrEqual(1);
        }
      });

      it("should have approximately zero mean", () => {
        const noise = generateWhiteNoise(100000);

        let sum = 0;
        for (let i = 0; i < noise.length; i++) {
          sum += noise[i];
        }
        const mean = sum / noise.length;

        expect(mean).toBeCloseTo(0, 1);
      });

      it("should have consistent RMS across calls", () => {
        const noise1 = generateWhiteNoise(10000);
        const noise2 = generateWhiteNoise(10000);

        const rms1 = calculateRMS(noise1);
        const rms2 = calculateRMS(noise2);

        // Both should be around 1/√3 ≈ 0.577 for uniform distribution
        expect(rms1).toBeGreaterThan(0.4);
        expect(rms1).toBeLessThan(0.7);
        expect(rms2).toBeGreaterThan(0.4);
        expect(rms2).toBeLessThan(0.7);
      });
    });
  });

  describe("Signal Analysis", () => {
    describe("calculateRMS", () => {
      it("should return correct RMS for DC signal", () => {
        const dc = new Float32Array(100).fill(0.5);
        const rms = calculateRMS(dc);

        expect(rms).toBeCloseTo(0.5, 5);
      });

      it("should return correct RMS for sine wave", () => {
        const sine = generateSineWave(440, SAMPLE_RATE, 0.1, 1);
        const rms = calculateRMS(sine);

        // RMS of sine wave = amplitude / √2 ≈ 0.707
        expect(rms).toBeCloseTo(1 / Math.sqrt(2), 1);
      });

      it("should return 0 for silence", () => {
        const silence = new Float32Array(100).fill(0);
        const rms = calculateRMS(silence);

        expect(rms).toBe(0);
      });
    });

    describe("calculatePeak", () => {
      it("should return correct peak for sine wave", () => {
        const amplitude = 0.8;
        const sine = generateSineWave(440, SAMPLE_RATE, 0.1, amplitude);
        const peak = calculatePeak(sine);

        expect(peak).toBeCloseTo(amplitude, 2);
      });

      it("should return absolute peak for asymmetric signals", () => {
        const signal = new Float32Array([0.5, -0.8, 0.3, -0.2]);
        const peak = calculatePeak(signal);

        // Use toBeCloseTo due to Float32Array precision
        expect(peak).toBeCloseTo(0.8, 5);
      });

      it("should return 0 for silence", () => {
        const silence = new Float32Array(100).fill(0);
        const peak = calculatePeak(silence);

        expect(peak).toBe(0);
      });
    });
  });
});
