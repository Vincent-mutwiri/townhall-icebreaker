// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestionView } from "./QuestionView";
import { ResultsScreen } from "./ResultsScreen";

import { WinnerScreen } from "./WinnerScreen";
import { HostView } from "./HostView";
import { toast, Toaster } from "sonner";

type Player = { _id: string; name: string; isEliminated: boolean; score?: number; };
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
  initialPrize?: number;
  incrementAmount?: number;
  lastRedemption?: string;
};

type LobbyProps = {
  initialGame: GameState;
};

type Winner = { _id: string; name: string; score: number; };

export function Lobby({ initialGame }: LobbyProps) {
  const [gameState, setGameState] = useState<GameState>(initialGame);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'lobby' | 'question' | 'results' | 'finished'>(
    initialGame.status === 'lobby' ? 'lobby' : 'question'
  );
  const [roundResults, setRoundResults] = useState<{ survivors: string[], eliminated: string[] } | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player-id-${gameState.pin}`);
    setPlayerId(storedPlayerId);
    
    const urlParams = new URLSearchParams(window.location.search);
    setIsHost(urlParams.get('host') === 'true');
  }, [gameState.pin]);

  // Poll for server events
  useEffect(() => {
    if (view === 'finished') return; // Stop polling when game is finished
    
    const pollEvents = async () => {
      try {
        const response = await fetch(`/api/game/events/${gameState.pin}`);
        if (response.ok) {
          const event = await response.json();
          handleServerEvent(event);
        }
      } catch (error) {
        console.error('Failed to poll events:', error);
      }
    };

    const interval = setInterval(pollEvents, 1000);
    return () => clearInterval(interval);
  }, [gameState.pin, view]);

  const handleServerEvent = (event: any) => {
    if (!event || event.type === 'NO_UPDATE') return;
    
    console.log('Received server event:', event);
    
    switch (event.type) {
      case 'SYNC_STATE':
        if (event.game) {
          setGameState(event.game);
        }
        if (event.view) {
          setView(event.view);
        }
        if (event.roundResults) {
          console.log('Setting round results:', event.roundResults);
          setRoundResults(event.roundResults);
        }
        if (event.winners) {
          setWinners(event.winners);
        }
        break;
        
      case 'PLAYER_ELIMINATED':
        const eventId = `${event.type}-${event.playerName}-${event.timestamp}`;
        if (!processedEvents.has(eventId)) {
          toast.error(`${event.playerName} has been eliminated!`);
          setProcessedEvents(prev => new Set([...prev, eventId]));
        }
        break;
    }
  };



  const currentPlayer = gameState.players.find(p => p._id === playerId);
  const isEliminated = !!currentPlayer?.isEliminated;

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

      setGameState(data.game);
      setView('question');
    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = async () => {
    // Trigger server processing when client timer expires
    try {
      await fetch('/api/game/process-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: gameState.pin }),
      });
    } catch (error) {
      console.error('Failed to trigger round processing:', error);
    }
  };

  const handleResultsTimeUp = () => {
    // Server handles progression automatically - no action needed
  };

  const renderView = () => {
    switch (view) {
      case 'question':
        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        if (isHost) {
          return <HostView 
            question={currentQuestion} 
            players={gameState.players} 
            onTimeUp={handleTimeUp}
            roundResults={roundResults}
            redeemedPlayers={[]}
            currentRound={gameState.currentQuestionIndex + 1}
            initialPrize={gameState.initialPrize}
            incrementAmount={gameState.incrementAmount}
          />;
        }
        return <QuestionView 
          question={currentQuestion} 
          pin={gameState.pin} 
          onTimeUp={handleTimeUp}
          isEliminated={isEliminated}
          currentRound={gameState.currentQuestionIndex + 1}
          initialPrize={gameState.initialPrize}
          incrementAmount={gameState.incrementAmount}
        />;
      case 'results':
        return <ResultsScreen 
          survivors={roundResults?.survivors || []} 
          eliminated={roundResults?.eliminated || []} 
          onTimeUp={handleResultsTimeUp}
        />;

      case 'finished':
        return <WinnerScreen winners={winners} />;
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
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Players in Lobby ({gameState.players.length})</h3>
                <p className="text-sm text-muted-foreground">Waiting for the host to start the game...</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {gameState.players.map((player) => (
                  <div key={player._id} className="p-3 bg-secondary rounded-lg text-center animate-in fade-in">
                    <span className="font-medium">{player.name}</span>
                  </div>
                ))}
              </div>

              {isHost && gameState.status === 'lobby' && (
                <div className="mt-8 text-center">
                  <Button size="lg" onClick={handleStartGame} disabled={isLoading || gameState.players.length < 1}>
                    {isLoading ? 'Starting...' : `Start Game (${gameState.players.length} Players)`}
                  </Button>
                  {gameState.players.length < 1 && <p className="text-xs text-muted-foreground mt-2">Need at least 1 player to start.</p>}
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