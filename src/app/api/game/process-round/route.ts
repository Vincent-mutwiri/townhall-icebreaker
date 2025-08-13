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
      // Skip already eliminated players
      if (player.isEliminated) {
        continue;
      }
      
      // Debug logging
      console.log(`Player ${player.name}:`, {
        lastAnswer: player.lastAnswer,
        questionId: currentQuestion._id.toString(),
        correctAnswer: currentQuestion.correctAnswer
      });
      
      // Check if player answered this question correctly
      const answeredCorrectly = player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString() && player.lastAnswer.isCorrect;
      
      console.log(`${player.name} answered correctly: ${answeredCorrectly}`);
      
      if (answeredCorrectly) {
        survivors.push(player.name);
      } else {
        // Player either answered incorrectly or didn't answer at all
        eliminated.push(player.name);
        await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
      }
      
      // Clear lastAnswer after processing
      await Player.updateOne({ _id: player._id }, { $unset: { lastAnswer: 1 } });
    }

    // If no active players were processed, return empty arrays but log it
    if (survivors.length === 0 && eliminated.length === 0) {
      console.log('Warning: No active players found to process');
    }

    return NextResponse.json({ survivors, eliminated });

  } catch (error) {
    console.error('Error processing round:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}