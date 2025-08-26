import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Vote } from '@/models/Vote';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin, votedForPlayerId } = await request.json();

    if (!pin || !votedForPlayerId) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const game = await Game.findOne({ pin });
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    // Record the vote
    await Vote.create({
      game: game._id,
      votedForPlayer: votedForPlayerId,
      round: game.currentQuestionIndex + 1
    });

    return NextResponse.json({ message: 'Vote submitted.' });

  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}