// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { QuestionView } from "./QuestionView";
import { ResultsScreen } from "./ResultsScreen";
import { LiveStats } from "./LiveStats";
import { WinnerScreen } from "./WinnerScreen";
import { HostView } from "./HostView";
import { NextQuestionModal } from "./NextQuestionModal";
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

  const [view, setView] = useState<'lobby' | 'question' | 'results' | 'finished' | 'next-question'>(
    initialGame.status === 'lobby' ? 'lobby' : 'question'
  );
  const [showNextQuestionModal, setShowNextQuestionModal] = useState(false);
  const [roundResults, setRoundResults] = useState<{ 
    survivors: string[]; 
    eliminated: string[]; 
    averageResponseTime?: number; 
    fastestResponse?: { playerName: string; time: number } 
  } | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());
  const [liveStats, setLiveStats] = useState<any>(null);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player-id-${gameState.pin}`);
    setPlayerId(storedPlayerId);
    
    // Check if player still exists in game (reconnection)
    if (storedPlayerId && !gameState.players.find(p => p._id === storedPlayerId)) {
      localStorage.removeItem(`player-id-${gameState.pin}`);
      setPlayerId(null);
      toast.error('You were disconnected from the game. Please rejoin.');
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const isHostParam = urlParams.get('host') === 'true';
    setIsHost(isHostParam);
    
    // Redirect hosts to setup page
    if (isHostParam && view === 'lobby') {
      window.location.href = `/game/${gameState.pin}/setup`;
      return;
    }
  }, [gameState.pin, view]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', gameState.pin);

    const handleGameStateUpdate = (data: {game?: GameState, view?: 'lobby' | 'question' | 'results' | 'finished', roundResults?: {survivors: string[], eliminated: string[]}, winners?: Winner[]}) => {
      console.log('Received game-state-update:', data);
      
      // Show next question modal with results
      if (data.roundResults) {
        console.log('Showing next question modal');
        setRoundResults(data.roundResults);
        setShowNextQuestionModal(true);
        return;
      }
      
      // Handle winners
      if (data.winners) {
        setWinners(data.winners);
        setView('finished');
        return;
      }
      
      // Update game state (eliminated players need this too)
      if (data.game) {
        setGameState(data.game);
      }
      
      // Update view and reset question state for new questions
      if (data.view) {
        console.log(`Switching to view: ${data.view}`);
        setView(data.view);
        
        // Reset question state when moving to a new question
        if (data.view === 'question') {
          setGameState(prev => ({ ...prev, questionKey: Date.now() }));
        }
      }
    };

    const handlePlayerEliminated = (data: { playerName: string; reason?: string }) => {
      console.log('Player eliminated event received:', data, 'Current view:', view);
      const eventId = `eliminated-${data.playerName}-${Date.now()}`;
      if (!processedEvents.has(eventId)) {
        const message = data.reason === 'no answer' 
          ? `⏰ ${data.playerName} ran out of time!`
          : data.reason === 'wrong answer'
          ? `💀 ${data.playerName} was eliminated!`
          : `💀 ${data.playerName} has been eliminated!`;
          
        toast.error(message, {
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

    const handleWrongAnswer = (data: { playerName: string }) => {
      // No toast - elimination is handled by handlePlayerEliminated
    };

    const handleLiveStats = (stats: any) => {
      setLiveStats(stats);
    };

    const handleAnswerConfirmed = (data: { playerId: string; isCorrect: boolean }) => {
      if (data.playerId === playerId) {
        const playerName = currentPlayer?.name || 'You';
        if (data.isCorrect) {
          toast.success(`🎉 ${playerName} survived!`, { 
            duration: 3000,
            style: {
              background: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0'
            }
          });
        } else {
          toast.error(`💀 ${playerName} eliminated!`, { 
            duration: 3000,
            style: {
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca'
            }
          });
        }
      }
    };

    const handleAnswerProgress = (data: { answered: number; total: number }) => {
      console.log(`${data.answered}/${data.total} players answered`);
    };



    const handlePlayerUpdate = () => {
      // Player updates are handled via WebSocket events only
    };
    
    const handlePlayerJoined = (data: { player: Player }) => {
      console.log('Player joined:', data.player.name);
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, data.player]
      }));
    };

    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('player-eliminated', handlePlayerEliminated);
    socket.on('wrong-answer', handleWrongAnswer);
    socket.on('live-stats', handleLiveStats);
    socket.on('answer-confirmed', handleAnswerConfirmed);
    socket.on('answer-progress', handleAnswerProgress);
    socket.on('player-update', handlePlayerUpdate);
    socket.on('player-joined', handlePlayerJoined);

    return () => {
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('player-eliminated', handlePlayerEliminated);
      socket.off('wrong-answer', handleWrongAnswer);
      socket.off('live-stats', handleLiveStats);
      socket.off('answer-confirmed', handleAnswerConfirmed);
      socket.off('answer-progress', handleAnswerProgress);
      socket.off('player-update', handlePlayerUpdate);
      socket.off('player-joined', handlePlayerJoined);
    };
  }, [socket, gameState.pin, processedEvents, view]);







  useEffect(() => {
    const player = gameState.players.find(p => p._id === playerId);
    setCurrentPlayer(player || null);
  }, [gameState.players, playerId]);

  const isEliminated = !!currentPlayer?.isEliminated;

  // const handleStartGame = async () => {
  //   if (!isHost) return;
  //   
  //   try {
  //     const response = await fetch('/api/game/start', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ pin: gameState.pin, hostSocketId: gameState.host }),
  //     });
  //     
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log('Game started successfully via API');
  //       
  //       // Update local state immediately for host
  //       setGameState(data.game);
  //       setView('question');
  //       
  //       // Emit WebSocket event to update other players
  //       if (socket) {
  //         socket.emit('start-game', gameState.pin);
  //       }
  //     } else {
  //       console.log('API call failed:', response.status);
  //     }
  //   } catch (error) {
  //     console.error('Failed to start game:', error);
  //   }
  // };

  const handleTimeUp = () => {
    // Server handles timing automatically now
  };

  const handleResultsTimeUp = () => {
    setRoundResults(null); // Clear results when time is up
    // Auto-progression is handled by server, just clear local results
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
        return (
          <>
            {(isHost || isEliminated) && (
              <div className="mb-4">
                <LiveStats
                  pin={gameState.pin}
                  totalPlayers={gameState.players.filter(p => !p.isEliminated).length}
                  currentRound={gameState.currentQuestionIndex + 1}
                  averageResponseTime={roundResults?.averageResponseTime}
                  fastestResponse={roundResults?.fastestResponse}
                />
              </div>
            )}
            <QuestionView 
              question={currentQuestion} 
              pin={gameState.pin} 
              onTimeUp={handleTimeUp}
              isEliminated={isEliminated}
              currentRound={gameState.currentQuestionIndex + 1}
              initialPrize={gameState.initialPrize}
              incrementAmount={gameState.incrementAmount}
            />
          </>
        );
      case 'results':
        // Skip results screen
        return null;

      case 'finished':
        return <WinnerScreen winners={winners} pin={gameState.pin} />;
      case 'lobby':
      default:
        // Player view (hosts are redirected to setup page)
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
                {gameState.players.map((player, index) => (
                  <div key={`${player._id}-${index}`} className="p-3 bg-secondary rounded-lg text-center animate-in fade-in">
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
      
      {showNextQuestionModal && roundResults && (
        <NextQuestionModal
          currentRound={gameState.currentQuestionIndex + 1}
          totalQuestions={gameState.questions.length}
          survivors={roundResults.survivors}
          eliminated={roundResults.eliminated}
          onComplete={() => {
            setShowNextQuestionModal(false);
            setRoundResults(null);
          }}
        />
      )}

      {renderView()}
    </>
  );
}