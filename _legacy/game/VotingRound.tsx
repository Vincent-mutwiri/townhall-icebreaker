"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Player = { _id: string; name: string; };
type VotingRoundProps = {
  eliminatedPlayers: Player[];
  onVote: (playerId: string) => void;
  onTimeUp: () => void;
  isEliminated: boolean;
};

export function VotingRound({ eliminatedPlayers, onVote, onTimeUp, isEliminated }: VotingRoundProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const handleVote = (playerId: string) => {
    setSelectedPlayer(playerId);
    onVote(playerId);
  };

  if (isEliminated) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Voting in Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg">Waiting for active players to vote...</p>
          <p className="text-sm text-muted-foreground">Time left: {timeLeft}s</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle>Vote to Redeem a Player</CardTitle>
        <p className="text-sm text-muted-foreground">Time left: {timeLeft}s</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {eliminatedPlayers.map((player) => (
            <Button
              key={player._id}
              variant={selectedPlayer === player._id ? "default" : "outline"}
              className="h-auto py-4 text-lg"
              onClick={() => handleVote(player._id)}
              disabled={!!selectedPlayer}
            >
              Vote for {player.name}
            </Button>
          ))}
        </div>
        {selectedPlayer && (
          <p className="text-center mt-4 text-primary font-bold">
            Vote submitted!
          </p>
        )}
      </CardContent>
    </Card>
  );
}