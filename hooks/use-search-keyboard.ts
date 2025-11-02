import { useEffect, useRef, type RefObject } from "react";

interface UseSearchKeyboardOptions {
  enabled?: boolean;
  onFocus?: () => void;
}

/**
 * Hook to handle keyboard shortcuts for search
 * - `/` key: Focus search input (common convention)
 * - `Ctrl/Cmd + K`: Focus search input (modern standard)
 * 
 * @param inputRef - Ref to the search input element
 * @param options - Configuration options
 */
export function useSearchKeyboard(
  inputRef: RefObject<HTMLInputElement>,
  options: UseSearchKeyboardOptions = {}
): void {
  const { enabled = true, onFocus } = options;
  const handlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    handlerRef.current = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Handle `/` key (but not if Shift is pressed, since that might be `?`)
      // Only trigger if not already in the search input
      if (event.key === "/" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        if (!isInput && target !== inputRef.current) {
          event.preventDefault();
          inputRef.current?.focus();
          onFocus?.();
        }
      }

      // Handle Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        if (!isInput || target === inputRef.current) {
          event.preventDefault();
          inputRef.current?.focus();
          onFocus?.();
        }
      }
    };

    document.addEventListener("keydown", handlerRef.current);

    return () => {
      if (handlerRef.current) {
        document.removeEventListener("keydown", handlerRef.current);
      }
    };
  }, [enabled, inputRef, onFocus]);
}

