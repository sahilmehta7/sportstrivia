import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value
 * Returns the debounced value after the specified delay
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 400ms)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 * Returns a debounced version of the callback
 * 
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 400ms)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 400
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T | null>(null);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    // Cleanup function
    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);

  return ((...args: Parameters<T>) => {
    if (debouncedCallback) {
      return debouncedCallback(...args);
    }
  }) as T;
}

