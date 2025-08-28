"use client";

interface LiveGamePlayerProps {
  gameData: any;
  userId: string;
}

export function LiveGamePlayer({ gameData, userId }: LiveGamePlayerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Live Game - Working!</h1>
        <p>Game Code: {gameData.joinCode}</p>
        <p>Status: {gameData.status}</p>
        <p>User ID: {userId}</p>
      </div>
    </div>
  );
}