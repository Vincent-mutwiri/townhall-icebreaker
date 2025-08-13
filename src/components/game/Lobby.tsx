// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionView } from "./QuestionView";
import { ResultsScreen } from "./ResultsScreen";
import { VotingRound } from "./VotingRound";
import { toast, Toaster } from "sonner";

type Player = { _id: string; name: string; isEliminated: boolean; };
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
  const [roundResults, setRoundResults] = useState<{ survivors: string[], eliminated: string[] } | null>(null);
  const [view, setView] = useState<'lobby' | 'question' | 'results' | 'voting'>(initialGame.status === 'lobby' ? 'lobby' : 'question');
  const [eliminatedPlayersForVote, setEliminatedPlayersForVote] = useState<Player[]>([]);

  const playerId = typeof window !== 'undefined' ? localStorage.getItem(`player-id-${gameState.pin}`) : null;
  const currentPlayer = gameState.players.find(p => p._id === playerId);
  const isEliminated = !!currentPlayer?.isEliminated;
  const isEliminatedThisRound = roundResults ? 
    !roundResults.survivors.includes(currentPlayer?.name || '') : false;
  const isHost = socket?.id === gameState.host || gameState.host?.startsWith('temp-host-');

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', gameState.pin);

    const handleUpdateLobby = (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    };

    const handleGameStarted = (newGameState: GameState) => {
      console.log('Game has started!', newGameState);
      setGameState(newGameState);
      setView('question');
    };

    const handleRoundResults = (results: { survivors: string[], eliminated: string[] }) => {
      setRoundResults(results);
      setView('results');
    };

    const handleVotingStarted = (data: { eliminatedPlayers: Player[] }) => {
      setEliminatedPlayersForVote(data.eliminatedPlayers);
      setView('voting');
    };

    const handlePlayerRedeemed = (data: { name: string | null }) => {
      if (data.name) {
        toast.success(`${data.name} has been redeemed!`);
      } else {
        toast.info("No one was redeemed this round.");
      }
    };

    const handleNextRound = (data: { game: GameState }) => {
      setGameState(data.game);
      setRoundResults(null); // Clear previous round results
      setView('question');
    };

    socket.on('update-lobby', handleUpdateLobby);
    socket.on('game-started', handleGameStarted);
    socket.on('round-results', handleRoundResults);
    socket.on('voting-started', handleVotingStarted);
    socket.on('player-redeemed', handlePlayerRedeemed);
    socket.on('next-round-started', handleNextRound);

    return () => {
      socket.off('update-lobby', handleUpdateLobby);
      socket.off('game-started', handleGameStarted);
      socket.off('round-results', handleRoundResults);
      socket.off('voting-started', handleVotingStarted);
      socket.off('player-redeemed', handlePlayerRedeemed);
      socket.off('next-round-started', handleNextRound);
    };
  }, [socket, gameState.pin, gameState.status]); // Added gameState.status to dependencies

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

      // Game state will be updated via socket listener (handleGameStarted)

    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = async () => {
    console.log("Time is up!");
    try {
      const response = await fetch('/api/game/process-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: gameState.pin }),
      });
      const results = await response.json();
      if (response.ok) {
        setRoundResults(results);
        setView('results');
        
        // Auto-progress to voting after 5 seconds
        setTimeout(() => {
          if (results.eliminated.length > 0) {
            const eliminatedPlayers = gameState.players.filter(p => 
              results.eliminated.includes(p.name)
            );
            setEliminatedPlayersForVote(eliminatedPlayers);
            setView('voting');
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to process round:', error);
    }
  };

  const handleVote = async (votedForPlayerId: string) => {
    await fetch('/api/game/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: gameState.pin, votedForPlayerId }),
    });
  };

  const handleVoteTimeUp = async () => {
    try {
      const response = await fetch('/api/game/process-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: gameState.pin, eliminatedPlayers: eliminatedPlayersForVote }),
      });
      const data = await response.json();
      
      if (data.redeemedPlayer) {
        toast.success(`${data.redeemedPlayer} has been redeemed!`);
      } else {
        toast.info("No one was redeemed this round.");
      }
      
      if (data.nextRound) {
        setTimeout(() => {
          setGameState(data.game);
          setRoundResults(null);
          setView('question');
        }, 3000);
      } else if (data.gameEnded) {
        toast.success("Game Over!");
      }
    } catch (error) {
      console.error('Failed to process vote:', error);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'question':
        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        return <QuestionView question={currentQuestion} pin={gameState.pin} onTimeUp={handleTimeUp} isEliminated={isEliminated} />;
      case 'results':
        return <ResultsScreen survivors={roundResults?.survivors || []} eliminated={roundResults?.eliminated || []} />;
      case 'voting':
        return <VotingRound eliminatedPlayers={eliminatedPlayersForVote} onVote={handleVote} onTimeUp={handleVoteTimeUp} isEliminated={isEliminatedThisRound} />;
      case 'lobby':
      default:
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
  };

  return (
    <>
      <Toaster richColors />
      {renderView()}
    </>
  );
}
