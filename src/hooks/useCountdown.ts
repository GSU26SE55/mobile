import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      stop();
      setRemaining(seconds ?? initialSeconds);
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds, stop],
  );

  const reset = useCallback(() => {
    stop();
    setRemaining(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { remaining, isActive: remaining > 0, start, reset };
}
