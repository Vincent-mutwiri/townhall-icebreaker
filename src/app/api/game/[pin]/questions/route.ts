import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';

export async function GET(request: Request, { params }: { params: Promise<{ pin: string }> }) {
  try {
    await connectToDatabase();
    const { pin } = await params;
    
    const game = await Game.findOne({ pin }).populate('questions');
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    return NextResponse.json(game.questions || []);
  } catch (error) {
    console.error('Error fetching game questions:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ pin: string }> }) {
  try {
    await connectToDatabase();
    const { pin } = await params;
    const { questionId } = await request.json();

    const game = await Game.findOne({ pin });
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    if (!game.questions.includes(questionId)) {
      game.questions.push(questionId);
      await game.save();
    }

    return NextResponse.json({ message: 'Question added to game.' });
  } catch (error) {
    console.error('Error adding question to game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ pin: string }> }) {
  try {
    await connectToDatabase();
    const { pin } = await params;
    const { questionId } = await request.json();

    const game = await Game.findOne({ pin });
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    game.questions = game.questions.filter(id => id.toString() !== questionId);
    await game.save();

    return NextResponse.json({ message: 'Question removed from game.' });
  } catch (error) {
    console.error('Error removing question from game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}