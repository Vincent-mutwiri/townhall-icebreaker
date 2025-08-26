// src/app/games/play/[joinCode]/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { HostedGame } from "@/models/HostedGame";
import { GameLobby } from "@/components/games/GameLobby";
import { notFound } from 'next/navigation';

async function getGameData(joinCode: string, userId: string) {
  await connectToDatabase();
  
  const hostedGame = await HostedGame.findOne({ 
    joinCode: joinCode.toUpperCase(),
    status: { $in: ['scheduled', 'live', 'finished'] }
  }).populate('templateId').populate('hostId', 'name');

  if (!hostedGame) {
    return null;
  }

  // Check if user is in the game or is the host
  const isHost = hostedGame.hostId._id.toString() === userId;
  const playerIndex = hostedGame.players.findIndex((p: any) => p.userId.toString() === userId);
  const isPlayer = playerIndex !== -1;

  if (!isHost && !isPlayer) {
    // User is not in the game, they need to join first
    return {
      needsToJoin: true,
      gameExists: true,
      joinCode: hostedGame.joinCode,
      gameTitle: hostedGame.templateId?.title || 'Unknown Game',
      gameStatus: hostedGame.status
    };
  }

  return {
    ...JSON.parse(JSON.stringify(hostedGame)),
    isHost,
    isPlayer,
    playerIndex,
    needsToJoin: false
  };
}

export default async function GameLobbyPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const gameData = await getGameData(joinCode, userId);

  if (!gameData) {
    notFound();
  }

  return <GameLobby gameData={gameData} userId={userId} />;
}
