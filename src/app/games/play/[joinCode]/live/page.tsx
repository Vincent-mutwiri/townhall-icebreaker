// src/app/games/play/[joinCode]/live/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { HostedGame } from "@/models/HostedGame";
import { LiveGamePlayer } from "@/components/games/LiveGamePlayer";
import { notFound } from 'next/navigation';

async function getLiveGameData(joinCode: string, userId: string) {
  await connectToDatabase();
  
  const hostedGame = await HostedGame.findOne({ 
    joinCode: joinCode.toUpperCase(),
    status: { $in: ['live', 'finished'] }
  }).populate('templateId').populate('hostId', 'name');

  if (!hostedGame) {
    return null;
  }

  // Check if user is in the game or is the host
  const isHost = hostedGame.hostId._id.toString() === userId;
  const playerIndex = hostedGame.players.findIndex((p: any) => p.userId.toString() === userId);
  const isPlayer = playerIndex !== -1;

  if (!isHost && !isPlayer) {
    return { accessDenied: true };
  }

  return {
    ...JSON.parse(JSON.stringify(hostedGame)),
    isHost,
    isPlayer,
    playerIndex,
    currentPlayer: isPlayer ? hostedGame.players[playerIndex] : null
  };
}

export default async function LiveGamePage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const gameData = await getLiveGameData(joinCode, userId);

  if (!gameData) {
    notFound();
  }

  if (gameData.accessDenied) {
    redirect(`/games/play/${joinCode}`);
  }

  return <LiveGamePlayer gameData={gameData} userId={userId} />;
}
