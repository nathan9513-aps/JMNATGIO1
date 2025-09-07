import { useState, useEffect, useRef } from "react";

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  onTick?: (time: number) => void;
}

export function useTimer({ autoStart = false, initialTime = 0, onTick }: UseTimerOptions = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          onTick?.(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  const start = () => setIsRunning(true);
  const stop = () => setIsRunning(false);
  const reset = () => {
    setTime(initialTime);
    setIsRunning(false);
  };
  const pause = () => setIsRunning(false);
  const resume = () => setIsRunning(true);

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    pause,
    resume,
    setTime,
  };
}
