import { useCallback, useEffect, useRef } from "react";

interface UseTimerOptions {
  initialTime: number;
  onTick?: (time: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const useTimer = ({ initialTime, onTick, onComplete, autoStart = false }: UseTimerOptions) => {
  const timeRef = useRef<number>(initialTime);
  const intervalRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    intervalRef.current = window.setInterval(() => {
      timeRef.current -= 1;
      onTickRef.current?.(timeRef.current);

      if (timeRef.current <= 0) {
        stop();
        onCompleteRef.current?.();
      }
    }, 1000);
  }, [stop]);

  const reset = useCallback(
    (newTime?: number) => {
      stop();
      timeRef.current = newTime ?? initialTime;
      onTickRef.current?.(timeRef.current);
    },
    [initialTime, stop],
  );

  const addTime = useCallback((seconds: number) => {
    timeRef.current += seconds;
    onTickRef.current?.(timeRef.current);
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart]);

  return { start, stop, reset, addTime, getTime: () => timeRef.current };
};
