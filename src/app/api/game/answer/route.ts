import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

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

    const updateQuery: any = {
      $set: { lastAnswer: { questionId: currentQuestion._id, isCorrect, submittedAt: new Date() } }
    };
    
    // Increment score if answer is correct
    if (isCorrect) {
      updateQuery.$inc = { score: 1 };
    }

    await Player.updateOne(
      { _id: playerId, game: game._id },
      updateQuery
    );

    return NextResponse.json({ message: 'Answer submitted.', yourAnswer: answer, isCorrect });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}