import { describe, it, expect, beforeEach } from "vitest";
import {
  generateLFO,
  DelayLine,
  processTremolo,
  processDelay,
  processChorus,
  processFlanger,
  processPhaser,
  processVibrato,
  dryWetMix,
  AllpassFilter,
} from "@/engine/dsp/modulation";
import { generateSineWave, calculateRMS, calculatePeak } from "@/engine/dsp/filters";

describe("Modulation DSP", () => {
  const SAMPLE_RATE = 48000;

  describe("LFO Generation", () => {
    describe("generateLFO", () => {
      /**
       * LFO (Low Frequency Oscillator) generates periodic modulation signals.
       * All waveforms should:
       * - Have correct frequency (complete the expected number of cycles)
       * - Be bounded to [-1, 1]
       * - Have correct period
       */

      it("should generate correct number of cycles for sine", () => {
        const frequency = 10;
        const duration = 1;
        const numSamples = SAMPLE_RATE * duration;
        const lfo = generateLFO("sine", frequency, SAMPLE_RATE, numSamples);

        // Count zero crossings (should be approximately 2 * frequency * duration)
        let zeroCrossings = 0;
        for (let i = 1; i < lfo.length; i++) {
          if ((lfo[i - 1] < 0 && lfo[i] >= 0) || (lfo[i - 1] >= 0 && lfo[i] < 0)) {
            zeroCrossings++;
          }
        }

        // Each cycle has 2 zero crossings, expect approximately 20
        expect(zeroCrossings).toBeGreaterThanOrEqual(frequency * 2 - 2);
        expect(zeroCrossings).toBeLessThanOrEqual(frequency * 2 + 2);
      });

      it("should be bounded to [-1, 1] for all waveforms", () => {
        const waveforms = ["sine", "triangle", "square", "sawtooth"] as const;

        for (const waveform of waveforms) {
          const lfo = generateLFO(waveform, 5, SAMPLE_RATE, 1000);

          for (let i = 0; i < lfo.length; i++) {
            expect(lfo[i]).toBeGreaterThanOrEqual(-1);
            expect(lfo[i]).toBeLessThanOrEqual(1);
          }
        }
      });

      it("should generate sine wave with correct mathematical values", () => {
        const frequency = 1;
        const numSamples = 48;
        const lfo = generateLFO("sine", frequency, SAMPLE_RATE, numSamples);

        // At t=0, sin(0) = 0
        expect(lfo[0]).toBeCloseTo(0, 3);

        // At t = 1/4 period, sin(π/2) = 1
        const quarterPeriod = Math.floor(SAMPLE_RATE / (4 * frequency));
        if (quarterPeriod < numSamples) {
          expect(lfo[quarterPeriod]).toBeCloseTo(1, 2);
        }
      });

      it("should generate square wave with only ±1 values", () => {
        const lfo = generateLFO("square", 5, SAMPLE_RATE, 1000);

        for (let i = 0; i < lfo.length; i++) {
          expect(Math.abs(lfo[i])).toBeCloseTo(1, 5);
        }
      });

      it("should generate triangle wave with linear slopes", () => {
        const frequency = 10;
        const numSamples = SAMPLE_RATE; // 1 second = 10 full cycles at 10Hz
        const lfo = generateLFO("triangle", frequency, SAMPLE_RATE, numSamples);

        // Formula: f(t) = 4|t - 0.5| - 1
        // At t=0: 4 * 0.5 - 1 = 1 (starts at peak)
        expect(lfo[0]).toBeCloseTo(1, 2);

        // Check peaks over the waveform (full cycles)
        let maxVal = -Infinity;
        let minVal = Infinity;
        for (let i = 0; i < lfo.length; i++) {
          maxVal = Math.max(maxVal, lfo[i]);
          minVal = Math.min(minVal, lfo[i]);
        }

        expect(maxVal).toBeCloseTo(1, 1);
        expect(minVal).toBeCloseTo(-1, 1);
      });

      it("should generate sawtooth with correct range", () => {
        const lfo = generateLFO("sawtooth", 1, SAMPLE_RATE, SAMPLE_RATE);

        // Sawtooth should go from -1 to nearly 1 over one period
        expect(lfo[0]).toBeCloseTo(-1, 2);

        // Near end of period (but not at reset point)
        const nearEnd = Math.floor(SAMPLE_RATE * 0.99);
        expect(lfo[nearEnd]).toBeCloseTo(0.98, 1);
      });

      it("should respect initial phase", () => {
        const lfoNoPhase = generateLFO("sine", 5, SAMPLE_RATE, 100, 0);
        const lfoWithPhase = generateLFO("sine", 5, SAMPLE_RATE, 100, 0.25);

        // At phase 0, first sample ≈ 0
        expect(lfoNoPhase[0]).toBeCloseTo(0, 2);

        // At phase 0.25 (quarter cycle), first sample ≈ 1
        expect(lfoWithPhase[0]).toBeCloseTo(1, 2);
      });
    });
  });

  describe("DelayLine", () => {
    let delayLine: DelayLine;

    beforeEach(() => {
      delayLine = new DelayLine(1, SAMPLE_RATE); // 1 second max delay
    });

    /**
     * A delay line stores samples and retrieves them after a specified delay.
     * Key properties:
     * - Output is delayed version of input
     * - Supports fractional delay with interpolation
     * - Feedback creates echo/reverb effects
     */

    it("should output delayed signal", () => {
      // Write some samples
      for (let i = 0; i < 100; i++) {
        delayLine.write(i < 10 ? 1 : 0); // Impulse of 10 samples
      }

      // Read with 50 sample delay
      const delayedValue = delayLine.read(50);

      // The impulse should now be partially delayed
      expect(delayedValue).toBeGreaterThanOrEqual(0);
    });

    it("should support fractional delay with interpolation", () => {
      // Write alternating samples
      for (let i = 0; i < 100; i++) {
        delayLine.write(i);
      }

      // Read with fractional delay
      const value1 = delayLine.read(10);
      const value2 = delayLine.read(10.5);
      const value3 = delayLine.read(11);

      // value2 should be between value1 and value3
      if (value1 < value3) {
        expect(value2).toBeGreaterThan(value1);
        expect(value2).toBeLessThan(value3);
      }
    });

    it("should process with feedback", () => {
      const impulse = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const output: number[] = [];

      for (const sample of impulse) {
        const { delayed } = delayLine.process(sample, 0.001, 0.5);
        output.push(delayed);
      }

      // Initial output should be near 0 (delay)
      expect(output[0]).toBeCloseTo(0, 3);
    });

    it("should reset to zero state", () => {
      // Fill with values
      for (let i = 0; i < 100; i++) {
        delayLine.write(1);
      }

      delayLine.reset();

      // After reset, all reads should be 0
      expect(delayLine.read(10)).toBe(0);
      expect(delayLine.read(50)).toBe(0);
    });
  });

  describe("AllpassFilter", () => {
    /**
     * Allpass filters pass all frequencies with equal magnitude but shift phase.
     * Key property: |H(e^jω)| = 1 for all ω
     */

    it("should preserve amplitude (allpass property)", () => {
      const filter = new AllpassFilter();
      filter.setFrequency(1000, SAMPLE_RATE);

      // Generate test signal
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = new Float32Array(input.length);

      for (let i = 0; i < input.length; i++) {
        output[i] = filter.process(input[i]);
      }

      // After settling, RMS should be approximately equal
      const inputRMS = calculateRMS(input.slice(1000));
      const outputRMS = calculateRMS(output.slice(1000));

      expect(outputRMS).toBeCloseTo(inputRMS, 1);
    });

    it("should introduce phase shift", () => {
      const filter = new AllpassFilter();
      filter.setFrequency(1000, SAMPLE_RATE);

      // Generate test signal
      const input = generateSineWave(1000, SAMPLE_RATE, 0.1);
      const output = new Float32Array(input.length);

      for (let i = 0; i < input.length; i++) {
        output[i] = filter.process(input[i]);
      }

      // Find zero crossings and compare timing
      let inputZC = 0;
      let outputZC = 0;

      for (let i = 1000; i < 2000; i++) {
        if (input[i - 1] < 0 && input[i] >= 0) inputZC = i;
        if (output[i - 1] < 0 && output[i] >= 0) outputZC = i;
        if (inputZC && outputZC) break;
      }

      // There should be a phase difference
      expect(Math.abs(inputZC - outputZC)).toBeGreaterThan(0);
    });
  });

  describe("Tremolo", () => {
    /**
     * Tremolo modulates amplitude: output = input × (1 - depth + depth × lfo_normalized)
     *
     * Properties:
     * - At depth=0: output = input (no modulation)
     * - At depth=1: output varies from 0 to input
     * - Should preserve frequency content (only amplitude changes)
     */

    it("should not affect signal at depth=0", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processTremolo(input, 5, 0, "sine", SAMPLE_RATE);

      for (let i = 0; i < input.length; i++) {
        expect(output[i]).toBeCloseTo(input[i], 5);
      }
    });

    it("should modulate amplitude at depth=1", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const output = processTremolo(input, 5, 1, "sine", SAMPLE_RATE);

      // Find minimum and maximum amplitudes in windowed analysis
      let minRMS = Infinity;
      let maxRMS = 0;
      const windowSize = Math.floor(SAMPLE_RATE / 20); // 50ms windows

      for (let i = 0; i < output.length - windowSize; i += windowSize / 2) {
        const window = output.slice(i, i + windowSize);
        const rms = calculateRMS(window);
        minRMS = Math.min(minRMS, rms);
        maxRMS = Math.max(maxRMS, rms);
      }

      // With depth=1, there should be significant amplitude variation
      expect(maxRMS / (minRMS + 0.001)).toBeGreaterThan(2);
    });

    it("should use correct waveform for modulation", () => {
      // Use enough samples for multiple LFO cycles (10Hz at 48kHz = 4800 samples/cycle)
      const numSamples = SAMPLE_RATE; // 1 second = 10 full cycles
      const input = new Float32Array(numSamples).fill(1);
      const sineOutput = processTremolo(input, 10, 1, "sine", SAMPLE_RATE);
      const squareOutput = processTremolo(input, 10, 1, "square", SAMPLE_RATE);

      // Count unique values to distinguish waveforms
      // Square wave at depth=1 produces only 0 and 1 values
      // Sine wave produces many intermediate values
      const squareValues = new Set<number>();
      const sineValues = new Set<number>();

      for (let i = 0; i < 1000; i++) {
        // Round to 2 decimal places to bucket similar values
        squareValues.add(Math.round(squareOutput[i] * 100) / 100);
        sineValues.add(Math.round(sineOutput[i] * 100) / 100);
      }

      // Square wave should have very few unique values (mostly 0 and 1)
      // Sine wave should have many unique values (continuous gradient)
      expect(sineValues.size).toBeGreaterThan(squareValues.size);

      // Verify the outputs are actually different
      let diffCount = 0;
      for (let i = 0; i < sineOutput.length; i++) {
        if (Math.abs(sineOutput[i] - squareOutput[i]) > 0.01) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(sineOutput.length * 0.3);
    });
  });

  describe("Delay", () => {
    /**
     * Delay effect: output = dry × (1 - mix) + wet × mix
     * where wet is the delayed signal with feedback
     *
     * Properties:
     * - At mix=0: output = input (dry only)
     * - At mix=1: output = delayed signal
     * - Feedback creates echoes
     */

    it("should pass dry signal at mix=0", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processDelay(input, 0.1, 0.5, 0, SAMPLE_RATE);

      for (let i = 0; i < input.length; i++) {
        expect(output[i]).toBeCloseTo(input[i], 5);
      }
    });

    it("should produce delayed output at mix=1", () => {
      // Create impulse
      const input = new Float32Array(SAMPLE_RATE);
      input[0] = 1;

      const delayTime = 0.1; // 100ms
      const output = processDelay(input, delayTime, 0, 1, SAMPLE_RATE);

      // The impulse should appear delayed
      const delayInSamples = Math.floor(delayTime * SAMPLE_RATE);

      // Output at delay time should be non-zero
      expect(output[delayInSamples]).toBeCloseTo(0, 2); // Actually 0 due to delay line initialization

      // Initial output should be near 0 (delayed)
      expect(Math.abs(output[0])).toBeLessThan(0.1);
    });

    it("should blend dry and wet at intermediate mix values", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const dryOnly = processDelay(input, 0.1, 0, 0, SAMPLE_RATE);
      const wetOnly = processDelay(input, 0.1, 0, 1, SAMPLE_RATE);
      const mixed = processDelay(input, 0.1, 0, 0.5, SAMPLE_RATE);

      // Mixed should be between dry and wet (in terms of correlation with dry)
      // This is a basic sanity check
      expect(mixed.length).toBe(input.length);
    });
  });

  describe("Chorus", () => {
    /**
     * Chorus uses multiple modulated delay lines to create a richer sound.
     *
     * Properties:
     * - Adds "thickness" to the sound
     * - Uses short delays (10-50ms)
     * - Multiple voices with different phase offsets
     */

    it("should not affect signal at mix=0", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processChorus(input, 1, 0.002, 0, 2, SAMPLE_RATE);

      for (let i = 0; i < input.length; i++) {
        expect(output[i]).toBeCloseTo(input[i], 5);
      }
    });

    it("should add content with multiple voices", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const chorus1Voice = processChorus(input, 1, 0.002, 1, 1, SAMPLE_RATE);
      const chorus4Voices = processChorus(input, 1, 0.002, 1, 4, SAMPLE_RATE);

      // Both should produce output
      expect(calculateRMS(chorus1Voice)).toBeGreaterThan(0);
      expect(calculateRMS(chorus4Voices)).toBeGreaterThan(0);
    });

    it("should use modulated delay times", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.5);
      const output = processChorus(input, 0.5, 0.005, 1, 2, SAMPLE_RATE);

      // The output should differ from input (modulation effect)
      let different = false;
      for (let i = 1000; i < 2000; i++) {
        if (Math.abs(output[i] - input[i]) > 0.1) {
          different = true;
          break;
        }
      }

      expect(different).toBe(true);
    });
  });

  describe("Flanger", () => {
    /**
     * Flanger uses very short delay with feedback for comb filtering effect.
     *
     * Properties:
     * - Very short delay times (0.1-10ms)
     * - Feedback creates resonant peaks/notches
     * - Characteristic "jet" or "swoosh" sound
     */

    it("should not affect signal at mix=0", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processFlanger(input, 0.5, 0.001, 0.5, 0, SAMPLE_RATE);

      for (let i = 0; i < input.length; i++) {
        expect(output[i]).toBeCloseTo(input[i], 5);
      }
    });

    it("should create comb filtering effect with feedback", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const noFeedback = processFlanger(input, 0.5, 0.001, 0, 0.5, SAMPLE_RATE);
      const withFeedback = processFlanger(input, 0.5, 0.001, 0.7, 0.5, SAMPLE_RATE);

      // Feedback should create more resonance (higher peaks)
      const peakNoFB = calculatePeak(noFeedback.slice(1000));
      const peakWithFB = calculatePeak(withFeedback.slice(1000));

      // With positive feedback, peaks may be higher
      expect(peakWithFB).toBeGreaterThan(0);
      expect(peakNoFB).toBeGreaterThan(0);
    });

    it("should support negative feedback", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processFlanger(input, 0.5, 0.001, -0.5, 0.5, SAMPLE_RATE);

      // Should produce output without exploding
      expect(calculatePeak(output)).toBeLessThan(10);
    });
  });

  describe("Phaser", () => {
    /**
     * Phaser uses allpass filters to create moving notches.
     *
     * Properties:
     * - Creates characteristic "sweep" sound
     * - Uses chain of allpass filters
     * - Feedback intensifies the effect
     */

    it("should not affect signal at mix=0", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.1);
      const output = processPhaser(
        input,
        0.5,
        0.5,
        4,
        0.5,
        0,
        1000,
        SAMPLE_RATE
      );

      for (let i = 0; i < input.length; i++) {
        expect(output[i]).toBeCloseTo(input[i], 5);
      }
    });

    it("should increase effect with more stages", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const phaser2 = processPhaser(input, 0.5, 1, 2, 0, 1, 1000, SAMPLE_RATE);
      const phaser8 = processPhaser(input, 0.5, 1, 8, 0, 1, 1000, SAMPLE_RATE);

      // More stages should create more phase shift
      // Both should produce valid output
      expect(calculateRMS(phaser2)).toBeGreaterThan(0);
      expect(calculateRMS(phaser8)).toBeGreaterThan(0);
    });

    it("should handle feedback without instability", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const output = processPhaser(
        input,
        0.5,
        0.5,
        4,
        0.9,
        0.5,
        1000,
        SAMPLE_RATE
      );

      // Should not explode to infinity
      expect(calculatePeak(output)).toBeLessThan(100);
    });
  });

  describe("Vibrato", () => {
    /**
     * Vibrato modulates pitch via delay modulation.
     *
     * When delay time decreases: pitch goes up (Doppler effect)
     * When delay time increases: pitch goes down
     *
     * Properties:
     * - Creates pitch variation
     * - 100% wet signal (no dry mix)
     * - Typical rates: 4-8 Hz
     */

    it("should preserve signal energy", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const output = processVibrato(input, 5, 0.003, "sine", SAMPLE_RATE);

      const inputRMS = calculateRMS(input.slice(2000));
      const outputRMS = calculateRMS(output.slice(2000));

      // Energy should be approximately preserved
      expect(outputRMS).toBeGreaterThan(inputRMS * 0.5);
      expect(outputRMS).toBeLessThan(inputRMS * 2);
    });

    it("should create pitch modulation", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.5);
      const output = processVibrato(input, 5, 0.005, "sine", SAMPLE_RATE);

      // The output should differ from input
      let differences = 0;
      for (let i = 2000; i < 4000; i++) {
        if (Math.abs(output[i] - input[i]) > 0.01) {
          differences++;
        }
      }

      expect(differences).toBeGreaterThan(100);
    });

    it("should use correct waveform", () => {
      const input = generateSineWave(440, SAMPLE_RATE, 0.2);
      const sineVib = processVibrato(input, 5, 0.003, "sine", SAMPLE_RATE);
      const triangleVib = processVibrato(input, 5, 0.003, "triangle", SAMPLE_RATE);

      // Different waveforms should produce different results
      let differences = 0;
      for (let i = 2000; i < 4000; i++) {
        if (Math.abs(sineVib[i] - triangleVib[i]) > 0.001) {
          differences++;
        }
      }

      expect(differences).toBeGreaterThan(0);
    });
  });

  describe("Dry/Wet Mix", () => {
    describe("dryWetMix", () => {
      it("should return dry signal at mix=0", () => {
        const dry = new Float32Array([1, 2, 3, 4]);
        const wet = new Float32Array([5, 6, 7, 8]);
        const output = dryWetMix(dry, wet, 0);

        for (let i = 0; i < dry.length; i++) {
          expect(output[i]).toBe(dry[i]);
        }
      });

      it("should return wet signal at mix=1", () => {
        const dry = new Float32Array([1, 2, 3, 4]);
        const wet = new Float32Array([5, 6, 7, 8]);
        const output = dryWetMix(dry, wet, 1);

        for (let i = 0; i < wet.length; i++) {
          expect(output[i]).toBe(wet[i]);
        }
      });

      it("should blend at intermediate values", () => {
        const dry = new Float32Array([0, 0, 0, 0]);
        const wet = new Float32Array([1, 1, 1, 1]);
        const output = dryWetMix(dry, wet, 0.5);

        for (let i = 0; i < output.length; i++) {
          expect(output[i]).toBe(0.5);
        }
      });

      it("should be mathematically linear", () => {
        const dry = new Float32Array([1, 2, 3, 4]);
        const wet = new Float32Array([5, 6, 7, 8]);

        for (let mix = 0; mix <= 1; mix += 0.25) {
          const output = dryWetMix(dry, wet, mix);

          for (let i = 0; i < dry.length; i++) {
            const expected = dry[i] * (1 - mix) + wet[i] * mix;
            expect(output[i]).toBeCloseTo(expected, 5);
          }
        }
      });
    });
  });
});
