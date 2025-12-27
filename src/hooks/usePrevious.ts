import { useRef, useEffect } from "react";

/**
 * Hook that returns the previous value of a state or prop.
 * Useful for comparing current and previous values in effects.
 *
 * @param value - The current value to track
 * @returns The previous value (undefined on first render)
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * useEffect(() => {
 *   if (prevCount !== undefined && prevCount !== count) {
 *     console.log(`Count changed from ${prevCount} to ${count}`);
 *   }
 * }, [count, prevCount]);
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook that returns the previous value with an initial value.
 * Unlike usePrevious, this never returns undefined.
 *
 * @param value - The current value to track
 * @param initialValue - The initial previous value
 * @returns The previous value (initialValue on first render)
 */
export function usePreviousWithInitial<T>(value: T, initialValue: T): T {
  const ref = useRef<T>(initialValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
