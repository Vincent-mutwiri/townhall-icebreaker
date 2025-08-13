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
};

type LobbyProps = {
  initialGame: GameState;
};

type Winner = { _id: string; name: string; score: number; }; // Define Winner type here

export function Lobby({ initialGame }: LobbyProps) {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState>(initialGame);
  const [players, setPlayers] = useState<Player[]>(initialGame.players);
  const [isLoading, setIsLoading] = useState(false);
  const [roundResults, setRoundResults] = useState<{ survivors: string[], eliminated: string[] } | null>(null);
  const [view, setView] = useState<'lobby' | 'question' | 'results' | 'voting' | 'finished'>(
    initialGame.status === 'lobby' ? 'lobby' : 
    initialGame.status === 'in-progress' ? 'question' : 
    initialGame.status === 'finished' ? 'finished' : 'lobby'
  );
  const [eliminatedPlayersForVote, setEliminatedPlayersForVote] = useState<Player[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [redeemedPlayers, setRedeemedPlayers] = useState<string[]>([]);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player-id-${gameState.pin}`);
    setPlayerId(storedPlayerId);
    
    // Check if URL has host parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hostCheck = urlParams.get('host') === 'true';
    setIsHost(hostCheck);


  }, [gameState.pin]);

  const handleResultsTimeUp = () => {
    if (roundResults && roundResults.eliminated.length > 0) {
      const eliminatedPlayers = gameState.players.filter(p => 
        roundResults.eliminated.includes(p.name)
      );
      setEliminatedPlayersForVote(eliminatedPlayers);
      setView('voting');
    } else {
      // Continue to next round or end game
      const activePlayers = gameState.players.filter(p => !p.isEliminated);
      if (activePlayers.length <= 1) {
        const allPlayers = gameState.players.sort((a, b) => (b.score || 0) - (a.score || 0));
        setWinners(allPlayers.map(p => ({ _id: p._id, name: p.name, score: p.score || 0 })));
        setView('finished');
      } else {
        setRoundResults(null);
        setView('question');
      }
    }
  };
  
  const currentPlayer = gameState.players.find(p => p._id === playerId);
  const isEliminated = !!currentPlayer?.isEliminated;
  const isEliminatedThisRound = roundResults ? 
    roundResults.eliminated.includes(currentPlayer?.name || '') : false;
  const canVote = !isEliminatedThisRound; // Only check if eliminated this round, not overall status

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
        setRedeemedPlayers(prev => [...prev, data.name!]);
      } else {
        toast.info("No one was redeemed this round.");
      }
    };

    const handleNextRound = (data: { game: GameState }) => {
      setGameState(data.game);
      setRoundResults(null); // Clear previous round results
      setView('question');
    };

    const handleGameOver = (data: { winners: Winner[] }) => {
      console.log("Game over! Winners:", data.winners);
      setWinners(data.winners);
      setView('finished');
    };

    socket.on('update-lobby', handleUpdateLobby);
    socket.on('game-started', handleGameStarted);
    socket.on('round-results', handleRoundResults);
    socket.on('voting-started', handleVotingStarted);
    socket.on('player-redeemed', handlePlayerRedeemed);
    socket.on('next-round-started', handleNextRound);
    socket.on('game-over', handleGameOver); // Listen for game-over event

    return () => {
      socket.off('update-lobby', handleUpdateLobby);
      socket.off('game-started', handleGameStarted);
      socket.off('round-results', handleRoundResults);
      socket.off('voting-started', handleVotingStarted);
      socket.off('player-redeemed', handlePlayerRedeemed);
      socket.off('next-round-started', handleNextRound);
      socket.off('game-over', handleGameOver); // Clean up game-over listener
    };
  }, [socket, gameState.pin, gameState.status]);

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
      setView('question');

    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = async () => {
    console.log("Time is up!");
    
    if (isHost) {
      // Only host processes the round
      try {
        const response = await fetch('/api/game/process-round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: gameState.pin }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const results = await response.json();
        setRoundResults(results);
        setView('results');
        
        // Update gameState with fresh player data after elimination
        const updatedGame = await fetch(`/api/game/${gameState.pin}`);
        if (updatedGame.ok) {
          const freshGameData = await updatedGame.json();
          setGameState(prev => ({ ...prev, players: freshGameData.players }));
        }
        
      } catch (error) {
        console.error('Failed to process round:', error);
        toast.error('Failed to process round results');
        setRoundResults({ survivors: [], eliminated: [] });
        setView('results');
      }
    } else {
      // Players also process round to get results
      try {
        const response = await fetch('/api/game/process-round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: gameState.pin }),
        });
        
        if (response.ok) {
          const results = await response.json();
          setRoundResults(results);
        } else {
          setRoundResults({ survivors: [], eliminated: [] });
        }
      } catch (error) {
        console.error('Failed to get round results:', error);
        setRoundResults({ survivors: [], eliminated: [] });
      }
      setView('results');
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
      
      if (!response.ok) {
        throw new Error('Failed to process vote');
      }
      
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
        if (data.winners) {
          setTimeout(() => {
            setWinners(data.winners);
            setView('finished');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to process vote:', error);
      // Fallback: just show a message and continue
      toast.info("Voting ended. Continuing to next round...");
      setTimeout(() => {
        setRoundResults(null);
        setView('question');
      }, 2000);
    }
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
            redeemedPlayers={redeemedPlayers}
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
        return <ResultsScreen survivors={roundResults?.survivors || []} eliminated={roundResults?.eliminated || []} onTimeUp={handleResultsTimeUp} />;
      case 'voting':
        return <VotingRound eliminatedPlayers={eliminatedPlayersForVote} onVote={handleVote} onTimeUp={handleVoteTimeUp} isEliminated={!canVote} />;
      case 'finished': // New case for finished game
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

              {isHost && gameState.status === 'lobby' && (
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