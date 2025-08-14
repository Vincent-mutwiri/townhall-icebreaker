import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { gameController } from '@/lib/gameController';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin, playerId, answer } = await request.json();

    if (!pin || !playerId || !answer) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const game = await Game.findOne({ pin }).populate('questions');
    if (!game || game.status !== 'in-progress') {
      return NextResponse.json({ message: 'Game not found or not in progress.' }, { status: 404 });
    }

    const currentQuestion: any = game.questions[game.currentQuestionIndex]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!currentQuestion) {
      return NextResponse.json({ message: 'Question not found.' }, { status: 404 });
    }

    const isCorrect = currentQuestion.correctAnswer === answer;
    
    // Debug logging
    console.log('Answer comparison:', {
      playerAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      questionText: currentQuestion.text
    });

    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ message: 'Player not found.' }, { status: 404 });
    }

    const updateQuery: { $set: { lastAnswer: { questionId: string; isCorrect: boolean; submittedAt: Date }; isEliminated?: boolean }; $inc?: { score: number } } = {
      $set: { lastAnswer: { questionId: currentQuestion._id, isCorrect, submittedAt: new Date() } }
    };
    
    if (isCorrect) {
      // Calculate time bonus (faster answers get more points)
      const answerTime = Date.now();
      // Simple scoring - correct answers get 100 points
      const totalPoints = 100;
      
      updateQuery.$inc = { score: totalPoints };
    } else if (!player.isEliminated) {
      // Eliminate player immediately on wrong answer
      updateQuery.$set.isEliminated = true;
      
      // Broadcast elimination toast immediately
      gameController.broadcastElimination(game.pin, player.name);
    }

    await Player.updateOne(
      { _id: playerId, game: game._id },
      updateQuery
    );

    // Answer processed successfully

    return NextResponse.json({ message: 'Answer submitted.', yourAnswer: answer, isCorrect });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}