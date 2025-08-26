// src/components/game/JoinGameForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketProvider";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinGameForm() {
  const router = useRouter();
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use session name as default, otherwise empty string
  const displayName = session?.user?.name || name;
  const isNameDisabled = !!session?.user?.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.toUpperCase(),
          name: session?.user?.name || name // Send the appropriate name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join game.');
      }

      // Save player ID to localStorage
      if (data.playerId) {
        localStorage.setItem(`player-id-${data.pin}`, data.playerId);
      }

      // Notify server about the new player
      if (socket) {
        socket.emit('player-joined', data.pin);
      }

      // Small delay to ensure WebSocket event is processed
      setTimeout(() => {
        router.push(`/game/${data.pin}`);
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a Game</CardTitle>
        <CardDescription>
          {session?.user ?
            `Enter the 6-digit game PIN to join as ${session.user.name}.` :
            'Enter the 6-digit game PIN and your name to join.'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Game PIN</Label>
            <Input
              id="pin"
              placeholder="ABC123"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g., Jane Doe"
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              required={!session?.user?.name}
              disabled={isNameDisabled}
              className={isNameDisabled ? "cursor-not-allowed bg-muted" : ""}
            />
            {session?.user?.name && (
              <p className="text-xs text-muted-foreground">
                You're signed in as {session.user.name}
              </p>
            )}
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Game'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}