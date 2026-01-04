import { useExternalConnectionStore } from "@/store/externalConnectionStore";
import { mapToEffectRange } from "@/visualizer/effectRanges";

interface EffectValueResult {
  value: number;
  isExternal: boolean;
}

/**
 * Hook that resolves the current value for an effect.
 * Returns the manual value when no external source is set,
 * or the mapped external value when connected.
 *
 * @param effectName - The effect name (used for range mapping)
 * @param manualValue - The manual slider value
 * @param externalSource - The external connection name, or null for manual
 */
export function useEffectValue(
  effectName: string,
  manualValue: number,
  externalSource: string | null
): EffectValueResult {
  // Subscribe to the external connection store
  const connection = useExternalConnectionStore((state) =>
    externalSource ? state.getConnectionByName(externalSource) : undefined
  );

  // If no external source or connection not found, use manual value
  if (!externalSource || !connection) {
    return {
      value: manualValue,
      isExternal: false,
    };
  }

  // Map the 0-1 RMS value to the effect's range
  const mappedValue = mapToEffectRange(connection.value, effectName);

  return {
    value: mappedValue,
    isExternal: true,
  };
}

/**
 * Hook that resolves multiple effect values at once.
 * More efficient than calling useEffectValue multiple times
 * since it only subscribes to the store once.
 *
 * @param effects - Array of effect configurations
 */
export function useEffectValues(
  effects: Array<{
    effectName: string;
    manualValue: number;
    externalSource: string | null;
  }>
): EffectValueResult[] {
  // Subscribe to all connections at once
  const getConnectionByName = useExternalConnectionStore(
    (state) => state.getConnectionByName
  );

  return effects.map(({ effectName, manualValue, externalSource }) => {
    if (!externalSource) {
      return { value: manualValue, isExternal: false };
    }

    const connection = getConnectionByName(externalSource);
    if (!connection) {
      return { value: manualValue, isExternal: false };
    }

    return {
      value: mapToEffectRange(connection.value, effectName),
      isExternal: true,
    };
  });
}
