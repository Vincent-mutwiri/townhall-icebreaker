"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NextQuestionModalProps = {
  currentRound: number;
  totalQuestions: number;
  survivors: string[];
  eliminated: string[];
  onComplete: () => void;
};

export function NextQuestionModal({ currentRound, totalQuestions, survivors, eliminated, onComplete }: NextQuestionModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Round {currentRound - 1} Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-green-600 font-semibold">
              Survivors: {survivors.length > 0 ? survivors.join(", ") : "None"}
            </p>
            <p className="text-red-600 font-semibold">
              Eliminated: {eliminated.length > 0 ? eliminated.join(", ") : "None"}
            </p>
          </div>
          
          <div className="py-4">
            <div className="text-3xl font-bold text-primary">{countdown}</div>
            <p className="text-sm text-muted-foreground">
              Next question starts in...
            </p>
          </div>
          
          <p className="text-lg font-semibold">
            Question {currentRound} of {totalQuestions}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}