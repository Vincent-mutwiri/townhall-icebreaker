// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionView } from "./QuestionView";

type Player = { _id: string; name: string; };
type Question = { _id: string; text: string; options: string[]; correctAnswer: string; };
type GameState = {
  pin: string;
  prizePool: number;
  players: Player[];
  host: string;
  hostName: string;
  status: 'lobby' | 'in-progress' | 'finished';
  questions: Question[];
  currentQuestionIndex: number;
};

type LobbyProps = {
  initialGame: GameState;
};

export function Lobby({ initialGame }: LobbyProps) {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState>(initialGame);
  const [players, setPlayers] = useState<Player[]>(initialGame.players);
  const [isLoading, setIsLoading] = useState(false);

  const isHost = true; // Everyone is host for testing without socket

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', gameState.pin);

    const handleUpdateLobby = (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    };

    const handleGameStarted = (newGameState: GameState) => {
      console.log('Game has started!', newGameState);
      setGameState(newGameState);
    };

    socket.on('update-lobby', handleUpdateLobby);
    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('update-lobby', handleUpdateLobby);
      socket.off('game-started', handleGameStarted);
    };
  }, [socket, gameState.pin]);

  const handleStartGame = async () => {
    if (!isHost) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: gameState.pin, hostSocketId: gameState.host }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Update game state directly since no socket
      setGameState(data.game);

    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    console.log("Answered:", answer);
  };

  if (gameState.status === 'in-progress') {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    return <QuestionView question={currentQuestion} onAnswer={handleAnswer} />;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Game Lobby</h2>
          <Badge variant="secondary" className="text-xl py-1">
            {gameState.pin}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Current Prize Pool: <span className="font-bold text-primary">${gameState.prizePool}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Host: {gameState.hostName}
        </p>
        <p className="text-xs text-muted-foreground">
          Socket Status: {isConnected ? 'Connected' : 'Disconnected'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <h3 className="font-semibold text-lg">Players in Lobby ({players.length})</h3>
          <p className="text-sm text-muted-foreground">Waiting for the host to start the game...</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <div key={player._id} className="p-3 bg-secondary rounded-lg text-center animate-in fade-in">
              <span className="font-medium">{player.name}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <div className="mt-8 text-center">
            <Button size="lg" onClick={handleStartGame} disabled={isLoading || players.length < 1}>
              {isLoading ? 'Starting...' : `Start Game (${players.length} Players)`}
            </Button>
            {players.length < 1 && <p className="text-xs text-muted-foreground mt-2">Need at least 1 player to start.</p>}
          </div>
        )}
        {!isHost && (
           <div className="mt-8 text-center">
             <p className="text-lg text-muted-foreground">Waiting for the host to start the game...</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}