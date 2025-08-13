// src/app/game/[pin]/page.tsx
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { Lobby } from '@/components/game/Lobby'; // Import the new client component

async function getGameData(pin: string) {
  await connectToDatabase();
  const game = await Game.findOne({ pin: pin.toUpperCase() }).populate('players');
  if (!game) return null;
  return JSON.parse(JSON.stringify(game));
}

export default async function GameLobbyPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  const game = await getGameData(pin);

  if (!game) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Render the client component and pass initial data as props */}
      <Lobby initialGame={game} />
    </div>
  );
}