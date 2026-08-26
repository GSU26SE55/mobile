import { useEffect, useState } from 'react';

/**
 * Delays a value update — used for search inputs so a request isn't fired on every keystroke.
 * Placed in shared/ because multiple features use it (kb, blog, battery-types).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
