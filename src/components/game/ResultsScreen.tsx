"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultsScreenProps = {
  survivors: string[];
  eliminated: string[];
  onTimeUp: () => void;
};

export function ResultsScreen({ survivors, eliminated, onTimeUp }: ResultsScreenProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => onTimeUp(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Round Over!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-green-600">Survivors:</h3>
          <p className="text-xl font-bold">{survivors.length > 0 ? survivors.join(', ') : 'None'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-600">Eliminated:</h3>
          <p className="text-xl font-bold">{eliminated.length > 0 ? eliminated.join(', ') : 'None'}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {eliminated.length > 0 ? `Starting voting in ${timeLeft}s...` : `Continuing to next round in ${timeLeft}s...`}
        </p>
      </CardContent>
    </Card>
  );
}