// src/app/api/games/join/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { HostedGame } from '@/models/HostedGame';
import { User } from '@/models/User';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userId = (session.user as any).id;
    const { joinCode } = await request.json();

    if (!joinCode) {
      return NextResponse.json({ message: 'Join code is required' }, { status: 400 });
    }

    // Find the hosted game
    const hostedGame = await HostedGame.findOne({ 
      joinCode: joinCode.toUpperCase(),
      status: { $in: ['scheduled', 'live'] }
    }).populate('templateId', 'title');

    if (!hostedGame) {
      return NextResponse.json({ 
        message: 'Game not found. Please check the join code and try again.' 
      }, { status: 404 });
    }

    // Check if game is full
    if (hostedGame.settings?.maxPlayers && hostedGame.players.length >= hostedGame.settings.maxPlayers) {
      return NextResponse.json({ 
        message: 'This game is full. Please try joining another game.' 
      }, { status: 400 });
    }

    // Check if player is already in the game
    const existingPlayer = hostedGame.players.find((p: any) => p.userId.toString() === userId);
    if (existingPlayer) {
      return NextResponse.json({ 
        message: 'You are already in this game',
        gameId: hostedGame._id,
        joinCode: hostedGame.joinCode
      });
    }

    // Check if late joining is allowed for live games
    if (hostedGame.status === 'live' && !hostedGame.settings?.allowLateJoin) {
      return NextResponse.json({ 
        message: 'This game has already started and late joining is not allowed.' 
      }, { status: 400 });
    }

    // Get user information
    const user = await User.findById(userId).select('name');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Add player to the game
    const newPlayer = {
      userId: userId,
      name: user.name,
      score: 0,
      answers: [],
      joinedAt: new Date(),
      isActive: true
    };

    await HostedGame.updateOne(
      { _id: hostedGame._id },
      { 
        $push: { players: newPlayer }
      }
    );

    return NextResponse.json({ 
      message: 'Successfully joined the game',
      gameId: hostedGame._id,
      joinCode: hostedGame.joinCode,
      gameTitle: (hostedGame.templateId as any)?.title || 'Unknown Game',
      gameStatus: hostedGame.status,
      playerCount: hostedGame.players.length + 1
    });

  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
