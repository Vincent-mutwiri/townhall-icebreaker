// src/components/game/Lobby.tsx
"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define a type for our player object
type Player = {
  _id: string;
  name: string;
};

// Define a type for the props our component will receive
type LobbyProps = {
  initialGame: {
    pin: string;
    prizePool: number;
    players: Player[];
  };
};

export function Lobby({ initialGame }: LobbyProps) {
  const { socket, isConnected } = useSocket();
  const [players, setPlayers] = useState<Player[]>(initialGame.players);

  useEffect(() => {
    if (!socket) return;

    // Join the room for this specific game
    socket.emit('join-room', initialGame.pin);

    // Listen for updates to the player list
    const handleUpdateLobby = (updatedPlayers: Player[]) => {
      console.log('Lobby updated!', updatedPlayers);
      setPlayers(updatedPlayers);
    };

    socket.on('update-lobby', handleUpdateLobby);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off('update-lobby', handleUpdateLobby);
    };
  }, [socket, initialGame.pin]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Game Lobby</h2>
          <Badge variant="secondary" className="text-xl py-1">
            {initialGame.pin}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Current Prize Pool: <span className="font-bold text-primary">${initialGame.prizePool}</span>
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

        <div className="mt-8 text-center">
          <Button size="lg">Start Game</Button>
        </div>
      </CardContent>
    </Card>
  );
}