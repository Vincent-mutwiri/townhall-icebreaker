"use client";

import { useEffect, useState } from 'react';

export function Timer({ duration, onTimeUp }: { duration: number; onTimeUp: () => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Reset the timer when the duration changes (new question)
  useEffect(() => {
    setTimeLeft(duration);
    
    // Clean up function to ensure no stale timers
    return () => {
      // Any cleanup if needed when duration changes
    };
  }, [duration]);

  // Timer effect that handles the countdown
  useEffect(() => {
    // If time is up, call the callback and exit
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    // Set up the interval
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        // If we're about to hit zero, clear the interval first
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Clean up the interval on unmount or when dependencies change
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="text-2xl font-bold">
      {timeLeft}
    </div>
  );
}
