import { useCallback, useEffect, useState } from "react";

const readFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
};

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void, () => void] => {
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readFromStorage(key, initialValue);
    if (stored !== initialValue) {
      setState(stored);
    }
    setIsHydrated(true);
  }, [key, initialValue]);

  useEffect(() => {
    if (!isHydrated) return;
    writeToStorage(key, state);
  }, [key, state, isHydrated]);

  const setValue = useCallback(
    (value: T | ((previous: T) => T)) => {
      setState((previous) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(previous) : value;
        writeToStorage(key, next);
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setValue, removeValue];
};
