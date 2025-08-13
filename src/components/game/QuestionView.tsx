"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer } from "./Timer";
import { cn } from "@/lib/utils";

type Question = { _id: string; text: string; options: string[]; };
type QuestionViewProps = {
  question: Question;
  pin: string;
  onTimeUp: () => void;
  isEliminated?: boolean;
  currentRound?: number;
  initialPrize?: number;
  incrementAmount?: number;
};

export function QuestionView({ question, pin, onTimeUp, isEliminated = false, currentRound = 1, initialPrize = 100, incrementAmount = 20 }: QuestionViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = async (answer: string) => {
    if (hasAnswered || isSubmitting || isEliminated) return;

    setIsSubmitting(true);
    setSelectedAnswer(answer);

    const playerId = localStorage.getItem(`player-id-${pin}`);
    if (!playerId) {
      console.error("Player ID not found!");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Submitting answer:', { pin, playerId, answer });
      const response = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, playerId, answer }),
      });
      const result = await response.json();
      console.log('Answer response:', result);
      
      if (response.ok) {
        setHasAnswered(true);
      } else {
        console.error('Answer submission failed:', result);
        setSelectedAnswer(null);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl animate-in fade-in">
      <CardHeader>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-green-600">
            ${initialPrize + (currentRound - 1) * incrementAmount}
          </div>
          <div className="text-sm text-muted-foreground">Round {currentRound} Prize</div>
        </div>
        <Timer duration={15} onTimeUp={onTimeUp} />
        <CardTitle className="text-center text-2xl md:text-3xl">
          {question.text}
        </CardTitle>
        {isEliminated && (
          <CardDescription className="text-center text-red-600 font-bold">
            You are eliminated - watching only
          </CardDescription>
        )}
        {hasAnswered && !isEliminated && (
          <CardDescription className="text-center text-primary font-bold">
            Your answer is locked in!
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-auto py-4 text-lg",
                selectedAnswer === option && "ring-4 ring-primary ring-offset-2",
                hasAnswered && selectedAnswer !== option && "opacity-50"
              )}
              onClick={() => handleAnswer(option)}
              disabled={hasAnswered || isSubmitting || isEliminated}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}