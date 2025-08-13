import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin } = await request.json();

    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    const currentQuestion: any = game.questions[game.currentQuestionIndex]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const survivors: string[] = [];
    const eliminated: string[] = [];

    for (const player of game.players) {
      if (player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString() && player.lastAnswer.isCorrect) {
        survivors.push(player.name);
      } else {
        eliminated.push(player.name);
        await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
      }
    }

    return NextResponse.json({ survivors, eliminated });

  } catch (error) {
    console.error('Error processing round:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}