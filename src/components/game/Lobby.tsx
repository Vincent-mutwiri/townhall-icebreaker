// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
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
  const { socket } = useSocket();
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

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', gameState.pin);

    const handleGameStateUpdate = (data: any) => {
      console.log('Received game-state-update:', data);
      if (data.game) {
        setGameState(data.game);
      }
      if (data.view) {
        console.log(`Switching to view: ${data.view}`);
        setView(data.view);
      }
      if (data.roundResults) {
        setRoundResults(data.roundResults);
        setView('results');
      }
      if (data.winners) {
        setWinners(data.winners);
        setView('finished');
      }
    };

    const handlePlayerEliminated = (data: { playerName: string }) => {
      const eventId = `eliminated-${data.playerName}-${Date.now()}`;
      if (!processedEvents.has(eventId)) {
        toast.error(`💀 ${data.playerName} has been eliminated!`, {
          duration: 3000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }
        });
        setProcessedEvents(prev => new Set([...prev, eventId]));
      }
    };

    const handlePlayerUpdate = async () => {
      if (view !== 'lobby') return; // Only update in lobby
      try {
        const response = await fetch(`/api/game/${gameState.pin}`);
        if (response.ok) {
          const updatedGame = await response.json();
          setGameState(updatedGame);
        }
      } catch (error) {
        console.error('Failed to update player list:', error);
      }
    };

    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('player-eliminated', handlePlayerEliminated);
    socket.on('player-update', handlePlayerUpdate);

    return () => {
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('player-eliminated', handlePlayerEliminated);
      socket.off('player-update', handlePlayerUpdate);
    };
  }, [socket, gameState.pin, processedEvents, view]);





  const currentPlayer = gameState.players.find(p => p._id === playerId);
  const isEliminated = !!currentPlayer?.isEliminated;

  const handleStartGame = async () => {
    if (!isHost) return;
    
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: gameState.pin, hostSocketId: gameState.host }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Game started successfully via API');
        
        // Update local state immediately for host
        setGameState(data.game);
        setView('question');
        
        // Emit WebSocket event to update other players
        if (socket) {
          socket.emit('start-game', gameState.pin);
        }
      } else {
        console.log('API call failed:', response.status);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleTimeUp = () => {
    // Server handles timing automatically now
  };

  const handleResultsTimeUp = () => {
    setRoundResults(null); // Clear results when time is up
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
        if (isHost) {
          return (
            <div className="w-full max-w-4xl space-y-6">
              {/* Host Setup Header */}
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">🎯 Setup Your Game</h2>
                    <Badge variant="secondary" className="text-xl py-1">
                      PIN: {gameState.pin}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Prize Pool: <span className="font-bold text-primary">${gameState.prizePool}</span>
                  </p>
                </CardHeader>
              </Card>

              {/* Players in Lobby */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Players in Lobby</h3>
                    <Badge variant="outline" className="text-lg">
                      {gameState.players.length} Players
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Players will see this PIN to join: <span className="font-mono font-bold">{gameState.pin}</span>
                  </p>
                </CardHeader>
                <CardContent>
                  {gameState.players.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-2">No players have joined yet</p>
                      <p className="text-sm text-muted-foreground">Share the PIN <span className="font-mono font-bold">{gameState.pin}</span> with your players</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {gameState.players.map((player, index) => (
                        <div key={player._id} className="p-3 bg-green-50 border border-green-200 rounded-lg text-center animate-in fade-in">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600 font-bold">#{index + 1}</span>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Start Game Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      onClick={handleStartGame} 
                      disabled={gameState.players.length < 1}
                      className="text-lg px-8 py-3"
                    >
                      🚀 Start Game ({gameState.players.length} Players)
                    </Button>
                    {gameState.players.length < 1 && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Need at least 1 player to start the game
                      </p>
                    )}
                    {gameState.players.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Ready to start! All players will see the first question.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        
        // Player view
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

              <div className="mt-8 text-center">
                <p className="text-lg text-muted-foreground">Waiting for the host to start the game...</p>
              </div>
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