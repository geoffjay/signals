/**
 * Effect range definitions for mapping normalized 0-1 values to effect-specific ranges.
 * Used when external connections drive effect parameters.
 */

export interface EffectRange {
  min: number;
  max: number;
  step: number;
  decimals: number; // For display formatting
}

export const effectRanges: Record<string, EffectRange> = {
  bloom: { min: 0, max: 10, step: 0.1, decimals: 1 },
  chromaticAberration: { min: 0, max: 0.1, step: 0.001, decimals: 3 },
  vignette: { min: 0, max: 1.5, step: 0.01, decimals: 2 },
  noise: { min: 0, max: 1, step: 0.01, decimals: 2 },
  glitch: { min: 0, max: 2, step: 0.01, decimals: 2 },
  scanlines: { min: 0, max: 2, step: 0.01, decimals: 2 },
  pixelation: { min: 2, max: 32, step: 1, decimals: 0 },
  dotScreen: { min: 0.5, max: 5, step: 0.1, decimals: 1 },
  sepia: { min: 0, max: 1, step: 0.01, decimals: 2 },
  hue: { min: -1, max: 1, step: 0.01, decimals: 2 },
  saturation: { min: -1, max: 1, step: 0.01, decimals: 2 },
};

/**
 * Maps a normalized value (0-1) to an effect's specific range.
 * External connections provide 0-1 RMS values that need to be scaled.
 */
export function mapToEffectRange(normalizedValue: number, effectName: string): number {
  const range = effectRanges[effectName];
  if (!range) {
    console.warn(`Unknown effect: ${effectName}, returning normalized value`);
    return normalizedValue;
  }

  // Clamp input to 0-1 range
  const clamped = Math.max(0, Math.min(1, normalizedValue));

  // Linear interpolation from normalized to effect range
  return range.min + clamped * (range.max - range.min);
}

/**
 * Maps an effect value back to normalized 0-1 range.
 * Useful for displaying external connection values on sliders.
 */
export function normalizeFromEffectRange(effectValue: number, effectName: string): number {
  const range = effectRanges[effectName];
  if (!range) {
    return effectValue;
  }

  // Inverse linear interpolation
  const rangeSize = range.max - range.min;
  if (rangeSize === 0) return 0;

  return (effectValue - range.min) / rangeSize;
}

/**
 * Formats an effect value for display based on its decimal precision.
 */
export function formatEffectValue(value: number, effectName: string): string {
  const range = effectRanges[effectName];
  if (!range) {
    return value.toFixed(2);
  }
  return value.toFixed(range.decimals);
}
