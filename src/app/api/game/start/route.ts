import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';

import { Player } from '@/models/Player';


export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { pin, hostSocketId, questionIds } = body;

    if (!pin || !hostSocketId || !questionIds || questionIds.length === 0) {
      return NextResponse.json({ message: 'Game PIN, Host ID, and questions are required.' }, { status: 400 });
    }

    const game = await Game.findOne({ pin });

    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    if (hostSocketId && game.host !== hostSocketId) {
      return NextResponse.json({ message: 'Only the host can start the game.' }, { status: 403 });
    }

    if (game.status !== 'lobby') {
      return NextResponse.json({ message: 'Game has already started.' }, { status: 400 });
    }

    // Use the questions provided by the host
    const updatedGame = await Game.findOneAndUpdate(
      { pin },
      { 
        questions: questionIds,
        status: 'in-progress',
        currentQuestionIndex: 0
      },
      { new: true }
    );
    
    // Clear any previous answers when starting new game
    await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });

    const gameWithQuestion = await Game.findById(updatedGame._id).populate('questions').populate('players');

    // Game will be started via WebSocket event from client

    return NextResponse.json({
      message: 'Game started!',
      game: JSON.parse(JSON.stringify(gameWithQuestion)),
    }, { status: 200 });

  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}