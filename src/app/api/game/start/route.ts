import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Question } from '@/models/Question';
import { Player } from '@/models/Player';
import { gameController } from '@/lib/gameController';

async function getDummyQuestions() {
  const questions = await Question.find({ text: /Dummy Question/ }).limit(5);
  if (questions.length >= 5) {
    return questions.map(q => q._id);
  }

  const dummyData = [
    { text: 'Dummy Question 1: What is 2+2?', options: ['3', '4', '5', '6'], correctAnswer: '4' },
    { text: 'Dummy Question 2: What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correctAnswer: 'Paris' },
    { text: 'Dummy Question 3: Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswer: 'Mars' },
    { text: 'Dummy Question 4: What is the largest mammal?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Great White Shark'], correctAnswer: 'Blue Whale' },
    { text: 'Dummy Question 5: In which year did the Titanic sink?', options: ['1905', '1912', '1918', '1923'], correctAnswer: '1912' },
  ];
  const createdQuestions = await Question.insertMany(dummyData);
  return createdQuestions.map(q => q._id);
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { pin, hostSocketId } = body;

    if (!pin) {
      return NextResponse.json({ message: 'Game PIN is required.' }, { status: 400 });
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

    const questionIds = await getDummyQuestions();
    
    // Use findOneAndUpdate to avoid version conflicts
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