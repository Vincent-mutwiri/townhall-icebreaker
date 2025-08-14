"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer } from "./Timer";
import { useSocket } from "@/context/SocketProvider";
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

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setIsSubmitting(false);
  }, [question._id]);


  // Check if user is host (only on client side)
  const [isHost, setIsHost] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHost(new URLSearchParams(window.location.search).get('host') === 'true');
      setPlayerId(localStorage.getItem(`player-id-${pin}`));
    }
  }, [pin]);

  const { socket } = useSocket();

  const handleAnswer = (answer: string) => {
    if (hasAnswered || isSubmitting || isEliminated || isHost) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const playerId = typeof window !== 'undefined' ? localStorage.getItem(`player-id-${pin}`) : null;
    if (!playerId) {
      console.error("Player ID not found!");
      return;
    }

    console.log('Submitting answer via WebSocket:', { pin, playerId, answer });
    
    if (socket) {
      socket.emit('submit-answer', { pin, playerId, answer });
    }
  };



  return (
    <Card className="w-full max-w-6xl animate-in fade-in">
      <CardHeader>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-green-600">
            ${(initialPrize || 100) + ((currentRound || 1) - 1) * (incrementAmount || 20)}
          </div>
          <div className="text-sm text-muted-foreground">
            Round {currentRound} • Current Prize Pool
          </div>
        </div>
        <Timer duration={15} onTimeUp={onTimeUp} />
        <CardTitle className="text-center text-2xl md:text-3xl">
          {question.text}
        </CardTitle>
        {isHost && (
          <CardDescription className="text-center text-blue-600 font-bold bg-blue-50 p-2 rounded">
            👑 Host View - Spectating Only
          </CardDescription>
        )}
        {isEliminated && !isHost && (
          <CardDescription className="text-center text-red-600 font-bold bg-red-50 p-2 rounded">
            🚫 You are eliminated - spectating only
          </CardDescription>
        )}
        {hasAnswered && !isEliminated && !isHost && (
          <CardDescription className="text-center text-primary font-bold">
            Your answer is locked in!
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <Button
              key={`${question._id}-${index}-${option}`}
              variant="outline"
              className={cn(
                "h-auto py-4 text-lg",
                selectedAnswer === option && "ring-4 ring-primary ring-offset-2",
                hasAnswered && selectedAnswer !== option && "opacity-50"
              )}
              onClick={() => handleAnswer(option)}
              disabled={hasAnswered || isSubmitting || isEliminated || isHost}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}