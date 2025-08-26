// src/app/api/games/host/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { GameTemplate } from '@/models/GameTemplate';
import { HostedGame } from '@/models/HostedGame';

// Generate a 6-digit alphanumeric join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userId = (session.user as any).id;
    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 });
    }

    // Verify the template exists and belongs to the user
    const template = await GameTemplate.findOne({ _id: templateId, createdBy: userId });
    if (!template) {
      return NextResponse.json({ message: 'Game template not found' }, { status: 404 });
    }

    // Validate template has questions
    if (!template.questions || template.questions.length === 0) {
      return NextResponse.json({
        message: 'Cannot host a game with no questions. Please add questions to your template first.'
      }, { status: 400 });
    }

    // Generate a unique join code
    let joinCode = generateJoinCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the join code is unique
    while (attempts < maxAttempts) {
      const existingGame = await HostedGame.findOne({
        joinCode,
        status: { $in: ['scheduled', 'live'] }
      });

      if (!existingGame) {
        break;
      }

      joinCode = generateJoinCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({
        message: 'Unable to generate unique join code. Please try again.'
      }, { status: 500 });
    }

    // Create the hosted game
    const hostedGame = await HostedGame.create({
      templateId: template._id,
      hostId: userId,
      joinCode,
      status: 'scheduled',
      players: [],
      currentQuestionIndex: 0,
      results: [],
      settings: {
        maxPlayers: 50, // Default max players
        allowLateJoin: true,
        showLeaderboard: true,
      }
    });

    return NextResponse.json({
      message: 'Game hosted successfully',
      joinCode,
      gameId: hostedGame._id,
      templateTitle: template.title
    });

  } catch (error) {
    console.error('Error hosting game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
