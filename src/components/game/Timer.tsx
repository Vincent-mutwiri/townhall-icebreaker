// src/components/game/Timer.tsx
"use client";

import { useEffect, useState } from 'react';

export function Timer({ duration, onTimeUp }: { duration: number; onTimeUp: () => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Reset timer when duration changes (new question)
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);



  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="text-2xl font-bold">
      {timeLeft}
    </div>
  );
}
