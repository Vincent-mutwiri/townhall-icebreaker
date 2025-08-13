// src/app/game/[pin]/page.tsx
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player'; // We need this import for populate to work correctly
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// This is a helper function to fetch data for our server component
async function getGameData(pin: string) {
  await connectToDatabase();
  // Find the game and populate the 'players' field to get player names
  const game = await Game.findOne({ pin: pin.toUpperCase() }).populate('players');
  if (!game) {
    return null;
  }
  // Mongoose returns a complex object, so we serialize it for the component
  return JSON.parse(JSON.stringify(game));
}

// This is a React Server Component
export default async function GameLobbyPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  const game = await getGameData(pin);

  // If no game is found for the pin, show a 404 page
  if (!game) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">Game Lobby</h2>
            <Badge variant="secondary" className="text-xl py-1">
              {game.pin}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Current Prize Pool: <span className="font-bold text-primary">${game.prizePool}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h3 className="font-semibold text-lg">Players in Lobby ({game.players.length})</h3>
            <p className="text-sm text-muted-foreground">Waiting for the host to start the game...</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {game.players.map((player: { _id: string; name: string }) => (
              <div key={player._id} className="p-3 bg-secondary rounded-lg text-center">
                <span className="font-medium">{player.name}</span>
              </div>
            ))}
          </div>

          {/* This is the Host's control area. We will add logic later to only show this to the host. */}
          <div className="mt-8 text-center">
            <Button size="lg">
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}