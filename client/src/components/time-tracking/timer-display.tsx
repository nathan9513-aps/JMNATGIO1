import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/time-utils";

interface TimerDisplayProps {
  startTime?: Date | string;
  durationSeconds?: number;
  className?: string;
}

export default function TimerDisplay({ 
  startTime, 
  durationSeconds, 
  className = "" 
}: TimerDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const getDisplayTime = () => {
    if (durationSeconds !== undefined) {
      return formatDuration(durationSeconds);
    }
    
    if (startTime) {
      const start = new Date(startTime);
      const elapsed = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
      return formatDuration(elapsed);
    }
    
    return "00:00:00";
  };

  return (
    <span 
      className={`timer-display ${className}`}
      data-testid="timer-display"
    >
      {getDisplayTime()}
    </span>
  );
}
