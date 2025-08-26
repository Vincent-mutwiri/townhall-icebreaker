// src/components/games/JoinGameForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function JoinGameForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please sign in to join a game");
      router.push("/login");
      return;
    }

    if (!joinCode.trim()) {
      toast.error("Please enter a join code");
      return;
    }

    if (joinCode.length !== 6) {
      toast.error("Join code must be 6 characters");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join game');
      }

      toast.success("Successfully joined the game!");
      
      // Redirect to the game lobby
      router.push(`/games/play/${data.joinCode}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setJoinCode(value);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-600" />
          Join a Game
        </CardTitle>
        <CardDescription>
          Enter a game code to join a live multiplayer session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoinGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinCode">Game Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={handleInputChange}
              placeholder="Enter 6-digit game code..."
              className="text-center text-lg font-mono tracking-wider"
              maxLength={6}
              disabled={isJoining}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isJoining || !joinCode.trim()}
          >
            <Play className="mr-2 h-4 w-4" />
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
