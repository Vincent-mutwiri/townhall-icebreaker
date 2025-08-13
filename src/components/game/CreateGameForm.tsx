// src/components/game/CreateGameForm.tsx
"use client"; // This is a client component

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketProvider";
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

export function CreateGameForm() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [hostName, setHostName] = useState("");
  const [initialPrize, setInitialPrize] = useState("100");
  const [incrementAmount, setIncrementAmount] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostName,
          initialPrize: Number(initialPrize),
          incrementAmount: Number(incrementAmount),
          hostSocketId: socket?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create game.');
      }

      // On success, redirect the host to their new game lobby
      router.push(`/game/${data.pin}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a New Game</CardTitle>
        <CardDescription>
          Set the starting prize and round increment to begin.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host-name">Your Name</Label>
            <Input
              id="host-name"
              placeholder="e.g., John Doe"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial-prize">Initial Cash Prize ($)</Label>
            <Input
              id="initial-prize"
              type="number"
              placeholder="e.g., 100"
              value={initialPrize}
              onChange={(e) => setInitialPrize(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="increment-amount">Increment per Round ($)</Label>
            <Input
              id="increment-amount"
              type="number"
              placeholder="e.g., 20"
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(e.target.value)}
              required
              min="1"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="w-full text-center text-xs text-muted-foreground">
            Socket Status: {isConnected ? (
              <span className="font-semibold text-green-500">Connected</span>
            ) : (
              <span className="font-semibold text-red-500">Connecting...</span>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Game'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}