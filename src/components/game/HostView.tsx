"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "./Timer";

type Player = { _id: string; name: string; isEliminated: boolean; };
type Question = { _id: string; text: string; options: string[]; correctAnswer: string; };
type HostViewProps = {
  question: Question;
  players: Player[];
  onTimeUp: () => void;
  roundResults?: { survivors: string[], eliminated: string[] } | null;
  redeemedPlayers?: string[];
  currentRound?: number;
  initialPrize?: number;
  incrementAmount?: number;
};

export function HostView({ question, players, onTimeUp, roundResults, redeemedPlayers = [], currentRound = 1, initialPrize = 100, incrementAmount = 20 }: HostViewProps) {
  const activePlayers = players.filter(p => !p.isEliminated);
  const eliminatedPlayers = players.filter(p => p.isEliminated);

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Host Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">🎯 Host Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">Monitor the game progress</p>
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-green-600">
              ${initialPrize + (currentRound - 1) * incrementAmount}
            </div>
            <div className="text-sm text-muted-foreground">Round {currentRound} Prize</div>
          </div>
          <Timer duration={15} onTimeUp={onTimeUp} />
          <CardTitle className="text-lg">Current Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium mb-4">{question.text}</p>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((option, index) => (
              <div 
                key={index} 
                className={`p-2 rounded border ${option === question.correctAnswer ? 'bg-green-100 border-green-400' : 'bg-gray-50'}`}
              >
                {option} {option === question.correctAnswer && '✓'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Players */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Active Players ({activePlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activePlayers.map((player) => (
                <div key={player._id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>{player.name}</span>
                  <Badge variant="secondary">Playing</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Eliminated Players */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Eliminated Players ({eliminatedPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eliminatedPlayers.map((player) => (
                <div key={player._id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span>{player.name}</span>
                  <Badge variant="destructive">Eliminated</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Round Results */}
      {roundResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Round Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Survivors:</h4>
                <p>{roundResults.survivors.length > 0 ? roundResults.survivors.join(', ') : 'None'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Eliminated:</h4>
                <p>{roundResults.eliminated.length > 0 ? roundResults.eliminated.join(', ') : 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redeemed Players */}
      {redeemedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">Recently Redeemed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{redeemedPlayers.join(', ')} have been redeemed by vote!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}