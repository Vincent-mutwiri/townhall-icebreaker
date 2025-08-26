// src/components/games/GameLobby.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Play, 
  Copy, 
  Crown, 
  Clock, 
  Trophy, 
  Settings,
  UserPlus,
  Gamepad2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";

interface GameLobbyProps {
  gameData: any;
  userId: string;
}

export function GameLobby({ gameData, userId }: GameLobbyProps) {
  const router = useRouter();
  const socket = useSocket();
  const [players, setPlayers] = useState(gameData.players || []);
  const [gameStatus, setGameStatus] = useState(gameData.status);
  const [isJoining, setIsJoining] = useState(false);

  // If user needs to join, show join interface
  if (gameData.needsToJoin) {
    return <JoinGameInterface gameData={gameData} userId={userId} />;
  }

  useEffect(() => {
    if (!socket) return;

    // Join the game room
    socket.emit('join-room', gameData.joinCode);

    // Listen for player updates
    socket.on('player-update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Listen for game status changes
    socket.on('game-status-update', (status) => {
      setGameStatus(status);
    });

    // Listen for game start
    socket.on('game:started', (gameState) => {
      // Redirect to game play interface
      router.push(`/games/play/${gameData.joinCode}/live`);
    });

    return () => {
      socket.off('player-update');
      socket.off('game-status-update');
      socket.off('game:started');
    };
  }, [socket, gameData.joinCode, router]);

  const handleStartGame = async () => {
    if (!gameData.isHost) return;

    if (players.length === 0) {
      toast.error("Need at least one player to start the game");
      return;
    }

    try {
      // Emit start game event via socket
      socket?.emit('host:start-game', gameData.joinCode);
      toast.success("Starting game...");
    } catch (error) {
      toast.error("Failed to start game");
    }
  };

  const copyJoinCode = () => {
    navigator.clipboard.writeText(gameData.joinCode);
    toast.success("Join code copied to clipboard!");
  };

  const gameTemplate = gameData.templateId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/games">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Games
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{gameTemplate?.title || 'Game Lobby'}</h1>
              <p className="text-muted-foreground">
                {gameStatus === 'scheduled' ? 'Waiting for players to join...' : 
                 gameStatus === 'live' ? 'Game in progress' : 'Game finished'}
              </p>
            </div>
          </div>
          
          {gameData.isHost && gameStatus === 'scheduled' && (
            <Button onClick={handleStartGame} size="lg" className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Game Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Game Code
                </CardTitle>
                <CardDescription>
                  Share this code with players to join the game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="joinCode">Join Code</Label>
                    <Input
                      id="joinCode"
                      value={gameData.joinCode}
                      readOnly
                      className="text-center text-2xl font-mono tracking-wider font-bold"
                    />
                  </div>
                  <Button onClick={copyJoinCode} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Game Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {gameTemplate?.questions?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {gameTemplate?.rules?.basePoints || 100}
                    </div>
                    <div className="text-sm text-muted-foreground">Base Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {gameTemplate?.rules?.timeLimit || 30}s
                    </div>
                    <div className="text-sm text-muted-foreground">Time Limit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {players.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Players</div>
                  </div>
                </div>

                {gameTemplate?.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">About this game:</h4>
                      <p className="text-muted-foreground text-sm">{gameTemplate.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Players List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </CardTitle>
                <CardDescription>
                  {gameStatus === 'scheduled' ? 'Waiting in lobby' : 'In game'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Host */}
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium">{gameData.hostId?.name || 'Host'}</div>
                      <div className="text-xs text-muted-foreground">Game Host</div>
                    </div>
                    <Badge variant="secondary">Host</Badge>
                  </div>

                  {/* Players */}
                  {players.map((player: any, index: number) => (
                    <div key={player.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {player.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(player.joinedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      {gameStatus !== 'scheduled' && (
                        <div className="text-right">
                          <div className="font-medium">{player.score || 0}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {players.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No players have joined yet</p>
                      <p className="text-sm">Share the join code to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for users who need to join the game
function JoinGameInterface({ gameData, userId }: { gameData: any, userId: string }) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoinGame = async () => {
    setIsJoining(true);
    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: gameData.joinCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join game');
      }

      toast.success("Successfully joined the game!");
      // Refresh the page to show the lobby
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Game</CardTitle>
          <CardDescription>
            You're about to join: <strong>{gameData.gameTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold tracking-wider mb-2">
              {gameData.joinCode}
            </div>
            <Badge variant={gameData.gameStatus === 'scheduled' ? 'default' : 'secondary'}>
              {gameData.gameStatus === 'scheduled' ? 'Waiting to start' : 
               gameData.gameStatus === 'live' ? 'In progress' : 'Finished'}
            </Badge>
          </div>

          <Button 
            onClick={handleJoinGame} 
            disabled={isJoining || gameData.gameStatus === 'finished'}
            className="w-full"
            size="lg"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </Button>

          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/games">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Games
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
